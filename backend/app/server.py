from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import documents, chat, graph, reset

app = FastAPI(
    title="DocMind API",
    description="Intelligent Document Workspace API with RAG and Graph capabilities",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def hello():
    return {"status": "healthy"}

# API Routers
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(graph.router, prefix="/graph", tags=["Knowledge Graph"])
app.include_router(reset.router, prefix="/reset", tags=["Reset"])
