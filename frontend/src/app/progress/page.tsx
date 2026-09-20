import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { ProgressScreen } from "@/features/progress/components/ProgressScreen";

export default function ProgressPage() {
  return (
    <RequireAuth>
      <ProgressScreen />
    </RequireAuth>
  );
}
