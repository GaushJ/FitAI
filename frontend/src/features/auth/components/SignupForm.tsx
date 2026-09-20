"use client";

import { useState, type FormEvent } from "react";
import { User, UserPlus } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { FormField } from "@/components/molecules/FormField";
import { signup } from "@/features/auth/api";
import { useAuthSubmit } from "@/features/auth/hooks/useAuthSubmit";
import { AuthInput } from "@/features/auth/components/AuthInput";
import { PasswordField } from "@/features/auth/components/PasswordField";

const MIN_PASSWORD_LENGTH = 6;

export function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { loading, error, setError, submit } = useAuthSubmit();

  const mismatch = Boolean(confirm) && password !== confirm;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    submit(() => signup({ username: username.trim().toLowerCase(), password, name: name.trim() }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Display Name" labelClassName="text-slate-600">
        <AuthInput
          icon={User}
          iconClassName="text-accent"
          type="text"
          required
          autoFocus
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <FormField label="Username" labelClassName="text-slate-600">
        <AuthInput
          icon={User}
          type="text"
          required
          placeholder="your_handle"
          className="font-mono"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
        />
      </FormField>

      <PasswordField
        label="Password"
        placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`}
        value={password}
        onChange={setPassword}
        revealable
      />

      <PasswordField
        label="Confirm Password"
        placeholder="••••••••"
        value={confirm}
        onChange={setConfirm}
        invalid={mismatch}
      />

      {mismatch && <p className="-mt-2 text-[11px] text-red-400">Passwords don&apos;t match.</p>}
      {error && <Alert tone="error">{error}</Alert>}

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={loading}
        loadingText="Creating..."
        disabled={mismatch}
        icon={<UserPlus />}
      >
        Create Account
      </Button>

      <p className="text-center text-xs text-slate-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="cursor-pointer text-xs font-semibold text-accent"
        >
          Sign in →
        </button>
      </p>
    </form>
  );
}
