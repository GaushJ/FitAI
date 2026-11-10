"""Pydantic schemas used by the LangGraph meal-resolution pipeline
(services/graph/) — as opposed to the request/response schemas in the other
files here, which belong to specific HTTP routes."""
from typing import List, Optional

from pydantic import BaseModel, Field


class IngredientExtraction(BaseModel):
    """Represents an individual food component extracted from spoken text."""
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
    """Root response containing the list of parsed ingredients from a meal transcript."""
    ingredients: List[IngredientExtraction] = Field(
        ...,
        description="List of all extracted food ingredients with their brand and weight in grams."
    )


class MacroParsingResponse(BaseModel):
    """LLM structured-output schema for the per-ingredient macro resolution sub-call."""
    calories_per_100g: float = Field(..., description="Calories per 100g of food")
    protein_per_100g: float = Field(..., description="Protein in grams per 100g of food")
    carbs_per_100g: float = Field(..., description="Carbohydrates in grams per 100g of food")
    fat_per_100g: float = Field(..., description="Fat in grams per 100g of food")
