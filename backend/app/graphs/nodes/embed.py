from langchain_openai import OpenAIEmbeddings
from typing import Dict, Any
from ...db.qdrant import get_qdrant
from ...config import settings
import uuid
from qdrant_client.http import models

def get_embeddings_model() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=settings.OPENAI_API_KEY,
    )

async def embed_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates embeddings from chunks and ingests them into the Qdrant database.
    """
    chunk_records = state.get("chunk_records", [])
    if not chunk_records:
        return {"status": "embedded"}
        
    client = get_qdrant()
    collection_name = "docmind_chunks"
    
    embeddings_model = get_embeddings_model()
    chunk_texts = [record.get("text", "") for record in chunk_records]

    # Ensure collection exists
    if not await client.collection_exists(collection_name):
        await client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE)
        )
    
    # Generate embeddings taking batches if necessary
    embeddings = await embeddings_model.aembed_documents(chunk_texts)
    
    points = []
    for i, chunk_record in enumerate(chunk_records):
        points.append(
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=embeddings[i],
                payload={
                    "text": chunk_record.get("text", ""),
                    "file_id": chunk_record.get("file_id"),
                    "filename": chunk_record.get("filename"),
                    "chunk_index": chunk_record.get("chunk_index"),
                }
            )
        )
        
    await client.upsert(
        collection_name=collection_name,
        points=points
    )
    
    return {"status": "embedded"}
