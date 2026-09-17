"""Test fixtures. Sets DATABASE_URL to the local Docker Postgres (see
../docker-compose.test.yml) BEFORE any project module is imported, since
db/session.py raises at import time if it's unset — must stay the first thing
that runs, ahead of any `from db...` / `from main import app`."""
import os

os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/getfitbro_test")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from db.models import Base
from db.session import engine, init_db

# ingredient_cache is seeded once per session (by init_db()) and treated as
# shared reference data, not per-test state — excluded from the per-test wipe
# below so tests don't each have to reseed it.
_STATEFUL_TABLES = [t for t in Base.metadata.sorted_tables if t.name != "ingredient_cache"]


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _database():
    """Fresh schema + seeded ingredient cache for the whole test session."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await init_db()
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def _clean_tables(_database):
    """Truncate per-test state before every test so tests can't leak into each other."""
    async with engine.begin() as conn:
        for table in reversed(_STATEFUL_TABLES):
            await conn.execute(table.delete())
    yield


@pytest_asyncio.fixture
async def client():
    from main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
