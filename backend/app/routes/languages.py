from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_db

router = APIRouter()


@router.get("/languages")
async def get_languages():
    return {
        "languages": [
            {"code": "en", "name": "English", "native": "English"},
            {"code": "loz", "name": "Lozi", "native": "Silozi"},
            {"code": "bem", "name": "Bemba", "native": "Ichibemba"},
        ]
    }


@router.get("/categories")
async def get_categories(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    categories = await db.translations.distinct("category")
    categories = sorted(c for c in categories if c)
    return {"categories": categories}
