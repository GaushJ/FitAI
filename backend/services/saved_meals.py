from services.macros import totals_from_ingredients


def serialize_saved_meal(m) -> dict:
    """Converts a SavedMeal ORM object to the response dict shape used by every
    /api/saved-meals* route."""
    return {
        "id": m.id,
        "name": m.name,
        "ingredients": m.ingredients,
        "macros": totals_from_ingredients(m.ingredients),
        "created_at": m.created_at.isoformat(),
        "updated_at": m.updated_at.isoformat(),
    }
