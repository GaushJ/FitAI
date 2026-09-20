"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, User } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { FormField } from "@/components/molecules/FormField";
import { login } from "@/features/auth/api";
import { useAuthSubmit } from "@/features/auth/hooks/useAuthSubmit";
import { AuthInput } from "@/features/auth/components/AuthInput";
import { PasswordField } from "@/features/auth/components/PasswordField";

export function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { loading, error, submit } = useAuthSubmit();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(() => login(username.trim(), password));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
      <FormField label="Username" labelClassName="text-slate-600">
        <AuthInput
          icon={User}
          type="text"
          required
          autoFocus
          placeholder="your_username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </FormField>

      <PasswordField
        label="Password"
        placeholder="••••••••"
        value={password}
        onChange={setPassword}
        revealable
      />

      {error && <Alert tone="error">{error}</Alert>}

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={loading}
        loadingText="Signing in..."
        icon={<ArrowRight />}
      >
        Sign In
      </Button>

      <p className="text-center text-xs text-slate-500">
        No account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="cursor-pointer text-xs font-semibold text-accent"
        >
          Create one →
        </button>
      </p>
    </form>
  );
}
