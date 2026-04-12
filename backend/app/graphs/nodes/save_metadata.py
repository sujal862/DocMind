from typing import Dict, Any
from ...db.mongodb import files_collection
from bson import ObjectId

# this tells: is file ka processing kaam khatam ho gaya
# db_file_ids leta hai, related Mongo document ko update karta hai, status completed jaisa set karta hai
async def save_metadata_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates the file metadata in MongoDB to reflect completion.
    """
    db_file_ids = state.get("db_file_ids", [])  # Passed by the API layer to track
    chunk_records = state.get("chunk_records", [])
    entities = state.get("entities", [])
    chunk_count_by_file: Dict[str, int] = {}
    entity_count_by_file: Dict[str, int] = {}
    relationship_count_by_file: Dict[str, int] = {}

    for chunk_record in chunk_records:
        file_id = chunk_record.get("file_id")
        if file_id:
            chunk_count_by_file[file_id] = chunk_count_by_file.get(file_id, 0) + 1

    for entity_group in entities:
        file_id = entity_group.get("file_id")
        if not file_id:
            continue
        entity_count_by_file[file_id] = entity_count_by_file.get(file_id, 0) + len(entity_group.get("nodes", []))
        relationship_count_by_file[file_id] = relationship_count_by_file.get(file_id, 0) + len(entity_group.get("edges", []))
    
    if db_file_ids:
        for f_id in db_file_ids:
            await files_collection.update_one(
                {"_id": ObjectId(f_id)},
                {
                    "$set": {
                        "status": "completed",
                        "graph_run_status": state.get("status", "completed"),
                        "chunk_count": chunk_count_by_file.get(f_id, 0),
                        "entity_count": entity_count_by_file.get(f_id, 0),
                        "relationship_count": relationship_count_by_file.get(f_id, 0),
                    }
                },
            )
            
    return {"status": "metadata_saved"}
