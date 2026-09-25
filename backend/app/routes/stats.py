from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_db
from app.models import HealthResponse, StatsResponse

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    total = await db.translations.count_documents({})
    verified = await db.translations.count_documents({"verified": True})
    complete = await db.translations.count_documents(
        {"loz": {"$ne": ""}, "bem": {"$ne": ""}}
    )
    missing_loz = await db.translations.count_documents({"loz": ""})
    missing_bem = await db.translations.count_documents({"bem": ""})

    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    cursor = db.translations.aggregate(pipeline)
    by_category: dict[str, int] = {}
    async for doc in cursor:
        cat = doc["_id"] or "unknown"
        by_category[cat] = doc["count"]

    return StatsResponse(
        total_entries=total,
        verified_entries=verified,
        complete_entries=complete,
        missing_loz=missing_loz,
        missing_bem=missing_bem,
        by_category=by_category,
    )


@router.get("/health", response_model=HealthResponse)
async def health_check(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    count = await db.translations.count_documents({})

    return HealthResponse(status="ok", db=db_status, entries=count)
