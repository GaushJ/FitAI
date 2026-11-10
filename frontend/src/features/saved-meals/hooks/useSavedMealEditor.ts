"use client";

import { useState } from "react";
import type { Notifier } from "@/hooks/useFeedback";
import { getErrorMessage } from "@/lib/errors";
import { sumIngredientMacros, roundMacros } from "@/lib/nutrition";
import type { Ingredient } from "@/types/nutrition";
import type { Notice } from "@/types/notice";
import { resolveIngredient } from "@/features/ingredients/api";
import { createSavedMeal, logSavedMeal, updateSavedMeal } from "@/features/saved-meals/api";
import type { SavedMealDraft } from "@/features/saved-meals/types";

const DEFAULT_WEIGHT_G = 100;
const EMPTY_NEW_INGREDIENT = { name: "", brand: "", weight: DEFAULT_WEIGHT_G };

interface UseSavedMealEditorOptions {
  draft: SavedMealDraft;
  notify: Notifier;
  /** Runs after the template is created/updated. */
  onTemplateSaved: () => Promise<void> | void;
  /** Runs after the meal is logged; the editor is closed by the caller. */
  onLogged: () => Promise<void> | void;
}

/** State and actions for building, saving and logging a meal template. */
export function useSavedMealEditor({ draft, notify, onTemplateSaved, onLogged }: UseSavedMealEditorOptions) {
  const [savedId, setSavedId] = useState<number | null>(draft.id);
  const [name, setName] = useState(draft.name);
  const [ingredients, setIngredients] = useState<Ingredient[]>(draft.ingredients);
  const [newIngredient, setNewIngredient] = useState(EMPTY_NEW_INGREDIENT);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const isNew = savedId === null;
  const totals = roundMacros(sumIngredientMacros(ingredients));

  const updateWeight = (index: number, grams: number) =>
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, weight_g: grams } : ing)));

  const removeIngredient = (index: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== index));

  const patchNewIngredient = (patch: Partial<typeof EMPTY_NEW_INGREDIENT>) =>
    setNewIngredient((prev) => ({ ...prev, ...patch }));

  // Resolves macros for a freshly typed ingredient and adds it to the meal.
  const addIngredient = async () => {
    const ingredientName = newIngredient.name.trim();
    if (!ingredientName) return;
    setResolving(true);
    setNotice(null);
    try {
      const macros = await resolveIngredient({
        name: ingredientName,
        brand: newIngredient.brand.trim(),
        weight_g: newIngredient.weight,
      });
      setIngredients((prev) => [
        ...prev,
        {
          name: ingredientName,
          brand: newIngredient.brand.trim() || null,
          weight_g: newIngredient.weight,
          calories_per_100g: macros.calories_per_100g ?? 0,
          protein_per_100g: macros.protein_per_100g ?? 0,
          carbs_per_100g: macros.carbs_per_100g ?? 0,
          fat_per_100g: macros.fat_per_100g ?? 0,
        },
      ]);
      setNewIngredient(EMPTY_NEW_INGREDIENT);
    } catch (err) {
      setNotice({ tone: "error", text: getErrorMessage(err, "Failed to add ingredient.") });
    } finally {
      setResolving(false);
    }
  };

  const validationError = (): Notice | null => {
    if (!name.trim()) return { tone: "error", text: "Give this meal a name." };
    if (ingredients.length === 0) return { tone: "error", text: "Add at least one ingredient." };
    return null;
  };

  /** Creates the template, or updates it once it exists, and returns its id. */
  const persistTemplate = async () => {
    const payload = { name: name.trim(), ingredients };
    const saved = savedId === null ? await createSavedMeal(payload) : await updateSavedMeal(savedId, payload);
    setSavedId(saved.id);
    await onTemplateSaved();
    return saved.id;
  };

  const saveTemplate = async () => {
    const problem = validationError();
    if (problem) return setNotice(problem);
    setSaving(true);
    setNotice(null);
    try {
      await persistTemplate();
      setNotice({ tone: "success", text: "Meal saved." });
    } catch (err) {
      setNotice({ tone: "error", text: getErrorMessage(err, "Failed to save meal.") });
    } finally {
      setSaving(false);
    }
  };

  // Logs with the quantities currently in the editor. A brand-new meal is saved
  // as a template first; an existing one is logged without changing its template.
  const saveAndLog = async (onDone: () => void) => {
    const problem = validationError();
    if (problem) return setNotice(problem);
    setSaving(true);
    setNotice(null);
    notify.clear();
    try {
      const mealId = savedId ?? (await persistTemplate());
      const data = await logSavedMeal(mealId, ingredients);
      notify.success(`Logged "${data.name}" — ${Math.round(data.macros?.calories ?? 0)} kcal`);
      onDone();
      await onLogged();
    } catch (err) {
      setNotice({ tone: "error", text: getErrorMessage(err, "Failed to log meal.") });
    } finally {
      setSaving(false);
    }
  };

  return {
    isNew,
    name,
    setName,
    ingredients,
    newIngredient,
    patchNewIngredient,
    totals,
    saving,
    resolving,
    notice,
    updateWeight,
    removeIngredient,
    addIngredient,
    saveTemplate,
    saveAndLog,
  };
}
