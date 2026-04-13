from fastapi import APIRouter, HTTPException
from ...db.mongodb import files_collection
from ...db.qdrant import get_qdrant
from ...db.neo4j import neo4j_driver
from ...db.mem0_client import get_memory
import shutil, os

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")

@router.delete("/")
async def reset_all():
    """Wipe all data: MongoDB docs, Qdrant vectors, Neo4j graph, Mem0 memory, and uploaded files."""
    errors = []

    # 1. MongoDB — drop all documents
    try:
        await files_collection.delete_many({})
    except Exception as e:
        errors.append(f"MongoDB: {e}")

    # 2. Qdrant — delete the entire collection
    try:
        qdrant = get_qdrant()
        await qdrant.delete_collection("docmind_chunks")
    except Exception as e:
        errors.append(f"Qdrant: {e}")

    # 3. Neo4j — delete all nodes and relationships
    try:
        async with neo4j_driver.session() as session:
            await session.run("MATCH (n) DETACH DELETE n")
    except Exception as e:
        errors.append(f"Neo4j: {e}")

    # 4. Mem0 — delete all memories for default user
    try:
        memory = get_memory()
        memory.delete_all(user_id="default_user")
    except Exception as e:
        errors.append(f"Mem0: {e}")

    # 5. Delete uploaded files
    try:
        if os.path.exists(UPLOAD_DIR):
            for f in os.listdir(UPLOAD_DIR):
                filepath = os.path.join(UPLOAD_DIR, f)
                if os.path.isfile(filepath):
                    os.remove(filepath)
    except Exception as e:
        errors.append(f"Files: {e}")

    if errors:
        return {"message": "Reset completed with some errors", "errors": errors}

    return {"message": "All data cleared successfully"}
