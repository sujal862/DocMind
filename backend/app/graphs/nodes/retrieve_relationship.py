from typing import Dict, Any
from ...db.neo4j import get_neo4j_session

# Yeh graph-based retrieval karta ha
async def retrieve_relationship_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Traverses Neo4j based on subqueries derived in query analysis.
    For simplicity in this node, we fetch a subgraph limit or execute a basic MATCH.
    In a fully robust system, this could use a Cypher translation LLM.
    """
    context = state.get("context", {})
    query_text = state.get("query", "")
    sub_queries = state.get("sub_queries", [])
    
    # Extract simple keywords from the query to match against node IDs
    keywords = sub_queries if sub_queries else [query_text]
    
    extracted_rels = []
    async for session in get_neo4j_session():
        for keyword in keywords:
            # Basic keyword matching against Neo4j Node IDs. 
            # In a production system, this could use Neo4j Vector Search or Full-Text Indices.
            cypher_query = """
            MATCH (n)-[r]-(m)
            WHERE type(r) <> 'MENTIONED_IN'
              AND (
                toLower(n.id) CONTAINS toLower($keyword)
                OR toLower(m.id) CONTAINS toLower($keyword)
                OR any(name IN coalesce(r.source_filenames, []) WHERE toLower(name) CONTAINS toLower($keyword))
              )
            RETURN n.id, type(r), m.id, coalesce(r.source_filenames, []) AS source_files
            LIMIT 15
            """
            result = await session.run(cypher_query, keyword=keyword)
            async for record in result:
                n_id, r_type, m_id = record["n.id"], record["type(r)"], record["m.id"]
                source_files = ", ".join(record["source_files"]) if record["source_files"] else "unknown source"
                rel_str = f"{n_id} -[{r_type}]-> {m_id} (docs: {source_files})"
                if rel_str not in extracted_rels:
                    extracted_rels.append(rel_str)
            
    context["retrieved_data"] = "\\n".join(extracted_rels) if extracted_rels else "No specific relationships found in Graph."
    
    return {"context": context}
