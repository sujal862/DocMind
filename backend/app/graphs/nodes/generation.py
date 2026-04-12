from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from ...db.mem0_client import get_memory
from ...config import settings

# Yeh final answer banata hai.

def get_generation_chain():
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        api_key=settings.OPENAI_API_KEY,
    )
    gen_prompt = PromptTemplate.from_template(
        """You are a helpful assistant for DocMind, answering questions based on the provided context retrieved from documents.
        If the context doesn't contain the answer, say you don't know based on the provided documents.
        Cite your sources naturally in your response when possible.

        User History Context:
        {user_history}

        Retrieved Document Context:
        {doc_context}

        Query: {query}
        """
    )
    return gen_prompt | llm

async def generation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates an answer based on the aggregated context and the original query.
    Updates Mem0 with the answer.
    """
    query = state.get("query", "")
    user_id = state.get("user_id", "default_user")
    context_dict = state.get("context", {})
    
    user_history = context_dict.get("user_history", "")
    doc_context = context_dict.get("retrieved_data", "No documents retrieved.")
    
    chain = get_generation_chain()
    result = await chain.ainvoke({
        "query": query,
        "user_history": user_history,
        "doc_context": doc_context
    })
    
    answer = result.content
    
    # Store the final interaction in Mem0
    memory = get_memory()
    memory.add(f"User asked: {query} | System answered: {answer}", user_id=user_id)
    
    return {"answer": answer}
