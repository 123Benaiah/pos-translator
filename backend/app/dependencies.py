from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database


async def get_db() -> AsyncIOMotorDatabase:
    return get_database()
