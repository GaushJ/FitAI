from typing import List, Optional

from pydantic import BaseModel


class SavedMealIngredientSchema(BaseModel):
    name: str
    brand: Optional[str] = None
    weight_g: float
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float


class SavedMealCreateSchema(BaseModel):
    name: str
    ingredients: List[SavedMealIngredientSchema]


class SavedMealUpdateSchema(BaseModel):
    name: Optional[str] = None
    ingredients: Optional[List[SavedMealIngredientSchema]] = None


class SavedMealLogSchema(BaseModel):
    ingredients: Optional[List[SavedMealIngredientSchema]] = None  # override for this log only
