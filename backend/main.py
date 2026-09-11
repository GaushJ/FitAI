import os
import shutil
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environmental variables from .env
load_dotenv()

from core.config import CORS_ALLOW_ORIGINS
from db.session import init_db
from routers import (
    auth,
    brand_preferences,
    dashboard,
    frequent_meals,
    ingredients,
    keys,
    progress,
    saved_meals,
    users,
)


# ── App lifespan (DB init + temp dir) ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs("temp_audio", exist_ok=True)
    yield
    if os.path.exists("temp_audio"):
        shutil.rmtree("temp_audio")


app = FastAPI(
    title="FitVoice API",
    description="Voice-driven meal tracker — macro resolution with LangGraph + Claude",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(keys.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(progress.router)
app.include_router(frequent_meals.router)
app.include_router(saved_meals.router)
app.include_router(ingredients.router)
app.include_router(brand_preferences.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
