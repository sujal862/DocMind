from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...graphs.query import query_app
from ...db.mem0_client import get_memory

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    user_id: str = "default_user" 

@router.post("/")
async def chat_query(request: ChatRequest):
    try:
        # Initialize standard state required by the LangGraph Query Graph
        initial_state = {
            "query": request.query,
            "user_id": request.user_id,
            "query_type": "factual", # default overridden by analysis node
            "sub_queries": [], # original user query ko chhote-chhote simpler questions mein tod dena.
            "context": {}, # yeh dictionary hai jismein graph folder ka diff-diff nodes kuch kuch info ayga to usko dalega jaisa : past user history(mem0), retrieved document content(qdrant), neo4j data(neo4j)
            "answer": "" # final answer store hoga
        }
        
        # We specify thread_id in config to enable MongoDBSaver checkpointing.
        config = {"configurable": {"thread_id": request.user_id}}
        
        # Invoke LangGraph Processing
        response_state = await query_app.ainvoke(initial_state, config=config)
        
        return {
            "answer": response_state.get("answer", "No answer generated."),
            "query_type_detected": response_state.get("query_type"),
            "sub_queries": response_state.get("sub_queries", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def chat_history(user_id: str = "default_user"):
    memory = get_memory()
    history = memory.get_all(user_id=user_id)
    # the format varies, Mem0 returns a dict of memory events
    return {"history": history}
