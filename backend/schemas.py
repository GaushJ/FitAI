from typing import Optional, List
from pydantic import BaseModel, Field

class IngredientExtraction(BaseModel):
    """
    Represents an individual food component extracted from spoken text.
    """
    name: str = Field(
        ..., 
        description="Generic name of the food item, e.g., 'Oats', 'Paneer', 'Chicken breast', 'Banana'."
    )
    brand: Optional[str] = Field(
        None, 
        description="Specific brand mentioned, e.g., 'Yogabar', 'Amul', 'Optimum Nutrition'. Defaults to None if no brand is mentioned."
    )
    weight_g: float = Field(
        ..., 
        description="The quantity or amount of the item parsed, normalized to grams (e.g., if user says '2 eggs', estimate weight, e.g., 100g, or if '1 banana', estimate 120g)."
    )

class MealExtractionResponse(BaseModel):
    """
    Root response containing the list of parsed ingredients from a meal transcript.
    """
    ingredients: List[IngredientExtraction] = Field(
        ..., 
        description="List of all extracted food ingredients with their brand and weight in grams."
    )
