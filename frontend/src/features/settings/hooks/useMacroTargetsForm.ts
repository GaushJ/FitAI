"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { caloriesFromMacros, scaleMacrosToCalories } from "@/lib/nutrition";
import { calculateTargets, updateProfile } from "@/features/settings/api";
import { bodyDraftFrom, parseBodyDraft, type BodyDraft } from "@/features/settings/bodyProfile";
import type { TargetPlan, UserProfile } from "@/features/settings/types";

export type MacroKey = "protein" | "carbs" | "fat";

/** Target fields as strings so half-typed numbers are allowed. */
export interface TargetsDraft {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const toGrams = (draft: TargetsDraft) => ({
  protein: Number(draft.protein) || 0,
  carbs: Number(draft.carbs) || 0,
  fat: Number(draft.fat) || 0,
});

const draftFromPlan = (plan: TargetPlan): TargetsDraft => ({
  calories: String(plan.calories),
  protein: String(plan.protein),
  carbs: String(plan.carbs),
  fat: String(plan.fat),
});

/**
 * State behind "Adjust Macro Targets": body stats → suggested targets (server-side
 * formulas), plus manual tweaks that keep calories consistent with the macros.
 */
export function useMacroTargetsForm(profile: UserProfile, onSaved: () => Promise<void> | void) {
  const [name, setName] = useState(profile.name);
  const [body, setBody] = useState<BodyDraft>(() => bodyDraftFrom(profile));
  const [targets, setTargets] = useState<TargetsDraft>({
    calories: String(profile.target_calories),
    protein: String(profile.target_protein),
    carbs: String(profile.target_carbs),
    fat: String(profile.target_fat),
  });
  const [plan, setPlan] = useState<TargetPlan | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      if (!(typed > 0)) return { ...prev, calories: String(caloriesFromMacros(toGrams(prev))) };
      const grams = toGrams(prev);
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
      setTargets(draftFromPlan(result));
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't calculate targets."));
    } finally {
      setCalculating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const grams = toGrams(targets);
      await updateProfile({
        name,
        target_calories: Number(targets.calories) || caloriesFromMacros(grams),
        target_protein: grams.protein,
        target_carbs: grams.carbs,
        target_fat: grams.fat,
        ...bodyProfile,
      });
      await onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Error saving profile."));
    } finally {
      setSaving(false);
    }
  };

  return {
    name,
    setName,
    body,
    setBodyField,
    bodyProfile,
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
