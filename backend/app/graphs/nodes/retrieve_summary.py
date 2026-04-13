from typing import Dict, Any
from ...db.qdrant import get_qdrant
from .retrieval_utils import format_chunk, unique_keywords

# Summary banane ke liye kaafi saara relevant text gather kar raha hai.
async def retrieve_summary_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetches chunks for a summary. To prevent context window overflow with GPT-4o-mini,
    we randomly sample or fetch a limited sequential number of chunks.
    """
    context = state.get("context", {})
    query = state.get("query", "")
    sub_queries = state.get("sub_queries", [])
    client = get_qdrant()
    keywords = unique_keywords(query, *sub_queries)
    
    scroll_result, _ = await client.scroll(
        collection_name="docmind_chunks",
        limit=200,
        with_payload=True,
    )

    chunks_by_doc: Dict[str, list[Dict[str, Any]]] = {}
    for point in scroll_result:
        if not point.payload:
            continue
        payload = dict(point.payload)
        doc_key = payload.get("file_id") or payload.get("filename", "unknown")
        chunks_by_doc.setdefault(doc_key, []).append(payload)

    targeted_docs = []
    if keywords:
        for doc_key, payloads in chunks_by_doc.items():
            filename = payloads[0].get("filename", "").lower()
            if any(keyword in filename for keyword in keywords):
                targeted_docs.append(doc_key)

    selected_doc_keys = targeted_docs or list(chunks_by_doc.keys())

    retrieved_texts = []
    for doc_key in selected_doc_keys:
        payloads = sorted(
            chunks_by_doc.get(doc_key, []),
            key=lambda payload: int(payload.get("chunk_index", 0)),
        )
        if not payloads:
            continue

        if len(payloads) <= 3:
            chosen_payloads = payloads
        else:
            middle_index = len(payloads) // 2
            chosen_payloads = [payloads[0], payloads[middle_index], payloads[-1]]

        for payload in chosen_payloads:
            retrieved_texts.append(format_chunk(payload))

    context["retrieved_data"] = "\\n---\\n".join(retrieved_texts)
    
    return {"context": context}
