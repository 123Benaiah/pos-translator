# POS Translator — Backend

FastAPI REST API for the English–Lozi–Bemba translation dictionary.

## Setup

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> Env lives here: copy `.env.example` to `.env` in this folder
> (`backend/.env` holds `MONGO_URI`, `DB_NAME`, `CORS_ORIGINS`).

## Deploy (Render)

`render.yaml` at the repo root defines the `pos-translator-api` Docker service.
Set in the Render dashboard:

- `MONGO_URI` — your Atlas connection string (secret, `sync: false`)
- `CORS_ORIGINS` — include your Vercel frontend URL after it deploys

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Translate

```bash
# Single word translation
curl "http://localhost:8000/api/translate?text=dog&from_lang=en&to_lang=bem"

# All translations for a word
curl "http://localhost:8000/api/translate-all?text=dog&from_lang=en"

# Batch translate
curl -X POST "http://localhost:8000/api/translate-batch" \
  -H "Content-Type: application/json" \
  -d '{"items": ["dog", "cat", "water"], "from_lang": "en", "to_lang": "bem"}'
```

### Search

```bash
# Search across all languages
curl "http://localhost:8000/api/search?q=water"

# Search in specific language
curl "http://localhost:8000/api/search?q=dog&lang=en&category=animals"

# Autocomplete suggestions
curl "http://localhost:8000/api/suggest?q=do&lang=en"
```

### Entry Management

```bash
# List entries (paginated)
curl "http://localhost:8000/api/entries?page=1&per_page=20"

# Get single entry
curl "http://localhost:8000/api/entries/dog"

# Create entry
curl -X POST "http://localhost:8000/api/entries" \
  -H "Content-Type: application/json" \
  -d '{"en": "perfume", "loz": "lafumu", "bem": "ubwalwa bwa kununkila", "category": "custom"}'

# Update entry
curl -X PUT "http://localhost:8000/api/entries/dog" \
  -H "Content-Type: application/json" \
  -d '{"verified": true}'

# Delete entry
curl -X DELETE "http://localhost:8000/api/entries/perfume"
```

### Metadata

```bash
# Available languages
curl "http://localhost:8000/api/languages"

# Available categories
curl "http://localhost:8000/api/categories"

# Database stats
curl "http://localhost:8000/api/stats"

# Health check
curl "http://localhost:8000/api/health"
```
