from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from ...db.mem0_client import get_memory
from ...config import settings

# Query ko samjta + classify karta hai (factual/relationship/comparison/summary),
# Mem0 se user history lekar complex queries ko sub-queries mein todta hai

class QueryAnalysis(BaseModel):
    query_type: str = Field(description="Must be one of: factual, relationship, comparison, summary")
    sub_queries: List[str] = Field(description="A list of decomposed sub-queries derived from the original query to help with retrieval", default=[])

def get_analysis_chain():
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        api_key=settings.OPENAI_API_KEY,
    )
    # with_structured_output — LLM ko force karta hai ki response exactly tumhare defined format mein do
    structured_analyzer = llm.with_structured_output(QueryAnalysis)
    analysis_prompt = PromptTemplate.from_template(
        """You are a smart query router for an intelligent document workspace.
        Analyze the following user query and categorize it into exactly one of these types:
        - factual: Specific facts, numbers, dates, or direct questions about content.
        - relationship: Questions about connections, e.g. "Who works with X?" or "How is X related to Y?"
        - comparison: Comparing multiple entities or multiple documents.
        - summary: Requests for summaries or overviews of entire documents.
        
        If the query is complex, decompose it into a few simple sub-queries.

        User Context (Past Mem0 preferences/history):
        {user_context}

        Query: {query}
        """
    )
    # | = Pipe operator — ek ke output ko doosre ka input banana
    return analysis_prompt | structured_analyzer

async def query_analysis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes the query and categorizes it to determine routing.
    Fetches user context from Mem0 to augment the analysis.
    """
    query = state.get("query", "")
    user_id = state.get("user_id", "default_user")
    
    # Optional: Retrieve relevant context from past queries for this user from Mem0
    memory = get_memory()
    retrieved_mem0 = memory.search(query, user_id=user_id)
    
    # Handling both list return type and dictionary {"results": [...]} return type based on Mem0 version
    results_list = retrieved_mem0.get("results", []) if isinstance(retrieved_mem0, dict) else retrieved_mem0
    
    user_context = "\n".join([m.get("memory", "") for m in results_list]) if results_list else "No previous context."

    # Analyze
    chain = get_analysis_chain()
    result = await chain.ainvoke({"query": query, "user_context": user_context})
    
    return {
        "query_type": result.query_type,
        "sub_queries": result.sub_queries,
        # Pass the mem0 context forward so generation node can use it
        "context": {"user_history": user_context}
    }
