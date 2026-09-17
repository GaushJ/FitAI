import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dumbbell, Flame, Settings } from "lucide-react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Banner, LoadingSpinner } from "@/components/ui";
import { getDashboard, getFrequentMeals, logFrequentMeal } from "@/features/dashboard/api";
import { MacroProgress, MealComposer, FrequentMealsRow, TodayLogList } from "@/features/dashboard/components";
import type { DashboardResponse, FrequentMeal, TrackMealResponse } from "@/features/dashboard/types";
import { SettingsSheet } from "@/features/settings/components";

export default function DashboardScreen() {
  const settingsSheetRef = useRef<BottomSheetModal>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [frequentMeals, setFrequentMeals] = useState<FrequentMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loggingId, setLoggingId] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [dashboardRes, frequentRes] = await Promise.all([getDashboard(), getFrequentMeals()]);
      setDashboard(dashboardRes);
      setFrequentMeals(frequentRes);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogged = async (result: TrackMealResponse) => {
    setSuccessMessage(`Meal logged! ${Math.round(result.macros.calories)} kcal tracked.`);
    if (result.warning) setError(result.warning);
    await loadDashboard();
  };

  const handleQuickLog = async (meal: FrequentMeal) => {
    setLoggingId(meal.id);
    setError("");
    try {
      const result = await logFrequentMeal(meal.id);
      setSuccessMessage(`Logged "${result.display_name}" — ${Math.round(result.macros.calories)} kcal`);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to quick-log meal.");
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <View className="flex-row items-center justify-between border-b border-border-subtle px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Dumbbell size={18} color="#C9F24D" strokeWidth={1.8} />
          <Text className="font-display text-[15px] text-text-primary">GetFitbro</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1 rounded-full border border-macro-calories/20 bg-macro-calories/10 px-2.5 py-1">
            <Flame size={11} color="#fb923c" fill="#fb923c" />
            <Text className="font-mono text-xs font-bold text-macro-calories">{dashboard?.user.current_streak ?? 0}</Text>
          </View>
          {dashboard ? (
            <Pressable
              onPress={() => settingsSheetRef.current?.present()}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Settings size={18} color="#8E9085" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView contentContainerClassName="gap-4 p-4" contentInsetAdjustmentBehavior="automatic">
          <MealComposer onLogged={handleLogged} />

          {error ? <Banner variant="error" message={error} /> : null}
          {successMessage ? <Banner variant="success" message={successMessage} /> : null}

          {dashboard ? (
            <MacroProgress
              totals={dashboard.totals}
              targets={{
                calories: dashboard.user.target_calories,
                protein: dashboard.user.target_protein,
                carbs: dashboard.user.target_carbs,
                fat: dashboard.user.target_fat,
              }}
            />
          ) : null}

          <FrequentMealsRow meals={frequentMeals} onLog={handleQuickLog} loggingId={loggingId} />

          {dashboard ? <TodayLogList meals={dashboard.meals} /> : null}
        </ScrollView>
      )}

      {dashboard ? (
        <SettingsSheet
          ref={settingsSheetRef}
          initialValues={{
            name: dashboard.user.name,
            target_calories: dashboard.user.target_calories,
            target_protein: dashboard.user.target_protein,
            target_carbs: dashboard.user.target_carbs,
            target_fat: dashboard.user.target_fat,
          }}
          onSaved={(updated) => {
            setDashboard((prev) => (prev ? { ...prev, user: { ...prev.user, ...updated } } : prev));
            setSuccessMessage("Targets updated!");
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
