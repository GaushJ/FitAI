"use client";

import { useState, type FormEvent } from "react";
import { resolveIngredient } from "@/features/ingredients/api";
import type { Notice } from "@/types/notice";
import { saveBrandPreference } from "@/features/brand-preferences/api";
import { macroDraftFrom, parseMacroDraft } from "@/features/brand-preferences/macros";
import type { BrandIdentity, MacroDraft } from "@/features/brand-preferences/types";

interface UseBrandByNameFormOptions {
  identity: BrandIdentity;
  onIdentityCleared: () => void;
  onSaved: () => Promise<void> | void;
  onNotice: (notice: Notice | null) => void;
}

/** "By Name" tab: auto-fetch an ingredient+brand's macros, let the user tweak them, then save. */
export function useBrandByNameForm({ identity, onIdentityCleared, onSaved, onNotice }: UseBrandByNameFormOptions) {
  const [macros, setMacros] = useState<MacroDraft | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ingredient = identity.ingredient.trim();
  const brand = identity.brand.trim();

  /** Fetched macros belong to one ingredient+brand pair, so editing it invalidates them. */
  const discardFetchedMacros = () => {
    setMacros(null);
    setFetchMessage(null);
  };

  const fetchMacros = async () => {
    if (!ingredient || !brand) return;
    setFetching(true);
    setFetchMessage(null);
    try {
      const data = await resolveIngredient({ name: ingredient, brand, weight_g: 100 });
      setMacros(macroDraftFrom(data));
      setFetchMessage("Macros fetched — edit if needed, then save.");
    } catch {
      setFetchMessage("Could not auto-fetch macros. Enter them manually.");
    } finally {
      setFetching(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ingredient || !brand) return;
    setSaving(true);
    onNotice(null);
    try {
      const parsed = macros ? parseMacroDraft(macros) : null;
      await saveBrandPreference({ ingredient_name: ingredient, preferred_brand: brand, ...parsed });
      onNotice({ tone: "success", text: `Saved "${brand} ${ingredient}" with macros.` });
      onIdentityCleared();
      discardFetchedMacros();
      await onSaved();
    } catch {
      onNotice({ tone: "error", text: "Failed to save brand preference." });
    } finally {
      setSaving(false);
    }
  };

  return { macros, setMacros, fetching, fetchMessage, saving, discardFetchedMacros, fetchMacros, submit };
}
