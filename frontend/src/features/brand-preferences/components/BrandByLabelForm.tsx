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
    <form onSubmit={form.submit} className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl text-sm text-ink-muted">
          Photograph the nutrition table on the back of the pack. Claude reads the exact values and saves them.
        </p>
        <UnitToggle value={form.unit} onChange={form.setUnit} />
      </div>

      <BrandIdentityFields value={identity} onChange={onIdentityChange} />
      <LabelDropzone preview={form.preview} onSelect={form.selectFile} />
      {form.extracted && <ExtractedMacrosPreview extracted={form.extracted} />}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          icon={<Sparkles />}
          loading={form.saving}
          loadingText="Extracting..."
          disabled={!form.file}
        >
          Extract &amp; save label
        </Button>
      </div>
    </form>
  );
}
