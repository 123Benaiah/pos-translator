# Migration: offline (localhost) → online Atlas — pos_translator

Date: 2026-09-25
Operator: Benaiah (PC `Benaiah`, local IP `192.168.7.28/20`, public IP `41.218.86.194`)
Repo: `pos-translator/`

## 1. Source and target

- Source (offline): `mongodb://localhost:27017`, DB `pos_translator`, Mongo `8.3.4`
  - `translations: 2276 docs`
  - `translation_log: 10 docs`
- Target (online): `mongodb+srv://benaiahlushomo_db_user:***@cluster0.va72sde.mongodb.net/pos_translator`, Mongo `8.0.32` (Atlas M0, GCP `ASIA_SOUTH_1`)
  - Before: `translations: 0`, `translation_log: 0`, indexes only `_id_`
  - After: `translations: 2276`, `translation_log: 10`

> Password lives only in `.env` (commented `MONGO_URI` line). Scripts below read it from `.env` and mask it as `***` in logs. Never commit `.env`.

`.env` relevant lines:
```ini
MONGO_URI=mongodb://localhost:27017
DB_NAME=pos_translator
#MONGO_URI=mongodb+srv://benaiahlushomo_db_user:<PASSWORD>@cluster0.va72sde.mongodb.net/pos_translator
```

## 2. Prerequisites

```powershell
# venv python has pymongo (4.10.0)
.\venv\Scripts\python.exe -c "import pymongo; print(pymongo.version)"

# local mongo up?
# mongosh mongodb://localhost:27017 --eval "db.runCommand({ping:1})"

# Atlas Network Access must allow you:
# - 41.218.86.194/32 (single IP), or 41.218.86.0/23 (512 IPs), or 0.0.0.0/0 (test only)
# We used 0.0.0.0/0 (comment MYCIDRZPC) to unblock TLS `tlsv1 alert internal error`.
# Verify public IP:
Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10
# -> 41.218.86.194
```

Diagnosis commands used (TCP ok, TLS rejected until whitelist active):
```powershell
Test-NetConnection -ComputerName ac-n2socoh-shard-00-00.va72sde.mongodb.net -Port 27017
nslookup -type=SRV _mongodb._tcp.cluster0.va72sde.mongodb.net
$uri = (python extract script output); mongosh $uri --eval "db.runCommand({ping:1})" --quiet
```

Atlas Admin API check (public `pbhtwcte`, project `6ab5308f5b1462115f354275`):
```powershell
# GET /api/atlas/v2/groups/{PROJECT}/clusters -> Cluster0 M0, paused:false, state:IDLE
# GET /groups/{PROJECT}/accessList -> 41.218.86.194/32 + 0.0.0.0/0
# GET /groups/{PROJECT}/databaseUsers -> benaiahlushomo_db_user atlasAdmin
```

## 3. Inspect offline schema (what we migrated)

Temp script `inspect_local.py`:
```python
from pymongo import MongoClient
local = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
db = local["pos_translator"]
for cname in db.list_collection_names():
    c = db[cname]
    print(f"\n== {cname}: {c.estimated_document_count()} docs ==")
    for idx in c.list_indexes():
        print(f"  {idx['name']}: key={idx['key']} unique={idx.get('unique', False)}")
local.close()
```
Run:
```powershell
.\venv\Scripts\python.exe "C:\Users\benai\AppData\Local\Temp\opencode\inspect_local.py"
```
Result:
```
translations: 2276 docs
  idx_key_unique (key, unique), idx_en, idx_loz, idx_bem, idx_category
translation_log: 10 docs
  idx_timestamp (timestamp -1), idx_from_lang
```

## 4. Migration — offline → online (idempotent upserts)

Temp script `migrate.py` — full logic used:
```python
"""Migrate pos_translator offline (localhost) -> online Atlas. Idempotent via upserts."""
import re
from pathlib import Path
from pymongo import MongoClient, UpdateOne, ASCENDING, DESCENDING

env_path = Path(r"C:\Users\benai\OneDrive\Documents\CIDRZ\codes\pos-translator\.env")
text = env_path.read_text(encoding="utf-8")
uris = re.findall(r'mongodb\+srv://[^\s"\'`]+', text)
online_uri = next((u.strip().rstrip('"').rstrip("'")
    for u in uris if "@" in u and "va72sde" in u and "pos_translator" in u), None)

local_client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=8000)
online_client = MongoClient(online_uri, serverSelectionTimeoutMS=15000)
ldb = local_client["pos_translator"]
odb = online_client["pos_translator"]

# 1. ensure indexes online
odb["translations"].create_index([("key", ASCENDING)], unique=True, name="idx_key_unique")
odb["translations"].create_index([("en", ASCENDING)], name="idx_en")
odb["translations"].create_index([("loz", ASCENDING)], name="idx_loz")
odb["translations"].create_index([("bem", ASCENDING)], name="idx_bem")
odb["translations"].create_index([("category", ASCENDING)], name="idx_category")
odb["translation_log"].create_index([("timestamp", DESCENDING)], name="idx_timestamp")
odb["translation_log"].create_index([("from_lang", ASCENDING)], name="idx_from_lang")

# 2. translations: upsert on `key` in batches of 500
batch = []
for doc in ldb["translations"].find({}):
    key = doc.get("key")
    _id = doc.pop("_id", None)
    ops_doc = {k: v for k, v in doc.items() if k not in ("key", "_id")}
    batch.append(UpdateOne({"key": key},
        {"$set": ops_doc, "$setOnInsert": {"_id": _id, "key": key}}, upsert=True))
    if len(batch) >= 500:
        odb["translations"].bulk_write(batch, ordered=False)
        batch = []
if batch:
    odb["translations"].bulk_write(batch, ordered=False)

# 3. translation_log: upsert on `_id`
batch2 = []
for doc in ldb["translation_log"].find({}):
    batch2.append(UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True))
if batch2:
    odb["translation_log"].bulk_write(batch2, ordered=False)
```

Run:
```powershell
.\venv\Scripts\python.exe "C:\Users\benai\AppData\Local\Temp\opencode\migrate.py"
```
Actual output:
```
local translations: 2276 log: 10
online BEFORE translations: 0 log: 0
Ensuring online indexes...
indexes ok: ['_id_', 'idx_key_unique', 'idx_en', 'idx_loz', 'idx_bem', 'idx_category'] ['_id_', 'idx_timestamp', 'idx_from_lang']
Migrating translations...
  500 processed (upserted=500 modified=0)
  1000 processed (upserted=1000 modified=0)
  1500 processed (upserted=1500 modified=0)
  2000 processed (upserted=2000 modified=0)
translations done: processed=2276 upserted=2276 modified=0
Migrating translation_log...
log done: processed=10 upserted=10 modified=0
online AFTER translations: 2276 log: 10
DONE
```

> First run failed with `BulkWriteError code 40: Updating the path 'key' would create a conflict` because `key` was in both `$set` and `$setOnInsert`. Fixed by excluding `key`/`_id` from `$set` (see script above). Re-run succeeded.

## 5. Verify online

```python
# read_online.py (masked URI, lists counts/indexes/samples)
# + mongosh check:
```
```powershell
# $uri read from .env without echoing password:
.\venv\Scripts\python.exe extract_script.py  # writes fixed_uri.txt
$uri = Get-Content "fixed_uri.txt" -Raw; $uri = $uri.Trim()
mongosh $uri --eval "db.runCommand({ping:1}); db.getCollectionNames()" --quiet
# -> [ 'translations', 'translation_log' ]
```

Full list with `atlasAdmin` user (also shows sample dataset):
```powershell
.\venv\Scripts\python.exe list_all.py
# DB pos_translator: translations 2276, translation_log 10
# DB sample_mflix: movies 21349, comments 41079, ...
```

## 6. Alternative (native tools, not used — we used pymongo upserts)

```bash
# dump local
mongodump --uri="mongodb://localhost:27017/pos_translator" --out=./dumps/mongodump-2026-09-25
# restore to Atlas (upsert not supported — would duplicate on re-run, so we preferred script above)
mongorestore --uri="mongodb+srv://benaiahlushomo_db_user:<PASSWORD>@cluster0.va72sde.mongodb.net/pos_translator" ./dumps/mongodump-2026-09-25/pos_translator
```

Existing JSON dumps in `dumps/` (`pos_translator_translations_20260924_165614.json`, `pos_translator_translation_log_20260924_165614.json`) were left untouched.

## 7. Post-migration

- Atlas Browse Collections > `pos_translator` now shows 2276 + 10.
- To point backend at online: set active `.env` to
  ```ini
  MONGO_URI=mongodb+srv://benaiahlushomo_db_user:<PASSWORD>@cluster0.va72sde.mongodb.net/pos_translator
  ```
- Remove `0.0.0.0/0` from Network Access, keep `41.218.86.194/32` (or `41.218.86.0/23` if IP rotates).
- Revoke Atlas API key used for diagnosis (`pbhtwcte`) if it was temporary.
- Temp scripts under `C:\Users\benai\AppData\Local\Temp\opencode\` (`inspect_local.py`, `migrate.py`, `read_online.py`, `list_all.py`, `fixed_uri*.txt`) were deleted after run.
