from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.models import User
from db.session import get_db
from schemas.auth import UserUpdateSchema

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("")
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
    await db.commit()
    return {"status": "success", "user": {
        "name": current_user.name,
        "target_calories": current_user.target_calories,
        "target_protein": current_user.target_protein,
        "target_carbs": current_user.target_carbs,
        "target_fat": current_user.target_fat,
    }}
