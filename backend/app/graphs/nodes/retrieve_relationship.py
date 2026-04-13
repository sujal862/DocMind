import re
from typing import Dict, Any
from ...db.neo4j import get_neo4j_session

STOPWORDS = {
    "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
    "are", "is", "was", "were", "the", "a", "an", "to", "of", "in", "on",
    "for", "and", "or", "does", "do", "did", "have", "has", "had", "with",
    "entities", "entity", "connected", "relationship", "relationships",
    "mentioned", "main", "people", "characters", "partners", "associates",
}

def extract_keywords(query_text: str, sub_queries: list[str]) -> list[str]:
    raw_texts = [query_text, *sub_queries]
    seen: set[str] = set()
    keywords: list[str] = []

    for text in raw_texts:
        for token in re.findall(r"[A-Za-z][A-Za-z\\.-]*", text):
            normalized = token.lower()
            if normalized in STOPWORDS or len(normalized) < 3:
                continue
            if normalized not in seen:
                seen.add(normalized)
                keywords.append(normalized)

    return keywords or [query_text.lower()]

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
    
    keywords = extract_keywords(query_text, sub_queries)
    
    extracted_rels = []
    async for session in get_neo4j_session():
        cypher_query = """
        MATCH (n)-[r]-(m)
        WHERE type(r) <> 'MENTIONED_IN'
          AND any(keyword IN $keywords WHERE
                toLower(n.id) = keyword
                OR toLower(m.id) = keyword
                OR toLower(n.id) CONTAINS keyword
                OR toLower(m.id) CONTAINS keyword
                OR keyword CONTAINS toLower(n.id)
                OR keyword CONTAINS toLower(m.id)
                OR any(name IN coalesce(r.source_filenames, []) WHERE toLower(name) CONTAINS keyword)
          )
        RETURN n.id, type(r), m.id, coalesce(r.source_filenames, []) AS source_files
        LIMIT 25
        """
        result = await session.run(cypher_query, keywords=keywords)
        async for record in result:
            n_id, r_type, m_id = record["n.id"], record["type(r)"], record["m.id"]
            source_files = ", ".join(record["source_files"]) if record["source_files"] else "unknown source"
            rel_str = f"{n_id} -[{r_type}]-> {m_id} (docs: {source_files})"
            if rel_str not in extracted_rels:
                extracted_rels.append(rel_str)
            
    context["retrieved_data"] = "\\n".join(extracted_rels) if extracted_rels else "No specific relationships found in Graph."
    
    return {"context": context}
