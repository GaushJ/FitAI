-- Fix: brand_preferences.ingredient_name was still globally UNIQUE.
--
-- Databases first created via Base.metadata.create_all() when the model had
-- `unique=True, index=True` on ingredient_name got a UNIQUE *index* named
-- ix_brand_preferences_ingredient_name (not a named constraint). Migration 0002
-- only dropped `brand_preferences_ingredient_name_key`, and 0001's
-- `CREATE INDEX IF NOT EXISTS` silently skipped because an index of that name
-- already existed. Result: two users (or one user re-importing) could not both
-- hold a preference for e.g. "milk":
--   UniqueViolationError: duplicate key ... "ix_brand_preferences_ingredient_name"
--
-- Uniqueness is per user and is enforced by ux_brand_preferences_user_ingredient
-- (user_id, ingredient_name) from migration 0002. Replace the global unique
-- index with a plain lookup index (the model declares index=True, unique=False).
--
-- Run once: `psql "$DATABASE_URL" -f backend/migrations/0003_drop_global_unique_brand_ingredient_index.sql`
-- Idempotent — safe to re-run.

DROP INDEX IF EXISTS ix_brand_preferences_ingredient_name;

CREATE INDEX IF NOT EXISTS ix_brand_preferences_ingredient_name
    ON brand_preferences (ingredient_name);
