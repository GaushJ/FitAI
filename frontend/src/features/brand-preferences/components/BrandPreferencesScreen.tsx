"use client";

import { useState } from "react";
import { Camera, FileSpreadsheet, Hash } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/atoms/Card";
import { SegmentedTabs, type TabItem } from "@/components/molecules/SegmentedTabs";
import type { Notice } from "@/types/notice";
import { PageHeader } from "@/features/app-shell/components/PageHeader";
import { BrandByLabelForm } from "@/features/brand-preferences/components/BrandByLabelForm";
import { BrandByNameForm } from "@/features/brand-preferences/components/BrandByNameForm";
import { BrandExcelPanel } from "@/features/brand-preferences/components/BrandExcelPanel";
import { BrandPreferenceList } from "@/features/brand-preferences/components/BrandPreferenceList";
import { useBrandPreferences } from "@/features/brand-preferences/hooks/useBrandPreferences";
import type { BrandIdentity } from "@/features/brand-preferences/types";

type BrandTab = "name" | "label" | "excel";

const TABS: TabItem<BrandTab>[] = [
  { id: "name", label: "By name", icon: <Hash /> },
  { id: "label", label: "Label photo", icon: <Camera /> },
  { id: "excel", label: "Excel (.xlsx)", icon: <FileSpreadsheet /> },
];

export function BrandPreferencesScreen() {
  const brands = useBrandPreferences();
  const [tab, setTab] = useState<BrandTab>("name");
  // Ingredient + brand survive switching between the "By name" and "Label photo" tabs.
  const [identity, setIdentity] = useState<BrandIdentity>({ ingredient: "", brand: "" });
  const [notice, setNotice] = useState<Notice | null>(null);

  const changeTab = (next: BrandTab) => {
    setTab(next);
    setNotice(null);
  };

  const formProps = { identity, onIdentityChange: setIdentity, onSaved: brands.refresh, onNotice: setNotice };

  return (
    <>
      <PageHeader
        eyebrow="Pantry rules"
        title={
          <span className="flex flex-wrap items-center gap-3">
            Brand preferences <Badge tone="muted">{brands.preferences.length} saved</Badge>
          </span>
        }
        description="Save brand-specific macros. The AI uses them automatically every time you log that ingredient without naming a brand."
      />

      <Card className="space-y-6">
        <div className="overflow-x-auto">
          <SegmentedTabs tabs={TABS} value={tab} onChange={changeTab} fullWidth={false} />
        </div>

        <div className="border-t border-line pt-6">
          {tab === "name" && <BrandByNameForm {...formProps} />}
          {tab === "label" && <BrandByLabelForm {...formProps} />}
          {tab === "excel" && (
            <BrandExcelPanel preferenceCount={brands.preferences.length} onImported={brands.refresh} />
          )}
        </div>

        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      </Card>

      <BrandPreferenceList preferences={brands.preferences} onRemove={brands.remove} onChanged={brands.refresh} />
    </>
  );
}
