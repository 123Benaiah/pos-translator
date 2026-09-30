# POS Translator

English ↔ Lozi (Silozi) ↔ Bemba (Ichibemba) translation dictionary.
FastAPI + MongoDB backend, React + Vite + Tailwind frontend.

Live:

- Frontend (Vercel): `https://pos-translator-three.vercel.app/`
- Backend (Render): `https://pos-translator.onrender.com` (`/docs`, `/api/health`)
- Database: MongoDB Atlas M0 (`pos_translator`, ~2276 entries)

## Architecture

```
Browser (Vercel static Vite)
  │  GET/POST https://<render>/api/*   (VITE_API_URL, axios)
  ▼
FastAPI (Render, app/main.py, lifespan connect_db)
  │  Motor async driver
  ▼
MongoDB Atlas (pos_translator.translations, translation_log)
```

The frontend never talks to MongoDB directly. If Render `/api/health`
says `{"status":"ok","db":"connected"}` but Vercel shows Network Error,
the break is Vercel → Render (CORS / env), not Render → DB.
See `docs/TROUBLESHOOTING.md`.

Details: `docs/ARCHITECTURE.md`. Endpoints: `docs/API.md` + `backend/README.md`.
Deploy record: `DEPLOYMENT.md`.

## Project structure

```
pos-translator/
├── backend/                 # FastAPI API (OWN .env, requirements.txt)
│   ├── app/
│   │   ├── main.py          # app, CORS, lifespan, /, /api, routers
│   │   ├── config.py        # MONGO_URI, DB_NAME, CORS_ORIGINS
│   │   ├── database.py      # Motor client, connect/close/get
│   │   ├── dependencies.py  # get_db() for Depends
│   │   ├── models.py        # Pydantic v2 schemas (LanguageEnum, entries, stats)
│   │   └── routes/          # translate, search, manage, languages, stats
│   ├── Dockerfile           # Render: WORKDIR /app, uvicorn $PORT
│   ├── requirements.txt     # fastapi, uvicorn, motor, pymongo, pydantic
│   ├── .env.example         # LOCAL TEST values (localhost)
│   └── README.md            # backend guide + curl examples
├── frontend/                # React 18 + Vite 5 + Tailwind (OWN .env.example)
│   ├── src/
│   │   ├── pages/           # Translate, Batch, Search, Entries, Stats, 404
│   │   ├── components/layout/ # AppLayout, Sidebar, ServerStatus, Logo, Header
│   │   ├── components/ui|translate|search|entries|stats/
│   │   ├── hooks/           # useTranslate(All), useBatch, useSearch, useEntries, useStats, useHealth
│   │   ├── lib/             # api.ts (API_ORIGIN/BASE), queryClient.ts, utils.ts
│   │   ├── stores/          # languageStore (zustand persist)
│   │   └── types/           # Language, DTOs, HealthResponse
│   ├── vite.config.ts       # @ alias, :5173, /api → :8000 proxy
│   ├── vercel.json          # CANONICAL for Root=frontend (build dist + SPA rewrite)
│   ├── .env.example         # VITE_API_URL= (empty local, Render URL in prod)
│   └── README.md            # frontend guide
├── scripts/                 # setup_database.py (seed from docs/languages CSVs)
├── docs/languages/          # source CSVs: lozi/*.csv (9), bemba/*.csv (9)
├── docs/                    # ARCHITECTURE, API, TROUBLESHOOTING (+ archive note)
├── dumps/                   # seed JSON dumps + migration notes
├── render.yaml              # Render blueprint (Docker, no PORT — injected)
├── vercel.json              # LEGACY root config (only if Root Directory = ./)
└── DEPLOYMENT.md            # step-by-step deploy history
```

Conventions:

- One venv for all Python: `backend/venv` (ignored). Scripts reuse it.
- Env files are per-app and never committed except `*.example`:
  `backend/.env` (ignored) holds `MONGO_URI/DB_NAME/CORS_ORIGINS`,
  `frontend/.env` (ignored, usually absent) holds `VITE_API_URL`.
- Generated artifacts are ignored and never committed:
  `frontend/dist/`, `node_modules/`, `*.tsbuildinfo`, `vite.config.d.ts`,
  `backend/venv/`, `__pycache__/`.
- `docs/follow-this-guide.md` is an archived generic JWT tutorial — unrelated,
  kept only for reference (header note added).

## Quick start (local)

```powershell
# 1. backend env
Copy-Item backend\.env.example backend\.env -Force
# backend/.env defaults to mongodb://localhost:27017 — edit only if using Atlas

# 2. python env (one venv)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt -r ..\scripts\requirements.txt
cd ..

# 3. seed DB (reads backend/.env, sources docs/languages/*.csv)
python scripts\setup_database.py

# 4. backend (terminal 1)
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Verify:

- UI `http://localhost:5173`, API `http://localhost:8000/docs`
- Health `http://localhost:8000/api/health` → `{"status":"ok","db":"connected"}`
- Leave `VITE_API_URL=` empty locally — Vite proxy handles `/api`.

## Environment variables

| File (ignored) | Key | Local test | Production |
|---|---|---|---|
| `backend/.env` | `MONGO_URI` | `mongodb://localhost:27017` | Atlas SRV in Render dashboard (secret) |
| `backend/.env` | `DB_NAME` | `pos_translator` | `pos_translator` |
| `backend/.env` | `CORS_ORIGINS` | `http://localhost:5173,...` | `https://pos-translator-three.vercel.app,http://localhost:5173` |
| `frontend/.env` | `VITE_API_URL` | empty (proxy) | `https://pos-translator.onrender.com` (no `/api`, no trailing `/`) |

`VITE_API_URL` is build-time — set in Vercel Production + Preview, then Redeploy.
`frontend/src/lib/api.ts` appends `/api` itself.

## Deployment (summary)

- Atlas M0 Free, user `readWrite` on `pos_translator`, Network `0.0.0.0/0`
  (Render Free has no static IP). Seed once from PC.
- Render `pos-translator-api` (Python 3, Root `backend`,
  Build `pip install -r requirements.txt`,
  Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`,
  Health `/api/health`). Env: `MONGO_URI` secret, `DB_NAME`,
  `CORS_ORIGINS` incl. Vercel URL, `PYTHON_VERSION 3.13.0`.
  `render.yaml` is the Docker blueprint (no `PORT` — Render injects `$PORT`).
- Vercel `pos-translator` (Root `frontend`, `npm ci`, `npm run build`,
  Output `dist`, `frontend/vercel.json` rewrites). Env `VITE_API_URL`.
Full history: `DEPLOYMENT.md`.

## Troubleshooting

- Vercel Network Error but Render health `connected` → `CORS_ORIGINS`
  on Render missing Vercel origin. Fix + `Clear build cache & Deploy`.
- First load ~40s → Render Free cold start (normal).
- White-on-white card, wrong API path, `cd: frontend` build error, etc. →
  `docs/TROUBLESHOOTING.md`.

## Chief-dev fixes in this pass

- `backend/app/main.py`: global handler no longer converts 404/400 to 500
  and no longer leaks `str(exc)`; `HTTPException` passes through.
- `translate.py`: `BackgroundTasks` injected (was shared default instance);
  `_log_translation` wrapped in try/except; removed unused `VALID_LANGS`/`asyncio`.
- `search.py`: `lang` validated via `Literal`, removed duplicated `$or`.
- `manage.py`: removed unused `ObjectId`, `_serialize` no longer mutates,
  `create_entry` handles `DuplicateKeyError` race.
- `stats.py`: `/health` returns `entries: 0` when DB down (was 500).
- `dependencies.py`: `get_db` sync (was redundant async wrapper).
- `database.py`: `serverSelectionTimeoutMS=8000`.
- `scripts/setup_database.py`: no longer prints full `MONGO_URI` (secret leak).
- `render.yaml`: removed hardcoded `PORT` (Render injects `$PORT`).
- `frontend/vite.config.ts`: ESM-safe `__dirname` via `fileURLToPath`.
- `frontend/package.json`: removed broken `lint` script (no eslint config).
- `frontend/README.md`: Vercel Root=`frontend` + `frontend/vercel.json`
  documented as canonical (was claiming root `vercel.json`).
- `docs/follow-this-guide.md`: marked archived/unrelated.
- `StatsCards`: Missing-Translations card fixed (was white-on-white).
