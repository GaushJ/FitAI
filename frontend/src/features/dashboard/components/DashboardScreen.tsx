"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { buttonClasses } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { useFeedback } from "@/hooks/useFeedback";
import { PageHeader } from "@/features/app-shell/components/PageHeader";
import { useLogout } from "@/features/auth/hooks/useAuthSession";
import { useBrandPreferences } from "@/features/brand-preferences/hooks/useBrandPreferences";
import { BrandPreferencesCard } from "@/features/dashboard/components/BrandPreferencesCard";
import { FeedbackBanners } from "@/features/dashboard/components/FeedbackBanners";
import { MacroSummary } from "@/features/dashboard/components/MacroSummary";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { FrequentMealsSection } from "@/features/frequent-meals/components/FrequentMealsSection";
import { useFrequentMeals } from "@/features/frequent-meals/hooks/useFrequentMeals";
import { IngredientEditModal } from "@/features/meals/components/IngredientEditModal";
import { MealComposer } from "@/features/meals/components/MealComposer";
import { TodayMeals } from "@/features/meals/components/TodayMeals";
import { useDeleteMeal } from "@/features/meals/hooks/useDeleteMeal";
import { useExpandedMeals } from "@/features/meals/hooks/useExpandedMeals";
import type { IngredientEditTarget } from "@/features/meals/types";
import { UpgradeToProButton } from "@/features/payments/components/UpgradeToProButton";
import { useProfile } from "@/features/profile/ProfileProvider";
import { SavedMealEditorModal } from "@/features/saved-meals/components/SavedMealEditorModal";
import { SavedMealsSection } from "@/features/saved-meals/components/SavedMealsSection";
import { blankDraft, draftFromLoggedMeal, draftFromSavedMeal } from "@/features/saved-meals/drafts";
import { useSavedMeals } from "@/features/saved-meals/hooks/useSavedMeals";
import type { SavedMealDraft } from "@/features/saved-meals/types";

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });

export function DashboardScreen() {
  const logout = useLogout();
  const feedback = useFeedback();
  const { notifier } = feedback;
  const account = useProfile();

  const dashboard = useDashboardData(logout);
  const brands = useBrandPreferences();
  const expanded = useExpandedMeals();

  // Logging or deleting can change the streak shown in the sidebar.
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

  return (
    <>
      <PageHeader
        eyebrow={`Today · ${todayLabel()}`}
        title="Macro dashboard"
        actions={
          <>
            <Link href="/settings" className={buttonClasses({ variant: "outline", size: "sm" })}>
              <SlidersHorizontal className="size-3.5" /> Adjust targets
            </Link>
            {!dashboard.profile.is_pro && <UpgradeToProButton notify={notifier} onConfirmed={refreshAll} />}
          </>
        }
      />

      <div className="space-y-8">
        <FeedbackBanners
          connectionError={dashboard.connectionError}
          error={feedback.error}
          success={feedback.success}
          onDismissError={feedback.dismissError}
          onDismissSuccess={feedback.dismissSuccess}
        />

        {dashboard.loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : (
          <MacroSummary totals={dashboard.totals} profile={dashboard.profile} />
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="flex flex-col gap-8 lg:col-span-7">
            <MealComposer
              notify={notifier}
              onMealLogged={async (mealId) => {
                await refreshAfterLog();
                if (mealId) expanded.expand(mealId);
              }}
            />
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
          </section>

          <section className="flex flex-col gap-8 lg:col-span-5">
            <FrequentMealsSection frequent={frequent} />
            <SavedMealsSection
              meals={saved.meals}
              loggingId={saved.loggingId}
              onNew={() => setMealDraft(blankDraft())}
              onLog={saved.logAsSaved}
              onEdit={(meal) => setMealDraft(draftFromSavedMeal(meal))}
              onRemove={saved.remove}
            />
            <BrandPreferencesCard count={brands.preferences.length} />
          </section>
        </div>
      </div>

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
    </>
  );
}
