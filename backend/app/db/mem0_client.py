from mem0 import Memory
from ..config import settings

config = {
    "llm": {
        "provider": "openai",
        "config": {
            "model": "gpt-4o-mini",
            "api_key": settings.OPENAI_API_KEY
        }
    },
    "custom_prompt": (
        "You are a memory extraction assistant. Extract distinct, standalone facts and user preferences from the conversation.\n"
        "IMPORTANT RULES:\n"
        "- Each preference or fact must be stored as a SEPARATE memory.\n"
        "- Do NOT merge or combine related preferences. For example, 'prefers concise answers' and 'prefers answers in bullet points' are TWO separate memories.\n"
        "- If a new fact directly contradicts an existing memory, update it. Otherwise, create a new memory.\n"
        "- Only update an existing memory when the new information is saying the EXACT same thing in different words.\n"
        "- Focus on extracting user preferences, important facts, and key information from the conversation."
    ),
}

memory: Memory | None = None

def get_memory() -> Memory:
    global memory
    if memory is None:
        memory = Memory.from_config(config)
    return memory
