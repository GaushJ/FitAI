import { Redirect, Tabs } from "expo-router";
import { LayoutGrid, LineChart } from "lucide-react-native";
import { useAuth } from "@/features/auth/AuthContext";

/** Guards everything under (tabs) — the root layout already redirects before
 * this mounts in the normal flow, but this stays as a direct-navigation safety net. */
export default function TabsLayout() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#C9F24D",
        tabBarInactiveTintColor: "#6E7066",
        tabBarStyle: { backgroundColor: "#0E0F0A", borderTopColor: "rgba(255,255,255,0.06)" },
        tabBarLabelStyle: { fontFamily: "HankenGrotesk_600SemiBold", fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarIcon: ({ color, size }) => <LineChart color={color} size={size - 2} /> }}
      />
    </Tabs>
  );
}
