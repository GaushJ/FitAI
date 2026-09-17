import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Dumbbell } from "lucide-react-native";
import { AuthTabs, LoginForm, SignupForm, type AuthTab } from "@/features/auth/components";

export default function LoginScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("login");

  const handleAuthSuccess = () => {
    router.replace("/(app)");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow items-center justify-center p-6" keyboardShouldPersistTaps="handled">
        <View className="mb-6 items-center gap-2">
          <View className="flex-row items-center gap-2">
            <Dumbbell size={22} color="#C9F24D" strokeWidth={1.8} />
            <Text className="font-display text-lg text-text-primary" style={{ letterSpacing: -0.4 }}>
              GetFitbro
            </Text>
          </View>
          <Text className="font-sans text-xs text-text-secondary">AI-powered macro tracking</Text>
        </View>

        <View className="w-full max-w-[420px] overflow-hidden rounded-lg border border-border-subtle bg-surface">
          <AuthTabs tab={tab} onChange={setTab} />
          <View className="p-6">
            {tab === "login" ? (
              <LoginForm onSuccess={handleAuthSuccess} onSwitchToSignup={() => setTab("signup")} />
            ) : (
              <SignupForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setTab("login")} />
            )}
          </View>
        </View>

        <Text className="mt-5 font-sans text-[10px] text-text-muted">Your data is private and never shared.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
