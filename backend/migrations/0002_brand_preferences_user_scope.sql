-- Scope brand_preferences to the user who owns it.
--
-- Previously this table (and its router/CRUD layer) had no user_id at all —
-- it was shared/global, so any user's "when I say paneer, I mean Amul" would
-- silently overwrite every other user's preference for the same ingredient
-- name. This migration adds user_id, backfills existing rows to the
-- earliest-registered user (the only reasonable default for data that
-- predates per-user scoping), then enforces NOT NULL plus a per-user
-- uniqueness constraint going forward.
--
-- REVIEW before running against a database with more than one real user and
-- pre-existing brand_preferences rows: the backfill assigns ALL existing rows
-- to a single user (the earliest by id) since there is no way to recover who
-- "really" set each one — reassign/dedupe manually afterwards if that's wrong
-- for your data.
--
-- Run once: `psql "$DATABASE_URL" -f backend/migrations/0002_brand_preferences_user_scope.sql`
-- Idempotent — safe to re-run.

ALTER TABLE brand_preferences ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

UPDATE brand_preferences
SET user_id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
WHERE user_id IS NULL;

ALTER TABLE brand_preferences ALTER COLUMN user_id SET NOT NULL;

-- Old global-uniqueness constraint (from Base.metadata.create_all(), back when
-- the model had `unique=True` on ingredient_name alone) — drop it so two
-- different users can each have their own preference for the same name.
ALTER TABLE brand_preferences DROP CONSTRAINT IF EXISTS brand_preferences_ingredient_name_key;

CREATE INDEX IF NOT EXISTS ix_brand_preferences_user_id ON brand_preferences (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_brand_preferences_user_ingredient
    ON brand_preferences (user_id, ingredient_name);
