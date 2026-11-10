import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AppShell } from "@/features/app-shell/components/AppShell";
import { ProfileProvider } from "@/features/profile/ProfileProvider";

/** Every signed-in page: auth gate, shared profile, sidebar shell. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <ProfileProvider>
        <AppShell>{children}</AppShell>
      </ProfileProvider>
    </RequireAuth>
  );
}
