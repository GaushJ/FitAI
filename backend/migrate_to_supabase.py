#!/usr/bin/env python3
"""
migrate_to_supabase.py
----------------------
Migrates all data from the local SQLite DB (meal_tracker.db) to Supabase
(PostgreSQL) in one shot.

What it does:
  1. Reads every row from the local SQLite file
  2. Connects to Supabase using DATABASE_URL (with SSL)
  3. Creates all tables via SQLAlchemy's create_all (safe — skips existing)
  4. Inserts all rows with ON CONFLICT DO NOTHING (idempotent — safe to re-run)
  5. Resets PostgreSQL sequences so future auto-increment IDs don't collide

Usage:
  Option A — set DATABASE_URL in backend/.env, then run:
      python migrate_to_supabase.py

  Option B — pass it inline:
      DATABASE_URL="postgresql://postgres:..." python migrate_to_supabase.py
"""

import asyncio
import json
import os
import sqlite3
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# -- Config --------------------------------------------------------------------
SQLITE_PATH = Path(__file__).parent / "meal_tracker.db"
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

if not DATABASE_URL:
    print("\n[ERR]  DATABASE_URL is not set.")
    print("    Add it to backend/.env or export it before running this script.")
    print("    Example: DATABASE_URL=postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres\n")
    sys.exit(1)

if not SQLITE_PATH.exists():
    print(f"\n[ERR]  SQLite DB not found at {SQLITE_PATH}")
    print("    Make sure you run this script from the backend/ directory.\n")
    sys.exit(1)

# asyncpg needs "postgresql+asyncpg://" scheme
ASYNC_PG_URL = (
    DATABASE_URL
    .replace("postgres://", "postgresql+asyncpg://", 1)
    .replace("postgresql://", "postgresql+asyncpg://", 1)
)

# asyncpg native URL (no SQLAlchemy prefix) for raw queries
RAW_PG_URL = (
    DATABASE_URL
    .replace("postgresql+asyncpg://", "postgresql://", 1)
    .replace("postgres://", "postgresql://", 1)
)

# -- Helpers -------------------------------------------------------------------

def read_sqlite() -> dict:
    """Read all tables from the local SQLite DB and return as a dict of lists."""
    con = sqlite3.connect(str(SQLITE_PATH))
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    tables = [
        "users",
        "ingredient_cache",
        "brand_preferences",
        "api_keys",
        "app_settings",
        "daily_food_logs",
    ]
    data = {}
    for table in tables:
        try:
            rows = cur.execute(f"SELECT * FROM {table}").fetchall()
            data[table] = [dict(r) for r in rows]
            print(f"  [READ] {table}: {len(rows)} row(s) read from SQLite")
        except sqlite3.OperationalError:
            print(f"  [WARN] {table}: table not found in SQLite — skipping")
            data[table] = []

    con.close()
    return data


async def create_tables():
    """Create all tables in Supabase using SQLAlchemy's metadata."""
    from sqlalchemy.ext.asyncio import create_async_engine
    from database import Base  # imports all ORM models

    engine = create_async_engine(
        ASYNC_PG_URL,
        echo=False,
        connect_args={"ssl": "require"},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("  [OK]   Tables created (or already exist) in Supabase")


async def insert_data(data: dict):
    """Insert all rows into Supabase using asyncpg raw SQL."""
    import asyncpg

    conn = await asyncpg.connect(RAW_PG_URL, ssl="require")

    try:
        # -- users ------------------------------------------------------------
        for row in data["users"]:
            await conn.execute("""
                INSERT INTO users
                    (id, name, username, password_hash,
                     target_calories, target_protein, target_carbs, target_fat,
                     current_streak, last_active_date)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                ON CONFLICT (id) DO NOTHING
            """,
                row["id"], row["name"], row.get("username"), row.get("password_hash"),
                float(row["target_calories"]), float(row["target_protein"]),
                float(row["target_carbs"]),    float(row["target_fat"]),
                int(row["current_streak"]),
                # SQLite stores date as string — convert to Python date for PG
                __import__("datetime").date.fromisoformat(row["last_active_date"])
                    if row.get("last_active_date") else None,
            )
        print(f"  [OK]   users: {len(data['users'])} row(s) inserted")

        # -- ingredient_cache --------------------------------------------------
        for row in data["ingredient_cache"]:
            await conn.execute("""
                INSERT INTO ingredient_cache
                    (id, name, brand,
                     calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                ON CONFLICT (id) DO NOTHING
            """,
                row["id"], row["name"], row.get("brand"),
                float(row["calories_per_100g"]), float(row["protein_per_100g"]),
                float(row["carbs_per_100g"]),    float(row["fat_per_100g"]),
            )
        print(f"  [OK]   ingredient_cache: {len(data['ingredient_cache'])} row(s) inserted")

        # -- brand_preferences -------------------------------------------------
        for row in data["brand_preferences"]:
            await conn.execute("""
                INSERT INTO brand_preferences (id, ingredient_name, preferred_brand)
                VALUES ($1,$2,$3)
                ON CONFLICT (id) DO NOTHING
            """,
                row["id"], row["ingredient_name"], row["preferred_brand"],
            )
        print(f"  [OK]   brand_preferences: {len(data['brand_preferences'])} row(s) inserted")

        # -- api_keys ----------------------------------------------------------
        for row in data["api_keys"]:
            await conn.execute("""
                INSERT INTO api_keys (id, provider, api_key)
                VALUES ($1,$2,$3)
                ON CONFLICT (id) DO NOTHING
            """,
                row["id"], row["provider"], row["api_key"],
            )
        print(f"  [OK]   api_keys: {len(data['api_keys'])} row(s) inserted")

        # -- app_settings ------------------------------------------------------
        for row in data["app_settings"]:
            await conn.execute("""
                INSERT INTO app_settings (id, key, value)
                VALUES ($1,$2,$3)
                ON CONFLICT (id) DO NOTHING
            """,
                row["id"], row["key"], row["value"],
            )
        print(f"  [OK]   app_settings: {len(data['app_settings'])} row(s) inserted")

        # -- daily_food_logs ---------------------------------------------------
        for row in data["daily_food_logs"]:
            # SQLite stores JSON as a plain string — parse it before inserting
            macros = row["computed_macros"]
            if isinstance(macros, str):
                macros = json.loads(macros)

            await conn.execute("""
                INSERT INTO daily_food_logs
                    (id, user_id, date, raw_transcript, computed_macros)
                VALUES ($1,$2,$3,$4,$5)
                ON CONFLICT (id) DO NOTHING
            """,
                row["id"], row["user_id"],
                __import__("datetime").date.fromisoformat(row["date"]),
                row["raw_transcript"],
                json.dumps(macros),   # PG JSON column expects a string via asyncpg
            )
        print(f"  [OK]   daily_food_logs: {len(data['daily_food_logs'])} row(s) inserted")

        # -- Reset sequences so future INSERTs don't collide -------------------
        # After inserting rows with explicit IDs, PostgreSQL sequences are still
        # at their starting value (1). setval advances them past the max existing ID.
        sequence_tables = [
            ("users_id_seq",              "users"),
            ("ingredient_cache_id_seq",   "ingredient_cache"),
            ("brand_preferences_id_seq",  "brand_preferences"),
            ("api_keys_id_seq",           "api_keys"),
            ("app_settings_id_seq",       "app_settings"),
            ("daily_food_logs_id_seq",    "daily_food_logs"),
        ]
        for seq_name, table_name in sequence_tables:
            await conn.execute(f"""
                SELECT setval('{seq_name}', COALESCE((SELECT MAX(id) FROM {table_name}), 1))
            """)
        print("  [OK]   PostgreSQL sequences reset to current max IDs")

    finally:
        await conn.close()


async def verify(data: dict):
    """Quick row-count check: SQLite vs Supabase."""
    import asyncpg

    conn = await asyncpg.connect(RAW_PG_URL, ssl="require")
    tables = [
        "users", "ingredient_cache", "brand_preferences",
        "api_keys", "app_settings", "daily_food_logs",
    ]
    print("\n  Verification — row counts:")
    all_ok = True
    for t in tables:
        pg_count  = await conn.fetchval(f"SELECT COUNT(*) FROM {t}")
        sq_count  = len(data.get(t, []))
        status    = "[OK]  " if pg_count >= sq_count else "[WARN]"
        if pg_count < sq_count:
            all_ok = False
        print(f"    {status} {t:<22} SQLite: {sq_count:>3}  ->  Supabase: {pg_count:>3}")
    await conn.close()
    return all_ok


# -- Entry point ---------------------------------------------------------------

async def run():
    print("\n[START] FitVoice - SQLite -> Supabase Migration")
    print("-" * 48)

    print("\n[1/4] Reading local SQLite database ...")
    data = read_sqlite()

    print("\n[2/4] Creating tables in Supabase ...")
    await create_tables()

    print("\n[3/4] Inserting data into Supabase ...")
    await insert_data(data)

    print("\n[4/4] Verifying migration ...")
    ok = await verify(data)

    if ok:
        print("\n[DONE] Migration complete! All data is now in Supabase.")
        print("       You can safely deploy to Render - the DB will persist across redeploys.\n")
    else:
        print("\n[WARN] Some tables have fewer rows than expected.")
        print("       Check the output above for details and re-run if needed.\n")


if __name__ == "__main__":
    asyncio.run(run())
