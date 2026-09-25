# POS Translator

English–Lozi–Bemba translation dictionary with a FastAPI backend and React frontend.

## Project Structure

```
pos-translator/
├── backend/          # FastAPI REST API
├── frontend/         # React + Vite UI
├── scripts/          # Database setup scripts
├── docs/             # Dictionary source files
├── .env              # Shared environment config
└── README.md
```

## Quick Start

### 1. Database Setup

```bash
# Install MongoDB and start the service
pip install -r requirements.txt
python scripts/setup_database.py
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Languages

- **English (en)** — source language
- **Lozi (loz)** — Silozi
- **Bemba (bem)** — Ichibemba

## Tech Stack

- **Backend:** FastAPI, Motor (async MongoDB), Pydantic v2
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, TanStack Query, Zustand
