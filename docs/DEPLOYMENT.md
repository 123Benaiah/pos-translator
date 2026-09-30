# POS Translator — Deployment Record

How this app was deployed. Stack: FastAPI backend + React/Vite frontend + MongoDB.

- Repo: `123Benaiah/pos-translator`, branch `main`
- Backend: `backend/app/main.py` (`app = FastAPI(...)`), entry `app.main:app`
- Frontend: `frontend/` (React 18, Vite 5, `tsc -b && vite build` → `dist/`)
- Architecture: backend on Render, frontend on Vercel, DB on MongoDB Atlas

## 1. Database — MongoDB Atlas M0 Free

Backend requires MongoDB (`motor==3.7.0` + `pymongo==4.10.0`, `backend/app/database.py`).

1. Atlas → Project `pos-translator` → Cluster M0 Free, AWS `eu-central-1`
2. Database Access → user `pos_api` / generated password, role `readWrite` on `pos_translator`
3. Network Access → `0.0.0.0/0` (Render Free has no static IP)
4. Connect string:
   ```
   mongodb+srv://pos_api:<PASSWORD>@cluster0.xxxxx.mongodb.net/pos_translator?retryWrites=true&w=majority
   ```
5. Seed once from PC (`backend/.env` pointed at Atlas):
   ```powershell
   pip install -r scripts/requirements.txt
   python scripts/setup_database.py
   ```
   Local verify showed 2276 entries, MongoDB `8.3.4` on `mongodb://localhost:27017`.

## 2. Backend — Render Web Service (manual)

`render.yaml` defines a Docker Blueprint, but manual service used `Language: Python 3`.

FIELD | VALUE
Name | `pos-translator-api`
Project | (leave empty)
Language | `Python 3`
Branch | `main`
Region | `Oregon (US West)` (matches existing services)
Root Directory | `backend`
Build Command | `pip install -r requirements.txt`
Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
Compute | `Free`
Health Check Path (Advanced) | `/api/health`
Environment Variables | see below

Env vars (`backend/app/config.py`, `backend/.env.example`):

| Key | Value | Secret |
|---|---|---|
| `MONGO_URI` | Atlas SRV string above | Yes |
| `DB_NAME` | `pos_translator` | No |
| `CORS_ORIGINS` | `http://localhost:5173` initially, then `https://<your-app>.vercel.app,http://localhost:5173` | No |
| `PYTHON_VERSION` | `3.13.0` (matches `backend/Dockerfile: FROM python:3.13-slim`) | No |

Do not manually add `PORT` — Render injects `$PORT`. Start command must use `$PORT`, not hardcoded `8000`.

Verify:
```
https://<service>.onrender.com/docs
https://<service>.onrender.com/api/health
```
Expected: `{"status":"ok","db":"connected","entries":2276}`. First hit ~40s on Free (cold start).

### Backend fix applied during deploy

Build succeeded but boot failed:
```
ModuleNotFoundError: No module named 'app'
```
Cause: `Root Directory` was empty (repo root), so `uvicorn app.main:app` could not resolve `backend/app/` with absolute imports (`from app.config...` in `main.py`).
Fix: set `Root Directory = backend`, keep Build/Start as above, `Manual Deploy > Clear build cache & Deploy`.

## 3. Frontend — Vercel

Two configs coexist:

- `vercel.json` (repo root): `cd frontend && npm ci && npm run build` → `frontend/dist` — used only when Vercel `Root Directory = ./`
- `frontend/vercel.json` (commit `905db53`): `npm ci && npm run build` → `dist` + SPA rewrites — used when `Root Directory = frontend`

Used settings:

FIELD | VALUE
Project | `pos-translator`
Framework Preset | `Vite`
Root Directory | `frontend`
Build Command | `npm run build` (not `vite build` alone — needs `tsc -b`)
Output Directory | `dist` (not `frontend/dist`)
Install Command | `npm ci`
Env | `VITE_API_URL=https://<render-service>.onrender.com` (no trailing `/`, no `/api` suffix — `frontend/src/lib/api.ts` appends `/api`), `Production` + `Preview`

### Frontend fixes applied during deploy

1. `cd: frontend: No such file or directory` with `Command "cd frontend && ..." exited with 1`
   Cause: `Root Directory = frontend` + root `vercel.json` Build Command. Cwd is already `frontend/`.
   Fix: override Build to `npm run build`, push commit `905db53 Add frontend/vercel.json for Vercel Root=frontend SPA rewrites`, redeploy.
2. Deploy on old commit `85744b5` lacked `frontend/vercel.json` → missing SPA rewrites. Fix: `git push origin main`, redeploy.

## 4. Local run

```powershell
# once
Copy-Item backend\.env.example backend\.env -Force
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r ..\scripts\requirements.txt
cd ..
python scripts\setup_database.py
# (scripts/requirements.txt includes backend/requirements.txt)

# backend (terminal 1)
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Leave `VITE_API_URL=` empty locally — Vite proxy (`frontend/vite.config.ts`: `/api -> http://localhost:8000`) handles it.

Verify: UI `http://localhost:5173`, docs `http://localhost:8000/docs`, health `http://localhost:8000/api/health`.

Local confirm result: `/api/health ok/connected/2276`, `/docs 200`, `/api/stats total 2276 verified 2271`.

### Local pitfalls hit

- `uvicorn app.main:app -- host ...` (spaces after `--`) → `Got unexpected extra arguments`. Use `--host`, `--port`, `--reload` with no space.
- Vite `ECONNREFUSED /api/*` → backend not running. Start backend first, then refresh `5173`.
