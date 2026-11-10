"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/molecules/BrandLogo";
import { SegmentedTabs } from "@/components/molecules/SegmentedTabs";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/useAuthSession";

type AuthMode = "login" | "signup";

const TABS = [
  { id: "login" as const, label: "Sign in" },
  { id: "signup" as const, label: "Create account" },
];

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  useRedirectIfAuthenticated("/dashboard");

  return (
    <div className="bg-dots flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-8">
        <span className="bg-ink px-2 py-1 font-mono text-xs uppercase tracking-widest text-white">Sign in</span>
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-ink">
          ← Back to home
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/" aria-label="GetFitBro home">
          <BrandLogo size="lg" />
        </Link>
        <p className="mt-3 text-center font-mono text-xs uppercase tracking-widest text-ink-muted">
          {"// "}Macro tracking via voice, text &amp; labels
        </p>

        <div className="mt-8 w-full max-w-md border border-ink bg-card p-6 shadow-hard sm:p-8">
          <SegmentedTabs tabs={TABS} value={mode} onChange={setMode} tone="light" />
          <div className="mt-6">
            {mode === "login" ? (
              <LoginForm onSwitchToSignup={() => setMode("signup")} />
            ) : (
              <SignupForm onSwitchToLogin={() => setMode("login")} />
            )}
          </div>
        </div>

        <p className="mt-6 flex max-w-md items-center justify-center gap-2 text-center text-sm text-ink-muted">
          <ShieldCheck className="size-4 shrink-0" />
          Your meal logs are private to your account. No ads, no third-party trackers.
        </p>
      </main>
    </div>
  );
}
