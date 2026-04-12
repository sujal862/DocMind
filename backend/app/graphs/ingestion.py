from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Dict, Any

from .nodes.parse import parse_node
from .nodes.chunk import chunk_node
from .nodes.embed import embed_node
from .nodes.extract_entities import extract_entities_node
from .nodes.build_kg import build_kg_node
from .nodes.save_metadata import save_metadata_node

# The Flow :  parse -> chunk -> embed -> extract_entities -> build_kg -> save_metadata.

# Define State
class IngestionState(TypedDict):
    files: List[str] # uploaded file paths
    filenames: List[str] # original uploaded file names
    db_file_ids: List[str] # file ids in mongodb
    parsed_documents: List[Dict[str, Any]] # per-document parsed text + metadata
    chunk_records: List[Dict[str, Any]] # per-chunk text + source metadata
    entities: List[Dict[str, Any]] # extracted entities with source metadata
    status: str # status of the ingestion

# Workflow Initialization
workflow = StateGraph(IngestionState)

# Add Nodes
workflow.add_node("parse", parse_node)
workflow.add_node("chunk", chunk_node)
workflow.add_node("embed", embed_node)
workflow.add_node("extract_entities", extract_entities_node)
workflow.add_node("build_kg", build_kg_node) # kg = knowledge graph
workflow.add_node("save_metadata", save_metadata_node)

# Add Edges (linear flow for ingestion)
workflow.add_edge(START, "parse")
workflow.add_edge("parse", "chunk")
workflow.add_edge("chunk", "embed")
workflow.add_edge("embed", "extract_entities")
workflow.add_edge("extract_entities", "build_kg")
workflow.add_edge("build_kg", "save_metadata")
workflow.add_edge("save_metadata", END)

# Compile Graph
ingestion_app = workflow.compile()
