import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { DashboardScreen } from "@/features/dashboard/components/DashboardScreen";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardScreen />
    </RequireAuth>
  );
}
