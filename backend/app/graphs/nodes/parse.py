import os
from langchain_community.document_loaders import PyPDFLoader
from typing import Dict, Any

async def parse_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reads PDFs from the file paths in the state ['files'].
    Extracts raw text and updates the state.
    """
    files = state.get("files", [])
    db_file_ids = state.get("db_file_ids", [])
    filenames = state.get("filenames", [])
    parsed_documents = []
    
    for index, file_path in enumerate(files):
        # Load PDF using LangChain's PyPDFLoader
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        # Combine pages into a single string for this document
        doc_text = "\n".join([page.page_content for page in docs])
        filename = filenames[index] if index < len(filenames) else os.path.basename(file_path)
        file_id = db_file_ids[index] if index < len(db_file_ids) else None
        parsed_documents.append(
            {
                "file_id": file_id,
                "filename": filename,
                "file_path": file_path,
                "text": doc_text,
            }
        )
        
    return {"parsed_documents": parsed_documents, "status": "parsed"}
