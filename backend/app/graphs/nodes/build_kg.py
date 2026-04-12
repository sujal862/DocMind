from typing import Dict, Any
from ...db.neo4j import get_neo4j_session

def _as_dict(value: Any) -> Dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump()
    return dict(value)

def _sanitize_cypher_identifier(value: str) -> str:
    return value.replace("`", "").strip() or "Unknown"

async def write_to_neo4j(tx, entities):
    for entity_group in entities:
        file_id = entity_group.get("file_id")
        filename = entity_group.get("filename")
        nodes = [_as_dict(node) for node in entity_group.get("nodes", [])]
        edges = [_as_dict(edge) for edge in entity_group.get("edges", [])]

        if not file_id:
            continue

        await tx.run(
            """
            MERGE (doc:Document {id: $file_id})
            SET doc.name = $filename
            """,
            file_id=file_id,
            filename=filename,
        )

        for d_node in nodes:
            node_label = _sanitize_cypher_identifier(d_node.get("label", "Entity"))
            await tx.run(
                f"""
                MERGE (n:`{node_label}` {{id: $id}})
                SET n.source_file_ids =
                    CASE
                        WHEN $file_id IN coalesce(n.source_file_ids, []) THEN coalesce(n.source_file_ids, [])
                        ELSE coalesce(n.source_file_ids, []) + $file_id
                    END,
                    n.source_filenames =
                    CASE
                        WHEN $filename IN coalesce(n.source_filenames, []) THEN coalesce(n.source_filenames, [])
                        ELSE coalesce(n.source_filenames, []) + $filename
                    END
                WITH n
                MATCH (doc:Document {{id: $file_id}})
                MERGE (n)-[:MENTIONED_IN]->(doc)
                """,
                id=d_node.get("id"),
                file_id=file_id,
                filename=filename,
            )

        for d_edge in edges:
            relationship_type = _sanitize_cypher_identifier(d_edge.get("type", "RELATED_TO"))
            await tx.run(
                f"""
                MATCH (source {{id: $source}})
                MATCH (target {{id: $target}})
                MERGE (source)-[r:`{relationship_type}`]->(target)
                SET r.source_file_ids =
                    CASE
                        WHEN $file_id IN coalesce(r.source_file_ids, []) THEN coalesce(r.source_file_ids, [])
                        ELSE coalesce(r.source_file_ids, []) + $file_id
                    END,
                    r.source_filenames =
                    CASE
                        WHEN $filename IN coalesce(r.source_filenames, []) THEN coalesce(r.source_filenames, [])
                        ELSE coalesce(r.source_filenames, []) + $filename
                    END
                """,
                source=d_edge.get("source"),
                target=d_edge.get("target"),
                file_id=file_id,
                filename=filename,
            )

async def build_kg_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes structured entities from the state and pushes them to Neo4j.
    """
    entities = state.get("entities", [])
    if not entities:
        return {"status": "kg_skipped"}
        
    async for session in get_neo4j_session():
        # Execute the write within a transaction
        await session.execute_write(write_to_neo4j, entities)
        
    return {"status": "kg_built"}
