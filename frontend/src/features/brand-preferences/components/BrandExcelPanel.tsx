"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Download, Upload } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/download";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/nutrition";
import type { Notice } from "@/types/notice";
import { exportBrandPreferences, importBrandPreferences } from "@/features/brand-preferences/api";

const EXPECTED_COLUMNS = ["Ingredient", "Brand", "Calories/100g", "Protein/100g", "Carbs/100g", "Fat/100g"];

interface ActionCardProps {
  title: ReactNode;
  description: string;
  borderClassName: string;
  action: ReactNode;
}

function ActionCard({ title, description, borderClassName, action }: ActionCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-3 rounded-2xl border bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:gap-4",
        borderClassName,
      )}
    >
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">{title}</p>
        <p className="mt-0.5 text-[10px] text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

interface BrandExcelPanelProps {
  preferenceCount: number;
  onImported: () => Promise<void> | void;
}

/** "Excel" tab: bulk export / import of brand preferences as a spreadsheet. */
export function BrandExcelPanel({ preferenceCount, onImported }: BrandExcelPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleExport = async () => {
    try {
      const { blob, filename } = await exportBrandPreferences();
      downloadBlob(blob, filename);
    } catch {
      setNotice({ tone: "error", text: "Failed to download Excel file." });
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting the same file
    setImporting(true);
    setNotice(null);
    try {
      const { message, warnings } = await importBrandPreferences(file);
      const warned = warnings?.length ? `  ⚠️ ${warnings.length} warning(s).` : "";
      setNotice({ tone: "success", text: `${message}${warned}` });
      await onImported();
    } catch (err) {
      setNotice({ tone: "error", text: getErrorMessage(err, "Failed to import Excel file.") });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-slate-400">
        Download your current brand preferences as a spreadsheet, edit it offline, then re-upload to restore or
        bulk-add preferences in one go.
      </p>

      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />

      <ActionCard
        borderClassName="border-emerald-900/40"
        title={
          <>
            <span className="text-emerald-400">↓</span> Download Preferences
          </>
        }
        description={`Exports all ${pluralize(preferenceCount, "saved brand")} with their nutrition data as a styled .xlsx file.`}
        action={
          <Button
            variant="success"
            size="sm"
            className="w-full px-4 py-2 shadow sm:w-auto"
            icon={<Download />}
            disabled={preferenceCount === 0}
            onClick={handleExport}
          >
            Export .xlsx
          </Button>
        }
      />

      <ActionCard
        borderClassName="border-accent/15"
        title={
          <>
            <span className="text-accent">↑</span> Upload &amp; Restore
          </>
        }
        description="Upload a .xlsx file in the same format to bulk-set preferences and nutrition data in one step."
        action={
          <Button
            size="sm"
            className="w-full px-4 py-2 shadow sm:w-auto"
            icon={<Upload />}
            loading={importing}
            loadingText="Importing..."
            onClick={() => fileInputRef.current?.click()}
          >
            Import .xlsx
          </Button>
        }
      />

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Expected columns</p>
        <div className="grid grid-cols-3 gap-1 text-center text-[9px] sm:grid-cols-6">
          {EXPECTED_COLUMNS.map((column, i) => (
            <div
              key={column}
              className={cn(
                "rounded px-1 py-1 font-mono font-bold",
                i < 2
                  ? "border border-accent/15 bg-accent/10 text-accent-light"
                  : "border border-slate-800 bg-slate-950 text-slate-400",
              )}
            >
              {column}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-600">
          Columns A–B are required. C–F are optional — fill them to also update the ingredient cache.
        </p>
      </div>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
    </div>
  );
}
