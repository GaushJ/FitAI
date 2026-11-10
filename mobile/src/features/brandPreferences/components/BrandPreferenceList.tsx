import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { ArrowRight, Check, Pencil, Search, Tag, Trash2 } from "lucide-react-native";
import { Button, EmptyState, FormField, IconButton, InlineNotice, Input } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { colors } from "@/theme/colors";
import type { Notice } from "@/types/notice";
import { renameBrandPreference, updateBrandPreferenceMacros } from "../api";
import { macroDraftFrom, parseMacroDraft } from "../macros";
import type { BrandPreference, MacroDraft } from "../types";
import { MacroFieldGrid } from "./fields";

// Port of web's BrandPreferenceList + BrandPreferenceEditForm + useBrandPreferenceEdit.

const hasMacros = (p: BrandPreference) => Boolean(p.calories_per_100g || p.protein_per_100g || p.carbs_per_100g || p.fat_per_100g);

function MacroPills({ preference: p }: { preference: BrandPreference }) {
  const pills = [
    { label: "Cal", value: p.calories_per_100g, tone: MACRO_TEXT.calories },
    { label: "P", value: p.protein_per_100g, tone: MACRO_TEXT.protein },
    { label: "C", value: p.carbs_per_100g, tone: MACRO_TEXT.carbs },
    { label: "F", value: p.fat_per_100g, tone: MACRO_TEXT.fat },
  ];

  return (
    <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
      {pills.map(({ label, value, tone }) =>
        value != null ? (
          <View key={label} className="flex-row gap-1.5 border border-line bg-surface-low px-2 py-1">
            <Text className={`font-mono-medium text-xs ${tone}`}>{label}</Text>
            <Text className="font-mono text-xs text-ink">{Number(value).toFixed(1)}</Text>
          </View>
        ) : null
      )}
      <Text className="font-mono text-xs text-ink-muted">/100{p.unit ?? "g"}</Text>
    </View>
  );
}

/** Inline edit of one saved preference: rename ingredient/brand and/or correct its macros. */
function BrandPreferenceEditForm({ preference: pref, onSaved }: { preference: BrandPreference; onSaved: () => Promise<void> | void }) {
  const [name, setName] = useState(pref.ingredient_name);
  const [brand, setBrand] = useState(pref.preferred_brand);
  const [macros, setMacros] = useState<MacroDraft>(() => macroDraftFrom(pref));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const newName = name.trim();
      const newBrand = brand.trim();
      const nameChanged = newName.toLowerCase() !== pref.ingredient_name.toLowerCase();
      const brandChanged = newBrand.toLowerCase() !== pref.preferred_brand?.toLowerCase();

      if (nameChanged || brandChanged) {
        await renameBrandPreference(pref.ingredient_name, { new_ingredient_name: newName, new_brand: newBrand });
      }

      const parsed = parseMacroDraft(macros);
      if (parsed) await updateBrandPreferenceMacros(nameChanged ? newName : pref.ingredient_name, parsed);

      await onSaved();
    } catch (err) {
      setNotice({ tone: "error", text: getErrorMessage(err, "Failed to save.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-4 border-t border-line bg-surface-low p-4">
      <FormField label="Ingredient">
        <Input size="sm" value={name} onChangeText={setName} />
      </FormField>
      <FormField label="Brand">
        <Input size="sm" value={brand} onChangeText={setBrand} />
      </FormField>

      <MacroFieldGrid compact values={macros} onChange={(key, value) => setMacros((m) => ({ ...m, [key]: value }))} />

      <View className="flex-row items-center justify-between gap-3">
        {notice ? <InlineNotice notice={notice} /> : <View />}
        <Button size="sm" icon={Check} loading={saving} loadingText="Saving..." onPress={save}>
          Save changes
        </Button>
      </View>
    </View>
  );
}

const matches = (p: BrandPreference, query: string) =>
  `${p.ingredient_name} ${p.preferred_brand}`.toLowerCase().includes(query.trim().toLowerCase());

interface BrandPreferenceListProps {
  preferences: BrandPreference[];
  onRemove: (ingredientName: string) => void;
  onChanged: () => Promise<void> | void;
}

/** Searchable registry of saved brand preferences, each editable in place. */
export function BrandPreferenceList({ preferences, onRemove, onChanged }: BrandPreferenceListProps) {
  // Only one row is editable at a time.
  const [editingName, setEditingName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const visible = preferences.filter((p) => matches(p, query));

  return (
    <View className="mt-10">
      <View className="mb-4 gap-3">
        <View>
          <Text className="font-mono text-xs uppercase tracking-widest text-ink-muted">{"// "}Saved registry</Text>
          <Text className="font-display-semibold text-2xl uppercase tracking-tight text-ink">Saved preferences</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="flex-1 justify-center">
            <View className="absolute left-3 z-10">
              <Search size={16} color={colors.inkMuted} />
            </View>
            <TextInput
              placeholder="Filter by ingredient or brand…"
              placeholderTextColor={colors.inkSubtle}
              accessibilityLabel="Filter preferences"
              value={query}
              onChangeText={setQuery}
              className="border border-ink bg-card py-2 pl-9 pr-3 font-sans text-sm text-ink"
            />
          </View>
          <Text className="font-mono text-xs uppercase tracking-widest text-ink-muted">{visible.length} listed</Text>
        </View>
      </View>

      {preferences.length === 0 ? (
        <EmptyState icon={Tag} title="No brand preferences yet">
          Add one above — by name, from a label photo, or by importing a spreadsheet.
        </EmptyState>
      ) : (
        <View className="gap-3">
          {visible.map((pref, index) => {
            const editing = editingName === pref.ingredient_name;
            return (
              <View key={pref.ingredient_name} className={`border bg-card ${editing ? "border-ink" : "border-line"}`}>
                <View className="gap-3 p-4">
                  <View className="flex-row items-center gap-4">
                    <Text className="font-mono text-sm text-ink-muted">{String(index + 1).padStart(2, "0")}</Text>
                    <Tag size={20} color={colors.inkMuted} />
                    <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
                      <Text className="font-display-semibold text-lg uppercase text-ink">{pref.ingredient_name}</Text>
                      <ArrowRight size={16} color={colors.inkMuted} />
                      <Text className="font-sans-semibold capitalize text-primary">{pref.preferred_brand}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between gap-3">
                    {hasMacros(pref) ? (
                      <MacroPills preference={pref} />
                    ) : (
                      <Text className="flex-1 font-mono text-xs text-ink-subtle">No macros saved</Text>
                    )}
                    <View className="flex-row gap-1">
                      <IconButton
                        label={editing ? "Close editor" : "Edit preference"}
                        icon={Pencil}
                        onPress={() => setEditingName(editing ? null : pref.ingredient_name)}
                      />
                      <IconButton label="Remove preference" variant="danger" icon={Trash2} onPress={() => onRemove(pref.ingredient_name)} />
                    </View>
                  </View>
                </View>

                {editing ? (
                  <BrandPreferenceEditForm
                    preference={pref}
                    onSaved={async () => {
                      setEditingName(null);
                      await onChanged();
                    }}
                  />
                ) : null}
              </View>
            );
          })}
          {visible.length === 0 ? (
            <Text className="py-6 text-center font-sans text-sm text-ink-muted">No preferences match &ldquo;{query}&rdquo;.</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
