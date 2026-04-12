from pydantic_settings import BaseSettings, SettingsConfigDict

# BaseSettings ka benefit yeh hota hai ki tum defaults bhi de sakte ho, aur agar .env file ya environment variable available ho toh woh automatically un values ko use kar leta hai.
class Settings(BaseSettings):
    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "docmind"

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "neo4jpassword"

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"

    # OpenAI
    OPENAI_API_KEY: str | None = None
    
    # app .env file read karega aur usme jo variables honge unko load karega.
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

settings = Settings()
