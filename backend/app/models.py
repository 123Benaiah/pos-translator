from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LanguageEnum(str, Enum):
    en = "en"
    loz = "loz"
    bem = "bem"


class MissingEnum(str, Enum):
    loz = "loz"
    bem = "bem"
    any = "any"


# ── Translate ──────────────────────────────────────────────

class TranslateResponse(BaseModel):
    input: str
    from_lang: str
    to_lang: str
    output: Optional[str] = None
    found: bool
    verified: bool = False


class TranslateAllResponse(BaseModel):
    input: str
    found: bool
    translations: dict[str, str]
    category: Optional[str] = None
    verified: bool = False


class BatchTranslateRequest(BaseModel):
    items: list[str] = Field(..., min_length=1, max_length=200)
    from_lang: LanguageEnum = LanguageEnum.en
    to_lang: LanguageEnum = LanguageEnum.bem


class BatchItemResult(BaseModel):
    input: str
    output: Optional[str] = None
    found: bool


class BatchTranslateResponse(BaseModel):
    results: list[BatchItemResult]
    total: int
    found_count: int


# ── Search ─────────────────────────────────────────────────

class SearchResult(BaseModel):
    en: str = ""
    loz: str = ""
    bem: str = ""
    category: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    count: int
    results: list[SearchResult]


class SuggestResponse(BaseModel):
    query: str
    suggestions: list[str]


# ── Entries CRUD ───────────────────────────────────────────

class EntryCreate(BaseModel):
    en: str = Field(..., min_length=1)
    loz: str = ""
    bem: str = ""
    category: str = "custom"
    verified: bool = False


class EntryUpdate(BaseModel):
    loz: Optional[str] = None
    bem: Optional[str] = None
    category: Optional[str] = None
    verified: Optional[bool] = None


class EntryResponse(BaseModel):
    model_config = ConfigDict(pop_by_name=True)

    id: str = Field(alias="_id")
    key: str
    en: str = ""
    loz: str = ""
    bem: str = ""
    category: Optional[str] = None
    verified: bool = False
    source: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PaginatedEntriesResponse(BaseModel):
    page: int
    per_page: int
    total: int
    pages: int
    entries: list[EntryResponse]


# ── Stats / Health ─────────────────────────────────────────

class StatsResponse(BaseModel):
    total_entries: int
    verified_entries: int
    complete_entries: int
    missing_loz: int
    missing_bem: int
    by_category: dict[str, int]


class HealthResponse(BaseModel):
    status: str
    db: str
    entries: int


# ── Errors ─────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    detail: str = ""
