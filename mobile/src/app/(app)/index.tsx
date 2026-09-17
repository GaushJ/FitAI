import { View, Text } from "react-native";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui";

/**
 * Temporary placeholder — the real Dashboard (tabs, meal composer, macro
 * progress) is M2. This exists only to verify the M1 auth flow end to end:
 * login/signup lands here, and logging out returns to (auth)/login.
 */
export default function AppPlaceholderScreen() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-bg p-6">
      <Text className="font-display text-xl text-text-primary">Welcome, {user?.name}</Text>
      <Text className="text-center font-sans text-sm text-text-secondary">
        Dashboard arrives in M2 — this placeholder just confirms the auth flow works end to end.
      </Text>
      <Button onPress={() => logout()}>Log out</Button>
    </View>
  );
}
