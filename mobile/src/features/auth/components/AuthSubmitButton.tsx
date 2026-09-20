import { ActivityIndicator, Pressable, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";

interface AuthSubmitButtonProps {
  loading: boolean;
  label: string;
  loadingLabel: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
}

/** Full-width accent submit button shared by the login and signup forms. */
export function AuthSubmitButton({ loading, label, loadingLabel, icon: Icon, onPress, disabled }: AuthSubmitButtonProps) {
  const isDisabled = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-sm bg-accent py-3.5 ${isDisabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="#0B0C09" />
          <Text className="font-sans-bold text-sm text-bg">{loadingLabel}</Text>
        </>
      ) : (
        <>
          <Text className="font-sans-bold text-sm text-bg">{label}</Text>
          <Icon size={15} color="#0B0C09" />
        </>
      )}
    </Pressable>
  );
}
