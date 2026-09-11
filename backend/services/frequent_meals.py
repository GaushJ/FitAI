"""Frequent Meals: auto-detected meal templates. A meal is identified by a
fingerprint of its ingredient names; logging the same set of ingredients twice
promotes it to a quick-log card in the UI (see routers/frequent_meals.py)."""
import datetime
import hashlib
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import FrequentMeal


def meal_fingerprint(resolved_ingredients: list) -> str:
    """MD5 of sorted, lowercased ingredient names — stable identity for a meal."""
    names = sorted(
        (ing.get("name", "") or "").strip().lower()
        for ing in resolved_ingredients
        if ing.get("name")
    )
    return hashlib.md5("|".join(names).encode()).hexdigest()


def meal_display_name(resolved_ingredients: list) -> str:
    """Human-readable name: first 3 ingredient names joined by ' + '."""
    names = [ing.get("name", "").strip().title() for ing in resolved_ingredients if ing.get("name")]
    if not names:
        return "Meal"
    if len(names) <= 3:
        return " + ".join(names)
    return " + ".join(names[:3]) + f" +{len(names) - 3} more"


def apply_portion_overrides(ingredients: list, portions: Optional[dict]) -> list:
    """Return a copy of `ingredients` with weight_g overridden per `portions` ({name: new_grams})."""
    if not portions:
        return [dict(ing) for ing in ingredients]
    portions_lower = {str(k).lower(): v for k, v in portions.items()}
    updated = []
    for ing in ingredients:
        ing = dict(ing)
        name_lower = (ing.get("name") or "").lower()
        if name_lower in portions_lower:
            ing["weight_g"] = float(portions_lower[name_lower])
        updated.append(ing)
    return updated


async def upsert_frequent_meal(
    db: AsyncSession,
    user_id: int,
    resolved_ingredients: list,
    total_meal_macros: dict,
) -> None:
    """Called after every successful meal log. Creates or increments the frequent meal record."""
    fp = meal_fingerprint(resolved_ingredients)
    existing_res = await db.execute(
        select(FrequentMeal).where(
            FrequentMeal.user_id == user_id,
            FrequentMeal.meal_fingerprint == fp,
        )
    )
    fm = existing_res.scalar_one_or_none()
    today = datetime.date.today()
    if fm:
        fm.log_count += 1
        fm.last_logged = today
        fm.macros = total_meal_macros          # keep latest macro snapshot
        fm.ingredients = resolved_ingredients  # keep latest portion sizes
    else:
        db.add(FrequentMeal(
            user_id=user_id,
            meal_fingerprint=fp,
            display_name=meal_display_name(resolved_ingredients),
            ingredients=resolved_ingredients,
            macros=total_meal_macros,
            log_count=1,
            last_logged=today,
        ))
    # commit is handled by the caller after adding the food log
