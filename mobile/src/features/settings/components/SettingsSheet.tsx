import { forwardRef } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { LogOut, X } from "lucide-react-native";
import { Banner } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { KCAL_PER_GRAM } from "../macros";
import type { UserSettings } from "../types";
import { useTargetsForm } from "../useTargetsForm";
import { BodyProfileSection } from "./BodyProfileSection";
import { PlanSummary } from "./PlanSummary";
import { TargetField } from "./TargetField";

interface SettingsSheetProps {
  initialValues: UserSettings;
  onSaved: (updated: UserSettings) => void;
}

const macroHint = (grams: string, kcalPerGram: number) => `≈ ${Math.round((Number(grams) || 0) * kcalPerGram)} kcal`;

/** Presented via a parent-held ref: `sheetRef.current?.present()`. */
export const SettingsSheet = forwardRef<BottomSheetModal, SettingsSheetProps>(function SettingsSheet(
  { initialValues, onSaved },
  ref
) {
  const { logout } = useAuth();
  const { height: windowHeight } = useWindowDimensions();
  const form = useTargetsForm(initialValues, onSaved);

  const dismiss = () => {
    if (ref && "current" in ref) ref.current?.dismiss();
  };

  const handleLogout = () => {
    dismiss();
    logout();
  };

  const handleSave = async () => {
    if (await form.save()) dismiss();
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
      <BottomSheetScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-1" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-3.5">
          <Text className="font-display text-base text-text-primary">Settings</Text>
          <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close">
            <X size={18} color="#8E9085" />
          </Pressable>
        </View>

        <TargetField label="Name" value={form.name} onChangeText={form.setName} />

        <BodyProfileSection
          body={form.body}
          onChange={form.setBodyField}
          canCalculate={form.canCalculate}
          calculating={form.calculating}
          onCalculate={form.calculate}
        />
        {form.plan ? <PlanSummary plan={form.plan} /> : null}

        <View className="gap-3 border-t border-border-subtle pt-5">
          <Text className="font-sans-bold text-[10px] uppercase tracking-widest text-text-secondary">Daily targets</Text>
          <View className="flex-row flex-wrap gap-3">
            <TargetField
              label="Calories"
              labelColor="#fb923c"
              value={form.targets.calories}
              onChangeText={form.setCaloriesText}
              onEndEditing={form.commitCalories}
              keyboardType="numeric"
              className="w-[47%]"
            />
            <TargetField
              label="Protein (g)"
              labelColor="#C9F24D"
              value={form.targets.protein}
              onChangeText={(v) => form.setMacro("protein", v)}
              keyboardType="numeric"
              hint={macroHint(form.targets.protein, KCAL_PER_GRAM.protein)}
              className="w-[47%]"
            />
            <TargetField
              label="Carbs (g)"
              labelColor="#22d3ee"
              value={form.targets.carbs}
              onChangeText={(v) => form.setMacro("carbs", v)}
              keyboardType="numeric"
              hint={macroHint(form.targets.carbs, KCAL_PER_GRAM.carbs)}
              className="w-[47%]"
            />
            <TargetField
              label="Fat (g)"
              labelColor="#fb7185"
              value={form.targets.fat}
              onChangeText={(v) => form.setMacro("fat", v)}
              keyboardType="numeric"
              hint={macroHint(form.targets.fat, KCAL_PER_GRAM.fat)}
              className="w-[47%]"
            />
          </View>
          <Text className="font-sans text-[10px] leading-4 text-text-muted">
            Calories = 4 × protein + 4 × carbs + 9 × fat. Editing a macro updates calories; editing calories
            rescales your macros, keeping their proportions.
          </Text>
        </View>

        {form.error ? <Banner variant="error" message={form.error} /> : null}

        <View className="flex-row gap-2.5">
          <Pressable onPress={dismiss} className="flex-1 items-center rounded-full border border-border bg-surface-high py-3">
            <Text className="font-sans-semibold text-[13px] text-text-secondary">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={form.saving}
            className={`flex-1 items-center rounded-full bg-accent py-3 ${form.saving ? "opacity-50" : ""}`}
          >
            <Text className="font-sans-bold text-[13px] text-bg">{form.saving ? "Saving…" : "Save"}</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleLogout} className="flex-row items-center justify-center gap-1.5 py-1">
          <LogOut size={13} color="#f87171" />
          <Text className="font-sans-semibold text-xs text-danger">Log Out</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
