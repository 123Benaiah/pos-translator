"""
setup_database.py
Database architect: Build pos_translator MongoDB from dictionary files in docs/.
"""

import os
import re
import sys
import csv
import io
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from pymongo import MongoClient, ASCENDING, DESCENDING, UpdateOne
from pymongo.errors import BulkWriteError
from dotenv import load_dotenv

# Backend owns MONGO_URI / DB_NAME: load backend/.env explicitly so this
# script works from any working directory (repo root, scripts/, backend/).
_BACKEND_ENV = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(dotenv_path=_BACKEND_ENV)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pos_translator")
DOCS_DIR = Path(__file__).resolve().parent.parent / "docs"

VALID_CATEGORIES = {
    "people", "family", "animals", "food", "business", "action",
    "adjective", "number", "greeting", "body", "place", "nature",
    "time", "building", "custom",
}

CATEGORY_MAP = {
    # bemba_master categories -> our categories
    "action": "action",
    "state": "adjective",
    "body": "body",
    "location": "place",
    "emotion": "adjective",
    "quality": "adjective",
    "nature": "nature",
    "animal": "animals",
    "person": "people",
    "people": "people",
    "family": "family",
    "food": "food",
    "drink": "food",
    "clothing": "custom",
    "object": "custom",
    "tool": "custom",
    "weapon": "custom",
    "transport": "custom",
    "building": "building",
    "place": "place",
    "time": "time",
    "communication": "custom",
    "religion": "custom",
    "government": "people",
    "health": "body",
    "commerce": "business",
    "work": "action",
    "behavior": "adjective",
    "event": "custom",
    "abstract": "custom",
    "material": "custom",
    "shape": "custom",
    "color": "adjective",
    "taste": "adjective",
    "manner": "custom",
    "degree": "custom",
    "quantity": "number",
    "order": "custom",
    "relation": "custom",
    "ability": "action",
    "law": "people",
    "language": "custom",
    "group": "people",
    "story": "custom",
    "holiday": "custom",
    "jewelry": "custom",
    "furniture": "custom",
    "plant": "nature",
    "agriculture": "action",
    "education": "custom",
    "measurement": "custom",
    "activity": "custom",
    "courtesy": "greeting",
    "gender": "custom",
    "school": "custom",
}

FILENAME_CATEGORY = {
    "bemba_animals": "animals",
    "bemba_family": "family",
    "bemba_food": "food",
    "bemba_body_parts": "body",
    "bemba_numbers": "number",
    "bemba_greetings": "greeting",
    "bemba_business_terms": "business",
    "bemba_common_verbs": "action",
}


def connect_db():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print(f"Connected to {MONGO_URI} -> database '{DB_NAME}'")
    return client, db


def setup_collections(db):
    translations = db["translations"]
    translation_log = db["translation_log"]

    translations.drop()
    translation_log.drop()

    translations.create_index([("key", ASCENDING)], unique=True, name="idx_key_unique")
    translations.create_index([("en", ASCENDING)], name="idx_en")
    translations.create_index([("loz", ASCENDING)], name="idx_loz")
    translations.create_index([("bem", ASCENDING)], name="idx_bem")
    translations.create_index([("category", ASCENDING)], name="idx_category")

    translation_log.create_index([("timestamp", DESCENDING)], name="idx_timestamp")
    translation_log.create_index([("from_lang", ASCENDING)], name="idx_from_lang")

    print("Collections created with indexes:")
    print("  translations: key(unique), en, loz, bem, category")
    print("  translation_log: timestamp, from_lang")
    return translations, translation_log


def normalize(text):
    if text is None:
        return ""
    text = str(text).strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text


def clean_key(text):
    key = normalize(text)
    key = re.sub(r"[^a-z0-9\s/-]", "", key)
    key = key.strip(" /-")
    return key


def map_category(raw_cat, filename=""):
    if not raw_cat:
        raw_cat = ""
    raw_cat = normalize(raw_cat)
    if raw_cat in CATEGORY_MAP:
        return CATEGORY_MAP[raw_cat]
    stem = Path(filename).stem
    if stem in FILENAME_CATEGORY:
        return FILENAME_CATEGORY[stem]
    return "custom"


def split_slash_variants(text):
    text = normalize(text)
    if not text:
        return []
    parts = re.split(r"\s*/\s*", text)
    return [p.strip() for p in parts if p.strip()]


def parse_bemba_master(filepath):
    entries = []
    fname = filepath.name
    try:
        df = pd.read_csv(filepath, encoding="utf-8", dtype=str)
    except Exception as e:
        print(f"  WARNING: Could not read {fname}: {e}")
        return entries

    for _, row in df.iterrows():
        en_raw = row.get("english", "")
        bem_raw = row.get("bemba", "")
        bem_alt = row.get("bemba_alt", "")
        pos = row.get("part_of_speech", "")
        cat_raw = row.get("category", "")
        verified = str(row.get("verified", "")).lower() == "true"

        en_variants = split_slash_variants(en_raw)
        bem_variants = split_slash_variants(bem_raw)
        if bem_alt:
            bem_variants.extend(split_slash_variants(bem_alt))

        for en in en_variants:
            key = clean_key(en)
            if not key:
                continue
            bem_val = bem_variants[0] if bem_variants else ""
            entries.append({
                "key": key,
                "en": normalize(en),
                "loz": "",
                "bem": normalize(bem_val),
                "category": map_category(cat_raw, fname),
                "verified": verified,
                "source": fname,
            })
    return entries


def parse_bemba_simple(filepath, category_override=None):
    entries = []
    fname = filepath.name
    stem = Path(filepath).stem
    cat = category_override or FILENAME_CATEGORY.get(stem, "custom")

    try:
        df = pd.read_csv(filepath, encoding="utf-8", dtype=str)
    except Exception as e:
        print(f"  WARNING: Could not read {fname}: {e}")
        return entries

    for _, row in df.iterrows():
        en_raw = row.get("english", "")
        bem_raw = row.get("bemba", "")
        verified = str(row.get("verified", "")).lower() == "true"

        en_variants = split_slash_variants(en_raw)
        bem_variants = split_slash_variants(bem_raw)

        for en in en_variants:
            key = clean_key(en)
            if not key:
                continue
            bem_val = bem_variants[0] if bem_variants else ""
            entries.append({
                "key": key,
                "en": normalize(en),
                "loz": "",
                "bem": normalize(bem_val),
                "category": cat,
                "verified": verified,
                "source": fname,
            })
    return entries


def parse_lozi_vocabulary(filepath):
    entries = []
    fname = filepath.name
    try:
        df = pd.read_csv(filepath, encoding="utf-8", dtype=str)
    except Exception as e:
        print(f"  WARNING: Could not read {fname}: {e}")
        return entries

    for _, row in df.iterrows():
        en_raw = row.get("english", "")
        loz_raw = row.get("silozi", "")
        pos = normalize(row.get("part_of_speech", ""))
        notes = normalize(row.get("notes", ""))
        verified = str(row.get("verified", "")).lower() == "true"

        en_variants = split_slash_variants(en_raw)
        loz_variants = split_slash_variants(loz_raw)

        for en in en_variants:
            key = clean_key(en)
            if not key:
                continue
            loz_val = loz_variants[0] if loz_variants else ""

            if pos in ("noun",):
                cat = "people" if key in ("person", "people", "child", "children", "man", "woman", "boy", "girl") else "custom"
            elif pos == "verb":
                cat = "action"
            elif pos in ("adjective",):
                cat = "adjective"
            else:
                cat = "custom"

            if key in ("dog", "cat", "lion", "fish", "bird", "snake", "sheep", "ostrich", "crocodile", "butterfly", "scorpion"):
                cat = "animals"
            elif key in ("father", "mother", "child", "children", "friend", "teacher", "farmer", "girl", "boy", "stranger", "enemy"):
                cat = "people"
            elif key in ("meat", "beer", "water", "food", "bread"):
                cat = "food"
            elif key in ("house", "home", "car", "book", "knife", "pot", "table", "mat"):
                cat = "custom"
            elif key in ("village", "river", "field", "tree", "island"):
                cat = "place"
            elif key in ("heart", "tooth", "teeth", "eye", "eyes", "chest", "finger", "fingers", "hair"):
                cat = "body"
            elif key in ("sun", "night", "thorn", "stones", "horns"):
                cat = "nature"
            elif key in ("year",):
                cat = "time"
            elif key in ("money",):
                cat = "business"
            elif key in ("work",):
                cat = "action"
            elif key in ("anger", "health", "laziness", "cowardice", "strength", "mercy", "evil", "difficulty", "stubbornness", "softness", "weight"):
                cat = "adjective"

            entries.append({
                "key": key,
                "en": normalize(en),
                "loz": normalize(loz_val),
                "bem": "",
                "category": cat,
                "verified": verified,
                "source": fname,
            })
    return entries


def parse_lozi_verb_radicals(filepath):
    entries = []
    fname = filepath.name
    try:
        df = pd.read_csv(filepath, encoding="utf-8", dtype=str)
    except Exception as e:
        print(f"  WARNING: Could not read {fname}: {e}")
        return entries

    for _, row in df.iterrows():
        en_raw = row.get("english", "")
        loz_raw = row.get("example_english", "")
        radical = row.get("silozi_radical", "")
        verified = str(row.get("verified", "")).lower() == "true"

        en_variants = split_slash_variants(en_raw)

        for en in en_variants:
            key = clean_key(en)
            if not key:
                continue
            loz_val = normalize(radical).strip("-") if radical else ""
            entries.append({
                "key": key,
                "en": normalize(en),
                "loz": loz_val,
                "bem": "",
                "category": "action",
                "verified": verified,
                "source": fname,
            })
    return entries


def parse_lozi_adjectives(filepath):
    entries = []
    fname = filepath.name
    try:
        df = pd.read_csv(filepath, encoding="utf-8", dtype=str)
    except Exception as e:
        print(f"  WARNING: Could not read {fname}: {e}")
        return entries

    for _, row in df.iterrows():
        en_raw = row.get("english", "")
        loz_raw = row.get("silozi_stem", "")
        verified = str(row.get("verified", "")).lower() == "true"

        en_variants = split_slash_variants(en_raw)

        for en in en_variants:
            key = clean_key(en)
            if not key:
                continue
            loz_val = normalize(loz_raw).strip("-") if loz_raw else ""
            entries.append({
                "key": key,
                "en": normalize(en),
                "loz": loz_val,
                "bem": "",
                "category": "adjective",
                "verified": verified,
                "source": fname,
            })
    return entries


def parse_csv_generic(filepath):
    entries = []
    fname = filepath.name
    try:
        df = pd.read_csv(filepath, encoding="utf-8", dtype=str)
    except Exception as e:
        print(f"  WARNING: Could not read {fname}: {e}")
        return entries

    cols = [normalize(c) for c in df.columns]

    en_col = None
    bem_col = None
    loz_col = None
    verified_col = None

    for c in cols:
        if c in ("english", "en", "word"):
            en_col = c
        elif c in ("bemba", "bem"):
            bem_col = c
        elif c in ("silozi", "lozi", "loz", "silozi_stem", "silozi_radical"):
            loz_col = c
        elif c in ("verified",):
            verified_col = c

    if not en_col:
        return entries

    for _, row in df.iterrows():
        en_val = row.get(en_col, "")
        bem_val = row.get(bem_col, "") if bem_col else ""
        loz_val = row.get(loz_col, "") if loz_col else ""
        verified = str(row.get(verified_col, "")).lower() == "true" if verified_col else False

        en_variants = split_slash_variants(en_val)

        for en in en_variants:
            key = clean_key(en)
            if not key:
                continue
            entries.append({
                "key": key,
                "en": normalize(en),
                "loz": normalize(loz_val),
                "bem": normalize(bem_val),
                "category": "custom",
                "verified": verified,
                "source": fname,
            })
    return entries


def discover_files(docs_dir):
    files = []
    SKIP_FILES = {
        "possessives.csv", "possessives.txt",
        "grammar_rules.csv", "grammar_rules.txt",
        "subject_prefixes.csv", "subject_prefixes.txt",
        "noun_classes.csv", "noun_classes.txt",
        "ideophones.csv", "ideophones.txt",
        "bemba.txt",
        "follow-this-guide.md",
    }
    for root, dirs, filenames in os.walk(docs_dir):
        for fn in filenames:
            fp = Path(root) / fn
            ext = fp.suffix.lower()
            if ext not in (".csv", ".txt", ".xlsx", ".xls"):
                continue
            if fn in SKIP_FILES:
                continue
            if ext == ".txt":
                csv_sibling = fp.with_suffix(".csv")
                if csv_sibling.exists():
                    continue
            files.append(fp)
    return sorted(files)


def parse_file(filepath):
    fname = filepath.name
    stem = filepath.stem

    if fname == "bemba_master.csv":
        return parse_bemba_master(filepath)

    if stem in FILENAME_CATEGORY and fname.endswith(".csv"):
        return parse_bemba_simple(filepath)

    if fname == "vocabulary.csv":
        return parse_lozi_vocabulary(filepath)

    if fname == "verb_radicals.csv":
        return parse_lozi_verb_radicals(filepath)

    if fname == "adjectives.csv":
        return parse_lozi_adjectives(filepath)

    if fname.endswith(".csv"):
        return parse_csv_generic(filepath)

    if fname.endswith(".txt"):
        return parse_csv_generic(filepath)

    if fname.endswith((".xlsx", ".xls")):
        try:
            df = pd.read_excel(filepath, dtype=str)
            tmp_path = filepath.with_suffix(".csv")
            df.to_csv(tmp_path, index=False)
            result = parse_csv_generic(tmp_path)
            return result
        except Exception as e:
            print(f"  WARNING: Could not read Excel {fname}: {e}")
            return []

    return []


def merge_entries(all_entries):
    merged = {}
    for entry in all_entries:
        key = entry["key"]
        if not key:
            continue
        if key not in merged:
            merged[key] = {
                "key": key,
                "en": "",
                "loz": "",
                "bem": "",
                "category": "custom",
                "verified": False,
                "source": set(),
            }
        doc = merged[key]

        if entry["en"] and not doc["en"]:
            doc["en"] = entry["en"]
        if entry["loz"] and not doc["loz"]:
            doc["loz"] = entry["loz"]
        if entry["bem"] and not doc["bem"]:
            doc["bem"] = entry["bem"]
        if entry["category"] != "custom" or doc["category"] == "custom":
            if entry["category"] != "custom":
                doc["category"] = entry["category"]
        if entry["verified"]:
            doc["verified"] = True
        if isinstance(entry["source"], str):
            doc["source"].add(entry["source"])
        elif isinstance(entry["source"], set):
            doc["source"].update(entry["source"])

    return merged


def upsert_translations(collection, merged_docs):
    now = datetime.now(timezone.utc)
    ops = []
    for key, doc in merged_docs.items():
        ops.append(
            UpdateOne(
                {"key": key},
                {
                    "$set": {
                        "en": doc["en"],
                        "loz": doc["loz"],
                        "bem": doc["bem"],
                        "category": doc["category"],
                        "verified": doc["verified"],
                        "source": ", ".join(sorted(doc["source"])),
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "key": key,
                        "created_at": now,
                    },
                },
                upsert=True,
            )
        )

    if ops:
        try:
            result = collection.bulk_write(ops, ordered=False)
            return result
        except BulkWriteError as bwe:
            print(f"  Bulk write errors: {len(bwe.details)}")
            return bwe.details
    return None


def print_report(collection, file_stats, merged_docs):
    total = collection.count_documents({})
    all3 = collection.count_documents({"loz": {"$ne": ""}, "bem": {"$ne": ""}})
    en_bem = collection.count_documents({"loz": "", "bem": {"$ne": ""}})
    en_loz = collection.count_documents({"loz": {"$ne": ""}, "bem": ""})
    en_only = collection.count_documents({"loz": "", "bem": ""})

    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)
    print(f"Total documents in translations:  {total}")
    print(f"  All 3 languages (en+loz+bem):    {all3}")
    print(f"  en + bem only (missing loz):      {en_bem}")
    print(f"  en + loz only (missing bem):      {en_loz}")
    print(f"  en only (missing both):           {en_only}")

    print("\n--- Breakdown by category ---")
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    for doc in collection.aggregate(pipeline):
        print(f"  {doc['_id']:20s} {doc['count']:5d}")

    print("\n--- Top 30 missing entries ---")
    missing = list(collection.find(
        {"$or": [{"loz": ""}, {"bem": ""}]},
        {"_id": 0, "en": 1, "loz": 1, "bem": 1}
    ).sort("en", ASCENDING).limit(30))
    for doc in missing:
        missing_langs = []
        if not doc.get("loz"):
            missing_langs.append("loz")
        if not doc.get("bem"):
            missing_langs.append("bem")
        print(f"  {doc['en']:30s} -> missing: {', '.join(missing_langs)}")

    print("\n--- Files processed ---")
    for fname, count in sorted(file_stats.items(), key=lambda x: -x[1]):
        print(f"  {fname:40s} {count:5d} entries")

    print("=" * 60)


def main():
    print("=" * 60)
    print("pos_translator Database Setup")
    print("=" * 60)

    if not DOCS_DIR.exists():
        print(f"ERROR: docs directory not found at {DOCS_DIR}")
        sys.exit(1)

    client, db = connect_db()
    translations, translation_log = setup_collections(db)

    files = discover_files(DOCS_DIR)
    print(f"\nDiscovered {len(files)} data files in docs/")

    all_entries = []
    file_stats = {}

    for filepath in files:
        rel = filepath.relative_to(DOCS_DIR)
        entries = parse_file(filepath)
        file_stats[str(rel)] = len(entries)
        all_entries.extend(entries)
        print(f"  {rel}: {len(entries)} entries")

    print(f"\nTotal raw entries: {len(all_entries)}")

    merged = merge_entries(all_entries)
    print(f"Merged unique keys: {len(merged)}")

    result = upsert_translations(translations, merged)
    if result:
        if isinstance(result, dict):
            print(f"Bulk write had errors: {len(result.get('writeErrors', []))} write errors")
        else:
            print(f"Upserted: {result.upserted_count} new, {result.modified_count} updated")

    print_report(translations, file_stats, merged)

    client.close()
    print("\nDone. MongoDB connection closed.")


if __name__ == "__main__":
    main()
