import { ActivityIndicator, View } from "react-native";

interface LoadingSpinnerProps {
  color?: string;
}

export function LoadingSpinner({ color = "#C9F24D" }: LoadingSpinnerProps) {
  return (
    <View className="items-center justify-center p-4">
      <ActivityIndicator color={color} />
    </View>
  );
}
