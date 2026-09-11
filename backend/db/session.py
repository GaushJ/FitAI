"""Database engine/session setup + startup initialization. Models live in
db/models.py; query helpers live in db/crud/."""
import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from db.models import Base, IngredientCache

# ── Database URL ──────────────────────────────────────────────────────────────
# Set DATABASE_URL to your Supabase connection string
# (postgresql://postgres:...@db.xxx.supabase.co:5432/postgres) — both locally
# (backend/.env) and in your hosting provider's env vars (e.g. Render).
# This app uses Supabase exclusively; there is no local SQLite fallback.
_raw_url = os.environ.get("DATABASE_URL", "")

if not _raw_url:
    raise RuntimeError(
        "DATABASE_URL is not set. This app requires a Supabase/Postgres connection "
        "string — set it in backend/.env (local) or your hosting provider's env vars (prod)."
    )

# Supabase (and Heroku-style) give "postgres://..." — SQLAlchemy needs "postgresql+asyncpg://"
DATABASE_URL = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1) \
                        .replace("postgresql://", "postgresql+asyncpg://", 1)
# Supabase requires SSL — pass it via connect_args so asyncpg enforces it.
# pool_pre_ping keeps the connection alive across Render's sleep/wake cycles.
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    connect_args={"ssl": "require"},
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        # Create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Seed ingredient cache if empty
        result = await session.execute(select(IngredientCache).limit(1))
        if not result.scalar():
            default_ingredients = [
                IngredientCache(name="oats", brand=None, calories_per_100g=389.0, protein_per_100g=16.9, carbs_per_100g=66.3, fat_per_100g=6.9),
                IngredientCache(name="paneer", brand="amul", calories_per_100g=360.0, protein_per_100g=18.0, carbs_per_100g=4.0, fat_per_100g=30.0),
                IngredientCache(name="paneer", brand=None, calories_per_100g=265.0, protein_per_100g=18.3, carbs_per_100g=1.2, fat_per_100g=20.8),
                IngredientCache(name="chicken breast", brand=None, calories_per_100g=165.0, protein_per_100g=31.0, carbs_per_100g=0.0, fat_per_100g=3.6),
                IngredientCache(name="egg", brand=None, calories_per_100g=155.0, protein_per_100g=13.0, carbs_per_100g=1.1, fat_per_100g=11.0),
                IngredientCache(name="banana", brand=None, calories_per_100g=89.0, protein_per_100g=1.1, carbs_per_100g=22.8, fat_per_100g=0.3),
                IngredientCache(name="milk", brand=None, calories_per_100g=61.0, protein_per_100g=3.2, carbs_per_100g=4.8, fat_per_100g=3.3),
                IngredientCache(name="almonds", brand=None, calories_per_100g=579.0, protein_per_100g=21.2, carbs_per_100g=21.7, fat_per_100g=49.9),
                IngredientCache(name="white rice", brand=None, calories_per_100g=130.0, protein_per_100g=2.7, carbs_per_100g=28.0, fat_per_100g=0.3),
                IngredientCache(name="whey protein", brand="optimum nutrition", calories_per_100g=375.0, protein_per_100g=75.0, carbs_per_100g=9.4, fat_per_100g=4.7),
                IngredientCache(name="peanut butter", brand="pintola", calories_per_100g=625.0, protein_per_100g=30.0, carbs_per_100g=18.0, fat_per_100g=50.0),
                IngredientCache(name="apple", brand=None, calories_per_100g=52.0, protein_per_100g=0.3, carbs_per_100g=14.0, fat_per_100g=0.2),
            ]
            session.add_all(default_ingredients)
            await session.commit()
