import asyncio
import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, Date, JSON, ForeignKey, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

DATABASE_URL = "sqlite+aiosqlite:///./meal_tracker.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, default="Guest User")
    target_calories: Mapped[float] = mapped_column(Float, default=2000.0)
    target_protein: Mapped[float] = mapped_column(Float, default=150.0)
    target_carbs: Mapped[float] = mapped_column(Float, default=200.0)
    target_fat: Mapped[float] = mapped_column(Float, default=65.0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[Optional[datetime.date]] = mapped_column(Date, nullable=True)

    food_logs: Mapped[List["DailyFoodLog"]] = relationship("DailyFoodLog", back_populates="user", cascade="all, delete-orphan")

class IngredientCache(Base):
    __tablename__ = "ingredient_cache"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    calories_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    protein_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    carbs_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    fat_per_100g: Mapped[float] = mapped_column(Float, default=0.0)

class AppSetting(Base):
    """Generic key-value store for small app-wide settings (e.g. preferred STT mode)."""
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)

class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    api_key: Mapped[str] = mapped_column(String, nullable=False)

class BrandPreference(Base):
    __tablename__ = "brand_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ingredient_name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    preferred_brand: Mapped[str] = mapped_column(String, nullable=False)

class DailyFoodLog(Base):
    __tablename__ = "daily_food_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    date: Mapped[datetime.date] = mapped_column(Date, default=datetime.date.today, index=True)
    raw_transcript: Mapped[str] = mapped_column(String, nullable=False)
    computed_macros: Mapped[dict] = mapped_column(JSON, nullable=False) # Stores aggregate macros & items details

    user: Mapped["User"] = relationship("User", back_populates="food_logs")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        # Create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # Check if default user exists
        result = await session.execute(select(User).where(User.id == 1))
        default_user = result.scalar_one_or_none()
        
        if not default_user:
            default_user = User(
                id=1,
                name="Gaurav",
                target_calories=2200.0,
                target_protein=150.0,
                target_carbs=230.0,
                target_fat=70.0,
                current_streak=0,
                last_active_date=None
            )
            session.add(default_user)
            await session.commit()
            
        # Check if ingredient cache is empty, seed standard ingredients
        result = await session.execute(select(IngredientCache).limit(1))
        if not result.scalar():
            default_ingredients = [
                IngredientCache(name="oats", brand=None, calories_per_100g=389.0, protein_per_100g=16.9, carbs_per_100g=66.3, fat_per_100g=6.9),
                IngredientCache(name="paneer", brand="amul", calories_per_100g=360.0, protein_per_100g=18.0, carbs_per_100g=4.0, fat_per_100g=30.0),
                IngredientCache(name="paneer", brand=None, calories_per_100g=265.0, protein_per_100g=18.3, carbs_per_100g=1.2, fat_per_100g=20.8),
                IngredientCache(name="chicken breast", brand=None, calories_per_100g=165.0, protein_per_100g=31.0, carbs_per_100g=0.0, fat_per_100g=3.6),
                IngredientCache(name="egg", brand=None, calories_per_100g=155.0, protein_per_100g=13.0, carbs_per_100g=1.1, fat_per_100g=11.0),
                IngredientCache(name="banana", brand=None, calories_per_100g=89.0, protein_per_100g=1.1, carbs_per_100g=22.8, fat_per_100g=0.3),
                IngredientCache(name="milk", brand=None, calories_per_100g=61.0, protein_per_100g=3.2, carbs_per_100g=4.8, fat_per_100g=3.3),
                IngredientCache(name="almonds", brand=None, calories_per_100g=579.0, protein_per_100g=21.2, carbs_per_100g=21.7, fat_per_100g=49.9),
                IngredientCache(name="white rice", brand=None, calories_per_100g=130.0, protein_per_100g=2.7, carbs_per_100g=28.0, fat_per_100g=0.3),
                IngredientCache(name="whey protein", brand="optimum nutrition", calories_per_100g=375.0, protein_per_100g=75.0, carbs_per_100g=9.4, fat_per_100g=4.7),
                IngredientCache(name="peanut butter", brand="pintola", calories_per_100g=625.0, protein_per_100g=30.0, carbs_per_100g=18.0, fat_per_100g=50.0),
                IngredientCache(name="apple", brand=None, calories_per_100g=52.0, protein_per_100g=0.3, carbs_per_100g=14.0, fat_per_100g=0.2),
            ]
            session.add_all(default_ingredients)
            await session.commit()

async def update_user_streak(session: AsyncSession, user_id: int) -> int:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return 0
        
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    
    if user.last_active_date == yesterday:
        # User was active yesterday, increment streak
        user.current_streak += 1
    elif user.last_active_date == today:
        # User was already active today, keep streak the same
        pass
    else:
        # Streak broken or first active day
        user.current_streak = 1
        
    user.last_active_date = today
    await session.commit()
    return user.current_streak

async def get_app_setting(session: AsyncSession, key: str, default: Optional[str] = None) -> Optional[str]:
    result = await session.execute(select(AppSetting).where(AppSetting.key == key))
    setting = result.scalar_one_or_none()
    return setting.value if setting else default

async def set_app_setting(session: AsyncSession, key: str, value: str) -> "AppSetting":
    result = await session.execute(select(AppSetting).where(AppSetting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
    else:
        setting = AppSetting(key=key, value=value)
        session.add(setting)
    await session.commit()
    return setting

async def get_all_api_keys(session: AsyncSession) -> List["APIKey"]:
    result = await session.execute(select(APIKey))
    return result.scalars().all()

async def save_api_key(session: AsyncSession, provider: str, api_key: str) -> "APIKey":
    result = await session.execute(select(APIKey).where(APIKey.provider == provider))
    entry = result.scalar_one_or_none()
    if entry:
        entry.api_key = api_key
    else:
        entry = APIKey(provider=provider, api_key=api_key)
        session.add(entry)
    await session.commit()
    return entry

async def delete_api_key(session: AsyncSession, provider: str) -> bool:
    result = await session.execute(select(APIKey).where(APIKey.provider == provider))
    entry = result.scalar_one_or_none()
    if entry:
        await session.delete(entry)
        await session.commit()
        return True
    return False

async def get_brand_preferences(session: AsyncSession) -> List["BrandPreference"]:
    """Return all saved brand preferences."""
    result = await session.execute(select(BrandPreference))
    return result.scalars().all()

async def set_brand_preference(session: AsyncSession, ingredient_name: str, preferred_brand: str) -> "BrandPreference":
    """Insert or overwrite a brand preference for an ingredient."""
    name_lower = ingredient_name.strip().lower()
    brand_lower = preferred_brand.strip().lower()
    result = await session.execute(select(BrandPreference).where(BrandPreference.ingredient_name == name_lower))
    pref = result.scalar_one_or_none()
    if pref:
        pref.preferred_brand = brand_lower
    else:
        pref = BrandPreference(ingredient_name=name_lower, preferred_brand=brand_lower)
        session.add(pref)
    await session.commit()
    return pref

async def delete_brand_preference(session: AsyncSession, ingredient_name: str) -> bool:
    """Delete a brand preference. Returns True if it existed, False otherwise."""
    name_lower = ingredient_name.strip().lower()
    result = await session.execute(select(BrandPreference).where(BrandPreference.ingredient_name == name_lower))
    pref = result.scalar_one_or_none()
    if pref:
        await session.delete(pref)
        await session.commit()
        return True
    return False

if __name__ == "__main__":
    # Test initialization
    asyncio.run(init_db())
    print("Database initialised and seeded!")
