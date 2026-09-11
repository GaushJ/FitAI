import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.models import DailyFoodLog, User
from db.session import get_db

router = APIRouter(prefix="/api", tags=["progress"])


@router.get("/progress")
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


@router.get("/history")
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


@router.delete("/meals/{meal_id}")
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
