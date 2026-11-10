-- Body profile behind the daily calorie/macro targets.
--
-- Powers POST /api/user/targets/calculate and pre-fills the "Adjust Macro Targets"
-- form. All columns are nullable: existing users keep working unchanged and simply
-- have no profile until they fill one in. Enum-valued columns hold the strings
-- from services/nutrition_targets.py (sex, activity_level, goal).
--
-- Run once: `psql "$DATABASE_URL" -f backend/migrations/0004_user_body_profile.sql`
-- Idempotent — safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS sex            VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age            INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm      DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg      DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal           VARCHAR;
