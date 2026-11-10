import { useState } from "react";
import { Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { Download, Upload } from "lucide-react-native";
import { Alert, Button } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/nutrition";
import type { Notice } from "@/types/notice";
import { exportBrandPreferences, importBrandPreferences } from "../api";

// Port of web's BrandExcelPanel. Export goes to the share sheet (save to Files, email, Drive…)
// instead of a browser download; import uses the system document picker.
const EXPECTED_COLUMNS = ["Ingredient", "Brand", "Calories/100g", "Protein/100g", "Carbs/100g", "Fat/100g"];
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function ActionCard({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <View className="gap-3 border border-line bg-surface-low p-4">
      <View>
        <Text className="font-display-semibold text-lg uppercase text-ink">{title}</Text>
        <Text className="mt-0.5 font-sans text-sm text-ink-muted">{description}</Text>
      </View>
      {action}
    </View>
  );
}

interface BrandExcelPanelProps {
  preferenceCount: number;
  onImported: () => Promise<void> | void;
}

/** "Excel" tab: bulk export / import of brand preferences as a spreadsheet. */
export function BrandExcelPanel({ preferenceCount, onImported }: BrandExcelPanelProps) {
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleExport = async () => {
    try {
      const file = await exportBrandPreferences();
      await Sharing.shareAsync(file.uri, { mimeType: XLSX_MIME, UTI: "org.openxmlformats.spreadsheetml.sheet" });
    } catch {
      setNotice({ tone: "error", text: "Failed to download Excel file." });
    }
  };

  const handleImport = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: [XLSX_MIME], copyToCacheDirectory: true });
    const file = picked.canceled ? null : picked.assets[0];
    if (!file) return;
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
    <View className="gap-4">
      <Text className="font-sans text-sm text-ink-muted">
        Download your brand preferences as a spreadsheet, edit it offline, then re-upload to restore or bulk-add preferences in
        one go.
      </Text>

      <ActionCard
        title="Export"
        description={`Downloads all ${pluralize(preferenceCount, "saved brand")} with their nutrition data as .xlsx.`}
        action={
          <Button variant="outline" icon={Download} disabled={preferenceCount === 0} onPress={handleExport}>
            Export .xlsx
          </Button>
        }
      />

      <ActionCard
        title="Import"
        description="Upload a .xlsx in the same format to bulk-set preferences and nutrition data."
        action={
          <Button variant="dark" icon={Upload} loading={importing} loadingText="Importing..." onPress={handleImport}>
            Import .xlsx
          </Button>
        }
      />

      <View className="border border-line p-4">
        <Text className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">Expected columns</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {EXPECTED_COLUMNS.map((column, i) => (
            <View key={column} className={`w-[48%] px-1 py-1.5 ${i < 2 ? "bg-ink" : "border border-line bg-surface-low"}`}>
              <Text className={`text-center font-mono text-[11px] ${i < 2 ? "text-white" : "text-ink-muted"}`}>{column}</Text>
            </View>
          ))}
        </View>
        <Text className="mt-2 font-sans text-xs text-ink-muted">
          Columns A–B are required. C–F are optional — fill them to also update the ingredient cache.
        </Text>
      </View>

      {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
    </View>
  );
}
