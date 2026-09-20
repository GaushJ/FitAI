"use client";

import { useState } from "react";
import { Pencil, Tag, Trash2 } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { cn } from "@/lib/cn";
import { BrandPreferenceEditForm } from "@/features/brand-preferences/components/BrandPreferenceEditForm";
import type { BrandPreference } from "@/features/brand-preferences/types";

const hasMacros = (p: BrandPreference) =>
  Boolean(p.calories_per_100g || p.protein_per_100g || p.carbs_per_100g || p.fat_per_100g);

function MacroPills({ preference: p }: { preference: BrandPreference }) {
  const pills = [
    { label: "Cal", value: p.calories_per_100g, tone: MACRO_TEXT.calories },
    { label: "P", value: p.protein_per_100g, tone: MACRO_TEXT.protein },
    { label: "C", value: p.carbs_per_100g, tone: MACRO_TEXT.carbs },
    { label: "F", value: p.fat_per_100g, tone: MACRO_TEXT.fat },
  ];

  return (
    <div className="flex flex-wrap gap-2 px-3 pb-2">
      {pills.map(
        ({ label, value, tone }) =>
          value != null && (
            <span key={label} className="flex items-baseline gap-0.5 rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px]">
              <span className={cn("font-bold", tone)}>{label}</span>
              <span className="font-mono text-slate-400">{Number(value).toFixed(1)}</span>
            </span>
          ),
      )}
      <span className="self-center text-[9px] text-slate-600">/100{p.unit ?? "g"}</span>
    </div>
  );
}

interface BrandPreferenceListProps {
  preferences: BrandPreference[];
  onRemove: (ingredientName: string) => void;
  onChanged: () => Promise<void> | void;
}

export function BrandPreferenceList({ preferences, onRemove, onChanged }: BrandPreferenceListProps) {
  // Only one row is editable at a time.
  const [editingName, setEditingName] = useState<string | null>(null);

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Saved Preferences</p>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {preferences.map((pref) => {
          const editing = editingName === pref.ingredient_name;
          return (
            <div key={pref.ingredient_name} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="font-medium capitalize text-slate-300">{pref.ingredient_name}</span>
                  <span className="text-slate-600">→</span>
                  <span className="capitalize text-accent-light">{pref.preferred_brand}</span>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton
                    label="Edit macros"
                    size="sm"
                    onClick={() => setEditingName(editing ? null : pref.ingredient_name)}
                  >
                    <Pencil />
                  </IconButton>
                  <IconButton label="Remove preference" size="sm" variant="danger" onClick={() => onRemove(pref.ingredient_name)}>
                    <Trash2 />
                  </IconButton>
                </div>
              </div>

              {!editing && hasMacros(pref) && <MacroPills preference={pref} />}

              {editing && (
                <BrandPreferenceEditForm
                  preference={pref}
                  onSaved={async () => {
                    setEditingName(null);
                    await onChanged();
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
