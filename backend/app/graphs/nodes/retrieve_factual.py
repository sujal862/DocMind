from typing import Dict, Any, List
from ...db.qdrant import get_qdrant
from ...config import settings
from langchain_openai import OpenAIEmbeddings
from .retrieval_utils import chunk_identity, format_chunk, lexical_score, unique_keywords

# Yeh factual query ke liye Qdrant search karta hai.

def get_embeddings_model() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=settings.OPENAI_API_KEY,
    )

async def retrieve_factual_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a vector search on Qdrant.
    """
    query = state.get("query", "")
    context = state.get("context", {})
    sub_queries = state.get("sub_queries", [])
    client = get_qdrant()
    embeddings_model = get_embeddings_model()
    keywords = unique_keywords(query, *sub_queries)
    
    # Embed the user query
    query_vector = await embeddings_model.aembed_query(query)
    
    search_result = await client.query_points(
        collection_name="docmind_chunks",
        query=query_vector,
        limit=20,
        with_payload=True,
    )

    semantic_candidates: List[Dict[str, Any]] = []
    for hit in search_result.points:
        if not hit.payload:
            continue
        payload = dict(hit.payload)
        payload["_semantic_score"] = float(hit.score)
        payload["_lexical_score"] = lexical_score(payload, keywords)
        semantic_candidates.append(payload)

    scored_candidates = semantic_candidates

    # If semantic retrieval misses clear lexical matches, do a lightweight corpus scan fallback.
    if not any(candidate["_lexical_score"] > 0 for candidate in semantic_candidates):
        scroll_result, _ = await client.scroll(
            collection_name="docmind_chunks",
            limit=200,
            with_payload=True,
        )
        fallback_candidates: List[Dict[str, Any]] = []
        for point in scroll_result:
            if not point.payload:
                continue
            payload = dict(point.payload)
            payload["_semantic_score"] = 0.0
            payload["_lexical_score"] = lexical_score(payload, keywords)
            if payload["_lexical_score"] > 0:
                fallback_candidates.append(payload)
        if fallback_candidates:
            scored_candidates = fallback_candidates

    doc_scores: Dict[str, int] = {}
    for candidate in scored_candidates:
        doc_key = candidate.get("file_id") or candidate.get("filename", "unknown")
        doc_scores[doc_key] = doc_scores.get(doc_key, 0) + candidate["_lexical_score"]

    best_doc_key = max(doc_scores, key=doc_scores.get) if doc_scores else None

    ranked_candidates = sorted(
        scored_candidates,
        key=lambda payload: (
            payload.get("file_id") == best_doc_key,
            payload["_lexical_score"],
            payload["_semantic_score"],
            -int(payload.get("chunk_index", 0)),
        ),
        reverse=True,
    )

    retrieved_texts = []
    seen_chunks: set[str] = set()
    for payload in ranked_candidates:
        chunk_key = chunk_identity(payload)
        if chunk_key in seen_chunks:
            continue
        if best_doc_key and payload.get("file_id") != best_doc_key and len(retrieved_texts) >= 3:
            continue
        seen_chunks.add(chunk_key)
        retrieved_texts.append(format_chunk(payload))
        if len(retrieved_texts) == 5:
            break

    context["retrieved_data"] = "\\n---\\n".join(retrieved_texts)
    
    return {"context": context}
