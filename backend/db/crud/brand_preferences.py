from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import BrandPreference


async def get_brand_preferences(session: AsyncSession, user_id: int) -> List["BrandPreference"]:
    """Return this user's saved brand preferences."""
    result = await session.execute(select(BrandPreference).where(BrandPreference.user_id == user_id))
    return result.scalars().all()


async def set_brand_preference(session: AsyncSession, user_id: int, ingredient_name: str, preferred_brand: str) -> "BrandPreference":
    """Insert or overwrite this user's brand preference for an ingredient."""
    name_lower = ingredient_name.strip().lower()
    brand_lower = preferred_brand.strip().lower()
    result = await session.execute(
        select(BrandPreference).where(
            BrandPreference.user_id == user_id,
            BrandPreference.ingredient_name == name_lower,
        )
    )
    pref = result.scalar_one_or_none()
    if pref:
        pref.preferred_brand = brand_lower
    else:
        pref = BrandPreference(user_id=user_id, ingredient_name=name_lower, preferred_brand=brand_lower)
        session.add(pref)
    await session.commit()
    return pref


async def delete_brand_preference(session: AsyncSession, user_id: int, ingredient_name: str) -> bool:
    """Delete this user's brand preference. Returns True if it existed, False otherwise."""
    name_lower = ingredient_name.strip().lower()
    result = await session.execute(
        select(BrandPreference).where(
            BrandPreference.user_id == user_id,
            BrandPreference.ingredient_name == name_lower,
        )
    )
    pref = result.scalar_one_or_none()
    if pref:
        await session.delete(pref)
        await session.commit()
        return True
    return False
