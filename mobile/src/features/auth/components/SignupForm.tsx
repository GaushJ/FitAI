import { useState } from "react";
import { View, Text } from "react-native";
import { User, Lock, UserPlus } from "lucide-react-native";
import { Banner } from "@/components/ui";
import { useAuth } from "../AuthContext";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";

interface SignupFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = name.trim() && username.trim() && password.length >= 6 && password === confirm;

  const handleUsernameChange = (text: string) => {
    setUsername(text.toLowerCase().replace(/\s+/g, "_"));
  };

  const handleSubmit = async () => {
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-3.5">
      <AuthField label="Display Name" icon={User} iconColor="#C9F24D" value={name} onChangeText={setName} placeholder="Your Name" />
      <AuthField
        label="Username"
        icon={User}
        value={username}
        onChangeText={handleUsernameChange}
        placeholder="your_handle"
        mono
      />
      <AuthField
        label="Password"
        icon={Lock}
        value={password}
        onChangeText={setPassword}
        placeholder="Min 6 characters"
        secureToggle
      />
      <AuthField
        label="Confirm Password"
        icon={Lock}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="••••••••"
        secureToggle
        borderColor={mismatch ? "rgba(239,68,68,0.5)" : undefined}
      />
      {mismatch ? <Text className="-mt-1.5 font-sans text-[11px] text-danger">Passwords don't match.</Text> : null}
      {error ? <Banner variant="error" message={error} /> : null}
      <AuthSubmitButton
        loading={loading}
        label="Create Account"
        loadingLabel="Creating..."
        icon={UserPlus}
        onPress={handleSubmit}
        disabled={!canSubmit}
      />
      <Text className="text-center font-sans text-xs text-text-secondary">
        Already have an account?{" "}
        <Text className="font-sans-semibold text-xs text-accent" onPress={onSwitchToLogin}>
          Sign in →
        </Text>
      </Text>
    </View>
  );
}
