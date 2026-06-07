import os
import re
import json
import base64
import shutil
import datetime
import anthropic
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environmental variables from .env
load_dotenv()

from database import (init_db, get_db, User, DailyFoodLog, BrandPreference, IngredientCache,
                       APIKey, update_user_streak, get_brand_preferences,
                       set_brand_preference, delete_brand_preference,
                       get_all_api_keys, save_api_key, delete_api_key,
                       get_app_setting, set_app_setting)

# ── Environment detection ────────────────────────────────────────────────────
# Set ENVIRONMENT=production in your hosting provider's env vars (Render, Fly.io,
# Railway, etc). When in production, the "choose local vs cloud STT" option is
# hidden from the UI — production deployments should always rely on a cloud STT
# provider (e.g. Groq) since most free/low hosting tiers can't fit a multi-GB
# Whisper model in memory.
IS_PRODUCTION = os.environ.get("ENVIRONMENT", "development").strip().lower() == "production"
from sqlalchemy import select as sql_select
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from stt_worker import transcribe_audio
from graph_engine import compiled_graph

# Lifespan manager for database initialization
SUPPORTED_PROVIDERS = {
    "anthropic": {"label": "Anthropic Claude",  "env_key": "ANTHROPIC_API_KEY",  "description": "Used for ingredient extraction, macro resolution & label vision (required)"},
    "openai":    {"label": "OpenAI",             "env_key": "OPENAI_API_KEY",     "description": "Alternative LLM for extraction and resolution"},
    "groq":      {"label": "Groq",               "env_key": "GROQ_API_KEY",       "description": "Ultra-fast Whisper API for speech-to-text"},
    "gemini":    {"label": "Google Gemini",      "env_key": "GEMINI_API_KEY",     "description": "Google's multimodal LLM alternative"},
    "tavily":    {"label": "Tavily Search",      "env_key": "TAVILY_API_KEY",     "description": "Web search fallback for unknown ingredients"},
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs("temp_audio", exist_ok=True)
    # Load API keys from DB into os.environ so all libraries pick them up
    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        keys = await get_all_api_keys(session)
        for k in keys:
            if k.provider in SUPPORTED_PROVIDERS:
                os.environ[SUPPORTED_PROVIDERS[k.provider]["env_key"]] = k.api_key

        # Load preferred STT mode ("auto" | "cloud" | "local") into os.environ.
        # In production this is always forced to "cloud" regardless of the saved
        # setting, since free/low-tier hosts can't run a local Whisper model.
        if IS_PRODUCTION:
            os.environ["STT_MODE"] = "cloud"
        else:
            saved_mode = await get_app_setting(session, "stt_mode", default="auto")
            os.environ["STT_MODE"] = saved_mode
    yield
    if os.path.exists("temp_audio"):
        shutil.rmtree("temp_audio")

app = FastAPI(
    title="Voice-Driven Meal Tracker API",
    description="Backend API for real-time speech transcription and agentic macro resolution",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas for request/response bodies
class UserUpdateSchema(BaseModel):
    name: str
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float

class ManualTrackSchema(BaseModel):
    text: str

class BrandPreferenceSchema(BaseModel):
    ingredient_name: str
    preferred_brand: str

# ----------------- ENDPOINTS -----------------

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "time": datetime.datetime.now().isoformat()}

@app.get("/api/user")
async def get_user_profile(db: AsyncSession = Depends(get_db)):
    """
    Get profile of the default user (ID 1).
    """
    result = await db.execute(select(User).where(User.id == 1))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "target_calories": user.target_calories,
        "target_protein": user.target_protein,
        "target_carbs": user.target_carbs,
        "target_fat": user.target_fat,
        "current_streak": user.current_streak,
        "last_active_date": user.last_active_date.isoformat() if user.last_active_date else None
    }

@app.post("/api/user")
async def update_user_profile(payload: UserUpdateSchema, db: AsyncSession = Depends(get_db)):
    """
    Update profile targets for the default user (ID 1).
    """
    result = await db.execute(select(User).where(User.id == 1))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.name = payload.name
    user.target_calories = payload.target_calories
    user.target_protein = payload.target_protein
    user.target_carbs = payload.target_carbs
    user.target_fat = payload.target_fat
    
    await db.commit()
    return {"status": "success", "user": {
        "name": user.name,
        "target_calories": user.target_calories,
        "target_protein": user.target_protein,
        "target_carbs": user.target_carbs,
        "target_fat": user.target_fat
    }}

@app.get("/api/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """
    Returns aggregated today's calories/macros vs target targets, log entries, and streak.
    """
    # 1. Fetch user profile
    result = await db.execute(select(User).where(User.id == 1))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 2. Fetch today's food logs
    today = datetime.date.today()
    logs_result = await db.execute(
        select(DailyFoodLog)
        .where(DailyFoodLog.user_id == 1, DailyFoodLog.date == today)
        .order_by(DailyFoodLog.id.desc())
    )
    logs = logs_result.scalars().all()
    
    # 3. Aggregate macros
    today_calories = 0.0
    today_protein = 0.0
    today_carbs = 0.0
    today_fat = 0.0
    
    meals_list = []
    for log in logs:
        macros = log.computed_macros.get("total_meal_macros", {})
        today_calories += macros.get("calories", 0.0)
        today_protein += macros.get("protein", 0.0)
        today_carbs += macros.get("carbs", 0.0)
        today_fat += macros.get("fat", 0.0)
        
        meals_list.append({
            "id": log.id,
            "raw_transcript": log.raw_transcript,
            "date": log.date.isoformat(),
            "macros": macros,
            "ingredients": log.computed_macros.get("resolved_ingredients", [])
        })
        
    return {
        "user": {
            "name": user.name,
            "current_streak": user.current_streak,
            "target_calories": user.target_calories,
            "target_protein": user.target_protein,
            "target_carbs": user.target_carbs,
            "target_fat": user.target_fat
        },
        "totals": {
            "calories": round(today_calories, 1),
            "protein": round(today_protein, 1),
            "carbs": round(today_carbs, 1),
            "fat": round(today_fat, 1)
        },
        "meals": meals_list
    }

@app.post("/api/transcribe")
async def transcribe_only(file: UploadFile = File(...)):
    """
    Transcribes audio and returns the raw text without running the LangGraph agent or committing to the DB.
    """
    temp_file_path = f"temp_audio/uploaded_{datetime.datetime.now().timestamp()}_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Transcribing audio file only: {temp_file_path}")
        transcript = transcribe_audio(temp_file_path)
        return {"status": "success", "transcript": transcript}
    except Exception as e:
        print(f"Error handling audio transcription: {e}")
        raise HTTPException(status_code=500, detail="Failed to transcribe audio")
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

@app.post("/api/track-meal")
async def track_meal(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint accepting voice recordings or raw text.
    Transcribes audio, triggers the LangGraph agent resolution, 
    persists logs, manages daily streaks, and returns the computed results.
    """
    transcript = ""
    
    # 1. Speech-to-Text resolution if file is provided
    if file:
        temp_file_path = f"temp_audio/uploaded_{datetime.datetime.now().timestamp()}_{file.filename}"
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            print(f"Saved audio file to {temp_file_path}. Initiating transcription...")
            transcript = transcribe_audio(temp_file_path)
        except Exception as e:
            print(f"Error handling audio file: {e}")
            raise HTTPException(status_code=500, detail="Failed to process or transcribe audio")
        finally:
            # Clean up temp file safely
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass
    elif text:
        transcript = text.strip()
    else:
        raise HTTPException(status_code=400, detail="Either audio file or manual text query is required")
        
    if not transcript:
        raise HTTPException(status_code=400, detail="Could not capture speech or text query. Please try again.")
        
    # 2. Invoke the compiled LangGraph pipeline
    print(f"Routing transcript to LangGraph pipeline: '{transcript}'")
    try:
        graph_input = {"raw_text": transcript}
        final_state = compiled_graph.invoke(graph_input)
    except Exception as ge:
        print(f"Error in LangGraph agent pipeline: {ge}")
        raise HTTPException(status_code=500, detail=f"Macro resolution agent failed: {ge}")
        
    extracted_ingredients = final_state.get("extracted_ingredients", [])
    resolved_ingredients = final_state.get("resolved_ingredients", [])
    total_meal_macros = final_state.get("total_meal_macros", {})
    
    # 3. Update User active streak
    streak = await update_user_streak(db, user_id=1)
    
    # 4. Save food log entry to DB
    # We serialize the extracted state fields to computed_macros JSON
    computed_json = {
        "resolved_ingredients": resolved_ingredients,
        "total_meal_macros": total_meal_macros
    }
    
    food_log = DailyFoodLog(
        user_id=1,
        date=datetime.date.today(),
        raw_transcript=transcript,
        computed_macros=computed_json
    )
    db.add(food_log)
    await db.commit()
    
    return {
        "status": "success",
        "transcript": transcript,
        "streak": streak,
        "ingredients": resolved_ingredients,
        "macros": total_meal_macros
    }

# ----------------- BRAND PREFERENCES -----------------

@app.get("/api/brand-preferences")
async def list_brand_preferences(db: AsyncSession = Depends(get_db)):
    """Return all saved brand preferences."""
    prefs = await get_brand_preferences(db)
    return [{"ingredient_name": p.ingredient_name, "preferred_brand": p.preferred_brand} for p in prefs]

@app.post("/api/brand-preferences")
async def upsert_brand_preference(payload: BrandPreferenceSchema, db: AsyncSession = Depends(get_db)):
    """Set or overwrite a preferred brand for an ingredient."""
    pref = await set_brand_preference(db, payload.ingredient_name, payload.preferred_brand)
    return {"status": "success", "ingredient_name": pref.ingredient_name, "preferred_brand": pref.preferred_brand}

@app.delete("/api/brand-preferences/{ingredient_name}")
async def remove_brand_preference(ingredient_name: str, db: AsyncSession = Depends(get_db)):
    """Remove a brand preference so the AI reverts to generic values."""
    deleted = await delete_brand_preference(db, ingredient_name)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No preference found for '{ingredient_name}'")
    return {"status": "deleted", "ingredient_name": ingredient_name}

@app.post("/api/brand-preferences/label")
async def set_brand_from_label(
    ingredient_name: str = Form(...),
    preferred_brand: str = Form(...),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Extract macros from a nutrition label photo using Claude vision,
    then save to ingredient_cache and brand_preferences for permanent use.
    """
    image_data = await image.read()
    image_b64 = base64.b64encode(image_data).decode()
    media_type = image.content_type or "image/jpeg"

    client = anthropic.Anthropic()

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": image_b64}
                    },
                    {
                        "type": "text",
                        "text": (
                            f"This is a nutrition label for '{preferred_brand} {ingredient_name}'. "
                            "Extract the nutritional values and normalise them to per 100g "
                            "(if the label shows per serving, convert using the serving size). "
                            "Reply with ONLY a raw JSON object — no markdown, no explanation — with exactly "
                            "these four numeric keys: "
                            "calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g. "
                            "Example: {\"calories_per_100g\": 62, \"protein_per_100g\": 3.2, "
                            "\"carbs_per_100g\": 4.8, \"fat_per_100g\": 3.3}"
                        )
                    }
                ]
            }]
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude vision call failed: {e}")

    raw_text = response.content[0].text.strip()
    json_match = re.search(r'\{.*?\}', raw_text, re.DOTALL)
    if not json_match:
        raise HTTPException(status_code=422, detail=f"Could not parse nutrition data from label. Raw response: {raw_text[:200]}")

    try:
        macros = json.loads(json_match.group())
        required = {"calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"}
        if not required.issubset(macros.keys()):
            raise ValueError("Missing keys")
        macros = {k: float(macros[k]) for k in required}
    except Exception:
        raise HTTPException(status_code=422, detail="Label extraction returned incomplete nutritional data.")

    name_lower = ingredient_name.strip().lower()
    brand_lower = preferred_brand.strip().lower()

    # Upsert ingredient_cache with label-accurate data
    result = await db.execute(
        sql_select(IngredientCache).where(
            IngredientCache.name == name_lower,
            IngredientCache.brand == brand_lower
        )
    )
    cache_entry = result.scalar_one_or_none()
    if cache_entry:
        cache_entry.calories_per_100g = macros["calories_per_100g"]
        cache_entry.protein_per_100g  = macros["protein_per_100g"]
        cache_entry.carbs_per_100g    = macros["carbs_per_100g"]
        cache_entry.fat_per_100g      = macros["fat_per_100g"]
    else:
        db.add(IngredientCache(
            name=name_lower, brand=brand_lower,
            calories_per_100g=macros["calories_per_100g"],
            protein_per_100g=macros["protein_per_100g"],
            carbs_per_100g=macros["carbs_per_100g"],
            fat_per_100g=macros["fat_per_100g"]
        ))

    # Save/overwrite brand preference
    await set_brand_preference(db, ingredient_name, preferred_brand)
    await db.commit()

    return {
        "status": "success",
        "ingredient_name": name_lower,
        "preferred_brand": brand_lower,
        "macros": macros,
        "source": "label_image"
    }

# ----------------- API KEY MANAGEMENT -----------------

class APIKeySchema(BaseModel):
    provider: str
    api_key: str

def mask_key(key: str) -> str:
    if len(key) <= 8:
        return "••••••••"
    return key[:4] + "••••••••" + key[-4:]

@app.get("/api/keys")
async def list_api_keys(db: AsyncSession = Depends(get_db)):
    """Return all saved providers with masked keys and metadata."""
    saved = {k.provider: k.api_key for k in await get_all_api_keys(db)}
    result = []
    for provider, meta in SUPPORTED_PROVIDERS.items():
        key = saved.get(provider) or os.environ.get(meta["env_key"], "")
        result.append({
            "provider": provider,
            "label": meta["label"],
            "description": meta["description"],
            "env_key": meta["env_key"],
            "is_set": bool(key),
            "masked_key": mask_key(key) if key else "",
        })
    return result

@app.post("/api/keys")
async def upsert_api_key(payload: APIKeySchema, db: AsyncSession = Depends(get_db)):
    """Save or update an API key, and hot-reload it into the running process."""
    if payload.provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{payload.provider}'")
    await save_api_key(db, payload.provider, payload.api_key)
    # Hot-reload into current process so no restart is needed
    os.environ[SUPPORTED_PROVIDERS[payload.provider]["env_key"]] = payload.api_key
    return {"status": "saved", "provider": payload.provider, "masked_key": mask_key(payload.api_key)}

@app.delete("/api/keys/{provider}")
async def remove_api_key(provider: str, db: AsyncSession = Depends(get_db)):
    """Remove a saved API key."""
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{provider}'")
    deleted = await delete_api_key(db, provider)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No saved key for '{provider}'")
    # Remove from running process env too
    os.environ.pop(SUPPORTED_PROVIDERS[provider]["env_key"], None)
    return {"status": "deleted", "provider": provider}

# ----------------- STT MODE SETTINGS (dev-only toggle) -----------------

class STTModeSchema(BaseModel):
    mode: str  # "auto" | "cloud" | "local"

VALID_STT_MODES = {"auto", "cloud", "local"}

@app.get("/api/stt-settings")
async def get_stt_settings(db: AsyncSession = Depends(get_db)):
    """
    Returns whether the user is allowed to choose between cloud/local STT,
    and the currently active mode. The choice is only exposed in non-production
    environments — production deployments are pinned to "cloud" automatically.
    """
    current_mode = os.environ.get("STT_MODE", "auto")
    return {
        "allow_local_choice": not IS_PRODUCTION,
        "current_mode": current_mode,
        "is_production": IS_PRODUCTION,
        "modes": [
            {"value": "auto",  "label": "Auto (Cloud, fallback to Local)", "description": "Uses Groq's hosted Whisper if a key is set, otherwise falls back to your local model."},
            {"value": "cloud", "label": "Cloud Only (Groq API)",            "description": "Always uses Groq's hosted Whisper API. Fastest, needs a free Groq API key."},
            {"value": "local", "label": "Local Only (On-device Whisper)",   "description": "Always uses faster-whisper running on your own machine. No API key or internet needed, but requires more RAM/CPU."},
        ],
    }

@app.post("/api/stt-settings")
async def update_stt_settings(payload: STTModeSchema, db: AsyncSession = Depends(get_db)):
    """Update the preferred STT mode. Disabled in production deployments."""
    if IS_PRODUCTION:
        raise HTTPException(status_code=403, detail="STT mode is locked to 'cloud' in production deployments.")
    if payload.mode not in VALID_STT_MODES:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of {sorted(VALID_STT_MODES)}")

    await set_app_setting(db, "stt_mode", payload.mode)
    os.environ["STT_MODE"] = payload.mode  # hot-reload, no restart needed
    return {"status": "saved", "mode": payload.mode}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
