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
    <div className="space-y-4 border-t border-line bg-surface-low p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Ingredient">
          <Input size="sm" value={edit.name} onChange={(e) => edit.setName(e.target.value)} />
        </FormField>
        <FormField label="Brand">
          <Input size="sm" value={edit.brand} onChange={(e) => edit.setBrand(e.target.value)} />
        </FormField>
      </div>

      <MacroFieldGrid compact values={edit.macros} onChange={edit.setMacro} />

      <div className="flex items-center justify-between gap-3">
        {edit.notice ? <InlineNotice notice={edit.notice} /> : <span />}
        <Button size="sm" icon={<Check />} loading={edit.saving} loadingText="Saving..." onClick={edit.save}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
