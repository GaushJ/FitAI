import type { ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { MACRO_TEXT } from "@/lib/macroStyles";
import type { ExtractedLabel, LabelUnit } from "@/features/brand-preferences/types";

interface UnitToggleProps {
  value: LabelUnit;
  onChange: (unit: LabelUnit) => void;
}

/** g / ml switch for the unit printed on the label. */
export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div className="flex shrink-0 items-center gap-3 font-mono text-xs uppercase tracking-widest text-ink-muted">
      Base
      <div className="flex border border-line bg-surface-container p-0.5">
        {(["g", "ml"] as const).map((unit) => (
          <button
            key={unit}
            type="button"
            aria-pressed={value === unit}
            onClick={() => onChange(unit)}
            className={cn(
              "cursor-pointer px-3 py-1 lowercase transition",
              value === unit ? "bg-ink text-white" : "text-ink-muted hover:text-ink",
            )}
          >
            {unit}
          </button>
        ))}
      </div>
      <span className="lowercase">per 100{value}</span>
    </div>
  );
}

interface LabelDropzoneProps {
  preview: string;
  onSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}

/** Click-to-upload area that previews the chosen nutrition-label photo. */
export function LabelDropzone({ preview, onSelect }: LabelDropzoneProps) {
  return (
    <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-line-strong bg-surface-low p-4 transition hover:border-ink">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data-URL preview of a user upload; nothing to optimise
        <img src={preview} alt="Label preview" className="max-h-36 object-contain" />
      ) : (
        <>
          <Upload className="size-7 text-ink-muted" />
          <p className="text-center text-sm text-ink-muted">
            Click to upload a nutrition label photo
            <span className="block font-mono text-[11px] text-ink-subtle">JPG, PNG or WEBP</span>
          </p>
        </>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={onSelect} />
    </label>
  );
}

const EXTRACTED_FIELDS = [
  { label: "kcal", key: "calories_per_100g", tone: MACRO_TEXT.calories },
  { label: "Protein", key: "protein_per_100g", tone: MACRO_TEXT.protein },
  { label: "Carbs", key: "carbs_per_100g", tone: MACRO_TEXT.carbs },
  { label: "Fat", key: "fat_per_100g", tone: MACRO_TEXT.fat },
] as const;

/** The macros vision read off the label, per 100 g / ml. */
export function ExtractedMacrosPreview({ extracted }: { extracted: ExtractedLabel }) {
  return (
    <div className="grid grid-cols-2 gap-3 border border-success bg-success-soft p-4 text-center sm:grid-cols-4">
      {EXTRACTED_FIELDS.map(({ label, key, tone }) => (
        <div key={key}>
          <p className={cn("font-display text-2xl font-bold", tone)}>{extracted.macros[key]}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            {label}/100{extracted.unit}
          </p>
        </div>
      ))}
    </div>
  );
}
