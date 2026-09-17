import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/features/auth/AuthContext";

/** Guards everything under (app) — the root layout already redirects before
 * this mounts in the normal flow, but this stays as a direct-navigation safety net. */
export default function AppLayout() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
