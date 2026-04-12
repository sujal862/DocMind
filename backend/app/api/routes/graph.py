from fastapi import APIRouter, HTTPException
from ...db.neo4j import get_neo4j_session

router = APIRouter()

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
                # Naive serialization, Neo4j return structures need unpacking dicts
                nodes.append(dict(record["n"]))
                nodes.append(dict(record["m"]))
                edges.append(dict(record["r"]))
                
        # Deduplicate nodes by ID if they exist
        unique_nodes = {n.get("id"): n for n in nodes if "id" in n}.values()
        
        return {"nodes": list(unique_nodes), "edges": edges}
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
                nodes.append(dict(record["n"]))
                nodes.append(dict(record["m"]))
                edges.append(dict(record["r"]))
                
        unique_nodes = {n.get("id"): n for n in nodes if "id" in n}.values()
        return {"entity": name, "raw_nodes": list(unique_nodes), "edges": edges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
