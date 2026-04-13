import os
import tempfile
from langchain_community.document_loaders import PyPDFLoader
from typing import Dict, Any
from ...db.s3 import download_file_from_s3

async def parse_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Downloads PDFs from S3 to temp files, extracts text, then cleans up.
    state['files'] now contains S3 keys instead of local paths.
    """
    s3_keys = state.get("files", [])
    db_file_ids = state.get("db_file_ids", [])
    filenames = state.get("filenames", [])
    parsed_documents = []

    for index, s3_key in enumerate(s3_keys):
        filename = filenames[index] if index < len(filenames) else s3_key.split("/")[-1]
        file_id = db_file_ids[index] if index < len(db_file_ids) else None

        # Download from S3 to a temp file for PyPDFLoader
        suffix = os.path.splitext(filename)[1] or ".pdf"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp_path = tmp.name
        tmp.close()

        try:
            download_file_from_s3(s3_key, tmp_path)

            # Load PDF using LangChain's PyPDFLoader
            loader = PyPDFLoader(tmp_path)
            docs = loader.load()
            doc_text = "\n".join([page.page_content for page in docs])

            parsed_documents.append({
                "file_id": file_id,
                "filename": filename,
                "file_path": s3_key,  # Store S3 key as reference
                "text": doc_text,
            })
        finally:
            # Always clean up the temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    return {"parsed_documents": parsed_documents, "status": "parsed"}
