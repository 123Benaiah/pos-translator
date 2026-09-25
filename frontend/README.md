# POS Translator — Frontend

React + Vite frontend for the English–Lozi–Bemba translation system.

## Setup

```bash
npm install
npm run dev
```

> The `.env` file is in the project root (`../.env`).

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
