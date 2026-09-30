import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from app.dependencies import get_db
from app.models import (
    EntryCreate,
    EntryResponse,
    EntryUpdate,
    ErrorResponse,
    MissingEnum,
    PaginatedEntriesResponse,
)

router = APIRouter()


def _serialize(doc: dict) -> dict:
    data = dict(doc)
    data["_id"] = str(data["_id"])
    return data


@router.get(
    "/entries",
    response_model=PaginatedEntriesResponse,
)
async def list_entries(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    category: str | None = Query(default=None),
    verified: bool | None = Query(default=None),
    missing: MissingEnum | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}
    if category:
        query["category"] = category
    if verified is not None:
        query["verified"] = verified
    if missing:
        if missing == MissingEnum.any:
            query["$or"] = [{"loz": ""}, {"bem": ""}]
        elif missing == MissingEnum.loz:
            query["loz"] = ""
        elif missing == MissingEnum.bem:
            query["bem"] = ""

    total = await db.translations.count_documents(query)
    pages = max(1, math.ceil(total / per_page))
    skip = (page - 1) * per_page

    cursor = db.translations.find(query).sort("key", ASCENDING).skip(skip).limit(per_page)
    docs = await cursor.to_list(length=per_page)
    entries = [EntryResponse(**_serialize(doc)) for doc in docs]

    return PaginatedEntriesResponse(
        page=page, per_page=per_page, total=total, pages=pages, entries=entries,
    )


@router.get(
    "/entries/{key}",
    response_model=EntryResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_entry(
    key: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.translations.find_one({"key": key.lower()})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Entry '{key}' not found")
    return EntryResponse(**_serialize(doc))


@router.post(
    "/entries",
    response_model=EntryResponse,
    status_code=201,
    responses={400: {"model": ErrorResponse}},
)
async def create_entry(
    body: EntryCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    key = body.en.strip().lower()
    if not key:
        raise HTTPException(status_code=400, detail="English word is required.")
    existing = await db.translations.find_one({"key": key})
    if existing:
        raise HTTPException(status_code=400, detail=f"The word '{key}' already exists.")

    now = datetime.now(timezone.utc)
    doc = {
        "key": key,
        "en": key,
        "loz": body.loz.strip().lower(),
        "bem": body.bem.strip().lower(),
        "category": body.category.strip().lower(),
        "verified": body.verified,
        "source": "api",
        "created_at": now,
        "updated_at": now,
    }

    result = None
    try:
        result = await db.translations.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail=f"The word '{key}' already exists.")
    doc["_id"] = result.inserted_id
    return EntryResponse(**_serialize(doc))


@router.put(
    "/entries/{key}",
    response_model=EntryResponse,
    responses={404: {"model": ErrorResponse}},
)
async def update_entry(
    key: str,
    body: EntryUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.translations.find_one({"key": key.lower()})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Entry '{key}' not found")

    update_fields: dict = {}
    if body.loz is not None:
        update_fields["loz"] = body.loz.strip().lower()
    if body.bem is not None:
        update_fields["bem"] = body.bem.strip().lower()
    if body.category is not None:
        update_fields["category"] = body.category.strip().lower()
    if body.verified is not None:
        update_fields["verified"] = body.verified

    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc)
        await db.translations.update_one({"key": key.lower()}, {"$set": update_fields})

    doc = await db.translations.find_one({"key": key.lower()})
    return EntryResponse(**_serialize(doc))


@router.delete(
    "/entries/{key}",
    responses={404: {"model": ErrorResponse}},
)
async def delete_entry(
    key: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    result = await db.translations.delete_one({"key": key.lower()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Entry '{key}' not found")
    return {"deleted": True, "key": key.lower()}
