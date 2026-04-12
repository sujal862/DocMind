from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import Dict, Any

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    is_separator_regex=False,
)

async def chunk_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes raw texts from the state and splits them into chunks.
    """
    parsed_documents = state.get("parsed_documents", [])
    chunk_records = []
    
    for parsed_document in parsed_documents:
        doc_text = parsed_document.get("text", "")
        chunks = text_splitter.split_text(doc_text)
        for chunk_index, chunk in enumerate(chunks):
            chunk_records.append(
                {
                    "file_id": parsed_document.get("file_id"),
                    "filename": parsed_document.get("filename"),
                    "file_path": parsed_document.get("file_path"),
                    "chunk_index": chunk_index,
                    "text": chunk,
                }
            )
    
    return {"chunk_records": chunk_records, "status": "chunked"}
