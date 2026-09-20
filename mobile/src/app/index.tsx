import { Redirect } from "expo-router";
import { LoadingSpinner } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";

export default function RootIndex() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) return <LoadingSpinner />;

  return <Redirect href={user ? "/(tabs)/dashboard" : "/(auth)/login"} />;
}
