import { forwardRef, useEffect, useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, useWindowDimensions } from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Bookmark, Camera, Pencil, Sparkles, Tag, Trash2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Banner } from "@/components/ui";
import {
  deleteBrandPreference,
  getBrandPreferences,
  resolveIngredientMacros,
  saveBrandFromLabel,
  saveBrandPreference,
  updateBrandPreference,
} from "../api";
import type { BrandPreference } from "../types";

interface BrandPreferencesSheetProps {
  onChanged?: () => void;
}

interface EditDraft {
  name: string;
  brand: string;
  cal: string;
  pro: string;
  carb: string;
  fat: string;
}

const num = (v: number | null) => (v != null ? String(v) : "");

export const BrandPreferencesSheet = forwardRef<BottomSheetModal, BrandPreferencesSheetProps>(
  function BrandPreferencesSheet({ onChanged }, ref) {
    const { height: windowHeight } = useWindowDimensions();
    const [tab, setTab] = useState<"name" | "label">("name");
    const [prefs, setPrefs] = useState<BrandPreference[]>([]);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [nameIngredient, setNameIngredient] = useState("");
    const [nameBrand, setNameBrand] = useState("");
    const [nameFetching, setNameFetching] = useState(false);
    const [nameFetched, setNameFetched] = useState(false);
    const [nameSaving, setNameSaving] = useState(false);
    const [nameCal, setNameCal] = useState("");
    const [namePro, setNamePro] = useState("");
    const [nameCarb, setNameCarb] = useState("");
    const [nameFat, setNameFat] = useState("");

    const [labelIngredient, setLabelIngredient] = useState("");
    const [labelBrand, setLabelBrand] = useState("");
    const [labelUnit, setLabelUnit] = useState<"g" | "ml">("g");
    const [labelImage, setLabelImage] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [labelSaving, setLabelSaving] = useState(false);

    const [editingName, setEditingName] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
    const [editSaving, setEditSaving] = useState(false);

    const dismiss = () => {
      if (ref && "current" in ref) ref.current?.dismiss();
    };

    const loadPrefs = async () => {
      try {
        const result = await getBrandPreferences();
        setPrefs(result);
      } catch (err) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to load preferences." });
      }
    };

    useEffect(() => {
      loadPrefs();
    }, []);

    const handleFetchMacros = async () => {
      if (!nameIngredient.trim() || !nameBrand.trim() || nameFetching) return;
      setNameFetching(true);
      setFeedback(null);
      try {
        const macros = await resolveIngredientMacros(nameIngredient.trim(), nameBrand.trim());
        setNameCal(String(macros.calories_per_100g));
        setNamePro(String(macros.protein_per_100g));
        setNameCarb(String(macros.carbs_per_100g));
        setNameFat(String(macros.fat_per_100g));
        setNameFetched(true);
      } catch {
        setFeedback({ type: "error", text: "Could not auto-fetch macros. Enter them manually." });
      } finally {
        setNameFetching(false);
      }
    };

    const handleSaveByName = async () => {
      if (!nameIngredient.trim() || !nameBrand.trim() || nameSaving) return;
      setNameSaving(true);
      setFeedback(null);
      try {
        const payload = {
          ingredient_name: nameIngredient.trim(),
          preferred_brand: nameBrand.trim(),
          ...(nameFetched
            ? {
                calories_per_100g: Number(nameCal) || 0,
                protein_per_100g: Number(namePro) || 0,
                carbs_per_100g: Number(nameCarb) || 0,
                fat_per_100g: Number(nameFat) || 0,
              }
            : {}),
        };
        await saveBrandPreference(payload);
        await loadPrefs();
        setNameIngredient("");
        setNameBrand("");
        setNameFetched(false);
        setNameCal("");
        setNamePro("");
        setNameCarb("");
        setNameFat("");
        setFeedback({ type: "success", text: `Saved ${payload.ingredient_name.toLowerCase()} → ${payload.preferred_brand.toLowerCase()}.` });
        onChanged?.();
      } catch (err) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to save preference." });
      } finally {
        setNameSaving(false);
      }
    };

    const handlePickPhoto = async () => {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        setFeedback({ type: "error", text: "Camera permission is required to add a label photo." });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setLabelImage({ uri: asset.uri, name: asset.fileName ?? "label.jpg", type: asset.mimeType ?? "image/jpeg" });
    };

    const handleSaveByLabel = async () => {
      if (!labelIngredient.trim() || !labelBrand.trim() || !labelImage || labelSaving) return;
      setLabelSaving(true);
      setFeedback(null);
      try {
        const result = await saveBrandFromLabel({
          ingredientName: labelIngredient.trim(),
          preferredBrand: labelBrand.trim(),
          unit: labelUnit,
          imageUri: labelImage.uri,
          imageName: labelImage.name,
          imageType: labelImage.type,
        });
        await loadPrefs();
        setLabelIngredient("");
        setLabelBrand("");
        setLabelUnit("g");
        setLabelImage(null);
        setFeedback({
          type: "success",
          text: `Label read! Exact macros for "${result.preferred_brand} ${result.ingredient_name}" saved.`,
        });
        onChanged?.();
      } catch (err) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to extract label." });
      } finally {
        setLabelSaving(false);
      }
    };

    const toggleEdit = (pref: BrandPreference) => {
      if (editingName === pref.ingredient_name) {
        setEditingName(null);
        setEditDraft(null);
        return;
      }
      setEditingName(pref.ingredient_name);
      setEditDraft({
        name: pref.ingredient_name,
        brand: pref.preferred_brand,
        cal: num(pref.calories_per_100g),
        pro: num(pref.protein_per_100g),
        carb: num(pref.carbs_per_100g),
        fat: num(pref.fat_per_100g),
      });
    };

    const handleSaveEdit = async (originalName: string) => {
      if (!editDraft) return;
      const cal = Number(editDraft.cal);
      const pro = Number(editDraft.pro);
      const carb = Number(editDraft.carb);
      const fat = Number(editDraft.fat);
      if (!editDraft.name.trim() || !editDraft.brand.trim() || [cal, pro, carb, fat].some((v) => Number.isNaN(v) || v < 0)) {
        setFeedback({ type: "error", text: "All fields must be valid, non-negative numbers." });
        return;
      }
      setEditSaving(true);
      try {
        await updateBrandPreference(originalName, editDraft.name.trim(), editDraft.brand.trim(), {
          calories_per_100g: cal,
          protein_per_100g: pro,
          carbs_per_100g: carb,
          fat_per_100g: fat,
        });
        await loadPrefs();
        setEditingName(null);
        setEditDraft(null);
        setFeedback({ type: "success", text: "Preference updated." });
        onChanged?.();
      } catch (err) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to save." });
      } finally {
        setEditSaving(false);
      }
    };

    const handleDelete = (pref: BrandPreference) => {
      Alert.alert(
        "Remove preference?",
        `"${pref.ingredient_name} → ${pref.preferred_brand}" will no longer resolve to exact macros.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteBrandPreference(pref.ingredient_name);
                setPrefs((prev) => prev.filter((p) => p.ingredient_name !== pref.ingredient_name));
                onChanged?.();
              } catch (err) {
                setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to remove preference." });
              }
            },
          },
        ]
      );
    };

    return (
      <BottomSheetModal
        ref={ref}
        maxDynamicContentSize={windowHeight * 0.88}
        backgroundStyle={{ backgroundColor: "#16180F" }}
        handleIndicatorStyle={{ backgroundColor: "#2A2D1E" }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
        )}
      >
        <View className="px-5 pb-1">
          <View className="flex-row items-center gap-1.5">
            <Bookmark size={16} color="#C9F24D" />
            <Text className="font-display text-base text-text-primary">Brand Preferences</Text>
          </View>
          <Text className="mt-1 font-sans text-xs leading-5 text-text-secondary">
            Save brand-specific macros. I&rsquo;ll use these automatically every time you log that ingredient.
          </Text>
        </View>

        <BottomSheetScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-3">
          <View className="flex-row gap-0.5 rounded-full bg-surface-inset p-1">
            <Pressable
              onPress={() => {
                setTab("name");
                setFeedback(null);
              }}
              className={`flex-1 items-center rounded-full py-2 ${tab === "name" ? "bg-accent" : ""}`}
            >
              <Text className={`font-sans-bold text-xs ${tab === "name" ? "text-bg" : "text-text-secondary"}`}>By Name</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setTab("label");
                setFeedback(null);
              }}
              className={`flex-1 items-center rounded-full py-2 ${tab === "label" ? "bg-accent" : ""}`}
            >
              <Text className={`font-sans-bold text-xs ${tab === "label" ? "text-bg" : "text-text-secondary"}`}>Label</Text>
            </Pressable>
          </View>

          {tab === "name" ? (
            <View className="gap-2.5">
              <Text className="font-sans text-[11px] leading-5 text-text-secondary">
                Enter the ingredient and brand &mdash; macros are fetched automatically and can be edited before saving.
              </Text>

              <View className="flex-row gap-2">
                <Field label="Ingredient" value={nameIngredient} onChangeText={setNameIngredient} placeholder="e.g. milk" className="flex-1" />
                <Field label="Brand" value={nameBrand} onChangeText={setNameBrand} placeholder="e.g. Nandini toned" className="flex-1" />
              </View>

              <Pressable
                onPress={handleFetchMacros}
                disabled={!nameIngredient.trim() || !nameBrand.trim() || nameFetching}
                className={`flex-row items-center justify-center gap-2 rounded-sm bg-surface-high py-2.5 ${
                  !nameIngredient.trim() || !nameBrand.trim() || nameFetching ? "opacity-45" : ""
                }`}
              >
                {nameFetching ? (
                  <ActivityIndicator size="small" color="#F4F5EF" />
                ) : (
                  <Sparkles size={12} color="#C9F24D" />
                )}
                <Text className="font-sans-bold text-xs text-text-secondary">
                  {nameFetching ? "Fetching macros…" : "Fetch Macros"}
                </Text>
              </Pressable>

              {nameFetched ? (
                <View className="gap-1.5 rounded-md border border-accent/20 bg-surface-inset p-3">
                  <Text className="font-sans-bold text-[9px] uppercase tracking-widest text-accent">Per 100g &mdash; edit if needed</Text>
                  <View className="flex-row gap-1.5">
                    <Field label="Cal" labelColor="#fb923c" value={nameCal} onChangeText={setNameCal} keyboardType="numeric" className="flex-1" compact />
                    <Field label="Protein" labelColor="#C9F24D" value={namePro} onChangeText={setNamePro} keyboardType="numeric" className="flex-1" compact />
                    <Field label="Carbs" labelColor="#22d3ee" value={nameCarb} onChangeText={setNameCarb} keyboardType="numeric" className="flex-1" compact />
                    <Field label="Fat" labelColor="#fb7185" value={nameFat} onChangeText={setNameFat} keyboardType="numeric" className="flex-1" compact />
                  </View>
                </View>
              ) : null}

              <Pressable
                onPress={handleSaveByName}
                disabled={!nameIngredient.trim() || !nameBrand.trim() || nameSaving}
                className={`items-center rounded-sm bg-accent py-3 ${!nameIngredient.trim() || !nameBrand.trim() || nameSaving ? "opacity-45" : ""}`}
              >
                <Text className="font-sans-bold text-xs text-bg">{nameSaving ? "Saving…" : "Save Preference"}</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2.5">
              <Text className="font-sans text-[11px] leading-5 text-text-secondary">
                Photo the nutrition facts panel on the back of the pack &mdash; I&rsquo;ll read the exact values and save them.
              </Text>

              <View className="flex-row gap-2">
                <Field label="Ingredient" value={labelIngredient} onChangeText={setLabelIngredient} placeholder="e.g. orange juice" className="flex-1" />
                <Field label="Brand" value={labelBrand} onChangeText={setLabelBrand} placeholder="e.g. Tropicana" className="flex-1" />
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="font-sans-bold text-[9px] uppercase tracking-widest text-text-muted">Unit</Text>
                <View className="flex-row overflow-hidden rounded-xs border border-border">
                  {(["g", "ml"] as const).map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => setLabelUnit(u)}
                      className={`px-3 py-1 ${labelUnit === u ? "bg-accent" : "bg-bg"}`}
                    >
                      <Text className={`font-sans-bold text-[11px] ${labelUnit === u ? "text-bg" : "text-text-secondary"}`}>{u}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text className="font-sans text-[10px] text-text-muted">per 100{labelUnit}</Text>
              </View>

              <Pressable
                onPress={handlePickPhoto}
                className="min-h-[108px] items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border p-4"
              >
                {labelImage ? (
                  <>
                    <View className="h-10 w-10 items-center justify-center rounded-md bg-surface-high">
                      <Camera size={18} color="#C9F24D" />
                    </View>
                    <Text className="font-sans text-[11px] text-text-secondary">Photo added &mdash; tap to replace</Text>
                  </>
                ) : (
                  <>
                    <Camera size={22} color="#6E7066" />
                    <Text className="text-center font-sans text-[11px] text-text-secondary">Tap to photograph a nutrition label</Text>
                    <Text className="font-sans text-[9.5px] text-text-muted">Uses your camera</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleSaveByLabel}
                disabled={!labelIngredient.trim() || !labelBrand.trim() || !labelImage || labelSaving}
                className={`items-center rounded-sm bg-accent py-3 ${
                  !labelIngredient.trim() || !labelBrand.trim() || !labelImage || labelSaving ? "opacity-45" : ""
                }`}
              >
                <Text className="font-sans-bold text-xs text-bg">{labelSaving ? "Extracting…" : "Extract & Save Label"}</Text>
              </Pressable>
            </View>
          )}

          {feedback ? <Banner variant={feedback.type} message={feedback.text} /> : null}

          <View className="gap-2">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-sans-bold text-[9px] uppercase tracking-widest text-text-muted">Saved Preferences</Text>
              <Text className="font-mono text-[9px] font-bold text-text-muted">({prefs.length})</Text>
            </View>

            {prefs.length === 0 ? (
              <Text className="font-sans text-[11px] text-text-muted">No saved preferences yet.</Text>
            ) : (
              prefs.map((pref) => {
                const isEditing = editingName === pref.ingredient_name;
                return (
                  <View key={pref.ingredient_name} className="overflow-hidden rounded-md border border-border-subtle bg-surface-inset">
                    <View className="flex-row items-center justify-between gap-1.5 px-3 py-2.5">
                      <View className="flex-1 flex-row items-center gap-1.5">
                        <Tag size={12} color="#C9F24D" />
                        <Text className="font-sans-semibold text-xs text-text-primary" numberOfLines={1}>
                          {pref.ingredient_name}
                        </Text>
                        <Text className="text-[11px] text-text-muted">&rarr;</Text>
                        <Text className="text-xs text-accent-hover" numberOfLines={1}>
                          {pref.preferred_brand}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <Pressable
                          onPress={() => toggleEdit(pref)}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${pref.ingredient_name}`}
                          className="h-6 w-6 items-center justify-center rounded-xs bg-surface-high"
                        >
                          <Pencil size={11} color="#8E9085" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(pref)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${pref.ingredient_name}`}
                          className="h-6 w-6 items-center justify-center rounded-xs bg-surface-high"
                        >
                          <Trash2 size={11} color="#8E9085" />
                        </Pressable>
                      </View>
                    </View>

                    {isEditing && editDraft ? (
                      <View className="gap-1.5 border-t border-border-subtle px-3 pb-2.5 pt-2.5">
                        <View className="flex-row gap-1.5">
                          <BottomSheetTextInput
                            value={editDraft.name}
                            onChangeText={(v) => setEditDraft((d) => (d ? { ...d, name: v } : d))}
                            className="flex-1 rounded-xs border border-border-subtle bg-surface-high px-2 py-1.5 text-[11px] text-text-primary"
                          />
                          <BottomSheetTextInput
                            value={editDraft.brand}
                            onChangeText={(v) => setEditDraft((d) => (d ? { ...d, brand: v } : d))}
                            className="flex-1 rounded-xs border border-border-subtle bg-surface-high px-2 py-1.5 text-[11px] text-text-primary"
                          />
                        </View>
                        <View className="flex-row gap-1.5">
                          <Field label="Cal" labelColor="#fb923c" value={editDraft.cal} onChangeText={(v) => setEditDraft((d) => (d ? { ...d, cal: v } : d))} keyboardType="numeric" className="flex-1" compact />
                          <Field label="Protein" labelColor="#C9F24D" value={editDraft.pro} onChangeText={(v) => setEditDraft((d) => (d ? { ...d, pro: v } : d))} keyboardType="numeric" className="flex-1" compact />
                          <Field label="Carbs" labelColor="#22d3ee" value={editDraft.carb} onChangeText={(v) => setEditDraft((d) => (d ? { ...d, carb: v } : d))} keyboardType="numeric" className="flex-1" compact />
                          <Field label="Fat" labelColor="#fb7185" value={editDraft.fat} onChangeText={(v) => setEditDraft((d) => (d ? { ...d, fat: v } : d))} keyboardType="numeric" className="flex-1" compact />
                        </View>
                        <Pressable
                          onPress={() => handleSaveEdit(pref.ingredient_name)}
                          disabled={editSaving}
                          className={`items-center rounded-xs bg-accent py-2 ${editSaving ? "opacity-50" : ""}`}
                        >
                          <Text className="font-sans-bold text-[10.5px] text-bg">{editSaving ? "Saving…" : "Save"}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View className="flex-row flex-wrap items-start gap-1.5 px-3 pb-2.5">
                        <MacroTile label="Cal" color="#fb923c" value={num(pref.calories_per_100g)} />
                        <MacroTile label="Protein" color="#C9F24D" value={num(pref.protein_per_100g)} />
                        <MacroTile label="Carbs" color="#22d3ee" value={num(pref.carbs_per_100g)} />
                        <MacroTile label="Fat" color="#fb7185" value={num(pref.fat_per_100g)} />
                        <Text className="self-center font-sans text-[9px] text-text-muted">/100{pref.unit}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <Pressable onPress={dismiss} className="items-center rounded-full border border-border bg-surface-high py-3">
            <Text className="font-sans-semibold text-[13px] text-text-secondary">Close</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

function MacroTile({ label, color, value }: { label: string; color: string; value: string }) {
  return (
    <View className="items-center gap-0.5 rounded-xs bg-surface-high px-1.5 py-1">
      <Text className="text-[8px] font-bold" style={{ color }}>
        {label}
      </Text>
      <Text className="font-mono text-[10px] text-text-secondary">{value || "—"}</Text>
    </View>
  );
}

function Field({
  label,
  labelColor = "#6E7066",
  value,
  onChangeText,
  placeholder,
  keyboardType,
  className = "",
  compact = false,
}: {
  label: string;
  labelColor?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "numeric";
  className?: string;
  compact?: boolean;
}) {
  return (
    <View className={`gap-1 ${className}`}>
      <Text className={compact ? "text-[8px] font-bold" : "font-sans-bold text-[9px] uppercase tracking-widest"} style={{ color: labelColor }}>
        {label}
      </Text>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6E7066"
        keyboardType={keyboardType}
        className={
          compact
            ? "rounded-xs border border-border-subtle bg-surface-high px-1 py-1.5 text-center font-mono text-[10px] text-text-primary"
            : "rounded-sm border border-border-subtle bg-bg px-3 py-2.5 text-xs text-text-primary"
        }
      />
    </View>
  );
}
