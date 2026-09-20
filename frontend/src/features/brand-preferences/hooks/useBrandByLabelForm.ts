"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { getErrorMessage } from "@/lib/errors";
import type { Notice } from "@/types/notice";
import { extractBrandLabel } from "@/features/brand-preferences/api";
import type { BrandIdentity, ExtractedLabel, LabelUnit } from "@/features/brand-preferences/types";

interface UseBrandByLabelFormOptions {
  identity: BrandIdentity;
  onIdentityCleared: () => void;
  onSaved: () => Promise<void> | void;
  onNotice: (notice: Notice | null) => void;
}

/** "Label" tab: upload a nutrition-facts photo and let vision read the exact macros. */
export function useBrandByLabelForm({ identity, onIdentityCleared, onSaved, onNotice }: UseBrandByLabelFormOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [unit, setUnit] = useState<LabelUnit>("g");
  const [extracted, setExtracted] = useState<ExtractedLabel | null>(null);
  const [saving, setSaving] = useState(false);

  const ingredient = identity.ingredient.trim();
  const brand = identity.brand.trim();

  const selectFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setExtracted(null);
    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ingredient || !brand || !file) return;
    setSaving(true);
    onNotice(null);
    setExtracted(null);
    try {
      const data = await extractBrandLabel({ ingredient, brand, image: file, unit });
      setExtracted({ macros: data.macros, unit: data.unit || "g" });
      onNotice({
        tone: "success",
        text: `Label read! Exact macros for "${brand} ${ingredient}" saved permanently.`,
      });
      onIdentityCleared();
      setFile(null);
      setPreview("");
      setUnit("g");
      await onSaved();
    } catch (err) {
      onNotice({ tone: "error", text: getErrorMessage(err, "Failed to extract label.") });
    } finally {
      setSaving(false);
    }
  };

  return { file, preview, unit, setUnit, extracted, saving, selectFile, submit };
}
