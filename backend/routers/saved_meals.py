"""Saved Meals (auth-protected). User-created meal templates, e.g. "Omelette +
Protein Shake". Unlike Frequent Meals (auto-detected after 2+ identical logs),
these are explicitly saved and freely editable — ingredients can be reweighed,
added, or removed before each use."""
import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.crud.users import update_user_streak
from db.models import DailyFoodLog, SavedMeal, User
from db.session import get_db
from schemas.saved_meals import (
    SavedMealCreateSchema,
    SavedMealLogSchema,
    SavedMealUpdateSchema,
)
from services.frequent_meals import upsert_frequent_meal
from services.macros import totals_from_ingredients
from services.saved_meals import serialize_saved_meal

router = APIRouter(prefix="/api/saved-meals", tags=["saved-meals"])


@router.get("")
async def list_saved_meals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(SavedMeal)
        .where(SavedMeal.user_id == current_user.id)
        .order_by(SavedMeal.updated_at.desc())
    )
    return [serialize_saved_meal(m) for m in res.scalars().all()]


@router.post("")
async def create_saved_meal(
    payload: SavedMealCreateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Meal name is required.")
    if not payload.ingredients:
        raise HTTPException(status_code=400, detail="At least one ingredient is required.")

    meal = SavedMeal(
        user_id=current_user.id,
        name=payload.name.strip(),
        ingredients=[i.model_dump() for i in payload.ingredients],
    )
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return serialize_saved_meal(meal)


@router.put("/{meal_id}")
async def update_saved_meal(
    meal_id: int,
    payload: SavedMealUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(SavedMeal).where(SavedMeal.id == meal_id, SavedMeal.user_id == current_user.id)
    )
    meal = res.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Saved meal not found.")

    if payload.name is not None:
        if not payload.name.strip():
            raise HTTPException(status_code=400, detail="Meal name cannot be empty.")
        meal.name = payload.name.strip()

    if payload.ingredients is not None:
        if not payload.ingredients:
            raise HTTPException(status_code=400, detail="At least one ingredient is required.")
        meal.ingredients = [i.model_dump() for i in payload.ingredients]

    meal.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(meal)
    return serialize_saved_meal(meal)


@router.delete("/{meal_id}")
async def delete_saved_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(SavedMeal).where(SavedMeal.id == meal_id, SavedMeal.user_id == current_user.id)
    )
    meal = res.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Saved meal not found.")
    await db.delete(meal)
    await db.commit()
    return {"status": "deleted", "meal_id": meal_id}


@router.post("/{meal_id}/log")
async def log_saved_meal(
    meal_id: int,
    payload: SavedMealLogSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Log a saved meal as today's food entry. Pass `ingredients` to log with
    changed quantities or extra/removed ingredients for this one use — the
    saved template itself is untouched unless you PUT /api/saved-meals/{id}.
    """
    res = await db.execute(
        select(SavedMeal).where(SavedMeal.id == meal_id, SavedMeal.user_id == current_user.id)
    )
    meal = res.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Saved meal not found.")

    ingredients = (
        [i.model_dump() for i in payload.ingredients]
        if payload.ingredients is not None
        else list(meal.ingredients)
    )
    if not ingredients:
        raise HTTPException(status_code=400, detail="At least one ingredient is required.")

    total_meal_macros = totals_from_ingredients(ingredients)

    food_log = DailyFoodLog(
        user_id=current_user.id,
        date=datetime.date.today(),
        raw_transcript=f"Logged saved meal: {meal.name}",
        computed_macros={"resolved_ingredients": ingredients, "total_meal_macros": total_meal_macros},
    )
    db.add(food_log)

    # Also feed the frequent-meals auto-detection so this stays consistent
    # with meals logged via voice/text.
    await upsert_frequent_meal(db, current_user.id, ingredients, total_meal_macros)

    streak = await update_user_streak(db, user_id=current_user.id)
    await db.commit()

    return {
        "status": "success",
        "streak": streak,
        "ingredients": ingredients,
        "macros": total_meal_macros,
        "name": meal.name,
    }
