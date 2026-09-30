from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database


def get_db() -> AsyncIOMotorDatabase:
    return get_database()
