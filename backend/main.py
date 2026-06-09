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
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
from jose import JWTError, jwt
import bcrypt as _bcrypt
from sqlalchemy import select, func

# Load environmental variables from .env
load_dotenv()

from database import (
    init_db, get_db, User, DailyFoodLog, BrandPreference, IngredientCache,
    APIKey, update_user_streak, get_brand_preferences,
    set_brand_preference, delete_brand_preference,
    get_all_api_keys, save_api_key, delete_api_key,
    get_app_setting, set_app_setting,
    create_user, get_user_by_username, get_user_by_id,
)
from sqlalchemy.ext.asyncio import AsyncSession
from stt_worker import transcribe_audio
from graph_engine import compiled_graph

# ── Environment detection ─────────────────────────────────────────────────────
IS_PRODUCTION = os.environ.get("ENVIRONMENT", "development").strip().lower() == "production"

# ── JWT / Auth configuration ──────────────────────────────────────────────────
# Set JWT_SECRET to a long random string in your hosting provider's env vars.
# The fallback is fine for local development but MUST be overridden in production.
SECRET_KEY = os.environ.get("JWT_SECRET", "fitvoice-dev-secret-change-me-in-production")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_DAYS = 7

http_bearer = HTTPBearer(auto_error=False)

# Use bcrypt directly — passlib 1.7.4 is incompatible with bcrypt 4.x because
# passlib's internal wrap-bug detection uses a 73-byte test string which newer
# bcrypt now rejects. Calling bcrypt directly avoids that internal check.
def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode("utf-8")[:72], _bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode())

def create_access_token(user_id: int) -> str:
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency — validate JWT and return the requesting User."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or has expired. Please log in again.")

    user = await get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists.")
    return user

# ── Supported API providers ───────────────────────────────────────────────────
SUPPORTED_PROVIDERS = {
    "anthropic": {"label": "Anthropic Claude",  "env_key": "ANTHROPIC_API_KEY",  "description": "Used for ingredient extraction, macro resolution & label vision (required)"},
    "openai":    {"label": "OpenAI",             "env_key": "OPENAI_API_KEY",     "description": "Alternative LLM for extraction and resolution"},
    "groq":      {"label": "Groq",               "env_key": "GROQ_API_KEY",       "description": "Ultra-fast Whisper API for speech-to-text"},
    "gemini":    {"label": "Google Gemini",      "env_key": "GEMINI_API_KEY",     "description": "Google's multimodal LLM alternative"},
    "tavily":    {"label": "Tavily Search",      "env_key": "TAVILY_API_KEY",     "description": "Web search fallback for unknown ingredients"},
}

# ── App lifespan (DB init + key hot-loading) ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs("temp_audio", exist_ok=True)
    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        keys = await get_all_api_keys(session)
        for k in keys:
            if k.provider in SUPPORTED_PROVIDERS:
                os.environ[SUPPORTED_PROVIDERS[k.provider]["env_key"]] = k.api_key
        if IS_PRODUCTION:
            os.environ["STT_MODE"] = "cloud"
        else:
            saved_mode = await get_app_setting(session, "stt_mode", default="auto")
            os.environ["STT_MODE"] = saved_mode
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
    allow_origins=[
        "http://localhost:3000",
        "https://fit-ai-black-one.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class SignupSchema(BaseModel):
    username: str
    password: str
    name: str

class LoginSchema(BaseModel):
    username: str
    password: str

class UserUpdateSchema(BaseModel):
    name: str
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float

class BrandPreferenceSchema(BaseModel):
    ingredient_name: str
    preferred_brand: str

class APIKeySchema(BaseModel):
    provider: str
    api_key: str

class STTModeSchema(BaseModel):
    mode: str  # "auto" | "cloud" | "local"

VALID_STT_MODES = {"auto", "cloud", "local"}

# ─────────────────────────────────────────────────────────────────────────────
# AUTH ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "time": datetime.datetime.now().isoformat()}

@app.post("/api/auth/signup")
async def signup(payload: SignupSchema, db: AsyncSession = Depends(get_db)):
    """Register a new user. Returns a JWT token on success."""
    if len(payload.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if len(payload.name.strip()) < 1:
        raise HTTPException(status_code=400, detail="Name is required.")

    existing = await get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken. Please choose another.")

    user = await create_user(
        db,
        username=payload.username,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
    )
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "username": user.username},
    }

@app.post("/api/auth/login")
async def login(payload: LoginSchema, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT token."""
    user = await get_user_by_username(db, payload.username)
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "username": user.username},
    }

# ─────────────────────────────────────────────────────────────────────────────
# USER PROFILE (auth-protected)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/user")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "target_calories": current_user.target_calories,
        "target_protein": current_user.target_protein,
        "target_carbs": current_user.target_carbs,
        "target_fat": current_user.target_fat,
        "current_streak": current_user.current_streak,
        "last_active_date": current_user.last_active_date.isoformat() if current_user.last_active_date else None,
    }

@app.post("/api/user")
async def update_user_profile(
    payload: UserUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.name = payload.name
    current_user.target_calories = payload.target_calories
    current_user.target_protein = payload.target_protein
    current_user.target_carbs = payload.target_carbs
    current_user.target_fat = payload.target_fat
    await db.commit()
    return {"status": "success", "user": {
        "name": current_user.name,
        "target_calories": current_user.target_calories,
        "target_protein": current_user.target_protein,
        "target_carbs": current_user.target_carbs,
        "target_fat": current_user.target_fat,
    }}

# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD (auth-protected)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.date.today()
    logs_result = await db.execute(
        select(DailyFoodLog)
        .where(DailyFoodLog.user_id == current_user.id, DailyFoodLog.date == today)
        .order_by(DailyFoodLog.id.desc())
    )
    logs = logs_result.scalars().all()

    today_calories = today_protein = today_carbs = today_fat = 0.0
    meals_list = []
    for log in logs:
        macros = log.computed_macros.get("total_meal_macros", {})
        today_calories += macros.get("calories", 0.0)
        today_protein  += macros.get("protein", 0.0)
        today_carbs    += macros.get("carbs", 0.0)
        today_fat      += macros.get("fat", 0.0)
        meals_list.append({
            "id": log.id,
            "raw_transcript": log.raw_transcript,
            "date": log.date.isoformat(),
            "macros": macros,
            "ingredients": log.computed_macros.get("resolved_ingredients", []),
        })

    return {
        "user": {
            "name": current_user.name,
            "username": current_user.username,
            "current_streak": current_user.current_streak,
            "target_calories": current_user.target_calories,
            "target_protein": current_user.target_protein,
            "target_carbs": current_user.target_carbs,
            "target_fat": current_user.target_fat,
        },
        "totals": {
            "calories": round(today_calories, 1),
            "protein": round(today_protein, 1),
            "carbs": round(today_carbs, 1),
            "fat": round(today_fat, 1),
        },
        "meals": meals_list,
    }

# ─────────────────────────────────────────────────────────────────────────────
# TRANSCRIBE (auth-protected)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/transcribe")
async def transcribe_only(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    temp_file_path = f"temp_audio/uploaded_{datetime.datetime.now().timestamp()}_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        transcript = transcribe_audio(temp_file_path)
        return {"status": "success", "transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to transcribe audio")
    finally:
        if os.path.exists(temp_file_path):
            try: os.remove(temp_file_path)
            except Exception: pass

# ─────────────────────────────────────────────────────────────────────────────
# TRACK MEAL (auth-protected)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/track-meal")
async def track_meal(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    transcript = ""
    if file:
        temp_file_path = f"temp_audio/uploaded_{datetime.datetime.now().timestamp()}_{file.filename}"
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            transcript = transcribe_audio(temp_file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to process or transcribe audio")
        finally:
            if os.path.exists(temp_file_path):
                try: os.remove(temp_file_path)
                except Exception: pass
    elif text:
        transcript = text.strip()
    else:
        raise HTTPException(status_code=400, detail="Either audio file or text is required.")

    if not transcript:
        raise HTTPException(status_code=400, detail="Could not capture speech. Please try again.")

    try:
        final_state = compiled_graph.invoke({"raw_text": transcript})
    except Exception as ge:
        raise HTTPException(status_code=500, detail=f"Macro resolution failed: {ge}")

    resolved_ingredients = final_state.get("resolved_ingredients", [])
    total_meal_macros    = final_state.get("total_meal_macros", {})

    streak = await update_user_streak(db, user_id=current_user.id)

    food_log = DailyFoodLog(
        user_id=current_user.id,
        date=datetime.date.today(),
        raw_transcript=transcript,
        computed_macros={"resolved_ingredients": resolved_ingredients, "total_meal_macros": total_meal_macros},
    )
    db.add(food_log)
    await db.commit()

    return {
        "status": "success",
        "transcript": transcript,
        "streak": streak,
        "ingredients": resolved_ingredients,
        "macros": total_meal_macros,
    }

# ─────────────────────────────────────────────────────────────────────────────
# PROGRESS — 90-day heatmap data (auth-protected)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/progress")
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns 90 days of daily calorie summaries (for the GitHub-style heatmap)
    plus all-time stats (streaks, totals).
    """
    today           = datetime.date.today()
    ninety_days_ago = today - datetime.timedelta(days=89)

    # Fetch last 90 days of logs for this user
    recent = await db.execute(
        select(DailyFoodLog)
        .where(DailyFoodLog.user_id == current_user.id, DailyFoodLog.date >= ninety_days_ago)
        .order_by(DailyFoodLog.date)
    )
    recent_logs = recent.scalars().all()

    # Group into a date → macro totals dict
    daily_map: dict = {}
    for log in recent_logs:
        ds = log.date.isoformat()
        if ds not in daily_map:
            daily_map[ds] = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "meal_count": 0}
        m = log.computed_macros.get("total_meal_macros", {})
        daily_map[ds]["calories"]   += m.get("calories", 0)
        daily_map[ds]["protein"]    += m.get("protein", 0)
        daily_map[ds]["carbs"]      += m.get("carbs", 0)
        daily_map[ds]["fat"]        += m.get("fat", 0)
        daily_map[ds]["meal_count"] += 1

    # Build 90-cell array (oldest first)
    summaries = []
    for i in range(90):
        d  = ninety_days_ago + datetime.timedelta(days=i)
        ds = d.isoformat()
        if ds in daily_map:
            cal   = round(daily_map[ds]["calories"], 1)
            ratio = cal / current_user.target_calories if current_user.target_calories else 0
            if ratio >= 0.9 and ratio <= 1.15:
                status = "met"        # sweet spot — green
            elif ratio > 1.15:
                status = "over"       # above target — orange/red
            elif ratio >= 0.5:
                status = "under"      # logged but under target — muted green
            else:
                status = "minimal"    # logged almost nothing — very muted
            summaries.append({
                "date": ds,
                "calories": cal,
                "protein": round(daily_map[ds]["protein"], 1),
                "carbs":   round(daily_map[ds]["carbs"], 1),
                "fat":     round(daily_map[ds]["fat"], 1),
                "meal_count": daily_map[ds]["meal_count"],
                "target_calories": current_user.target_calories,
                "status": status,
            })
        else:
            summaries.append({
                "date": ds, "calories": 0, "protein": 0, "carbs": 0, "fat": 0,
                "meal_count": 0, "target_calories": current_user.target_calories,
                "status": "empty",
            })

    # All-time stats for this user
    all_logs_res = await db.execute(
        select(DailyFoodLog).where(DailyFoodLog.user_id == current_user.id)
    )
    all_logs = all_logs_res.scalars().all()

    unique_dates = sorted(set(log.date for log in all_logs))
    best_streak = curr = 0
    prev_d = None
    for d in unique_dates:
        curr = (curr + 1) if prev_d and (d - prev_d).days == 1 else 1
        best_streak = max(best_streak, curr)
        prev_d = d

    total_count_res = await db.execute(
        select(func.count(DailyFoodLog.id)).where(DailyFoodLog.user_id == current_user.id)
    )
    total_meals = total_count_res.scalar() or 0

    return {
        "summaries": summaries,
        "stats": {
            "current_streak": current_user.current_streak,
            "best_streak": best_streak,
            "total_days_logged": len(unique_dates),
            "total_meals": total_meals,
        },
        "target_calories": current_user.target_calories,
    }

# ─────────────────────────────────────────────────────────────────────────────
# HISTORY — paginated past meals (auth-protected)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/history")
async def get_history(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * per_page
    logs_res = await db.execute(
        select(DailyFoodLog)
        .where(DailyFoodLog.user_id == current_user.id)
        .order_by(DailyFoodLog.date.desc(), DailyFoodLog.id.desc())
        .offset(offset)
        .limit(per_page)
    )
    logs = logs_res.scalars().all()

    total_res = await db.execute(
        select(func.count(DailyFoodLog.id)).where(DailyFoodLog.user_id == current_user.id)
    )
    total = total_res.scalar() or 0

    return {
        "meals": [
            {
                "id": log.id,
                "date": log.date.isoformat(),
                "raw_transcript": log.raw_transcript,
                "macros": log.computed_macros.get("total_meal_macros", {}),
                "ingredients": log.computed_macros.get("resolved_ingredients", []),
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }

# ─────────────────────────────────────────────────────────────────────────────
# DELETE MEAL (auth-protected)
# ─────────────────────────────────────────────────────────────────────────────

@app.delete("/api/meals/{meal_id}")
async def delete_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a specific meal log. Users can only delete their own meals."""
    result = await db.execute(
        select(DailyFoodLog).where(
            DailyFoodLog.id == meal_id,
            DailyFoodLog.user_id == current_user.id,   # ownership check
        )
    )
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found or does not belong to you.")
    await db.delete(meal)
    await db.commit()
    return {"status": "deleted", "meal_id": meal_id}

# ─────────────────────────────────────────────────────────────────────────────
# BRAND PREFERENCES (global — no auth required)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/brand-preferences")
async def list_brand_preferences(db: AsyncSession = Depends(get_db)):
    prefs = await get_brand_preferences(db)
    return [{"ingredient_name": p.ingredient_name, "preferred_brand": p.preferred_brand} for p in prefs]

@app.post("/api/brand-preferences")
async def upsert_brand_preference(payload: BrandPreferenceSchema, db: AsyncSession = Depends(get_db)):
    pref = await set_brand_preference(db, payload.ingredient_name, payload.preferred_brand)
    return {"status": "success", "ingredient_name": pref.ingredient_name, "preferred_brand": pref.preferred_brand}

@app.delete("/api/brand-preferences/{ingredient_name}")
async def remove_brand_preference(ingredient_name: str, db: AsyncSession = Depends(get_db)):
    deleted = await delete_brand_preference(db, ingredient_name)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No preference found for '{ingredient_name}'")
    return {"status": "deleted", "ingredient_name": ingredient_name}

@app.post("/api/brand-preferences/label")
async def set_brand_from_label(
    ingredient_name: str = Form(...),
    preferred_brand: str = Form(...),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Extract macros from a nutrition label photo via Claude vision and persist them."""
    image_data = await image.read()
    image_b64  = base64.b64encode(image_data).decode()
    media_type = image.content_type or "image/jpeg"
    client = anthropic.Anthropic()

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_b64}},
                {"type": "text", "text": (
                    f"This is a nutrition label for '{preferred_brand} {ingredient_name}'. "
                    "Extract the nutritional values and normalise them to per 100g. "
                    "Reply with ONLY a raw JSON object with these four numeric keys: "
                    "calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g."
                )},
            ]}],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude vision call failed: {e}")

    raw_text   = response.content[0].text.strip()
    json_match = re.search(r'\{.*?\}', raw_text, re.DOTALL)
    if not json_match:
        raise HTTPException(status_code=422, detail="Could not parse nutrition data from label.")

    try:
        macros   = json.loads(json_match.group())
        required = {"calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"}
        if not required.issubset(macros.keys()):
            raise ValueError("Missing keys")
        macros = {k: float(macros[k]) for k in required}
    except Exception:
        raise HTTPException(status_code=422, detail="Label extraction returned incomplete data.")

    name_lower  = ingredient_name.strip().lower()
    brand_lower = preferred_brand.strip().lower()

    from sqlalchemy import select as sql_select
    result = await db.execute(
        sql_select(IngredientCache).where(IngredientCache.name == name_lower, IngredientCache.brand == brand_lower)
    )
    cache_entry = result.scalar_one_or_none()
    if cache_entry:
        cache_entry.calories_per_100g = macros["calories_per_100g"]
        cache_entry.protein_per_100g  = macros["protein_per_100g"]
        cache_entry.carbs_per_100g    = macros["carbs_per_100g"]
        cache_entry.fat_per_100g      = macros["fat_per_100g"]
    else:
        db.add(IngredientCache(name=name_lower, brand=brand_lower, **macros))

    await set_brand_preference(db, ingredient_name, preferred_brand)
    await db.commit()
    return {"status": "success", "ingredient_name": name_lower, "preferred_brand": brand_lower, "macros": macros, "source": "label_image"}

# ─────────────────────────────────────────────────────────────────────────────
# API KEY MANAGEMENT (global — no auth)
# ─────────────────────────────────────────────────────────────────────────────

def mask_key(key: str) -> str:
    if len(key) <= 8:
        return "••••••••"
    return key[:4] + "••••••••" + key[-4:]

@app.get("/api/keys")
async def list_api_keys(db: AsyncSession = Depends(get_db)):
    saved  = {k.provider: k.api_key for k in await get_all_api_keys(db)}
    result = []
    for provider, meta in SUPPORTED_PROVIDERS.items():
        key = saved.get(provider) or os.environ.get(meta["env_key"], "")
        result.append({
            "provider": provider, "label": meta["label"],
            "description": meta["description"], "env_key": meta["env_key"],
            "is_set": bool(key), "masked_key": mask_key(key) if key else "",
        })
    return result

@app.post("/api/keys")
async def upsert_api_key(payload: APIKeySchema, db: AsyncSession = Depends(get_db)):
    if payload.provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{payload.provider}'")
    await save_api_key(db, payload.provider, payload.api_key)
    os.environ[SUPPORTED_PROVIDERS[payload.provider]["env_key"]] = payload.api_key
    return {"status": "saved", "provider": payload.provider, "masked_key": mask_key(payload.api_key)}

@app.delete("/api/keys/{provider}")
async def remove_api_key(provider: str, db: AsyncSession = Depends(get_db)):
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{provider}'")
    deleted = await delete_api_key(db, provider)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No saved key for '{provider}'")
    os.environ.pop(SUPPORTED_PROVIDERS[provider]["env_key"], None)
    return {"status": "deleted", "provider": provider}

# ─────────────────────────────────────────────────────────────────────────────
# STT MODE SETTINGS (dev-only toggle, no auth required)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/stt-settings")
async def get_stt_settings(db: AsyncSession = Depends(get_db)):
    return {
        "allow_local_choice": not IS_PRODUCTION,
        "current_mode": os.environ.get("STT_MODE", "auto"),
        "is_production": IS_PRODUCTION,
        "modes": [
            {"value": "auto",  "label": "Auto (Cloud then Local)",       "description": "Uses Groq if key is set, falls back to local model."},
            {"value": "cloud", "label": "Cloud Only (Groq API)",          "description": "Always uses Groq's hosted Whisper. Needs a Groq API key."},
            {"value": "local", "label": "Local Only (On-device Whisper)", "description": "Runs faster-whisper on your machine. No key needed."},
        ],
    }

@app.post("/api/stt-settings")
async def update_stt_settings(payload: STTModeSchema, db: AsyncSession = Depends(get_db)):
    if IS_PRODUCTION:
        raise HTTPException(status_code=403, detail="STT mode is locked to 'cloud' in production.")
    if payload.mode not in VALID_STT_MODES:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of {sorted(VALID_STT_MODES)}")
    await set_app_setting(db, "stt_mode", payload.mode)
    os.environ["STT_MODE"] = payload.mode
    return {"status": "saved", "mode": payload.mode}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
