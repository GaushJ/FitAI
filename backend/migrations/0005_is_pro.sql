-- GetFitBro Pro unlock flag, set by backend/routers/payments.py's payment.captured
-- handler once a "pro_unlock" purchase (via paykit) is confirmed by Razorpay's webhook.
--
-- Run once: `psql "$DATABASE_URL" -f backend/migrations/0005_is_pro.sql`
-- Idempotent — safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false;
