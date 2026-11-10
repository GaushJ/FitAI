import { useState } from "react";
import { Text, View } from "react-native";
import { User, UserPlus } from "lucide-react-native";
import { Alert, Button, FormField } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "../AuthContext";
import { AuthInput, PasswordField } from "./AuthInputs";

// Port of web's SignupForm.
const MIN_PASSWORD_LENGTH = 6;

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

  const mismatch = Boolean(confirm) && password !== confirm;

  const handleSubmit = async () => {
    setError("");
    if (!name.trim() || !username.trim()) return setError("Fill in your name and username.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    setLoading(true);
    try {
      await signup(name.trim(), username.trim().toLowerCase(), password);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, "Network error. Is the backend running?"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-4">
      <FormField label="Display name">
        <AuthInput icon={User} autoCapitalize="words" placeholder="Your Name" accessibilityLabel="Display name" value={name} onChangeText={setName} />
      </FormField>

      <FormField label="Username">
        <AuthInput
          icon={User}
          mono
          placeholder="your_handle"
          accessibilityLabel="Username"
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s+/g, "_"))}
        />
      </FormField>

      <PasswordField label="Password" placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`} value={password} onChange={setPassword} revealable />

      <View className="gap-2">
        <PasswordField label="Confirm password" placeholder="••••••••" value={confirm} onChange={setConfirm} invalid={mismatch} />
        {mismatch ? <Text className="font-sans text-xs text-danger">{"Passwords don't match."}</Text> : null}
      </View>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Button size="lg" fullWidth loading={loading} loadingText="Creating..." disabled={mismatch} icon={UserPlus} onPress={handleSubmit}>
        Create account
      </Button>

      <View className="border-t border-line pt-5">
        <Text className="text-center font-sans text-sm text-ink-muted">
          Already have an account?{" "}
          <Text onPress={onSwitchToLogin} accessibilityRole="button" className="font-mono-medium text-xs uppercase tracking-widest text-ink underline">
            Sign in →
          </Text>
        </Text>
      </View>
    </View>
  );
}
