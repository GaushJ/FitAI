"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/molecules/BrandLogo";
import { AuthTabBar } from "@/features/auth/components/AuthTabBar";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/useAuthSession";

type AuthMode = "login" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  useRedirectIfAuthenticated("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-4 py-6 text-slate-100">
      <div className="pointer-events-none absolute top-0 left-1/4 size-160 rounded-full bg-[radial-gradient(ellipse,rgba(201,242,77,0.07),transparent_70%)] blur-[60px]" />
      <div className="pointer-events-none absolute right-[20%] bottom-0 size-120 rounded-full bg-[radial-gradient(ellipse,rgba(201,242,77,0.05),transparent_70%)] blur-[60px]" />

      <div className="relative mb-8 flex flex-col items-center gap-3">
        <Link href="/" aria-label="GetFitbro home">
          <BrandLogo size="lg" />
        </Link>
        <p className="text-[13px] text-slate-500">AI-powered macro tracking</p>
      </div>

      <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/[0.09] bg-[linear-gradient(160deg,#16180F,#0E0F0A)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]">
        <AuthTabBar
          value={mode}
          onChange={setMode}
          tabs={[
            { id: "login", label: "Sign In", icon: <LogIn className="size-3.5" /> },
            { id: "signup", label: "Create Account", icon: <UserPlus className="size-3.5" /> },
          ]}
        />

        <div className="px-7 pt-7 pb-8">
          {mode === "login" ? (
            <LoginForm onSwitchToSignup={() => setMode("signup")} />
          ) : (
            <SignupForm onSwitchToLogin={() => setMode("login")} />
          )}
        </div>
      </div>

      <p className="mt-6 text-[11px] text-slate-700">Your data is private and never shared.</p>
    </div>
  );
}
