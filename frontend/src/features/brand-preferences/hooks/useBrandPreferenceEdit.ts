"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import type { Notice } from "@/types/notice";
import { renameBrandPreference, updateBrandPreferenceMacros } from "@/features/brand-preferences/api";
import { macroDraftFrom, parseMacroDraft } from "@/features/brand-preferences/macros";
import type { BrandPreference, MacroDraft } from "@/features/brand-preferences/types";

/** Inline edit of one saved preference: rename ingredient/brand and/or correct its macros. */
export function useBrandPreferenceEdit(pref: BrandPreference, onSaved: () => Promise<void> | void) {
  const [name, setName] = useState(pref.ingredient_name);
  const [brand, setBrand] = useState(pref.preferred_brand);
  const [macros, setMacros] = useState<MacroDraft>(() => macroDraftFrom(pref));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const setMacro = (key: keyof MacroDraft, value: string) => setMacros((m) => ({ ...m, [key]: value }));

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const newName = name.trim();
      const newBrand = brand.trim();
      const nameChanged = newName.toLowerCase() !== pref.ingredient_name.toLowerCase();
      const brandChanged = newBrand.toLowerCase() !== pref.preferred_brand?.toLowerCase();

      if (nameChanged || brandChanged) {
        await renameBrandPreference(pref.ingredient_name, { new_ingredient_name: newName, new_brand: newBrand });
      }

      const parsed = parseMacroDraft(macros);
      if (parsed) {
        await updateBrandPreferenceMacros(nameChanged ? newName : pref.ingredient_name, parsed);
      }

      await onSaved();
    } catch (err) {
      setNotice({ tone: "error", text: getErrorMessage(err, "Failed to save.") });
    } finally {
      setSaving(false);
    }
  };

  return { name, setName, brand, setBrand, macros, setMacro, saving, notice, save };
}
