import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User


async def create_user(
    session: AsyncSession,
    username: str,
    name: str,
    password_hash: str,
    target_calories: float = 2000.0,
    target_protein: float = 150.0,
    target_carbs: float = 200.0,
    target_fat: float = 65.0,
) -> "User":
    """Create a new user account and persist it."""
    user = User(
        name=name,
        username=username.strip().lower(),
        password_hash=password_hash,
        target_calories=target_calories,
        target_protein=target_protein,
        target_carbs=target_carbs,
        target_fat=target_fat,
        current_streak=0,
        last_active_date=None,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_user_by_username(session: AsyncSession, username: str) -> Optional["User"]:
    """Look up a user by their username (case-insensitive)."""
    result = await session.execute(
        select(User).where(User.username == username.strip().lower())
    )
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: int) -> Optional["User"]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user_streak(session: AsyncSession, user_id: int) -> int:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return 0

    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)

    if user.last_active_date == yesterday:
        user.current_streak += 1
    elif user.last_active_date == today:
        pass  # already active today
    else:
        user.current_streak = 1

    user.last_active_date = today
    await session.commit()
    return user.current_streak
