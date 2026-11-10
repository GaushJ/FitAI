-- Master food/macro cache table.
--
-- Backs the "resolve ingredient" flow: before calling Tavily + the LLM to look
-- up macros for a (name, brand) pair, the backend checks this table first
-- (backend/db_sync.py: query_local_cache). Every successful Tavily/LLM
-- resolution — and every brand preference a user saves, imports, or scans
-- from a label — is written back here (save_to_local_cache / IngredientCache
-- upserts in backend/main.py), so repeat lookups of the same brand skip the
-- Tavily API call entirely.
--
-- Run this once against the Supabase project's SQL editor (or via `psql
-- "$DATABASE_URL" -f backend/migrations/0001_ingredient_cache.sql`). It is
-- idempotent — safe to re-run.
--
-- Note: backend/database.py's init_db() already creates this table via
-- SQLAlchemy's Base.metadata.create_all() on app startup, but that call does
-- NOT create the unique index below (SQLAlchemy has no expression-index
-- support in this model). Without it, the ON CONFLICT upsert in
-- db_sync.save_to_local_cache() fails at runtime. Run this migration once
-- per environment to guarantee the index exists.

CREATE TABLE IF NOT EXISTS ingredient_cache (
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR NOT NULL,
    brand              VARCHAR,
    calories_per_100g  FLOAT NOT NULL DEFAULT 0.0,
    protein_per_100g   FLOAT NOT NULL DEFAULT 0.0,
    carbs_per_100g     FLOAT NOT NULL DEFAULT 0.0,
    fat_per_100g       FLOAT NOT NULL DEFAULT 0.0,
    unit               VARCHAR NOT NULL DEFAULT 'g'
);

CREATE INDEX IF NOT EXISTS ix_ingredient_cache_name  ON ingredient_cache (name);
CREATE INDEX IF NOT EXISTS ix_ingredient_cache_brand ON ingredient_cache (brand);

-- Required for `INSERT ... ON CONFLICT (name, COALESCE(brand, '')) DO UPDATE`
-- (db_sync.save_to_local_cache) and for treating name+brand as the cache key.
CREATE UNIQUE INDEX IF NOT EXISTS ux_ingredient_cache_name_brand
    ON ingredient_cache (name, (COALESCE(brand, '')));

CREATE TABLE IF NOT EXISTS brand_preferences (
    id               SERIAL PRIMARY KEY,
    ingredient_name  VARCHAR NOT NULL UNIQUE,
    preferred_brand  VARCHAR NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_brand_preferences_ingredient_name ON brand_preferences (ingredient_name);
