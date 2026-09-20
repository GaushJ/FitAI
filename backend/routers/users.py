from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.crud.users import BODY_PROFILE_FIELDS, body_profile_dict
from db.models import User
from db.session import get_db
from schemas.auth import UserUpdateSchema
from schemas.targets import TargetInputsSchema, TargetPlanSchema
from services.nutrition_targets import calculate_targets

router = APIRouter(prefix="/api/user", tags=["user"])


def _targets_dict(user: User) -> dict:
    return {
        "target_calories": user.target_calories,
        "target_protein": user.target_protein,
        "target_carbs": user.target_carbs,
        "target_fat": user.target_fat,
    }


@router.get("")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        **_targets_dict(current_user),
        **body_profile_dict(current_user),
        "current_streak": current_user.current_streak,
        "last_active_date": current_user.last_active_date.isoformat() if current_user.last_active_date else None,
    }


@router.post("")
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
    for field in BODY_PROFILE_FIELDS:
        value = getattr(payload, field)
        if value is not None:
            # Enum members are stored as their plain string values.
            setattr(current_user, field, getattr(value, "value", value))
    await db.commit()
    return {"status": "success", "user": {"name": current_user.name, **_targets_dict(current_user), **body_profile_dict(current_user)}}


@router.post("/targets/calculate", response_model=TargetPlanSchema)
async def calculate_daily_targets(
    payload: TargetInputsSchema,
    current_user: User = Depends(get_current_user),
):
    """Suggest daily calories and macros from body stats and a goal.

    Pure formulas (Mifflin-St Jeor + Atwater) — nothing is saved; the client shows the
    suggestion, lets the user tweak it, then saves via POST /api/user.
    """
    plan = calculate_targets(
        sex=payload.sex,
        age=payload.age,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        activity=payload.activity_level,
        goal=payload.goal,
    )
    return TargetPlanSchema(
        bmr=plan.bmr,
        tdee=plan.tdee,
        bmi=plan.bmi,
        goal=plan.goal,
        calories=plan.calories,
        protein=plan.protein_g,
        carbs=plan.carbs_g,
        fat=plan.fat_g,
        calorie_adjustment=plan.calorie_adjustment,
        warnings=plan.warnings,
    )
