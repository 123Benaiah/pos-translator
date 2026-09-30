# Troubleshooting

## Vercel Network Error but Render `/api/health` says connected

Symptom: sidebar shows Disconnected, actions fail with `Network Error`,
but `https://pos-translator.onrender.com/api/health` returns
`{"status":"ok","db":"connected","entries":2276}`.

Cause: frontend never talks to MongoDB — path is Vercel → Render → Atlas.
A working Render health proves Render → DB is fine; the break is
Vercel → Render, almost always CORS.

Fix:

1. Render Dashboard → `pos-translator-api` → Environment:
   `CORS_ORIGINS=https://pos-translator-three.vercel.app,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173`
   (exact origin, no trailing `/`; `allow_credentials` requires explicit origins).
2. `Manual Deploy → Clear build cache & Deploy`, wait ~2 min.
3. Vercel hard-refresh, click sidebar refresh (ServerStatus) → `Connected`.

Verify: F12 Console `blocked by CORS policy` disappears; Network
`/api/health` 200 with `Access-Control-Allow-Origin: https://pos-translator-three.vercel.app`.
`render.yaml` alone doesn't update an existing manual service.

## Vercel still calls wrong backend

- Check baked URL: fetch `/assets/index-*.js`, look for `onrender.com`.
  Must be `https://pos-translator.onrender.com` (no `/api` — `lib/api.ts` appends it).
- `VITE_API_URL` is build-time: set in Vercel Production + Preview, then Redeploy.
- Empty `VITE_API_URL` → calls `/api` on `vercel.app` → SPA rewrite returns
  `index.html` (looks like DB failure).

## Render cold start

First hit ~40s on Free (normal). Sidebar `Checking...` covers this.
`ServerStatus` distinguishes `Render not reachable` vs `API up but DB disconnected`.

## Local pitfalls

- `uvicorn app.main:app -- host` (space after `--`) → use `--host/--port/--reload`.
- Vite `ECONNREFUSED /api/*` → start backend first; keep `VITE_API_URL=` empty.
- `cd: frontend: No such file` on Vercel → Root is already `frontend`;
  Build must be `npm run build`, not `cd frontend && ...`.
- `ModuleNotFoundError: No module named 'app'` on Render → Root Directory = `backend`.
- 404/400 turning into 500 (fixed): global handler now passes HTTPException through.
- `Missing Translations` white-on-white (fixed `49577fe`): card had no bg but white text.

## Secrets

- Real credentials live only in `backend/.env` (ignored) and Render/Vercel dashboards.
- `*.example`, `DEPLOYMENT.md`, `dumps/*.md` must stay `<PASSWORD>`/`***`.
  `scripts/setup_database.py` no longer prints the URI.
- If a password was pasted anywhere public, rotate in Atlas and update Render.
