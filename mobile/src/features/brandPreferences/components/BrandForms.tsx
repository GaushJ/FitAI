import { useState } from "react";
import { Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Plus, Sparkles } from "lucide-react-native";
import { Button } from "@/components/ui";
import { resolveIngredient } from "@/features/ingredients/api";
import { getErrorMessage } from "@/lib/errors";
import { colors } from "@/theme/colors";
import type { Notice } from "@/types/notice";
import { extractBrandLabel, saveBrandPreference } from "../api";
import { macroDraftFrom, parseMacroDraft } from "../macros";
import type { BrandIdentity, ExtractedLabel, LabelUnit, MacroDraft } from "../types";
import { BrandIdentityFields, ExtractedMacrosPreview, LabelDropzone, MacroFieldGrid, UnitToggle } from "./fields";

// Ports of web's BrandByNameForm + useBrandByNameForm and BrandByLabelForm + useBrandByLabelForm.
interface BrandFormProps {
  identity: BrandIdentity;
  onIdentityChange: (next: BrandIdentity) => void;
  onSaved: () => Promise<void> | void;
  onNotice: (notice: Notice | null) => void;
}

/** "By name" tab: auto-fetch an ingredient+brand's macros, let the user tweak them, then save. */
export function BrandByNameForm({ identity, onIdentityChange, onSaved, onNotice }: BrandFormProps) {
  const [macros, setMacros] = useState<MacroDraft | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ingredient = identity.ingredient.trim();
  const brand = identity.brand.trim();

  /** Fetched macros belong to one ingredient+brand pair, so editing it invalidates them. */
  const discardFetchedMacros = () => {
    setMacros(null);
    setFetchMessage(null);
  };

  const fetchMacros = async () => {
    if (!ingredient || !brand) return;
    setFetching(true);
    setFetchMessage(null);
    try {
      setMacros(macroDraftFrom(await resolveIngredient({ name: ingredient, brand, weight_g: 100 })));
      setFetchMessage("Macros fetched — edit if needed, then save.");
    } catch {
      setFetchMessage("Could not auto-fetch macros. Enter them manually.");
    } finally {
      setFetching(false);
    }
  };

  const submit = async () => {
    if (!ingredient || !brand) return;
    setSaving(true);
    onNotice(null);
    try {
      const parsed = macros ? parseMacroDraft(macros) : null;
      await saveBrandPreference({ ingredient_name: ingredient, preferred_brand: brand, ...parsed });
      onNotice({ tone: "success", text: `Saved "${brand} ${ingredient}" with macros.` });
      onIdentityChange({ ingredient: "", brand: "" });
      discardFetchedMacros();
      await onSaved();
    } catch {
      onNotice({ tone: "error", text: "Failed to save brand preference." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-5">
      <Text className="font-sans text-sm text-ink-muted">
        Enter the ingredient and brand — macros are fetched automatically and can be edited before saving.
      </Text>

      <BrandIdentityFields
        value={identity}
        onChange={(next) => {
          onIdentityChange(next);
          discardFetchedMacros();
        }}
      />
      <Button
        variant="outline"
        icon={Sparkles}
        iconColor={colors.primary}
        loading={fetching}
        loadingText="Fetching..."
        disabled={!ingredient || !brand}
        onPress={fetchMacros}
      >
        Fetch
      </Button>

      {fetchMessage ? <Text className="font-mono text-xs text-ink-muted">{fetchMessage}</Text> : null}

      {macros ? (
        <View className="border border-line bg-surface-low p-4">
          <View className="mb-3 flex-row justify-between">
            <Text className="font-mono text-xs uppercase tracking-widest text-ink">{"// "}Nutrition per 100g</Text>
            <Text className="font-mono text-xs uppercase tracking-widest text-ink-muted">Editable</Text>
          </View>
          <MacroFieldGrid values={macros} onChange={(key, value) => setMacros((m) => (m ? { ...m, [key]: value } : m))} />
        </View>
      ) : null}

      <View className="items-end">
        <Button size="lg" icon={Plus} loading={saving} loadingText="Saving..." disabled={!ingredient || !brand} onPress={submit}>
          Save preference
        </Button>
      </View>
    </View>
  );
}

type LabelImage = { uri: string; name: string; type: string };

/** "Label photo" tab: upload a nutrition-facts photo and let vision read the exact macros. */
export function BrandByLabelForm({ identity, onIdentityChange, onSaved, onNotice }: BrandFormProps) {
  const [image, setImage] = useState<LabelImage | null>(null);
  const [unit, setUnit] = useState<LabelUnit>("g");
  const [extracted, setExtracted] = useState<ExtractedLabel | null>(null);
  const [saving, setSaving] = useState(false);

  const ingredient = identity.ingredient.trim();
  const brand = identity.brand.trim();

  const selectFile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset) return;
    setImage({ uri: asset.uri, name: asset.fileName ?? "label.jpg", type: asset.mimeType ?? "image/jpeg" });
    setExtracted(null);
  };

  const submit = async () => {
    if (!ingredient || !brand || !image) return;
    setSaving(true);
    onNotice(null);
    setExtracted(null);
    try {
      const data = await extractBrandLabel({ ingredient, brand, image, unit });
      setExtracted({ macros: data.macros, unit: data.unit || "g" });
      onNotice({ tone: "success", text: `Label read! Exact macros for "${brand} ${ingredient}" saved permanently.` });
      onIdentityChange({ ingredient: "", brand: "" });
      setImage(null);
      setUnit("g");
      await onSaved();
    } catch (err) {
      onNotice({ tone: "error", text: getErrorMessage(err, "Failed to extract label.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-5">
      <View className="gap-3">
        <Text className="font-sans text-sm text-ink-muted">
          Photograph the nutrition table on the back of the pack. Claude reads the exact values and saves them.
        </Text>
        <UnitToggle value={unit} onChange={setUnit} />
      </View>

      <BrandIdentityFields value={identity} onChange={onIdentityChange} />
      <LabelDropzone previewUri={image?.uri ?? ""} onPress={selectFile} />
      {extracted ? <ExtractedMacrosPreview extracted={extracted} /> : null}

      <View className="items-end">
        <Button size="lg" icon={Sparkles} loading={saving} loadingText="Extracting..." disabled={!image} onPress={submit}>
          Extract & save label
        </Button>
      </View>
    </View>
  );
}
