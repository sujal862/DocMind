import re
from typing import Any, Dict, Iterable, List


STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "based", "by", "did", "do", "does",
    "document", "documents", "for", "from", "how", "i", "in", "is", "it", "me",
    "of", "on", "or", "please", "question", "summarize", "summary", "tell", "that",
    "the", "their", "them", "they", "this", "to", "was", "what", "when", "where",
    "which", "who", "why", "with", "uploaded",
}


def tokenize_text(text: str) -> List[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z\\.-]*", text.lower())
    return [token for token in tokens if token not in STOPWORDS and len(token) >= 3]


def unique_keywords(*values: str) -> List[str]:
    seen: set[str] = set()
    ordered: List[str] = []
    for value in values:
        for token in tokenize_text(value):
            if token not in seen:
                seen.add(token)
                ordered.append(token)
    return ordered


def chunk_identity(payload: Dict[str, Any]) -> str:
    file_id = payload.get("file_id", "unknown")
    chunk_index = payload.get("chunk_index", "unknown")
    return f"{file_id}:{chunk_index}"


def lexical_score(payload: Dict[str, Any], keywords: Iterable[str]) -> int:
    text = payload.get("text", "").lower()
    filename = payload.get("filename", "").lower()
    score = 0
    for keyword in keywords:
        if keyword in filename:
            score += 4
        if keyword in text:
            score += 2
    return score


def format_chunk(payload: Dict[str, Any]) -> str:
    filename = payload.get("filename", "unknown")
    chunk_index = payload.get("chunk_index", "?")
    text = payload.get("text", "")
    return f"[{filename} | chunk {chunk_index}] {text}"
