import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { SlidersHorizontal } from "lucide-react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { Alert, Button, PageHeader, Spinner } from "@/components/ui";
import { useFeedback } from "@/hooks/useFeedback";
import { useRemoteList } from "@/hooks/useRemoteList";
import { fetchBrandPreferences } from "@/features/brandPreferences/api";
import {
  BrandPreferencesCard,
  FrequentMealsSection,
  IngredientEditModal,
  MacroSummary,
  MealComposer,
  TodayMeals,
  type IngredientEditTarget,
} from "@/features/dashboard/components";
import { useDashboardData, useDeleteMeal, useExpandedMeals, useFrequentMeals } from "@/features/dashboard/hooks/useDashboardHooks";
import { UpgradeToProButton } from "@/features/payments/components/UpgradeToProButton";
import { useProfile } from "@/features/profile/ProfileProvider";
import { SavedMealEditorModal, SavedMealsSection } from "@/features/savedMeals/components";
import { blankDraft, draftFromLoggedMeal, draftFromSavedMeal } from "@/features/savedMeals/drafts";
import { useSavedMeals } from "@/features/savedMeals/hooks/useSavedMeals";
import type { SavedMealDraft } from "@/features/savedMeals/types";

const todayLabel = () => new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });

/** Same sections, order and copy as web's DashboardScreen at phone width. */
export default function DashboardScreen() {
  const router = useRouter();
  const feedback = useFeedback();
  const { notifier } = feedback;
  const account = useProfile();

  const dashboard = useDashboardData();
  const brands = useRemoteList(fetchBrandPreferences);
  const expanded = useExpandedMeals();

  // Logging or deleting can change the streak shown in the header.
  const refreshAll = async () => {
    await dashboard.refresh();
    void account.refresh();
  };
  const frequent = useFrequentMeals({ notify: notifier, onLogged: refreshAll });
  const refreshAfterLog = async () => {
    await refreshAll();
    void frequent.refresh();
  };
  const saved = useSavedMeals({ notify: notifier, onLogged: refreshAfterLog });
  const deletion = useDeleteMeal(notifier, refreshAll);

  const [mealDraft, setMealDraft] = useState<SavedMealDraft | null>(null);
  const [ingredientEdit, setIngredientEdit] = useState<IngredientEditTarget | null>(null);

  const openSettings = () => router.navigate("/(tabs)/settings");
  const openBrands = () => router.navigate("/(tabs)/brands");

  return (
    <AppScreen>
      <PageHeader
        eyebrow={`Today · ${todayLabel()}`}
        title="Macro dashboard"
        actions={
          <>
            <Button variant="outline" size="sm" icon={SlidersHorizontal} onPress={openSettings}>
              Adjust targets
            </Button>
            {!dashboard.profile.is_pro ? <UpgradeToProButton /> : null}
          </>
        }
      />

      <View className="gap-8">
        {dashboard.connectionError || feedback.error || feedback.success ? (
          <View className="gap-3">
            {dashboard.connectionError ? (
              <Alert tone="error" size="lg">
                {dashboard.connectionError}
              </Alert>
            ) : null}
            {feedback.error ? (
              <Alert tone="error" size="lg" onDismiss={feedback.dismissError}>
                {feedback.error}
              </Alert>
            ) : null}
            {feedback.success ? (
              <Alert tone="success" size="lg" onDismiss={feedback.dismissSuccess}>
                {feedback.success}
              </Alert>
            ) : null}
          </View>
        ) : null}

        {dashboard.loading ? (
          <Spinner />
        ) : (
          <MacroSummary totals={dashboard.totals} profile={dashboard.profile} onAdjustTargets={openSettings} />
        )}

        <MealComposer notify={notifier} onMealLogged={refreshAfterLog} onOpenBrandPreferences={openBrands} />
        <TodayMeals
          meals={dashboard.meals}
          totals={dashboard.totals}
          loading={dashboard.loading}
          expandedIds={expanded.expandedIds}
          deletingId={deletion.deletingId}
          onToggle={expanded.toggle}
          onDelete={deletion.remove}
          onSaveAsMeal={(meal) => setMealDraft(draftFromLoggedMeal(meal))}
          onEditIngredient={setIngredientEdit}
        />

        <FrequentMealsSection frequent={frequent} />
        <SavedMealsSection
          meals={saved.meals}
          loggingId={saved.loggingId}
          onNew={() => setMealDraft(blankDraft())}
          onLog={saved.logAsSaved}
          onEdit={(meal) => setMealDraft(draftFromSavedMeal(meal))}
          onRemove={saved.remove}
        />
        <BrandPreferencesCard count={brands.items.length} onOpen={openBrands} />
      </View>

      {ingredientEdit ? (
        <IngredientEditModal
          target={ingredientEdit}
          onClose={() => setIngredientEdit(null)}
          onSaved={async () => {
            setIngredientEdit(null);
            notifier.success("Ingredient updated.");
            await dashboard.refresh();
          }}
        />
      ) : null}

      {mealDraft ? (
        <SavedMealEditorModal
          draft={mealDraft}
          notify={notifier}
          onClose={() => setMealDraft(null)}
          onTemplateSaved={saved.refresh}
          onLogged={refreshAfterLog}
        />
      ) : null}
    </AppScreen>
  );
}
