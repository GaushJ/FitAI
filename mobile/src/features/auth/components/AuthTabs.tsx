import { View, Pressable, Text } from "react-native";
import { LogIn, UserPlus } from "lucide-react-native";

export type AuthTab = "login" | "signup";

interface AuthTabsProps {
  tab: AuthTab;
  onChange: (tab: AuthTab) => void;
}

export function AuthTabs({ tab, onChange }: AuthTabsProps) {
  return (
    <View className="flex-row border-b border-border-subtle">
      <TabButton
        active={tab === "login"}
        label="Sign In"
        icon={LogIn}
        onPress={() => onChange("login")}
      />
      <TabButton
        active={tab === "signup"}
        label="Create Account"
        icon={UserPlus}
        onPress={() => onChange("signup")}
      />
    </View>
  );
}

function TabButton({
  active,
  label,
  icon: Icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: typeof LogIn;
  onPress: () => void;
}) {
  const color = active ? "#C9F24D" : "#8E9085";
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-1.5 py-4"
      style={{ borderBottomWidth: 2, borderBottomColor: active ? "#C9F24D" : "transparent" }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Icon size={13} color={color} />
      <Text className="font-sans-bold text-xs" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}
