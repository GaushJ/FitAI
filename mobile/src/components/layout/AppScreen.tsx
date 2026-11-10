import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { AppHeader } from "./AppHeader";
import { DotsBackground } from "./DotsBackground";

interface AppScreenProps {
  children: React.ReactNode;
  /** Pull-to-refresh; web reloads the page instead. */
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Every signed-in tab: header, dotted backdrop and the page's scrolling column (web's AppShell `<main>`). */
export function AppScreen({ children, onRefresh, refreshing = false }: AppScreenProps) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface">
      <AppHeader />
      <View className="flex-1">
        <DotsBackground />
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerClassName="px-4 py-6 pb-12"
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
            }
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
