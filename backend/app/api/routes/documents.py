import os
from typing import Annotated
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from bson import ObjectId
from ...db.mongodb import files_collection
from ...db.neo4j import get_neo4j_session
from ...db.qdrant import get_qdrant
from ...graphs.ingestion import ingestion_app
from qdrant_client.http import models

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "backend", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_document_background(file_path: str, db_file_id: str):
    # Triggers the LangGraph ingestion flow
    try:
        await ingestion_app.ainvoke({
            "files": [file_path],
            "filenames": [os.path.basename(file_path).split("_", 1)[1]],
            "db_file_ids": [db_file_id],
            "status": "started"
        })
    except Exception as e:
        await files_collection.update_one(
            {"_id": ObjectId(db_file_id)},
            {"$set": {"status": "failed", "error": str(e)}}
        )

# Handling multiple files upload
@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    files: Annotated[list[UploadFile], File(description="One or more documents to upload")],
):
    responses = []
    for file in files:
        # Create MongoDB Record
        db_file = await files_collection.insert_one({
            "name": file.filename,
            "status": "saving"
        })
        file_id_str = str(db_file.inserted_id)
        
        # Save to disk locally
        file_path = os.path.join(UPLOAD_DIR, f"{file_id_str}_{file.filename}")
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        # Update status to queued
        await files_collection.update_one(
            {"_id": db_file.inserted_id},
            {"$set": {"status": "queued", "path": file_path}}
        )
        
        # Execute the heavy LangGraph ingestion in the background (Queue mein daala)
        background_tasks.add_task(process_document_background, file_path, file_id_str)
        responses.append({"file_id": file_id_str, "filename": file.filename, "status": "queued"})
        
    return {"message": "Files uploaded successfully, processing started", "files": responses}

@router.get("/")
async def list_documents():
    docs = []
    async for doc in files_collection.find({}):
        docs.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "status": doc.get("status", "unknown"),
            "chunk_count": doc.get("chunk_count", 0),
            "entity_count": doc.get("entity_count", 0),
            "relationship_count": doc.get("relationship_count", 0),
        })
    return {"documents": docs}

@router.get("/{id}")
async def get_document(id: str):
    doc = await files_collection.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "status": doc.get("status", "unknown"),
        "path": doc.get("path"),
        "chunk_count": doc.get("chunk_count", 0),
        "entity_count": doc.get("entity_count", 0),
        "relationship_count": doc.get("relationship_count", 0),
        "error": doc.get("error"),
    }

@router.delete("/{id}")
async def delete_document(id: str):
    doc = await files_collection.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Cleanup related data in Qdrant and Neo4j using file_id references
    client = get_qdrant()
    if await client.collection_exists("docmind_chunks"):
        await client.delete(
            collection_name="docmind_chunks",
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="file_id",
                            match=models.MatchValue(value=id),
                        )
                    ]
                )
            ),
        )

    async for session in get_neo4j_session():
        await session.run(
            """
            MATCH ()-[r]->()
            WHERE $file_id IN coalesce(r.source_file_ids, [])
            SET r.source_file_ids = [fid IN coalesce(r.source_file_ids, []) WHERE fid <> $file_id],
                r.source_filenames = [name IN coalesce(r.source_filenames, []) WHERE name <> $filename]
            WITH r
            WHERE size(coalesce(r.source_file_ids, [])) = 0
            DELETE r
            """,
            file_id=id,
            filename=doc.get("name"),
        )
        await session.run(
            """
            MATCH (n)
            WHERE $file_id IN coalesce(n.source_file_ids, [])
            SET n.source_file_ids = [fid IN coalesce(n.source_file_ids, []) WHERE fid <> $file_id],
                n.source_filenames = [name IN coalesce(n.source_filenames, []) WHERE name <> $filename]
            """,
            file_id=id,
            filename=doc.get("name"),
        )
        await session.run(
            """
            MATCH (d:Document {id: $file_id})
            DETACH DELETE d
            """,
            file_id=id,
        )
        await session.run(
            """
            MATCH (n)
            WHERE NOT (n)--() AND NOT n:Document
            DELETE n
            """
        )

    file_path = doc.get("path")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    result = await files_collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 1:
        return {"message": f"Document {id} deleted successfully"}
    raise HTTPException(status_code=404, detail="Document not found")
