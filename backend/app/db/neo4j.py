from neo4j import AsyncGraphDatabase
from ..config import settings

# Initialize Async Neo4j Driver
neo4j_driver = AsyncGraphDatabase.driver(
    settings.NEO4J_URI,
    auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
)

async def get_neo4j_session():
    # Helper to get an async session
    async with neo4j_driver.session() as session:
        yield session # automatic session close after use

async def close_neo4j():
    await neo4j_driver.close()
