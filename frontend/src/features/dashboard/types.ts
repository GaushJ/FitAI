import type { Macros } from "@/types/nutrition";
import type { MealLog } from "@/features/meals/types";
import type { UserProfile } from "@/features/settings/types";

export interface DashboardData {
  user: UserProfile;
  totals: Macros;
  meals: MealLog[];
}
