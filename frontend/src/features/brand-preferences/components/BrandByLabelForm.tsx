"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Notice } from "@/types/notice";
import { BrandIdentityFields } from "@/features/brand-preferences/components/BrandIdentityFields";
import {
  ExtractedMacrosPreview,
  LabelDropzone,
  UnitToggle,
} from "@/features/brand-preferences/components/LabelUpload";
import { useBrandByLabelForm } from "@/features/brand-preferences/hooks/useBrandByLabelForm";
import type { BrandIdentity } from "@/features/brand-preferences/types";

interface BrandByLabelFormProps {
  identity: BrandIdentity;
  onIdentityChange: (next: BrandIdentity) => void;
  onSaved: () => Promise<void> | void;
  onNotice: (notice: Notice | null) => void;
}

export function BrandByLabelForm({ identity, onIdentityChange, onSaved, onNotice }: BrandByLabelFormProps) {
  const form = useBrandByLabelForm({
    identity,
    onIdentityCleared: () => onIdentityChange({ ingredient: "", brand: "" }),
    onSaved,
    onNotice,
  });

  return (
    <form onSubmit={form.submit} className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-400">
        Photo the nutrition facts panel on the back of the pack. Claude will read the exact values and save
        them — no more guessing.
      </p>

      <BrandIdentityFields value={identity} onChange={onIdentityChange} />
      <UnitToggle value={form.unit} onChange={form.setUnit} />
      <LabelDropzone preview={form.preview} onSelect={form.selectFile} />
      {form.extracted && <ExtractedMacrosPreview extracted={form.extracted} />}

      <Button
        type="submit"
        fullWidth
        icon={<Sparkles />}
        loading={form.saving}
        loadingText="Extracting..."
        disabled={!form.file}
      >
        Extract &amp; Save Label
      </Button>
    </form>
  );
}
