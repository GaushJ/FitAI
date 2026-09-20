"use client";

import { useState } from "react";
import { BookMarked, FileSpreadsheet, Tag, Upload } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { SegmentedTabs, type TabItem } from "@/components/molecules/SegmentedTabs";
import { Modal } from "@/components/organisms/Modal";
import type { Notice } from "@/types/notice";
import { BrandByLabelForm } from "@/features/brand-preferences/components/BrandByLabelForm";
import { BrandByNameForm } from "@/features/brand-preferences/components/BrandByNameForm";
import { BrandExcelPanel } from "@/features/brand-preferences/components/BrandExcelPanel";
import { BrandPreferenceList } from "@/features/brand-preferences/components/BrandPreferenceList";
import type { useBrandPreferences } from "@/features/brand-preferences/hooks/useBrandPreferences";
import type { BrandIdentity } from "@/features/brand-preferences/types";

type BrandTab = "name" | "label" | "excel";

const TABS: TabItem<BrandTab>[] = [
  { id: "name", label: "By Name", icon: <Tag /> },
  { id: "label", label: "Label", icon: <Upload /> },
  { id: "excel", label: "Excel", icon: <FileSpreadsheet />, activeClassName: "bg-emerald-600 text-white shadow" },
];

interface BrandPreferencesModalProps {
  brands: ReturnType<typeof useBrandPreferences>;
  onClose: () => void;
}

export function BrandPreferencesModal({ brands, onClose }: BrandPreferencesModalProps) {
  const [tab, setTab] = useState<BrandTab>("name");
  // Ingredient + brand survive switching between the "By Name" and "Label" tabs.
  const [identity, setIdentity] = useState<BrandIdentity>({ ingredient: "", brand: "" });
  const [notice, setNotice] = useState<Notice | null>(null);

  const changeTab = (next: BrandTab) => {
    setTab(next);
    setNotice(null);
  };

  const formProps = { identity, onIdentityChange: setIdentity, onSaved: brands.refresh, onNotice: setNotice };

  return (
    <Modal
      title="Brand Preferences"
      icon={<BookMarked className="text-accent" />}
      subtitle="Save brand-specific macros. The AI will use these automatically every time you log that ingredient."
      onClose={onClose}
      bodyClassName="space-y-6"
    >
      <SegmentedTabs tabs={TABS} value={tab} onChange={changeTab} />

      {tab === "name" && <BrandByNameForm {...formProps} />}
      {tab === "label" && <BrandByLabelForm {...formProps} />}
      {tab === "excel" && (
        <BrandExcelPanel preferenceCount={brands.preferences.length} onImported={brands.refresh} />
      )}

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      {brands.preferences.length > 0 && (
        <BrandPreferenceList
          preferences={brands.preferences}
          onRemove={brands.remove}
          onChanged={brands.refresh}
        />
      )}

      {brands.preferences.length === 0 && tab !== "excel" && (
        <p className="py-2 text-center text-xs text-slate-600">No brand preferences saved yet.</p>
      )}
    </Modal>
  );
}
