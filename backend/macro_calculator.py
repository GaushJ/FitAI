from typing import List


def calculate_ingredient_macros(ingredient: dict) -> dict:
    factor = ingredient["weight_g"] / 100.0
    return {
        "calories": round(ingredient["calories_per_100g"] * factor, 1),
        "protein":  round(ingredient["protein_per_100g"]  * factor, 1),
        "carbs":    round(ingredient["carbs_per_100g"]    * factor, 1),
        "fat":      round(ingredient["fat_per_100g"]      * factor, 1),
    }


def calculate_meal_macros(ingredients: List[dict]) -> dict:
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    for ing in ingredients:
        per_ing = calculate_ingredient_macros(ing)
        for key in totals:
            totals[key] += per_ing[key]
    return {k: round(v, 1) for k, v in totals.items()}
