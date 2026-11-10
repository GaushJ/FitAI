import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.crud.users import update_user_streak
from db.models import DailyFoodLog, FrequentMeal, User
from db.session import get_db
from schemas.meals import PortionAdjustSchema
from services.frequent_meals import apply_portion_overrides
from services.macros import totals_from_ingredients

router = APIRouter(prefix="/api/frequent-meals", tags=["frequent-meals"])


@router.get("")
async def list_frequent_meals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return meals logged at least twice, sorted by log_count desc."""
    res = await db.execute(
        select(FrequentMeal)
        .where(FrequentMeal.user_id == current_user.id, FrequentMeal.log_count >= 2)
        .order_by(FrequentMeal.log_count.desc(), FrequentMeal.last_logged.desc())
        .limit(20)
    )
    meals = res.scalars().all()
    return [
        {
            "id": m.id,
            "display_name": m.display_name,
            "ingredients": m.ingredients,
            "macros": m.macros,
            "log_count": m.log_count,
            "last_logged": m.last_logged.isoformat(),
        }
        for m in meals
    ]


@router.post("/{meal_id}/log")
async def quick_log_frequent_meal(
    meal_id: int,
    payload: PortionAdjustSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Quick-log a frequent meal. Optionally pass `portions` to scale ingredient grams.
    Portions dict: { "chicken breast": 200 }  (key = ingredient name, value = new grams)
    """
    res = await db.execute(
        select(FrequentMeal).where(
            FrequentMeal.id == meal_id,
            FrequentMeal.user_id == current_user.id,
        )
    )
    fm = res.scalar_one_or_none()
    if not fm:
        raise HTTPException(status_code=404, detail="Frequent meal not found.")

    # Apply portion overrides (if any) and recompute totals from per-100g values
    ingredients = apply_portion_overrides(fm.ingredients, payload.portions)
    total_meal_macros = totals_from_ingredients(ingredients)

    transcript = f"Quick-logged: {fm.display_name}"

    food_log = DailyFoodLog(
        user_id=current_user.id,
        date=datetime.date.today(),
        raw_transcript=transcript,
        computed_macros={"resolved_ingredients": ingredients, "total_meal_macros": total_meal_macros},
    )
    db.add(food_log)

    # Also keep the frequent-meal record updated
    fm.log_count  += 1
    fm.last_logged = datetime.date.today()

    streak = await update_user_streak(db, user_id=current_user.id)
    await db.commit()

    return {
        "status": "success",
        "streak": streak,
        "ingredients": ingredients,
        "macros": total_meal_macros,
        "display_name": fm.display_name,
    }


@router.delete("/{meal_id}")
async def delete_frequent_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(FrequentMeal).where(
            FrequentMeal.id == meal_id,
            FrequentMeal.user_id == current_user.id,
        )
    )
    fm = res.scalar_one_or_none()
    if not fm:
        raise HTTPException(status_code=404, detail="Frequent meal not found.")
    await db.delete(fm)
    await db.commit()
    return {"status": "deleted", "meal_id": meal_id}
