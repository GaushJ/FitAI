"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { macroActual } from "@/lib/nutrition";
import type { Notice } from "@/types/notice";
import { updateIngredient } from "@/features/meals/api";
import type { IngredientEditForm, IngredientEditTarget } from "@/features/meals/types";

const toNumber = (value: string) => Number(value) || 0;

/** Form state for correcting an already-logged ingredient's weight and per-100g macros. */
export function useIngredientEditForm(target: IngredientEditTarget, onSaved: () => Promise<void> | void) {
  const { ingredient } = target;
  const [form, setForm] = useState<IngredientEditForm>({
    weight_g: String(ingredient.weight_g ?? ""),
    calories_per_100g: String(ingredient.calories_per_100g ?? ""),
    protein_per_100g: String(ingredient.protein_per_100g ?? ""),
    carbs_per_100g: String(ingredient.carbs_per_100g ?? ""),
    fat_per_100g: String(ingredient.fat_per_100g ?? ""),
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const setField = (key: keyof IngredientEditForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const weight = toNumber(form.weight_g);
  const resulting = {
    calories: macroActual(toNumber(form.calories_per_100g), weight),
    protein: macroActual(toNumber(form.protein_per_100g), weight),
    carbs: macroActual(toNumber(form.carbs_per_100g), weight),
    fat: macroActual(toNumber(form.fat_per_100g), weight),
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await updateIngredient(target.mealId, target.index, {
        weight_g: weight,
        calories_per_100g: toNumber(form.calories_per_100g),
        protein_per_100g: toNumber(form.protein_per_100g),
        carbs_per_100g: toNumber(form.carbs_per_100g),
        fat_per_100g: toNumber(form.fat_per_100g),
      });
      await onSaved();
    } catch (err) {
      setNotice({ tone: "error", text: getErrorMessage(err, "Failed to update ingredient.") });
    } finally {
      setSaving(false);
    }
  };

  return { form, setField, resulting, saving, notice, save };
}
