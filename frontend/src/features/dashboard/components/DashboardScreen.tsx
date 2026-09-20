"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/hooks/useFeedback";
import { getStoredUser } from "@/lib/storage/authStorage";
import { ApiKeysModal } from "@/features/api-keys/components/ApiKeysModal";
import { useApiKeys } from "@/features/api-keys/hooks/useApiKeys";
import { useLogout } from "@/features/auth/hooks/useAuthSession";
import { BrandPreferencesModal } from "@/features/brand-preferences/components/BrandPreferencesModal";
import { useBrandPreferences } from "@/features/brand-preferences/hooks/useBrandPreferences";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { FeedbackBanners } from "@/features/dashboard/components/FeedbackBanners";
import { MacroSummary } from "@/features/dashboard/components/MacroSummary";
import { TipsCard } from "@/features/dashboard/components/TipsCard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { FrequentMealsSection } from "@/features/frequent-meals/components/FrequentMealsSection";
import { useFrequentMeals } from "@/features/frequent-meals/hooks/useFrequentMeals";
import { IngredientEditModal } from "@/features/meals/components/IngredientEditModal";
import { MealComposer } from "@/features/meals/components/MealComposer";
import { TodayMeals } from "@/features/meals/components/TodayMeals";
import { useDeleteMeal } from "@/features/meals/hooks/useDeleteMeal";
import { useExpandedMeals } from "@/features/meals/hooks/useExpandedMeals";
import type { IngredientEditTarget } from "@/features/meals/types";
import { SavedMealEditorModal } from "@/features/saved-meals/components/SavedMealEditorModal";
import { SavedMealsSection } from "@/features/saved-meals/components/SavedMealsSection";
import { blankDraft, draftFromLoggedMeal, draftFromSavedMeal } from "@/features/saved-meals/drafts";
import { useSavedMeals } from "@/features/saved-meals/hooks/useSavedMeals";
import type { SavedMealDraft } from "@/features/saved-meals/types";
import { MacroTargetsModal } from "@/features/settings/components/MacroTargetsModal";

type HeaderDialog = "api-keys" | "brands" | "targets";

export function DashboardScreen() {
  const router = useRouter();
  const logout = useLogout();
  const feedback = useFeedback();
  const { notifier } = feedback;

  const dashboard = useDashboardData(logout);
  const apiKeys = useApiKeys();
  const brands = useBrandPreferences();
  const expanded = useExpandedMeals();

  const frequent = useFrequentMeals({ notify: notifier, onLogged: dashboard.refresh });
  const refreshAfterLog = async () => {
    await dashboard.refresh();
    void frequent.refresh();
  };
  const saved = useSavedMeals({ notify: notifier, onLogged: refreshAfterLog });
  const deletion = useDeleteMeal(notifier, dashboard.refresh);

  const [dialog, setDialog] = useState<HeaderDialog | null>(null);
  const [mealDraft, setMealDraft] = useState<SavedMealDraft | null>(null);
  const [ingredientEdit, setIngredientEdit] = useState<IngredientEditTarget | null>(null);
  const closeDialog = () => setDialog(null);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 pb-16 font-sans text-slate-100 selection:bg-accent selection:text-ink">
      <div className="pointer-events-none absolute top-0 left-1/4 h-160 w-160 rounded-full bg-accent/5 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-140 w-140 rounded-full bg-accent/5 blur-[100px]" />

      <DashboardHeader
        streakDays={dashboard.profile.current_streak}
        username={getStoredUser()?.username ?? ""}
        missingKeyCount={apiKeys.missingCount}
        brandCount={brands.preferences.length}
        onOpenApiKeys={() => setDialog("api-keys")}
        onOpenBrands={() => setDialog("brands")}
        onOpenTargets={() => setDialog("targets")}
        onOpenProgress={() => router.push("/progress")}
        onLogout={logout}
      />

      <main className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-8 px-4 md:px-8 lg:grid-cols-12">
        <FeedbackBanners
          connectionError={dashboard.connectionError}
          error={feedback.error}
          success={feedback.success}
          onDismissError={feedback.dismissError}
          onDismissSuccess={feedback.dismissSuccess}
        />

        <section className="flex flex-col gap-6 lg:col-span-5">
          <MealComposer
            notify={notifier}
            onMealLogged={async (mealId) => {
              await refreshAfterLog();
              if (mealId) expanded.expand(mealId);
            }}
          />
          <TipsCard />
        </section>

        <section className="flex flex-col gap-6 lg:col-span-7">
          <MacroSummary totals={dashboard.totals} profile={dashboard.profile} loading={dashboard.loading} />
          <FrequentMealsSection frequent={frequent} />
          <SavedMealsSection
            meals={saved.meals}
            loggingId={saved.loggingId}
            onNew={() => setMealDraft(blankDraft())}
            onLog={saved.logAsSaved}
            onEdit={(meal) => setMealDraft(draftFromSavedMeal(meal))}
            onRemove={saved.remove}
          />
          <TodayMeals
            meals={dashboard.meals}
            loading={dashboard.loading}
            expandedIds={expanded.expandedIds}
            deletingId={deletion.deletingId}
            onToggle={expanded.toggle}
            onDelete={deletion.remove}
            onSaveAsMeal={(meal) => setMealDraft(draftFromLoggedMeal(meal))}
            onEditIngredient={setIngredientEdit}
          />
        </section>
      </main>

      {dialog === "api-keys" && <ApiKeysModal apiKeys={apiKeys} onClose={closeDialog} />}
      {dialog === "brands" && <BrandPreferencesModal brands={brands} onClose={closeDialog} />}
      {dialog === "targets" && (
        <MacroTargetsModal
          profile={dashboard.profile}
          onClose={closeDialog}
          onSaved={async () => {
            notifier.success("Macro targets updated!");
            closeDialog();
            await dashboard.refresh();
          }}
        />
      )}

      {ingredientEdit && (
        <IngredientEditModal
          target={ingredientEdit}
          onClose={() => setIngredientEdit(null)}
          onSaved={async () => {
            setIngredientEdit(null);
            notifier.success("Ingredient updated.");
            await dashboard.refresh();
          }}
        />
      )}

      {mealDraft && (
        <SavedMealEditorModal
          draft={mealDraft}
          notify={notifier}
          onClose={() => setMealDraft(null)}
          onTemplateSaved={saved.refresh}
          onLogged={refreshAfterLog}
        />
      )}
    </div>
  );
}
