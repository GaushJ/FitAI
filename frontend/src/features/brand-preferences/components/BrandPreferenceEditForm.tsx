"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { InlineNotice } from "@/components/atoms/InlineNotice";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { MacroFieldGrid } from "@/features/brand-preferences/components/MacroFieldGrid";
import { useBrandPreferenceEdit } from "@/features/brand-preferences/hooks/useBrandPreferenceEdit";
import type { BrandPreference } from "@/features/brand-preferences/types";

interface BrandPreferenceEditFormProps {
  preference: BrandPreference;
  onSaved: () => Promise<void> | void;
}

export function BrandPreferenceEditForm({ preference, onSaved }: BrandPreferenceEditFormProps) {
  const edit = useBrandPreferenceEdit(preference, onSaved);

  return (
    <div className="space-y-2 border-t border-slate-800 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Edit preference</p>

      <div className="grid grid-cols-2 gap-1.5">
        <FormField label="Ingredient" variant="micro">
          <Input size="xs" surface="raised" value={edit.name} onChange={(e) => edit.setName(e.target.value)} />
        </FormField>
        <FormField label="Brand" variant="micro">
          <Input size="xs" surface="raised" value={edit.brand} onChange={(e) => edit.setBrand(e.target.value)} />
        </FormField>
      </div>

      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Macros per 100g</p>
      <MacroFieldGrid compact values={edit.macros} onChange={edit.setMacro} />

      <Button
        size="xs"
        fullWidth
        icon={<Check />}
        loading={edit.saving}
        loadingText="Saving..."
        onClick={edit.save}
      >
        Save
      </Button>
      {edit.notice && <InlineNotice notice={edit.notice} />}
    </div>
  );
}
