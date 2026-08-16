"""
Synchronous DB helpers for LangGraph nodes (which cannot be async).

Connects to Supabase/Postgres via psycopg2. DATABASE_URL is required.
"""
import os
import re

_DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not _DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. This app requires a Supabase/Postgres connection "
        "string — set it in backend/.env (local) or your hosting provider's env vars (prod)."
    )


# ── Connection helpers ────────────────────────────────────────────────────────

def _pg_dsn() -> str:
    """Convert SQLAlchemy-style asyncpg URL to psycopg2 DSN."""
    dsn = re.sub(r"^postgresql\+asyncpg://", "postgresql://", _DATABASE_URL)
    dsn = re.sub(r"^postgres://", "postgresql://", dsn)
    return dsn


def _pg_conn():
    import psycopg2
    return psycopg2.connect(_pg_dsn(), sslmode="require")


# ── Public API ────────────────────────────────────────────────────────────────

def query_local_cache(name: str, brand) -> dict | None:
    """Return cached per-100g macros for (name, brand) or None."""
    try:
        conn = _pg_conn()
        cur = conn.cursor()
        if brand:
            cur.execute(
                "SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g "
                "FROM ingredient_cache WHERE name=%s AND brand=%s LIMIT 1",
                (name, brand),
            )
        else:
            cur.execute(
                "SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g "
                "FROM ingredient_cache WHERE name=%s AND brand IS NULL LIMIT 1",
                (name,),
            )
        row = cur.fetchone()
        conn.close()

        if not row:
            return None
        return {
            "calories_per_100g": row[0],
            "protein_per_100g":  row[1],
            "carbs_per_100g":    row[2],
            "fat_per_100g":      row[3],
        }
    except Exception as exc:
        print(f"[db_sync] query_local_cache error: {exc}")
        return None


def query_local_cache_any_brand(name: str) -> dict | None:
    """Return cached per-100g macros for `name` regardless of brand, or None."""
    try:
        conn = _pg_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g "
            "FROM ingredient_cache WHERE name=%s LIMIT 1",
            (name,),
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return None
        return {
            "calories_per_100g": row[0],
            "protein_per_100g":  row[1],
            "carbs_per_100g":    row[2],
            "fat_per_100g":      row[3],
        }
    except Exception as exc:
        print(f"[db_sync] query_local_cache_any_brand error: {exc}")
        return None


def save_to_local_cache(name: str, brand, macros: dict) -> None:
    """Persist per-100g macros to ingredient_cache (upsert by name+brand)."""
    try:
        conn = _pg_conn()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO ingredient_cache (name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (name, COALESCE(brand, '')) DO UPDATE SET
                calories_per_100g = EXCLUDED.calories_per_100g,
                protein_per_100g  = EXCLUDED.protein_per_100g,
                carbs_per_100g    = EXCLUDED.carbs_per_100g,
                fat_per_100g      = EXCLUDED.fat_per_100g
            """,
            (
                name, brand,
                macros["calories_per_100g"], macros["protein_per_100g"],
                macros["carbs_per_100g"],    macros["fat_per_100g"],
            ),
        )
        conn.commit()
        conn.close()
    except Exception as exc:
        print(f"[db_sync] save_to_local_cache error: {exc}")


def get_preferred_brand(ingredient_name: str) -> str | None:
    """Return the user's preferred brand for an ingredient, or None."""
    try:
        conn = _pg_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT preferred_brand FROM brand_preferences WHERE ingredient_name=%s LIMIT 1",
            (ingredient_name,),
        )
        row = cur.fetchone()
        conn.close()

        return row[0] if row else None
    except Exception as exc:
        print(f"[db_sync] get_preferred_brand error: {exc}")
        return None
