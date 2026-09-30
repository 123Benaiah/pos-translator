from contextlib import asynccontextmanager
from html import escape

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.config import get_settings
from app.database import connect_db, close_db, get_database
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


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    """Landing page: proves the API is up and the database is working.

    Shows DB status plus each collection with its document count,
    so opening the bare backend URL answers "is the DB working?".
    """
    db_name = escape(settings.DB_NAME)
    try:
        db = get_database()
        await db.command("ping")
        names = sorted(await db.list_collection_names())
        counts: dict[str, str] = {}
        for name in names:
            try:
                counts[name] = str(await db[name].count_documents({}))
            except Exception:
                counts[name] = "?"
        db_status = "connected"
        headline = "DB working well"
    except Exception as exc:
        names = []
        counts = {}
        db_status = "disconnected"
        headline = f"DB not reachable: {escape(str(exc))}"

    if names:
        rows = "".join(
            f"<li><code>{escape(n)}</code> — {escape(counts.get(n, '?'))} documents</li>"
            for n in names
        )
        collections_html = f"<ul>{rows}</ul>"
    else:
        collections_html = "<p>No collections found.</p>"

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>POS Translator API</title></head>
<body style="font-family: sans-serif; max-width: 640px; margin: 2rem auto;">
<h1>POS Translator API</h1>
<p><strong>{escape(headline)}</strong> (db: {escape(db_status)}, database: <code>{db_name}</code>)</p>
<h2>Collections</h2>
{collections_html}
<h2>Links</h2>
<ul>
<li><a href="/docs">Swagger docs (/docs)</a></li>
<li><a href="/api/health">Health check (/api/health)</a></li>
<li><a href="/api/stats">Stats (/api/stats)</a></li>
</ul>
</body>
</html>"""


@app.get("/api", include_in_schema=False)
async def api_index():
    """JSON summary for the bare /api path (routers live under /api/*)."""
    try:
        db = get_database()
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {
        "name": "POS Translator API",
        "status": "ok",
        "db": db_status,
        "docs": "/docs",
        "health": "/api/health",
        "stats": "/api/stats",
    }


app.include_router(translate.router, prefix="/api", tags=["translate"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(manage.router, prefix="/api", tags=["manage"])
app.include_router(languages.router, prefix="/api", tags=["languages"])
app.include_router(stats.router, prefix="/api", tags=["stats"])
