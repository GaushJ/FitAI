import { useState } from "react";
import { View, Text } from "react-native";
import { User, Lock, ArrowRight } from "lucide-react-native";
import { Banner } from "@/components/ui";
import { useAuth } from "../AuthContext";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-4">
      <AuthField label="Username" icon={User} value={username} onChangeText={setUsername} placeholder="your_username" />
      <AuthField
        label="Password"
        icon={Lock}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureToggle
      />
      {error ? <Banner variant="error" message={error} /> : null}
      <AuthSubmitButton
        loading={loading}
        label="Sign In"
        loadingLabel="Signing in..."
        icon={ArrowRight}
        onPress={handleSubmit}
        disabled={!username.trim() || !password}
      />
      <Text className="text-center font-sans text-xs text-text-secondary">
        No account?{" "}
        <Text className="font-sans-semibold text-xs text-accent" onPress={onSwitchToSignup}>
          Create one →
        </Text>
      </Text>
    </View>
  );
}
