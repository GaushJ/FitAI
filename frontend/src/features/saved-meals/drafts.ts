import type { MealLog } from "@/features/meals/types";
import type { SavedMeal, SavedMealDraft } from "@/features/saved-meals/types";

const cloneIngredients = <T extends { ingredients: SavedMealDraft["ingredients"] }>(source: T) =>
  source.ingredients.map((ing) => ({ ...ing }));

export const blankDraft = (): SavedMealDraft => ({ id: null, name: "", ingredients: [] });

/** Edit an existing template — its quantities can change before logging or saving. */
export const draftFromSavedMeal = (meal: SavedMeal): SavedMealDraft => ({
  id: meal.id,
  name: meal.name,
  ingredients: cloneIngredients(meal),
});

/** Turn a logged meal into a reusable template ("I have this every day"). */
export const draftFromLoggedMeal = (meal: MealLog): SavedMealDraft => ({
  id: null,
  name: meal.ingredients.map((i) => i.name).slice(0, 3).join(" + ") || "My Meal",
  ingredients: cloneIngredients(meal),
});
