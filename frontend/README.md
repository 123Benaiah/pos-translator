# POS Translator — Frontend

React + Vite frontend for the English–Lozi–Bemba translation system.

## Setup

```bash
npm install
npm run dev
```

> Env lives here: copy `.env.example` to `.env` in this folder
> (`frontend/.env` holds `VITE_API_URL`; leave it empty for local dev
> so `/api` goes through the Vite proxy).

The app runs at http://localhost:5173 and proxies `/api` requests to the backend.

## Pages

- `/` — Single word translation + translate all languages
- `/batch` — Batch translate multiple words at once
- `/search` — Search across all translations
- `/entries` — Manage entries (CRUD + verify toggle)
- `/stats` — Database statistics and category breakdown

## Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS (custom gold/purple/orange palette)
- React Router v6
- TanStack Query v5
- Zustand (language store with persist)
- Axios, React Hot Toast, Lucide React icons

## Notes

- Sidebar footer `ServerStatus` polls `GET /api/health` every 30s and has a
  manual refresh button (entries count, backend origin, Render vs DB error hint).
- Hooks map 1:1 to API (`src/hooks/`, `useTranslate` single is available but
  panels currently use `useTranslateAll`); DTOs in `src/types`.
- `@` alias → `src` is configured (`vite.config.ts`, `tsconfig.json`).

## Deploy (Vercel)

Vercel project `pos-translator`, settings:

- `Root Directory = frontend`
- `Framework = Vite`, `Install = npm ci`, `Build = npm run build`, `Output = dist`
- `frontend/vercel.json` provides SPA rewrites (`/(.*) -> /index.html`)

Set in the Vercel dashboard (Production + Preview, then Redeploy — Vite bakes it at build time):

- `VITE_API_URL=https://<your-backend>.onrender.com` (required, build-time)

After the first deploy, add the Vercel URL to the backend's `CORS_ORIGINS`.
