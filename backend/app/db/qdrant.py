from qdrant_client import AsyncQdrantClient
from ..config import settings

# Initialize Async Qdrant Client for vector operations
qdrant_client = AsyncQdrantClient(
    url=settings.QDRANT_URL,
)

def get_qdrant() -> AsyncQdrantClient:
    return qdrant_client
