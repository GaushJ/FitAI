"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils, Sparkles, Loader2, AlertCircle, Eye, EyeOff,
  User, Lock, ArrowRight, UserPlus, LogIn,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Auth token helpers (shared with main page) ────────────────────────────────
export const AUTH_TOKEN_KEY = "fitvoice_auth_token";
export const AUTH_USER_KEY  = "fitvoice_auth_user";

export const getStoredToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

export const storeAuth = (token: string, user: { id: number; name: string; username: string }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

// ─────────────────────────────────────────────────────────────────────────────

type Tab = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");

  // Redirect if already logged in
  useEffect(() => {
    if (getStoredToken()) router.replace("/");
  }, [router]);

  // ── Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [loginError,    setLoginError]    = useState("");
  const [showLoginPwd,  setShowLoginPwd]  = useState(false);

  // ── Signup state
  const [signupName,     setSignupName]     = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm,  setSignupConfirm]  = useState("");
  const [signupLoading,  setSignupLoading]  = useState(false);
  const [signupError,    setSignupError]    = useState("");
  const [showSignupPwd,  setShowSignupPwd]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(""); setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed.");
      storeAuth(data.access_token, data.user);
      router.replace("/");
    } catch (err: any) {
      setLoginError(err.message || "Network error. Is the backend running?");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match."); return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters."); return;
    }
    setSignupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupUsername.trim().toLowerCase(),
          password: signupPassword,
          name: signupName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed.");
      storeAuth(data.access_token, data.user);
      router.replace("/");
    } catch (err: any) {
      setSignupError(err.message || "Network error. Is the backend running?");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center px-4 selection:bg-purple-500 selection:text-white relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[35rem] h-[35rem] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-10 z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-900/40">
          <Utensils className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-indigo-200 to-cyan-200 bg-clip-text text-transparent flex items-center justify-center gap-2">
            FitVoice
            <span className="text-[10px] font-semibold tracking-widest text-purple-400 border border-purple-500/30 bg-purple-500/5 px-2 py-0.5 rounded-full uppercase">Active AI</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Voice-driven macro tracking with AI</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-2xl z-10 overflow-hidden">

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setLoginError(""); setSignupError(""); }}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${
                tab === t
                  ? "text-purple-400 border-b-2 border-purple-500 bg-purple-950/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div className="p-8">

          {/* ── LOGIN FORM ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="your_username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showLoginPwd ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                  <button type="button" onClick={() => setShowLoginPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                    {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/40"
              >
                {loginLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  : <><ArrowRight className="w-4 h-4" /> Sign In</>}
              </button>

              <p className="text-center text-xs text-slate-500">
                No account yet?{" "}
                <button type="button" onClick={() => setTab("signup")}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition">
                  Create one →
                </button>
              </p>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Display Name</label>
                <div className="relative">
                  <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Gaurav"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="gaurav_fit"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/20 transition font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-600">Lowercase letters, numbers, underscores only.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showSignupPwd ? "text" : "password"}
                    required
                    placeholder="Min 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                  <button type="button" onClick={() => setShowSignupPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                    {showSignupPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition ${
                      signupConfirm && signupPassword !== signupConfirm
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-800 focus:border-purple-500/70 focus:ring-purple-500/20"
                    }`}
                  />
                </div>
                {signupConfirm && signupPassword !== signupConfirm && (
                  <p className="text-[10px] text-red-400">Passwords don't match.</p>
                )}
              </div>

              {signupError && (
                <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {signupError}
                </div>
              )}

              <button
                type="submit"
                disabled={signupLoading || (!!signupConfirm && signupPassword !== signupConfirm)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/40"
              >
                {signupLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                  : <><UserPlus className="w-4 h-4" /> Create Account</>}
              </button>

              <p className="text-center text-xs text-slate-500">
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition">
                  Sign in →
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-[10px] text-slate-700 z-10">
        Your data is private and never shared.
      </p>
    </div>
  );
}
