from typing import Optional

from pydantic import BaseModel


class BrandPreferenceSchema(BaseModel):
    ingredient_name: str
    preferred_brand: str
    calories_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None


class MacroUpdateSchema(BaseModel):
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float


class PrefRenameSchema(BaseModel):
    new_ingredient_name: str
    new_brand: str
