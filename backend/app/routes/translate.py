import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_db
from app.models import (
    BatchItemResult,
    BatchTranslateRequest,
    BatchTranslateResponse,
    ErrorResponse,
    LanguageEnum,
    TranslateAllResponse,
    TranslateResponse,
)

router = APIRouter()

VALID_LANGS = {"en", "loz", "bem"}


async def _log_translation(
    db: AsyncIOMotorDatabase,
    input_text: str,
    from_lang: str,
    to_lang: str,
    output_text: str,
    found: bool,
):
    await db.translation_log.insert_one(
        {
            "input_text": input_text,
            "from_lang": from_lang,
            "to_lang": to_lang,
            "output_text": output_text,
            "found": found,
            "timestamp": datetime.now(timezone.utc),
        }
    )


@router.get(
    "/translate",
    response_model=TranslateResponse,
    responses={400: {"model": ErrorResponse}},
)
async def translate_word(
    text: str = Query(..., min_length=1),
    from_lang: LanguageEnum = Query(...),
    to_lang: LanguageEnum = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    text = text.strip().lower()
    if from_lang == to_lang:
        return TranslateResponse(
            input=text, from_lang=from_lang, to_lang=to_lang,
            output=text, found=True, verified=True,
        )

    doc = await db.translations.find_one(
        {from_lang: {"$eq": text}},
        {to_lang: 1, "verified": 1, "_id": 0},
    )

    if doc and doc.get(to_lang):
        output = doc[to_lang]
        verified = doc.get("verified", False)
        found = True
    else:
        output = None
        verified = False
        found = False

    background_tasks.add_task(
        _log_translation, db, text, from_lang, to_lang,
        output or "", found,
    )

    return TranslateResponse(
        input=text, from_lang=from_lang, to_lang=to_lang,
        output=output, found=found, verified=verified,
    )


@router.get(
    "/translate-all",
    response_model=TranslateAllResponse,
    responses={400: {"model": ErrorResponse}},
)
async def translate_all(
    text: str = Query(..., min_length=1),
    from_lang: LanguageEnum = Query(default=LanguageEnum.en),
    db: AsyncIOMotorDatabase = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    text = text.strip().lower()
    doc = await db.translations.find_one(
        {from_lang: {"$eq": text}},
        {"en": 1, "loz": 1, "bem": 1, "category": 1, "verified": 1, "_id": 0},
    )

    if doc:
        translations = {
            lang: doc.get(lang, "") for lang in ("en", "loz", "bem")
        }
        result = TranslateAllResponse(
            input=text,
            found=True,
            translations=translations,
            category=doc.get("category"),
            verified=doc.get("verified", False),
        )
    else:
        result = TranslateAllResponse(
            input=text,
            found=False,
            translations={"en": "", "loz": "", "bem": ""},
            category=None,
            verified=False,
        )

    for lang in ("en", "loz", "bem"):
        if lang != from_lang:
            background_tasks.add_task(
                _log_translation,
                db, text, from_lang, lang,
                result.translations.get(lang, ""),
                result.found,
            )

    return result


@router.post(
    "/translate-batch",
    response_model=BatchTranslateResponse,
    responses={400: {"model": ErrorResponse}},
)
async def translate_batch(
    body: BatchTranslateRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    from_lang = body.from_lang.value
    to_lang = body.to_lang.value

    if from_lang == to_lang:
        results = [
            BatchItemResult(input=item.strip().lower(), output=item.strip().lower(), found=True)
            for item in body.items
        ]
        return BatchTranslateResponse(
            results=results, total=len(results), found_count=len(results),
        )

    normalized = [item.strip().lower() for item in body.items]
    unique_words = list(set(normalized))

    cursor = db.translations.find(
        {from_lang: {"$in": unique_words}},
        {from_lang: 1, to_lang: 1, "_id": 0},
    )
    docs = await cursor.to_list(length=len(unique_words))

    lookup: dict[str, str] = {}
    for doc in docs:
        src = doc.get(from_lang, "")
        tgt = doc.get(to_lang, "")
        if src and tgt:
            lookup[src] = tgt

    results = []
    found_count = 0
    for word in normalized:
        output = lookup.get(word)
        found = output is not None
        if found:
            found_count += 1
        results.append(BatchItemResult(input=word, output=output, found=found))
        background_tasks.add_task(
            _log_translation, db, word, from_lang, to_lang,
            output or "", found,
        )

    return BatchTranslateResponse(
        results=results, total=len(results), found_count=found_count,
    )
