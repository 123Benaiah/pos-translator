# API reference

Base locally `http://localhost:8000`, prod `https://pos-translator.onrender.com`.
All routers under `/api`. Interactive docs: `/docs` (Swagger), `/redoc`.
Landing pages: `GET /` (HTML DB status + counts), `GET /api` (JSON summary).

Conventions: `text/q/key` normalized `strip().lower()`; errors
`{"error","detail"}` (404/400 pass through, 500 masked).

## Translate

```
GET /api/translate?text=dog&from_lang=en&to_lang=bem
→ {"input":"dog","from_lang":"en","to_lang":"bem","output":"...","found":true,"verified":false}
GET /api/translate-all?text=dog&from_lang=en
→ {"input":"dog","found":true,"translations":{"en":"dog","loz":"...","bem":"..."},"category":"animals","verified":false}
POST /api/translate-batch  {"items":["dog","cat"],"from_lang":"en","to_lang":"bem"}
→ {"results":[{"input":"dog","output":"...","found":true}],"total":2,"found_count":1}
```

`from_lang/to_lang`: `en|loz|bem`. Same-lang returns echo `found:true`.
Each lookup is background-logged to `translation_log` (failure-safe).

## Search

```
GET /api/search?q=water&lang=all&category=&limit=20
→ {"query":"water","count":n,"results":[{"en":"water","loz":"...","bem":"...","category":"..."}]}
GET /api/suggest?q=do&lang=en&limit=8
→ {"query":"do","suggestions":["dog","door"]}
```

`lang` on search: `all|en|loz|bem` (validated). `q` min 2 (search) / 1 (suggest).

## Entries (CRUD)

```
GET /api/entries?page=1&per_page=50&category=&verified=&missing=
  missing: loz|bem|any  → {"page","per_page","total","pages","entries":[{_id,key,en,loz,bem,category,verified,source,created_at,updated_at}]}
GET /api/entries/dog → single Entry (404 if missing)
POST /api/entries  {"en":"perfume","loz":"...","bem":"...","category":"custom","verified":false} → 201 Entry (400 duplicate)
PUT /api/entries/dog  {"loz":"...","verified":true} → updated Entry (partial, bumps updated_at)
DELETE /api/entries/dog → {"deleted":true,"key":"dog"}
```

Keys are `en.strip().lower()`. `per_page` max 200. List sorted by `key`.

## Metadata / stats / health

```
GET /api/languages → {"languages":[{"code":"en","name":"English","native":"English"},...]}
GET /api/categories → {"categories":["animals",...]}  (distinct, sorted)
GET /api/stats → {"total_entries":2276,"verified_entries":n,"complete_entries":n,"missing_loz":n,"missing_bem":n,"by_category":{...}}
GET /api/health → {"status":"ok","db":"connected|disconnected","entries":n}  (entries 0 when down)
```

Frontend hooks map 1:1: `useTranslate(All)`, `useBatchTranslate`,
`useSearch`, `useSuggest`, `useEntries`, `useStats`, `useHealth`
(`frontend/src/hooks/`, `types/index.ts`). Full curl set: `backend/README.md`.
