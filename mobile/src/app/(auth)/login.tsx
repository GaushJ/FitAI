import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { DotsBackground } from "@/components/layout/DotsBackground";
import { BrandLogo, SegmentedTabs } from "@/components/ui";
import { LoginForm, SignupForm } from "@/features/auth/components";
import { colors, shadows } from "@/theme/colors";

type AuthMode = "login" | "signup";

const TABS = [
  { id: "login" as const, label: "Sign in" },
  { id: "signup" as const, label: "Create account" },
];

/** Port of web's AuthScreen (minus its "Back to home" link — the app has no marketing page). */
export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const handleAuthSuccess = () => router.replace("/(tabs)/dashboard");

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center border-b border-line bg-surface px-4 py-3">
        <Text className="bg-ink px-2 py-1 font-mono text-xs uppercase tracking-widest text-white">Sign in</Text>
      </View>

      <View className="flex-1">
        <DotsBackground />
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerClassName="flex-grow items-center justify-center px-4 py-12" keyboardShouldPersistTaps="handled">
            <BrandLogo size="lg" />
            <Text className="mt-3 text-center font-mono text-xs uppercase tracking-widest text-ink-muted">
              {"// "}Macro tracking via voice, text &amp; labels
            </Text>

            <View className="mt-8 w-full max-w-md border border-ink bg-card p-6" style={shadows.hard}>
              <SegmentedTabs tabs={TABS} value={mode} onChange={setMode} tone="light" />
              <View className="mt-6">
                {mode === "login" ? (
                  <LoginForm onSuccess={handleAuthSuccess} onSwitchToSignup={() => setMode("signup")} />
                ) : (
                  <SignupForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setMode("login")} />
                )}
              </View>
            </View>

            <View className="mt-6 max-w-md flex-row items-center justify-center gap-2">
              <ShieldCheck size={16} color={colors.inkMuted} />
              <Text className="flex-shrink text-center font-sans text-sm text-ink-muted">
                Your meal logs are private to your account. No ads, no third-party trackers.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
