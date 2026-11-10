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

function ActionCard({ title, description, action }: { title: string; description: string; action: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-3 border border-line bg-surface-low p-4 sm:flex-row sm:items-center sm:gap-6">
      <div>
        <p className="font-display text-lg font-semibold uppercase text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
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
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Download your brand preferences as a spreadsheet, edit it offline, then re-upload to restore or bulk-add
        preferences in one go.
      </p>

      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />

      <ActionCard
        title="Export"
        description={`Downloads all ${pluralize(preferenceCount, "saved brand")} with their nutrition data as .xlsx.`}
        action={
          <Button variant="outline" icon={<Download />} disabled={preferenceCount === 0} onClick={handleExport}>
            Export .xlsx
          </Button>
        }
      />

      <ActionCard
        title="Import"
        description="Upload a .xlsx in the same format to bulk-set preferences and nutrition data."
        action={
          <Button
            variant="dark"
            icon={<Upload />}
            loading={importing}
            loadingText="Importing..."
            onClick={() => fileInputRef.current?.click()}
          >
            Import .xlsx
          </Button>
        }
      />

      <div className="border border-line p-4">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">Expected columns</p>
        <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-[11px] sm:grid-cols-3 lg:grid-cols-6">
          {EXPECTED_COLUMNS.map((column, i) => (
            <div
              key={column}
              className={cn("px-1 py-1.5", i < 2 ? "bg-ink text-white" : "border border-line bg-surface-low text-ink-muted")}
            >
              {column}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Columns A–B are required. C–F are optional — fill them to also update the ingredient cache.
        </p>
      </div>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
    </div>
  );
}
