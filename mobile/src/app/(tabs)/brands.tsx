import { useState } from "react";
import { View } from "react-native";
import { Camera, FileSpreadsheet, Hash } from "lucide-react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { Alert, Badge, Card, PageHeader, SegmentedTabs, type TabItem } from "@/components/ui";
import { useRemoteList } from "@/hooks/useRemoteList";
import { deleteBrandPreference, fetchBrandPreferences } from "@/features/brandPreferences/api";
import { BrandByLabelForm, BrandByNameForm, BrandExcelPanel, BrandPreferenceList } from "@/features/brandPreferences/components";
import type { BrandIdentity } from "@/features/brandPreferences/types";
import type { Notice } from "@/types/notice";

type BrandTab = "name" | "label" | "excel";

const TABS: TabItem<BrandTab>[] = [
  { id: "name", label: "By name", icon: Hash },
  { id: "label", label: "Label photo", icon: Camera },
  { id: "excel", label: "Excel (.xlsx)", icon: FileSpreadsheet },
];

/** Same layout and copy as web's BrandPreferencesScreen. */
export default function BrandPreferencesScreen() {
  const brands = useRemoteList(fetchBrandPreferences);
  const [tab, setTab] = useState<BrandTab>("name");
  // Ingredient + brand survive switching between the "By name" and "Label photo" tabs.
  const [identity, setIdentity] = useState<BrandIdentity>({ ingredient: "", brand: "" });
  const [notice, setNotice] = useState<Notice | null>(null);

  const changeTab = (next: BrandTab) => {
    setTab(next);
    setNotice(null);
  };

  const remove = async (ingredientName: string) => {
    try {
      await deleteBrandPreference(ingredientName);
      await brands.refresh();
    } catch {
      /* silent — the row simply stays (as on web) */
    }
  };

  const formProps = { identity, onIdentityChange: setIdentity, onSaved: brands.refresh, onNotice: setNotice };

  return (
    <AppScreen>
      <PageHeader
        eyebrow="Pantry rules"
        title="Brand preferences"
        titleAccessory={<Badge tone="muted">{`${brands.items.length} saved`}</Badge>}
        description="Save brand-specific macros. The AI uses them automatically every time you log that ingredient without naming a brand."
      />

      <Card className="gap-6">
        <SegmentedTabs tabs={TABS} value={tab} onChange={changeTab} fullWidth={false} />

        <View className="border-t border-line pt-6">
          {tab === "name" ? <BrandByNameForm {...formProps} /> : null}
          {tab === "label" ? <BrandByLabelForm {...formProps} /> : null}
          {tab === "excel" ? <BrandExcelPanel preferenceCount={brands.items.length} onImported={brands.refresh} /> : null}
        </View>

        {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
      </Card>

      <BrandPreferenceList preferences={brands.items} onRemove={remove} onChanged={brands.refresh} />
    </AppScreen>
  );
}
