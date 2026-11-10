"use client";

import { useState } from "react";
import { ArrowRight, Pencil, Search, Tag, Trash2 } from "lucide-react";
import { IconButton } from "@/components/atoms/IconButton";
import { EmptyState } from "@/components/molecules/EmptyState";
import { cn } from "@/lib/cn";
import { MACRO_TEXT } from "@/lib/macroStyles";
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
    <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
      {pills.map(
        ({ label, value, tone }) =>
          value != null && (
            <span key={label} className="flex gap-1.5 border border-line bg-surface-low px-2 py-1">
              <span className={cn("font-medium", tone)}>{label}</span>
              <span className="text-ink">{Number(value).toFixed(1)}</span>
            </span>
          ),
      )}
      <span className="text-ink-muted">/100{p.unit ?? "g"}</span>
    </div>
  );
}

const matches = (p: BrandPreference, query: string) =>
  `${p.ingredient_name} ${p.preferred_brand}`.toLowerCase().includes(query.trim().toLowerCase());

interface BrandPreferenceListProps {
  preferences: BrandPreference[];
  onRemove: (ingredientName: string) => void;
  onChanged: () => Promise<void> | void;
}

/** Searchable registry of saved brand preferences, each editable in place. */
export function BrandPreferenceList({ preferences, onRemove, onChanged }: BrandPreferenceListProps) {
  // Only one row is editable at a time.
  const [editingName, setEditingName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const visible = preferences.filter((p) => matches(p, query));

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">{"// "}Saved registry</p>
          <h2 className="font-display text-2xl font-semibold uppercase tracking-tight text-ink">Saved preferences</h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Filter preferences</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              placeholder="Filter by ingredient or brand…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-ink bg-card py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
            />
          </label>
          <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-ink-muted">{visible.length} listed</span>
        </div>
      </div>

      {preferences.length === 0 ? (
        <EmptyState icon={<Tag />} title="No brand preferences yet">
          Add one above — by name, from a label photo, or by importing a spreadsheet.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {visible.map((pref, index) => {
            const editing = editingName === pref.ingredient_name;
            return (
              <li key={pref.ingredient_name} className={cn("border bg-card", editing ? "border-ink" : "border-line")}>
                <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="font-mono text-sm text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
                    <Tag className="size-5 shrink-0 text-ink-muted" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg font-semibold uppercase text-ink">{pref.ingredient_name}</span>
                        <ArrowRight className="size-4 text-ink-muted" />
                        <span className="font-semibold capitalize text-primary">{pref.preferred_brand}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    {hasMacros(pref) ? (
                      <MacroPills preference={pref} />
                    ) : (
                      <span className="font-mono text-xs text-ink-subtle">No macros saved</span>
                    )}
                    <div className="flex shrink-0 gap-1">
                      <IconButton
                        label={editing ? "Close editor" : "Edit preference"}
                        onClick={() => setEditingName(editing ? null : pref.ingredient_name)}
                      >
                        <Pencil />
                      </IconButton>
                      <IconButton label="Remove preference" variant="danger" onClick={() => onRemove(pref.ingredient_name)}>
                        <Trash2 />
                      </IconButton>
                    </div>
                  </div>
                </div>

                {editing && (
                  <BrandPreferenceEditForm
                    preference={pref}
                    onSaved={async () => {
                      setEditingName(null);
                      await onChanged();
                    }}
                  />
                )}
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="py-6 text-center text-sm text-ink-muted">No preferences match &ldquo;{query}&rdquo;.</li>
          )}
        </ul>
      )}
    </section>
  );
}
