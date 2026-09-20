import { useEffect, useState } from "react";
import { calculateTargets, updateUser } from "./api";
import { bodyDraftFrom, parseBodyDraft, type BodyDraft } from "./bodyProfile";
import { caloriesFromMacros, scaleMacrosToCalories } from "./macros";
import type { TargetPlan, UserSettings } from "./types";

export type MacroKey = "protein" | "carbs" | "fat";

/** Target fields as strings so half-typed numbers are allowed. */
export interface TargetsDraft {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const targetsDraftFrom = (values: UserSettings): TargetsDraft => ({
  calories: String(values.target_calories),
  protein: String(values.target_protein),
  carbs: String(values.target_carbs),
  fat: String(values.target_fat),
});

const toGrams = (draft: TargetsDraft) => ({
  protein: Number(draft.protein) || 0,
  carbs: Number(draft.carbs) || 0,
  fat: Number(draft.fat) || 0,
});

/**
 * State behind the Settings sheet: body stats → suggested targets (server-side formulas),
 * plus manual tweaks that keep calories consistent with the macros.
 */
export function useTargetsForm(initialValues: UserSettings, onSaved: (updated: UserSettings) => void) {
  const [name, setName] = useState(initialValues.name);
  const [body, setBody] = useState<BodyDraft>(() => bodyDraftFrom(initialValues));
  const [targets, setTargets] = useState<TargetsDraft>(() => targetsDraftFrom(initialValues));
  const [plan, setPlan] = useState<TargetPlan | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Re-sync whenever the sheet is reopened with fresh values from the dashboard.
  useEffect(() => {
    setName(initialValues.name);
    setBody(bodyDraftFrom(initialValues));
    setTargets(targetsDraftFrom(initialValues));
    setPlan(null);
    setError("");
  }, [initialValues]);

  const bodyProfile = parseBodyDraft(body);

  const setBodyField = <K extends keyof BodyDraft>(key: K, value: BodyDraft[K]) => {
    setBody((prev) => ({ ...prev, [key]: value }));
    setPlan(null); // the suggestion no longer matches the inputs
  };

  /** Editing a macro re-derives calories from Atwater's 4/4/9 factors. */
  const setMacro = (key: MacroKey, value: string) =>
    setTargets((prev) => {
      const next = { ...prev, [key]: value };
      return { ...next, calories: String(caloriesFromMacros(toGrams(next))) };
    });

  const setCaloriesText = (value: string) => setTargets((prev) => ({ ...prev, calories: value }));

  /** Called when the calories field loses focus: rescale the macros to match, keeping their ratios. */
  const commitCalories = () =>
    setTargets((prev) => {
      const typed = Number(prev.calories);
      const grams = toGrams(prev);
      if (!(typed > 0)) return { ...prev, calories: String(caloriesFromMacros(grams)) };
      if (caloriesFromMacros(grams) === 0) return prev; // nothing to scale
      const scaled = scaleMacrosToCalories(grams, typed);
      return {
        calories: String(caloriesFromMacros(scaled)),
        protein: String(scaled.protein),
        carbs: String(scaled.carbs),
        fat: String(scaled.fat),
      };
    });

  const calculate = async () => {
    if (!bodyProfile) return;
    setCalculating(true);
    setError("");
    try {
      const result = await calculateTargets(bodyProfile);
      setPlan(result);
      setTargets({
        calories: String(result.calories),
        protein: String(result.protein),
        carbs: String(result.carbs),
        fat: String(result.fat),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't calculate targets.");
    } finally {
      setCalculating(false);
    }
  };

  /** Resolves to true when saved, so the caller can dismiss the sheet. */
  const save = async (): Promise<boolean> => {
    setError("");
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return false;
    }
    const values = {
      target_calories: Number(targets.calories),
      target_protein: Number(targets.protein),
      target_carbs: Number(targets.carbs),
      target_fat: Number(targets.fat),
    };
    if (Object.values(values).some((v) => Number.isNaN(v) || v < 0)) {
      setError("Targets must be valid, non-negative numbers.");
      return false;
    }
    setSaving(true);
    try {
      const result = await updateUser({ name: trimmedName, ...values, ...bodyProfile });
      onSaved(result.user);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    name,
    setName,
    body,
    setBodyField,
    canCalculate: bodyProfile !== null,
    targets,
    setMacro,
    setCaloriesText,
    commitCalories,
    plan,
    calculating,
    calculate,
    saving,
    save,
    error,
  };
}
