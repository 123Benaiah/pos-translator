from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import connect_db, close_db
from app.routes import translate, search, manage, languages, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="POS Translator API",
    description="REST API for English–Lozi–Bemba translation dictionary",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


app.include_router(translate.router, prefix="/api", tags=["translate"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(manage.router, prefix="/api", tags=["manage"])
app.include_router(languages.router, prefix="/api", tags=["languages"])
app.include_router(stats.router, prefix="/api", tags=["stats"])
