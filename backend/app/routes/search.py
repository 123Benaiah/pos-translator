import re

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_db
from app.models import SearchResponse, SuggestResponse, SearchResult

router = APIRouter()


@router.get("/search", response_model=SearchResponse)
async def search_translations(
    q: str = Query(..., min_length=2),
    lang: str = Query(default="all"),
    category: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    q = q.strip().lower()
    pattern = re.compile(re.escape(q), re.IGNORECASE)

    if lang == "all":
        query: dict = {"$or": [
            {"en": {"$regex": pattern}},
            {"loz": {"$regex": pattern}},
            {"bem": {"$regex": pattern}},
        ]}
    elif lang in ("en", "loz", "bem"):
        query = {lang: {"$regex": pattern}}
    else:
        query = {"$or": [
            {"en": {"$regex": pattern}},
            {"loz": {"$regex": pattern}},
            {"bem": {"$regex": pattern}},
        ]}

    if category:
        query["category"] = category

    cursor = db.translations.find(
        query,
        {"_id": 0, "en": 1, "loz": 1, "bem": 1, "category": 1},
    ).limit(limit)

    docs = await cursor.to_list(length=limit)
    results = [SearchResult(**doc) for doc in docs]

    return SearchResponse(query=q, count=len(results), results=results)


@router.get("/suggest", response_model=SuggestResponse)
async def suggest(
    q: str = Query(..., min_length=1),
    lang: str = Query(default="en"),
    limit: int = Query(default=8, ge=1, le=20),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    q = q.strip().lower()

    if lang not in ("en", "loz", "bem"):
        lang = "en"

    regex = re.compile(f"^{re.escape(q)}", re.IGNORECASE)
    cursor = db.translations.find(
        {lang: {"$regex": regex}},
        {lang: 1, "_id": 0},
    ).limit(limit)

    docs = await cursor.to_list(length=limit)
    suggestions = sorted(set(doc.get(lang, "") for doc in docs if doc.get(lang)))

    return SuggestResponse(query=q, suggestions=suggestions)
