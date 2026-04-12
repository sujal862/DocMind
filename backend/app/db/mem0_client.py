from mem0 import Memory
from ..config import settings

config = {
    "llm": {
        "provider": "openai",
        "config": {
            "model": "gpt-4o-mini",
            "api_key": settings.OPENAI_API_KEY
        }
    }
}

memory: Memory | None = None

def get_memory() -> Memory:
    global memory
    if memory is None:
        memory = Memory.from_config(config)
    return memory
