import { Image, Pressable, Text, TextInput, View } from "react-native";
import { Upload } from "lucide-react-native";
import { FormField, Input } from "@/components/ui";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { colors } from "@/theme/colors";
import type { BrandIdentity, ExtractedLabel, LabelUnit, MacroDraft } from "../types";

// Ports of web's BrandIdentityFields, MacroFieldGrid and LabelUpload (UnitToggle, LabelDropzone,
// ExtractedMacrosPreview).

export function BrandIdentityFields({ value, onChange }: { value: BrandIdentity; onChange: (next: BrandIdentity) => void }) {
  return (
    <View className="gap-4">
      <FormField label="Ingredient" required>
        <Input placeholder="e.g. greek yogurt" value={value.ingredient} onChangeText={(ingredient) => onChange({ ...value, ingredient })} />
      </FormField>
      <FormField label="Brand" required>
        <Input placeholder="e.g. Epigamia No Added Sugar" value={value.brand} onChangeText={(brand) => onChange({ ...value, brand })} />
      </FormField>
    </View>
  );
}

const FIELDS: { key: keyof MacroDraft; label: string; code: string; unit: string; tone: string }[] = [
  { key: "calories", label: "Energy", code: "Cal", unit: "kcal", tone: MACRO_TEXT.calories },
  { key: "protein", label: "Protein", code: "P", unit: "g", tone: MACRO_TEXT.protein },
  { key: "carbs", label: "Carbohydrates", code: "C", unit: "g", tone: MACRO_TEXT.carbs },
  { key: "fat", label: "Total fat", code: "F", unit: "g", tone: MACRO_TEXT.fat },
];

/** Four per-100g number tiles: energy, protein, carbs, fat. */
export function MacroFieldGrid({
  values,
  onChange,
  compact,
}: {
  values: MacroDraft;
  onChange: (key: keyof MacroDraft, value: string) => void;
  /** Smaller numbers for use inside a list row. */
  compact?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {FIELDS.map(({ key, label, code, unit, tone }) => (
        <View key={key} className="w-[47%] border border-line bg-card px-3 py-2.5">
          <View className="flex-row justify-between">
            <Text className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">{label}</Text>
            <Text className={`font-mono-medium text-[11px] uppercase ${tone}`}>{code}</Text>
          </View>
          <View className="mt-1 flex-row items-baseline gap-2">
            <TextInput
              keyboardType="decimal-pad"
              accessibilityLabel={label}
              value={values[key]}
              onChangeText={(v) => onChange(key, v)}
              className={`min-w-0 flex-1 p-0 font-display text-ink ${compact ? "text-xl" : "text-3xl"}`}
            />
            <Text className="font-mono text-xs text-ink-muted">{unit}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** g / ml switch for the unit printed on the label. */
export function UnitToggle({ value, onChange }: { value: LabelUnit; onChange: (unit: LabelUnit) => void }) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="font-mono text-xs uppercase tracking-widest text-ink-muted">Base</Text>
      <View className="flex-row border border-line bg-surface-container p-0.5">
        {(["g", "ml"] as const).map((unit) => (
          <Pressable
            key={unit}
            accessibilityRole="button"
            accessibilityState={{ selected: value === unit }}
            onPress={() => onChange(unit)}
            className={`px-3 py-1 ${value === unit ? "bg-ink" : ""}`}
          >
            <Text className={`font-mono text-xs lowercase ${value === unit ? "text-white" : "text-ink-muted"}`}>{unit}</Text>
          </Pressable>
        ))}
      </View>
      <Text className="font-mono text-xs lowercase tracking-widest text-ink-muted">per 100{value}</Text>
    </View>
  );
}

/** Tap-to-upload area that previews the chosen nutrition-label photo. */
export function LabelDropzone({ previewUri, onPress }: { previewUri: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Upload a nutrition label photo"
      className="min-h-40 items-center justify-center gap-2 border-2 border-dashed border-line-strong bg-surface-low p-4"
    >
      {previewUri ? (
        <Image source={{ uri: previewUri }} accessibilityLabel="Label preview" resizeMode="contain" className="h-36 w-full" />
      ) : (
        <>
          <Upload size={28} color={colors.inkMuted} />
          <Text className="text-center font-sans text-sm text-ink-muted">Tap to upload a nutrition label photo</Text>
          <Text className="font-mono text-[11px] text-ink-subtle">JPG, PNG or WEBP</Text>
        </>
      )}
    </Pressable>
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
    <View className="flex-row flex-wrap gap-3 border border-success bg-success-soft p-4">
      {EXTRACTED_FIELDS.map(({ label, key, tone }) => (
        <View key={key} className="w-[46%] items-center">
          <Text className={`font-display text-2xl ${tone}`}>{extracted.macros[key]}</Text>
          <Text className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            {label}/100{extracted.unit}
          </Text>
        </View>
      ))}
    </View>
  );
}
