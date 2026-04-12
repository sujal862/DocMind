from typing import Dict, Any
from .retrieve_factual import retrieve_factual_node
from .retrieve_relationship import retrieve_relationship_node

# Yeh comparison query ke liye factual + relationship dono retrieval combine karta hai.
async def retrieve_comparison_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs both Qdrant search and Neo4j traversal to combine insights for comparison.
    """
    # Run factual
    factual_state = await retrieve_factual_node(state)
    factual_context = factual_state.get("context", {}).get("retrieved_data", "")
    
    # Run relationship
    rel_state = await retrieve_relationship_node(state)
    rel_context = rel_state.get("context", {}).get("retrieved_data", "")
    
    # Merge context
    merged_context = f"--- Document Matches ---\\n{factual_context}\\n\\n--- Graph Relationships ---\\n{rel_context}"
    
    context = state.get("context", {})
    context["retrieved_data"] = merged_context
    return {"context": context}
