import datetime
import json
import os
import re
import shutil
from typing import List, Optional

import anthropic
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.crud.users import update_user_streak
from db.models import DailyFoodLog, FrequentMeal, User
from db.session import get_db
from services.frequent_meals import upsert_frequent_meal
from services.graph.pipeline import compiled_graph
from services.llm_provider import set_request_key
from services.stt_worker import transcribe_audio

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
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


@router.post("/transcribe")
async def transcribe_only(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    x_groq_key: Optional[str] = Header(None),
):
    temp_file_path = f"temp_audio/uploaded_{datetime.datetime.now().timestamp()}_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        transcript = transcribe_audio(temp_file_path, groq_api_key=x_groq_key or "")
        return {"status": "success", "transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {e}")
    finally:
        if os.path.exists(temp_file_path):
            try: os.remove(temp_file_path)
            except Exception: pass


@router.post("/track-meal")
async def track_meal(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_anthropic_key: Optional[str] = Header(None),
    x_groq_key: Optional[str] = Header(None),
):
    set_request_key(x_anthropic_key or "")
    transcript = ""
    if file:
        temp_file_path = f"temp_audio/uploaded_{datetime.datetime.now().timestamp()}_{file.filename}"
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            transcript = transcribe_audio(temp_file_path, groq_api_key=x_groq_key or "")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {e}")
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

    # Warn the user if any ingredients fell back to generic estimates
    fallback_items = [
        r["name"] for r in resolved_ingredients
        if r.get("resolution_source") == "generic_fallback"
    ]
    warning = None
    if fallback_items:
        names = ", ".join(f'"{n}"' for n in fallback_items)
        warning = (
            f"Macros for {names} could not be found online and were estimated. "
            "For accurate tracking, add them manually via Brand Preferences."
        )

    streak = await update_user_streak(db, user_id=current_user.id)

    food_log = DailyFoodLog(
        user_id=current_user.id,
        date=datetime.date.today(),
        raw_transcript=transcript,
        computed_macros={"resolved_ingredients": resolved_ingredients, "total_meal_macros": total_meal_macros},
    )
    db.add(food_log)

    # Auto-upsert frequent meal record (creates or increments log_count)
    await upsert_frequent_meal(db, current_user.id, resolved_ingredients, total_meal_macros)

    await db.commit()

    return {
        "status": "success",
        "transcript": transcript,
        "streak": streak,
        "ingredients": resolved_ingredients,
        "macros": total_meal_macros,
        "warning": warning,
    }


@router.get("/suggest-meals")
async def suggest_meals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_anthropic_key: Optional[str] = Header(None),
):
    """
    Computes today's remaining macros and asks Claude to suggest 3 meals that
    best fill the gap — preferring the user's frequent meals where possible.
    Returns a ranked list with fit_score and fit_reason.
    """
    # 1. Today's consumed macros
    today = datetime.date.today()
    logs_res = await db.execute(
        select(DailyFoodLog).where(
            DailyFoodLog.user_id == current_user.id,
            DailyFoodLog.date == today,
        )
    )
    logs = logs_res.scalars().all()

    consumed = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    for log in logs:
        m = log.computed_macros.get("total_meal_macros", {})
        for k in consumed:
            consumed[k] += float(m.get(k, 0))

    remaining = {
        "calories": round(current_user.target_calories - consumed["calories"], 1),
        "protein":  round(current_user.target_protein  - consumed["protein"],  1),
        "carbs":    round(current_user.target_carbs    - consumed["carbs"],    1),
        "fat":      round(current_user.target_fat      - consumed["fat"],      1),
    }

    # 2. Frequent meals (top 10 by count)
    fm_res = await db.execute(
        select(FrequentMeal)
        .where(FrequentMeal.user_id == current_user.id, FrequentMeal.log_count >= 2)
        .order_by(FrequentMeal.log_count.desc())
        .limit(10)
    )
    frequent = fm_res.scalars().all()
    frequent_summaries = [
        {
            "id": f.id,
            "name": f.display_name,
            "macros": f.macros,
            "log_count": f.log_count,
        }
        for f in frequent
    ]

    # 3. Ask Claude
    prompt = f"""You are a nutrition coach for FitVoice, a macro-tracking app.

The user's REMAINING macros for today are:
- Calories: {remaining['calories']} kcal
- Protein:  {remaining['protein']} g
- Carbs:    {remaining['carbs']} g
- Fat:      {remaining['fat']} g

Their frequently logged meals (prefer these when they fit):
{json.dumps(frequent_summaries, indent=2)}

Suggest exactly 3 meals that best fill the remaining macros.
Rules:
- Prefer frequent meals from the list above when they fit well.
- If a frequent meal is used, set "is_frequent": true and "frequent_meal_id" to its id.
- Otherwise set "is_frequent": false and "frequent_meal_id": null.
- fit_score: integer 1-10 (10 = perfect macro fit).
- fit_reason: one short sentence explaining why this meal fits.
- estimated_macros: your best estimate for this meal's macros.
- description: brief description (e.g. "250g grilled chicken + 150g rice").

Reply with ONLY a valid JSON array of 3 objects, no markdown, no explanation:
[
  {{
    "name": "...",
    "description": "...",
    "is_frequent": true,
    "frequent_meal_id": 12,
    "estimated_macros": {{"calories": 0, "protein": 0, "carbs": 0, "fat": 0}},
    "fit_score": 9,
    "fit_reason": "..."
  }},
  ...
]"""

    try:
        api_key = x_anthropic_key or os.environ.get("ANTHROPIC_API_KEY", "")
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        m = re.search(r"\[.*\]", raw, re.DOTALL)
        raw = m.group() if m else raw
        suggestions: List[dict] = json.loads(raw)
    except Exception as e:
        print(f"[suggest-meals] ERROR: {e}")
        # Return a graceful fallback so the UI doesn't break
        suggestions = [
            {
                "name": "High-protein meal",
                "description": f"A meal targeting ~{remaining['protein']}g protein",
                "is_frequent": False,
                "frequent_meal_id": None,
                "estimated_macros": remaining,
                "fit_score": 5,
                "fit_reason": "Suggestion service temporarily unavailable.",
            }
        ]

    return {
        "remaining": remaining,
        "suggestions": suggestions,
    }
