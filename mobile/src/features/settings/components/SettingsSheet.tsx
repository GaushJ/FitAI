import { forwardRef, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { LogOut, X } from "lucide-react-native";
import { Banner } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { updateUser } from "../api";
import type { UserTargets } from "../types";
import { TargetField } from "./TargetField";

interface SettingsSheetProps {
  initialValues: UserTargets;
  onSaved: (updated: UserTargets) => void;
}

/** Presented via a parent-held ref: `sheetRef.current?.present()`. */
export const SettingsSheet = forwardRef<BottomSheetModal, SettingsSheetProps>(function SettingsSheet(
  { initialValues, onSaved },
  ref
) {
  const { logout } = useAuth();
  const [name, setName] = useState(initialValues.name);
  const [calories, setCalories] = useState(String(initialValues.target_calories));
  const [protein, setProtein] = useState(String(initialValues.target_protein));
  const [carbs, setCarbs] = useState(String(initialValues.target_carbs));
  const [fat, setFat] = useState(String(initialValues.target_fat));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Re-sync whenever the sheet is reopened with fresh values from the dashboard.
  useEffect(() => {
    setName(initialValues.name);
    setCalories(String(initialValues.target_calories));
    setProtein(String(initialValues.target_protein));
    setCarbs(String(initialValues.target_carbs));
    setFat(String(initialValues.target_fat));
    setError("");
  }, [initialValues]);

  const dismiss = () => {
    if (ref && "current" in ref) ref.current?.dismiss();
  };

  const handleLogout = () => {
    dismiss();
    logout();
  };

  const handleSave = async () => {
    setError("");
    const payload: UserTargets = {
      name: name.trim(),
      target_calories: Number(calories),
      target_protein: Number(protein),
      target_carbs: Number(carbs),
      target_fat: Number(fat),
    };
    if (!payload.name) {
      setError("Name is required.");
      return;
    }
    const numericValues = [payload.target_calories, payload.target_protein, payload.target_carbs, payload.target_fat];
    if (numericValues.some((v) => Number.isNaN(v) || v < 0)) {
      setError("Targets must be valid, non-negative numbers.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateUser(payload);
      onSaved(result.user);
      dismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      backgroundStyle={{ backgroundColor: "#16180F" }}
      handleIndicatorStyle={{ backgroundColor: "#2A2D1E" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
      )}
    >
      <BottomSheetView className="gap-4 px-5 pb-8 pt-1">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-3.5">
          <Text className="font-display text-base text-text-primary">Settings</Text>
          <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close">
            <X size={18} color="#8E9085" />
          </Pressable>
        </View>

        <TargetField label="Name" value={name} onChangeText={setName} />

        <View className="flex-row flex-wrap gap-3">
          <TargetField
            label="Calories"
            labelColor="#fb923c"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            className="w-[47%]"
          />
          <TargetField
            label="Protein (g)"
            labelColor="#C9F24D"
            value={protein}
            onChangeText={setProtein}
            keyboardType="numeric"
            className="w-[47%]"
          />
          <TargetField
            label="Carbs (g)"
            labelColor="#22d3ee"
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="numeric"
            className="w-[47%]"
          />
          <TargetField
            label="Fat (g)"
            labelColor="#fb7185"
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
            className="w-[47%]"
          />
        </View>

        {error ? <Banner variant="error" message={error} /> : null}

        <View className="flex-row gap-2.5">
          <Pressable onPress={dismiss} className="flex-1 items-center rounded-full border border-border bg-surface-high py-3">
            <Text className="font-sans-semibold text-[13px] text-text-secondary">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className={`flex-1 items-center rounded-full bg-accent py-3 ${saving ? "opacity-50" : ""}`}
          >
            <Text className="font-sans-bold text-[13px] text-bg">{saving ? "Saving…" : "Save"}</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleLogout} className="flex-row items-center justify-center gap-1.5 py-1">
          <LogOut size={13} color="#f87171" />
          <Text className="font-sans-semibold text-xs text-danger">Log Out</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
