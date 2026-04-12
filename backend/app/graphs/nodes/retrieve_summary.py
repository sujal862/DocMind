from typing import Dict, Any
from ...db.qdrant import get_qdrant
from qdrant_client.http import models

# Summary banane ke liye kaafi saara relevant text gather kar raha hai.
async def retrieve_summary_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetches chunks for a summary. To prevent context window overflow with GPT-4o-mini,
    we randomly sample or fetch a limited sequential number of chunks.
    """
    context = state.get("context", {})
    client = get_qdrant()
    
    scroll_result, _ = await client.scroll(
        collection_name="docmind_chunks",
        limit=15, 
        with_payload=True
    )
    
    retrieved_texts = []
    for point in scroll_result:
        if not point.payload:
            continue
        filename = point.payload.get("filename", "unknown")
        chunk_index = point.payload.get("chunk_index", "?")
        text = point.payload.get("text", "")
        retrieved_texts.append(f"[{filename} | chunk {chunk_index}] {text}")
    context["retrieved_data"] = "\\n---\\n".join(retrieved_texts)
    
    return {"context": context}
