"""SQLAlchemy ORM models. No engine/session/query logic here — see db/session.py
for that and db/crud/ for query helpers."""
import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Float, Date, DateTime, JSON, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, default="Guest User")

    # ── Auth fields — nullable so existing rows without credentials still load ──
    # New users created via /api/auth/signup will always have both fields set.
    username: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    target_calories: Mapped[float] = mapped_column(Float, default=2000.0)
    target_protein: Mapped[float] = mapped_column(Float, default=150.0)
    target_carbs: Mapped[float] = mapped_column(Float, default=200.0)
    target_fat: Mapped[float] = mapped_column(Float, default=65.0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[Optional[datetime.date]] = mapped_column(Date, nullable=True)

    food_logs: Mapped[List["DailyFoodLog"]] = relationship("DailyFoodLog", back_populates="user", cascade="all, delete-orphan")
    frequent_meals: Mapped[List["FrequentMeal"]] = relationship("FrequentMeal", back_populates="user", cascade="all, delete-orphan")
    saved_meals: Mapped[List["SavedMeal"]] = relationship("SavedMeal", back_populates="user", cascade="all, delete-orphan")


class IngredientCache(Base):
    __tablename__ = "ingredient_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    calories_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    protein_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    carbs_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    fat_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str] = mapped_column(String, default="g", server_default="g", nullable=False)


class BrandPreference(Base):
    __tablename__ = "brand_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ingredient_name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    preferred_brand: Mapped[str] = mapped_column(String, nullable=False)


class FrequentMeal(Base):
    """
    Auto-maintained table of meals the user logs repeatedly.
    A meal is identified by a fingerprint (MD5 of sorted ingredient names).
    Created on first log, incremented on every subsequent match.
    Surfaced in the UI as quick-log cards once log_count >= 2.
    """
    __tablename__ = "frequent_meals"

    id: Mapped[int]              = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int]         = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    meal_fingerprint: Mapped[str] = mapped_column(String, index=True, nullable=False)
    display_name: Mapped[str]    = mapped_column(String, nullable=False)
    ingredients: Mapped[dict]    = mapped_column(JSON, nullable=False)   # resolved ingredient list
    macros: Mapped[dict]         = mapped_column(JSON, nullable=False)   # total_meal_macros
    log_count: Mapped[int]       = mapped_column(Integer, default=1)
    last_logged: Mapped[datetime.date] = mapped_column(Date, default=datetime.date.today)

    user: Mapped["User"] = relationship("User", back_populates="frequent_meals")


class SavedMeal(Base):
    """
    User-created meal template (e.g. "Breakfast Omelette + Protein Shake").
    Unlike FrequentMeal (auto-detected from repeat logs), these are explicitly
    saved by the user and can be freely renamed/edited — ingredients added,
    removed, or reweighed — before each use.
    """
    __tablename__ = "saved_meals"

    id: Mapped[int]           = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int]      = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str]         = mapped_column(String, nullable=False)
    ingredients: Mapped[list] = mapped_column(JSON, nullable=False)   # list of resolved ingredient dicts
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="saved_meals")


class DailyFoodLog(Base):
    __tablename__ = "daily_food_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    date: Mapped[datetime.date] = mapped_column(Date, default=datetime.date.today, index=True)
    raw_transcript: Mapped[str] = mapped_column(String, nullable=False)
    computed_macros: Mapped[dict] = mapped_column(JSON, nullable=False)  # Stores aggregate macros & items details

    user: Mapped["User"] = relationship("User", back_populates="food_logs")
