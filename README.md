# POS Translator

English–Lozi–Bemba translation dictionary with a FastAPI backend and React frontend.

## Project Structure

```
pos-translator/
├── backend/          # FastAPI REST API (own .env + requirements.txt)
├── frontend/         # React + Vite UI (own .env.example, VITE_* vars)
├── scripts/          # Database setup scripts (own requirements.txt)
├── docs/             # Dictionary source files
└── README.md
```

## Quick Start

### 1. Backend venv (one venv for all Python work)

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt -r ..\scripts\requirements.txt
```

### 2. Database Setup

```bash
# From repo root, with backend venv activated:
pip install -r scripts/requirements.txt
python scripts/setup_database.py
```
Reads connection settings from `backend/.env`
(copy `backend/.env.example` to `backend/.env` first).

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Frontend

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
