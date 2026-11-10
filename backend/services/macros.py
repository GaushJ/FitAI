"""Shared macro math. Single source of truth for turning a list of resolved
ingredients into total macros — used by the meal-tracking pipeline
(services/graph/nodes.py's calculation_node), Frequent Meals quick-log, and
Saved Meals logging, which all previously duplicated this same calculation."""


def totals_from_ingredients(ingredients: list) -> dict:
    """Recompute total macros from a list of {weight_g, *_per_100g} ingredient dicts."""
    total_cal = total_pro = total_crb = total_fat = 0.0
    for ing in ingredients:
        weight_factor = float(ing.get("weight_g", 0) or 0) / 100.0
        total_cal += float(ing.get("calories_per_100g", 0) or 0) * weight_factor
        total_pro += float(ing.get("protein_per_100g", 0) or 0) * weight_factor
        total_crb += float(ing.get("carbs_per_100g", 0) or 0) * weight_factor
        total_fat += float(ing.get("fat_per_100g", 0) or 0) * weight_factor
    return {
        "calories": round(total_cal, 1),
        "protein": round(total_pro, 1),
        "carbs": round(total_crb, 1),
        "fat": round(total_fat, 1),
    }
