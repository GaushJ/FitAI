from typing import Optional

from pydantic import BaseModel


class PortionAdjustSchema(BaseModel):
    """Optional per-ingredient gram overrides for quick-log portion editor."""
    portions: Optional[dict] = None  # { "ingredient_name": new_grams }


class ResolveIngredientRequest(BaseModel):
    name: str
    brand: str = ""
    weight_g: float = 100
