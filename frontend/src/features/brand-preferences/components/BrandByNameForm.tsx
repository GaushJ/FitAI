"use client";

import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Notice } from "@/types/notice";
import { BrandIdentityFields } from "@/features/brand-preferences/components/BrandIdentityFields";
import { MacroFieldGrid } from "@/features/brand-preferences/components/MacroFieldGrid";
import { useBrandByNameForm } from "@/features/brand-preferences/hooks/useBrandByNameForm";
import type { BrandIdentity } from "@/features/brand-preferences/types";

interface BrandByNameFormProps {
  identity: BrandIdentity;
  onIdentityChange: (next: BrandIdentity) => void;
  onSaved: () => Promise<void> | void;
  onNotice: (notice: Notice | null) => void;
}

export function BrandByNameForm({ identity, onIdentityChange, onSaved, onNotice }: BrandByNameFormProps) {
  const form = useBrandByNameForm({
    identity,
    onIdentityCleared: () => onIdentityChange({ ingredient: "", brand: "" }),
    onSaved,
    onNotice,
  });
  const canFetch = Boolean(identity.ingredient.trim() && identity.brand.trim());

  return (
    <form onSubmit={form.submit} className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-400">
        Enter the ingredient and brand — macros are fetched automatically and can be edited before saving.
      </p>

      <BrandIdentityFields
        value={identity}
        onChange={(next) => {
          onIdentityChange(next);
          form.discardFetchedMacros();
        }}
      />

      <Button
        variant="secondary"
        size="sm"
        fullWidth
        className="font-semibold"
        icon={<Sparkles className="text-accent" />}
        loading={form.fetching}
        loadingText="Fetching macros..."
        disabled={!canFetch}
        onClick={form.fetchMacros}
      >
        Fetch Macros
      </Button>

      {form.fetchMessage && <p className="-mt-1 text-[10px] text-slate-500">{form.fetchMessage}</p>}

      {form.macros && (
        <div className="space-y-2 rounded-xl border border-accent/20 bg-slate-950 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-accent">
            Per 100g — edit if needed
          </p>
          <MacroFieldGrid
            values={form.macros}
            onChange={(key, value) => form.setMacros((m) => (m ? { ...m, [key]: value } : m))}
          />
        </div>
      )}

      <Button type="submit" fullWidth icon={<Plus />} loading={form.saving} loadingText="Saving...">
        Save Preference
      </Button>
    </form>
  );
}
