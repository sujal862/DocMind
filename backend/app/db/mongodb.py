from motor.motor_asyncio import AsyncIOMotorClient
from ..config import settings

# The Motor client is initialized here to connect to mongodb.
client = AsyncIOMotorClient(settings.MONGO_URI)
database = client[settings.MONGO_DB_NAME]

# Collections
files_collection = database.get_collection("files")
# Can add entity_collection or similar later if necessary
