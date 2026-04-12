from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from ...config import settings

#har chunk LLM ko deta hai, LLM se imp chije idetify krka structured graph-like data nikalta hai
class Node(BaseModel):
    id: str = Field(description="Unique identifier for the node (e.g., person name, concept).")
    label: str = Field(description="The type of the node (e.g., Person, Company, Concept).")

class Edge(BaseModel):
    source: str = Field(description="The id of the source node.")
    target: str = Field(description="The id of the target node.")
    type: str = Field(description="The type of relationship (e.g., WORKS_FOR, IS_A).")

class KnowledgeGraphExtraction(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

def get_extraction_chain():
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        api_key=settings.OPENAI_API_KEY,
    )
    structured_llm = llm.with_structured_output(KnowledgeGraphExtraction)
    prompt = PromptTemplate.from_template(
        """You are a top-tier data extraction system. Your task is to extract an ontology of nodes and edges to build a knowledge graph from the given text chunk.
        Only extract factual, distinct entities and their relationships. Return the data exactly in the requested format.
        
        Text Chunk:
        {text}
        """
    )
    return prompt | structured_llm

async def extract_entities_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts structured graph entities from text chunks using GPT-4o-mini.
    """
    chunk_records = state.get("chunk_records", [])
    extracted_entities = []
    extraction_chain = get_extraction_chain()
    
    # Process chunks in series or parallel (limiting parallel to avoid rate limits on free accounts)
    for chunk_record in chunk_records:
        chunk = chunk_record.get("text", "")
        # Avoid empty chunks
        if len(chunk.strip()) < 10:
            continue
            
        result = await extraction_chain.ainvoke({"text": chunk})
        
        # We append the pydantic model dumping
        if result:
            extracted_entities.append(
                {
                    "file_id": chunk_record.get("file_id"),
                    "filename": chunk_record.get("filename"),
                    "chunk_index": chunk_record.get("chunk_index"),
                    "nodes": result.nodes,
                    "edges": result.edges,
                }
            )

    return {"entities": extracted_entities, "status": "entities_extracted"}
