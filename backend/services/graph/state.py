from typing import Any, Dict, List, TypedDict

from schemas.graph import IngredientExtraction


class GraphState(TypedDict):
    raw_text: str
    extracted_ingredients: List[IngredientExtraction]
    resolved_ingredients: List[Dict[str, Any]]
    total_meal_macros: Dict[str, float]
