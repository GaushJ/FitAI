import { useState } from "react";
import { Text, View } from "react-native";
import { ArrowRight, User } from "lucide-react-native";
import { Alert, Button, FormField } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "../AuthContext";
import { AuthInput, PasswordField } from "./AuthInputs";

// Port of web's LoginForm.
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
    // Web blocks this with the browser's `required` check; React Native has none.
    if (!username.trim() || !password) return setError("Enter your username and password.");
    setLoading(true);
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, "Network error. Is the backend running?"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-5">
      <FormField label="Username">
        <AuthInput icon={User} placeholder="your_handle" accessibilityLabel="Username" value={username} onChangeText={setUsername} />
      </FormField>

      <PasswordField label="Password" placeholder="••••••••" value={password} onChange={setPassword} revealable />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Button
        size="lg"
        fullWidth
        loading={loading}
        loadingText="Signing in..."
        icon={ArrowRight}
        iconAfter
        onPress={handleSubmit}
      >
        Sign in
      </Button>

      <View className="border-t border-line pt-5">
        <Text className="text-center font-sans text-sm text-ink-muted">
          No account?{" "}
          <Text onPress={onSwitchToSignup} accessibilityRole="button" className="font-mono-medium text-xs uppercase tracking-widest text-ink underline">
            Create one →
          </Text>
        </Text>
      </View>
    </View>
  );
}
