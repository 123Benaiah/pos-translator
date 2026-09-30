# Architecture

## Runtime topology

```
Vercel (static Vite SPA, frontend/dist)
  │  axios baseURL = VITE_API_URL + /api   (or /api proxy locally)
  │  CORS: browser enforces Access-Control-Allow-Origin
  ▼
Render (FastAPI + uvicorn, backend/app)
  │  lifespan: connect_db() → Motor → Atlas
  │  CORS middleware from CORS_ORIGINS (exact origins, credentials on)
  ▼
MongoDB Atlas M0 (db pos_translator)
  ├── translations (~2276 docs: key unique, en/loz/bem, category, verified, source, timestamps)
  └── translation_log (input_text, from_lang, to_lang, output_text, found, timestamp)
```

Frontend never connects to MongoDB. All data flows through `/api/*`.

## Backend layout (`backend/app`)

- `main.py` — `FastAPI(lifespan)`, CORS, global handler (passes HTTPException
  through, 500s masked), landing `GET /` (HTML DB status), `GET /api` (JSON
  summary), routers mounted at `/api`.
- `config.py` — `BaseSettings`: `MONGO_URI`, `DB_NAME`, `CORS_ORIGINS`
  (comma-split → `cors_origin_list`). Reads `backend/.env`.
- `database.py` — module globals `_client/_db`, `connect_db` (8s selection
  timeout), `close_db`, `get_database` (raises if lifespan not run).
- `dependencies.py` — `get_db()` for `Depends` (sync wrapper).
- `models.py` — `LanguageEnum`, `MissingEnum`, translate/search/entry/stats/health schemas.
- `routes/translate.py` — `GET /translate`, `GET /translate-all`,
  `POST /translate-batch`. Normalizes `strip().lower()`, background-logs
  to `translation_log` (never breaks response).
- `routes/search.py` — `GET /search` (`q`, `Literal lang`, `category`, `limit`),
  `GET /suggest` (prefix regex). Regex scan — no text index (fine at 2k docs).
- `routes/manage.py` — `GET /entries` (page/per_page/category/verified/missing),
  `GET /entries/{key}`, `POST` (201, DuplicateKeyError → 400),
  `PUT` (partial update + `updated_at`), `DELETE`.
- `routes/languages.py` — static `GET /languages`, `GET /categories` (distinct).
- `routes/stats.py` — `GET /stats` (5 counts + `$group by_category`),
  `GET /health` (`ping` → connected/disconnected, entries 0 when down).

Indexes (created by `scripts/setup_database.py`):
`translations: key unique, en, loz, bem, category`;
`translation_log: timestamp, from_lang`.

## Frontend layout (`frontend/src`)

- `main.tsx` — `QueryClientProvider` + `BrowserRouter` + `Toaster`.
- `App.tsx` — routes under `AppLayout`: `/`, `/batch`, `/search`,
  `/entries`, `/stats`, `*`.
- `components/layout/` — `AppLayout` (sidebar + outlet), `Sidebar` (nav),
  `ServerStatus` (health dot + entries + manual refresh via `useHealth.refetch()`),
  `Logo`, `Header` (title + actions slot).
- `components/{ui,translate,search,entries,stats}/` — presentational + panels.
- `hooks/` — one per endpoint: `useTranslate` (single, currently unused —
  panels use `useTranslateAll`), `useTranslateAll`, `useBatchTranslate`,
  `useSearch`, `useSuggest`, `useEntries`, `useStats`, `useHealth` (30s poll).
- `lib/api.ts` — exports `API_ORIGIN` (trimmed `VITE_API_URL` or `''`) and
  `API_BASE` (`ORIGIN/api` or `/api`); axios instance.
- `lib/queryClient.ts` — `staleTime 5m, retry 1, no refocus`.
- `stores/languageStore.ts` — zustand persist `pos-translator-langs`.
- `types/` — `Language`, all DTOs incl. `HealthResponse{status,db,entries}`.
- `vite.config.ts` — `@` → `src` alias (currently unused, kept),
  ESM-safe `__dirname`, dev proxy `/api → localhost:8000`.

## Config & deploy mapping

- `render.yaml` — Docker blueprint only (`dockerfilePath backend/Dockerfile`,
  `healthCheckPath /api/health`). Manual Render service uses Python 3 with
  Root `backend`. No `PORT` key — Render injects `$PORT`
  (`Dockerfile` defaults `${PORT:-8000}`).
- `frontend/vercel.json` — canonical when Vercel Root = `frontend`
  (`npm ci && npm run build` → `dist` + SPA rewrite).
  Root `vercel.json` is legacy (only if Root = `./`).
- `scripts/setup_database.py` — reads `backend/.env`, sources
  `docs/languages/*/*.csv`, drops + recreates collections + indexes,
  upserts 2276 entries. Never prints URI (masked).
- `dumps/` — seed JSON exports + `MIGRATION_OFFLINE_TO_ONLINE` notes.
- `docs/languages/` — source CSVs (9 lozi + 9 bemba).
