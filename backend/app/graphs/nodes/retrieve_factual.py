from typing import Dict, Any
from ...db.qdrant import get_qdrant
from ...config import settings
from langchain_openai import OpenAIEmbeddings

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
    client = get_qdrant()
    embeddings_model = get_embeddings_model()
    
    # Embed the user query
    query_vector = await embeddings_model.aembed_query(query)
    
    # Search Qdrant
    search_result = await client.search(
        collection_name="docmind_chunks",
        query_vector=query_vector,
        limit=5
    )
    
    retrieved_texts = []
    for hit in search_result:
        if not hit.payload:
            continue
        filename = hit.payload.get("filename", "unknown")
        chunk_index = hit.payload.get("chunk_index", "?")
        text = hit.payload.get("text", "")
        retrieved_texts.append(f"[{filename} | chunk {chunk_index}] {text}")
    context["retrieved_data"] = "\\n---\\n".join(retrieved_texts)
    
    return {"context": context}
