import { Text, type ColorValue } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { BarChart3, KeyRound, LayoutDashboard, Settings, Tags, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/features/auth/AuthContext";
import { ProfileProvider } from "@/features/profile/ProfileProvider";
import { colors } from "@/theme/colors";

// Same pages and icons as web's sidebar (frontend/src/features/app-shell/navItems.ts); labels are
// shortened to fit a tab bar, and each screen's PageHeader carries web's full title.
function tabIcon(Icon: LucideIcon) {
  // Active icons are red like web's active nav item; the tint colours below are plain hex strings.
  return function TabIcon({ focused }: { focused: boolean; color: ColorValue }) {
    return <Icon size={20} color={focused ? colors.primary : colors.inkMuted} />;
  };
}

function tabLabel(label: string) {
  return function TabLabel({ focused }: { focused: boolean }) {
    return (
      <Text
        className={`font-display-medium text-[11px] uppercase tracking-wide ${focused ? "font-display-semibold text-ink" : "text-ink-muted"}`}
      >
        {label}
      </Text>
    );
  };
}

/** Guards everything under (tabs) and shares the signed-in profile, like web's (app) layout. */
export default function TabsLayout() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <ProfileProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveBackgroundColor: colors.surfaceContainer,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        }}
      >
        <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: tabIcon(LayoutDashboard), tabBarLabel: tabLabel("Dashboard") }} />
        <Tabs.Screen name="brands" options={{ title: "Brand Preferences", tabBarIcon: tabIcon(Tags), tabBarLabel: tabLabel("Brands") }} />
        <Tabs.Screen name="progress" options={{ title: "Progress & Logs", tabBarIcon: tabIcon(BarChart3), tabBarLabel: tabLabel("Progress") }} />
        <Tabs.Screen name="api-keys" options={{ title: "API Keys", tabBarIcon: tabIcon(KeyRound), tabBarLabel: tabLabel("API Keys") }} />
        <Tabs.Screen name="settings" options={{ title: "Settings & Targets", tabBarIcon: tabIcon(Settings), tabBarLabel: tabLabel("Settings") }} />
      </Tabs>
    </ProfileProvider>
  );
}
