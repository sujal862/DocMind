from fastapi import APIRouter, HTTPException
from ...db.neo4j import get_neo4j_session

router = APIRouter()

def serialize_node(node) -> dict:
    data = dict(node)
    data["labels"] = sorted(list(node.labels))
    return data

def serialize_edge(relationship) -> dict:
    source_node = relationship.start_node
    target_node = relationship.end_node
    source_id = source_node.get("id")
    target_id = target_node.get("id")
    source_label = source_node.get("name") or source_id
    target_label = target_node.get("name") or target_id

    return {
        "id": relationship.element_id,
        "source": source_id,
        "target": target_id,
        "source_label": source_label,
        "target_label": target_label,
        "type": relationship.type,
        **dict(relationship),
    }

@router.get("/")
async def get_full_graph():
    # Warning: In production, fetching the full graph without limits is dangerous.
    nodes = []
    edges = []
    
    query = """
    MATCH (n)-[r]->(m)
    RETURN n, r, m
    LIMIT 200
    """
    
    try:
        async for session in get_neo4j_session():
            result = await session.run(query)
            async for record in result:
                nodes.append(serialize_node(record["n"]))
                nodes.append(serialize_node(record["m"]))
                edges.append(serialize_edge(record["r"]))
                
        # Deduplicate nodes by ID if they exist
        unique_nodes = {n.get("id"): n for n in nodes if "id" in n}.values()
        unique_edges = {
            (edge.get("source"), edge.get("target"), edge.get("type")): edge
            for edge in edges
            if edge.get("source") and edge.get("target") and edge.get("type")
        }.values()
        
        return {"nodes": list(unique_nodes), "edges": list(unique_edges)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# all relation of a entity
@router.get("/entity/{name}")
async def get_entity_graph(name: str):
    query = """
    MATCH (n {id: $name})-[r]-(m)
    RETURN n, r, m
    """
    
    nodes = []
    edges = []
    try:
        async for session in get_neo4j_session():
            result = await session.run(query, name=name)
            async for record in result:
                nodes.append(serialize_node(record["n"]))
                nodes.append(serialize_node(record["m"]))
                edges.append(serialize_edge(record["r"]))
                
        unique_nodes = {n.get("id"): n for n in nodes if "id" in n}.values()
        unique_edges = {
            (edge.get("source"), edge.get("target"), edge.get("type")): edge
            for edge in edges
            if edge.get("source") and edge.get("target") and edge.get("type")
        }.values()
        serialized_nodes = list(unique_nodes)
        serialized_edges = list(unique_edges)
        return {"entity": name, "nodes": serialized_nodes, "raw_nodes": serialized_nodes, "edges": serialized_edges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
