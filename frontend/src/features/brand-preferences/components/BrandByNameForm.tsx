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
    <form onSubmit={form.submit} className="space-y-5">
      <p className="text-sm text-ink-muted">
        Enter the ingredient and brand — macros are fetched automatically and can be edited before saving.
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <BrandIdentityFields
          value={identity}
          onChange={(next) => {
            onIdentityChange(next);
            form.discardFetchedMacros();
          }}
        />
        <Button
          variant="outline"
          className="lg:w-40 lg:py-[11px]"
          icon={<Sparkles className="text-primary" />}
          loading={form.fetching}
          loadingText="Fetching..."
          disabled={!canFetch}
          onClick={form.fetchMacros}
        >
          Fetch
        </Button>
      </div>

      {form.fetchMessage && <p className="font-mono text-xs text-ink-muted">{form.fetchMessage}</p>}

      {form.macros && (
        <div className="border border-line bg-surface-low p-4">
          <p className="mb-3 flex justify-between font-mono text-xs uppercase tracking-widest text-ink">
            {"// "}Nutrition per 100g <span className="text-ink-muted">Editable</span>
          </p>
          <MacroFieldGrid
            values={form.macros}
            onChange={(key, value) => form.setMacros((m) => (m ? { ...m, [key]: value } : m))}
          />
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" icon={<Plus />} loading={form.saving} loadingText="Saving...">
          Save preference
        </Button>
      </div>
    </form>
  );
}
