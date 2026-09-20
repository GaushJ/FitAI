import type { ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ExtractedLabel, LabelUnit } from "@/features/brand-preferences/types";

interface UnitToggleProps {
  value: LabelUnit;
  onChange: (unit: LabelUnit) => void;
}

/** g / ml switch for the unit printed on the label. */
export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit</span>
      <div className="flex overflow-hidden rounded-lg border border-slate-700">
        {(["g", "ml"] as const).map((unit) => (
          <button
            key={unit}
            type="button"
            onClick={() => onChange(unit)}
            className={cn(
              "cursor-pointer px-3 py-1 text-xs font-semibold transition",
              value === unit ? "bg-accent text-ink" : "bg-slate-900 text-slate-400 hover:text-slate-200",
            )}
          >
            {unit}
          </button>
        ))}
      </div>
      <span className="text-[10px] text-slate-600">per 100{value}</span>
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
    <label className="relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 p-4 transition hover:border-accent">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data-URL preview of a user upload; nothing to optimise
        <img src={preview} alt="Label preview" className="max-h-32 rounded-lg object-contain" />
      ) : (
        <>
          <Upload className="h-8 w-8 text-slate-600" />
          <p className="text-center text-xs text-slate-500">
            Click to upload nutrition label photo
            <br />
            <span className="text-[10px] text-slate-600">JPG, PNG or WEBP</span>
          </p>
        </>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={onSelect} />
    </label>
  );
}

const EXTRACTED_FIELDS = [
  { label: "kcal", key: "calories_per_100g", tone: "text-orange-400" },
  { label: "Protein", key: "protein_per_100g", tone: "text-accent" },
  { label: "Carbs", key: "carbs_per_100g", tone: "text-accent" },
  { label: "Fat", key: "fat_per_100g", tone: "text-rose-400" },
] as const;

/** The macros vision read off the label, per 100 g / ml. */
export function ExtractedMacrosPreview({ extracted }: { extracted: ExtractedLabel }) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-center">
      {EXTRACTED_FIELDS.map(({ label, key, tone }) => (
        <div key={key}>
          <p className={cn("text-sm font-bold", tone)}>{extracted.macros[key]}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">
            {label}/100{extracted.unit}
          </p>
        </div>
      ))}
    </div>
  );
}
