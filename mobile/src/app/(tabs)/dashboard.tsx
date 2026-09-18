import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bookmark, Dumbbell, Flame, Settings } from "lucide-react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Banner, LoadingSpinner } from "@/components/ui";
import { deleteMeal, getDashboard, getFrequentMeals, logFrequentMeal } from "@/features/dashboard/api";
import {
  MacroProgress,
  MealComposer,
  FrequentMealsRow,
  TodayLogList,
  IngredientEditorSheet,
  PortionEditorSheet,
  type IngredientEditTarget,
} from "@/features/dashboard/components";
import type {
  DashboardResponse,
  FrequentMeal,
  Ingredient,
  MealLog,
  QuickLogResponse,
  TrackMealResponse,
} from "@/features/dashboard/types";
import { SettingsSheet } from "@/features/settings/components";
import { BrandPreferencesSheet } from "@/features/brandPreferences/components";
import { deleteSavedMeal, getSavedMeals, logSavedMeal } from "@/features/savedMeals/api";
import { SavedMealsRow, SavedMealEditorSheet, type SavedMealEditorTarget } from "@/features/savedMeals/components";
import type { LogSavedMealResponse, SavedMeal } from "@/features/savedMeals/types";

export default function DashboardScreen() {
  const settingsSheetRef = useRef<BottomSheetModal>(null);
  const brandPreferencesSheetRef = useRef<BottomSheetModal>(null);
  const ingredientSheetRef = useRef<BottomSheetModal>(null);
  const portionSheetRef = useRef<BottomSheetModal>(null);
  const savedMealSheetRef = useRef<BottomSheetModal>(null);

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [frequentMeals, setFrequentMeals] = useState<FrequentMeal[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [savedLoggingId, setSavedLoggingId] = useState<number | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<IngredientEditTarget | null>(null);
  const [portionMeal, setPortionMeal] = useState<FrequentMeal | null>(null);
  const [savedMealTarget, setSavedMealTarget] = useState<SavedMealEditorTarget | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [dashboardRes, frequentRes, savedRes] = await Promise.all([
        getDashboard(),
        getFrequentMeals(),
        getSavedMeals(),
      ]);
      setDashboard(dashboardRes);
      setFrequentMeals(frequentRes);
      setSavedMeals(savedRes);
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

  const handleAdjustPortions = (meal: FrequentMeal) => {
    setPortionMeal(meal);
    portionSheetRef.current?.present();
  };

  const handlePortionLogged = async (result: QuickLogResponse) => {
    setSuccessMessage(`Logged "${result.display_name}" — ${Math.round(result.macros.calories)} kcal`);
    await loadDashboard();
  };

  const handleEditIngredient = (mealId: number, index: number, ingredient: Ingredient) => {
    setEditingIngredient({ mealId, index, ingredient });
    ingredientSheetRef.current?.present();
  };

  const handleIngredientSaved = async () => {
    setSuccessMessage("Ingredient updated.");
    await loadDashboard();
  };

  const handleCreateSavedMeal = () => {
    setSavedMealTarget({ mode: "new", meal: null });
    savedMealSheetRef.current?.present();
  };

  const handleEditSavedMeal = (meal: SavedMeal) => {
    setSavedMealTarget({ mode: "edit", meal });
    savedMealSheetRef.current?.present();
  };

  const handleSavedMealSaved = async () => {
    await loadDashboard();
  };

  const handleSavedMealLogged = async (result: LogSavedMealResponse) => {
    setSuccessMessage(`Logged "${result.name}" — ${Math.round(result.macros.calories)} kcal`);
    await loadDashboard();
  };

  const handleLogSavedMeal = async (meal: SavedMeal) => {
    setSavedLoggingId(meal.id);
    setError("");
    try {
      const result = await logSavedMeal(meal.id);
      setSuccessMessage(`Logged "${result.name}" — ${Math.round(result.macros.calories)} kcal`);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log meal.");
    } finally {
      setSavedLoggingId(null);
    }
  };

  const handleDeleteMeal = (meal: MealLog) => {
    Alert.alert("Delete meal?", `"${meal.raw_transcript}" will be removed permanently.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMeal(meal.id);
            await loadDashboard();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete meal.");
          }
        },
      },
    ]);
  };

  const handleDeleteSavedMeal = (meal: SavedMeal) => {
    Alert.alert("Delete saved meal?", `"${meal.name}" will be removed permanently.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSavedMeal(meal.id);
            setSavedMeals((prev) => prev.filter((m) => m.id !== meal.id));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete meal.");
          }
        },
      },
    ]);
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
              onPress={() => brandPreferencesSheetRef.current?.present()}
              accessibilityRole="button"
              accessibilityLabel="Brand Preferences"
            >
              <Bookmark size={18} color="#8E9085" />
            </Pressable>
          ) : null}
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

          <FrequentMealsRow
            meals={frequentMeals}
            onLog={handleQuickLog}
            onAdjustPortions={handleAdjustPortions}
            loggingId={loggingId}
          />

          <SavedMealsRow
            meals={savedMeals}
            onLog={handleLogSavedMeal}
            onEdit={handleEditSavedMeal}
            onDelete={handleDeleteSavedMeal}
            onCreateNew={handleCreateSavedMeal}
            loggingId={savedLoggingId}
          />

          {dashboard ? (
            <TodayLogList meals={dashboard.meals} onEditIngredient={handleEditIngredient} onDeleteMeal={handleDeleteMeal} />
          ) : null}
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

      <BrandPreferencesSheet ref={brandPreferencesSheetRef} />
      <IngredientEditorSheet ref={ingredientSheetRef} target={editingIngredient} onSaved={handleIngredientSaved} />
      <PortionEditorSheet ref={portionSheetRef} meal={portionMeal} onLogged={handlePortionLogged} />
      <SavedMealEditorSheet
        ref={savedMealSheetRef}
        target={savedMealTarget}
        onSaved={handleSavedMealSaved}
        onLogged={handleSavedMealLogged}
      />
    </SafeAreaView>
  );
}
