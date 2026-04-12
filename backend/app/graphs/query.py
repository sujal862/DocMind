from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Dict, Any

from .nodes.query_analysis import query_analysis_node
from .nodes.retrieve_factual import retrieve_factual_node
from .nodes.retrieve_relationship import retrieve_relationship_node
from .nodes.retrieve_comparison import retrieve_comparison_node
from .nodes.retrieve_summary import retrieve_summary_node
from .nodes.generation import generation_node

class QueryState(TypedDict):
    query: str # original user query
    query_type: str  # factual, relationship, comparison, summary
    sub_queries: List[str] # original user query ko chhote-chhote simpler questions mein tod dena.
    context: Dict[str, str] # yeh dictionary hai jismein graph folder ka diff-diff nodes kuch kuch info ayga to usko dalega jaisa : past user history(mem0), retrieved document content(qdrant), neo4j data(neo4j)
    answer: str # final answer store hoga
    user_id: str

workflow = StateGraph(QueryState)

# Add Nodes
workflow.add_node("query_analysis", query_analysis_node)
workflow.add_node("retrieve_factual", retrieve_factual_node)
workflow.add_node("retrieve_relationship", retrieve_relationship_node)
workflow.add_node("retrieve_comparison", retrieve_comparison_node)
workflow.add_node("retrieve_summary", retrieve_summary_node)
workflow.add_node("generation", generation_node)

# Add Edges
workflow.add_edge(START, "query_analysis")

def route_query(state: QueryState) -> str:
    # Router conditional logic based on query_type
    t = state.get("query_type", "factual")
    if t == "relationship":
        return "retrieve_relationship"
    elif t == "comparison":
        return "retrieve_comparison"
    elif t == "summary":
        return "retrieve_summary"
    return "retrieve_factual"

workflow.add_conditional_edges(
    "query_analysis",
    route_query,
    {
        "retrieve_factual": "retrieve_factual",
        "retrieve_relationship": "retrieve_relationship",
        "retrieve_comparison": "retrieve_comparison",
        "retrieve_summary": "retrieve_summary",
    }
)

# All retrieval paths converge to generation
workflow.add_edge("retrieve_factual", "generation")
workflow.add_edge("retrieve_relationship", "generation")
workflow.add_edge("retrieve_comparison", "generation")
workflow.add_edge("retrieve_summary", "generation")
workflow.add_edge("generation", END)

# Checkpointing is initialized at server startup using AsyncMongoDBSaver
# We compile the graph dynamically or pass the checkpointer from main.py, 
# for now we expose the uncompiled workflow, or a compilation wrapper.
query_app = workflow.compile()
