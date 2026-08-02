"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Eye, EyeOff, User, Lock, ArrowRight, UserPlus, LogIn } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

type Tab = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");

  useEffect(() => {
    if (getStoredToken()) router.replace("/dashboard");
  }, [router]);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [loginError,    setLoginError]    = useState("");
  const [showLoginPwd,  setShowLoginPwd]  = useState(false);

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
      router.replace("/dashboard");
    } catch (err: any) {
      setLoginError(err.message || "Network error. Is the backend running?");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (signupPassword !== signupConfirm) { setSignupError("Passwords do not match."); return; }
    if (signupPassword.length < 6) { setSignupError("Password must be at least 6 characters."); return; }
    setSignupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: signupUsername.trim().toLowerCase(), password: signupPassword, name: signupName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed.");
      storeAuth(data.access_token, data.user);
      router.replace("/dashboard");
    } catch (err: any) {
      setSignupError(err.message || "Network error. Is the backend running?");
    } finally {
      setSignupLoading(false);
    }
  };

  const inputCls = "w-full bg-[#0B0C09] border border-white/[0.09] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F4F5EF] placeholder:text-[#6E7066] focus:outline-none focus:border-[#C9F24D]/60 focus:ring-1 focus:ring-[#C9F24D]/20 transition";

  return (
    <div style={{ minHeight: "100vh", background: "#0B0C09", color: "#F4F5EF", fontFamily: "'Hanken Grotesk', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" }}>

      {/* Glows */}
      <div style={{ position: "absolute", top: 0, left: "25%", width: "40rem", height: "40rem", background: "radial-gradient(ellipse,rgba(201,242,77,0.07),transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, right: "20%", width: "30rem", height: "30rem", background: "radial-gradient(ellipse,rgba(201,242,77,0.05),transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 32, position: "relative" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "#C9F24D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MicIcon />
          </div>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", color: "#F4F5EF" }}>FitVoice</span>
        </a>
        <p style={{ fontSize: 13, color: "#8E9085" }}>Voice-driven macro tracking with AI</p>
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 420, background: "linear-gradient(160deg,#16180F,#0E0F0A)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.7)", position: "relative" }}>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setLoginError(""); setSignupError(""); }}
              style={{
                flex: 1, padding: "16px 0", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                background: "none", border: "none", cursor: "pointer", transition: "color .15s",
                color: tab === t ? "#C9F24D" : "#8E9085",
                borderBottom: tab === t ? "2px solid #C9F24D" : "2px solid transparent",
              }}
            >
              {t === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div style={{ padding: "28px 28px 32px" }}>

          {/* LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Username">
                <User size={15} color="#8E9085" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" required autoFocus placeholder="your_username" value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Password">
                <Lock size={15} color="#8E9085" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showLoginPwd ? "text" : "password"} required placeholder="••••••••" value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)} className={inputCls} style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowLoginPwd((p) => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6E7066" }}>
                  {showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </Field>
              {loginError && <ErrorMsg text={loginError} />}
              <SubmitBtn loading={loginLoading} label="Sign In" loadingLabel="Signing in..." icon={<ArrowRight size={15} />} />
              <p style={{ textAlign: "center", fontSize: 12, color: "#8E9085" }}>
                No account?{" "}
                <button type="button" onClick={() => setTab("signup")}
                  style={{ background: "none", border: "none", color: "#C9F24D", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                  Create one →
                </button>
              </p>
            </form>
          )}

          {/* SIGNUP */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Display Name">
                <User size={15} color="#C9F24D" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" required autoFocus placeholder="Your Name" value={signupName}
                  onChange={(e) => setSignupName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Username">
                <User size={15} color="#8E9085" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" required placeholder="your_handle" value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  className={inputCls} style={{ fontFamily: "'JetBrains Mono', monospace" }} />
              </Field>
              <Field label="Password">
                <Lock size={15} color="#8E9085" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showSignupPwd ? "text" : "password"} required placeholder="Min 6 characters" value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)} className={inputCls} style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowSignupPwd((p) => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6E7066" }}>
                  {showSignupPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </Field>
              <Field label="Confirm Password">
                <Lock size={15} color="#8E9085" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="password" required placeholder="••••••••" value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: signupConfirm && signupPassword !== signupConfirm ? "rgba(239,68,68,0.5)" : undefined }} />
              </Field>
              {signupConfirm && signupPassword !== signupConfirm && (
                <p style={{ fontSize: 11, color: "#f87171", marginTop: -8 }}>Passwords don't match.</p>
              )}
              {signupError && <ErrorMsg text={signupError} />}
              <SubmitBtn loading={signupLoading} label="Create Account" loadingLabel="Creating..." icon={<UserPlus size={15} />}
                disabled={!!signupConfirm && signupPassword !== signupConfirm} />
              <p style={{ textAlign: "center", fontSize: 12, color: "#8E9085" }}>
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")}
                  style={{ background: "none", border: "none", color: "#C9F24D", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                  Sign in →
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: "#3A3D2E" }}>Your data is private and never shared.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7066" }}>{label}</label>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 12, padding: "10px 14px", fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {text}
    </div>
  );
}

function SubmitBtn({ loading, label, loadingLabel, icon, disabled }: { loading: boolean; label: string; loadingLabel: string; icon: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="submit" disabled={loading || disabled}
      style={{ width: "100%", background: "#C9F24D", border: "none", color: "#0B0C09", fontSize: 14, fontWeight: 700, cursor: loading || disabled ? "not-allowed" : "pointer", padding: "14px 0", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .15s, opacity .15s", opacity: loading || disabled ? 0.5 : 1 }}
      onMouseEnter={(e) => { if (!loading && !disabled) (e.currentTarget as HTMLButtonElement).style.background = "#D4F56A"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#C9F24D"; }}
    >
      {loading ? <><Loader2 size={15} className="animate-spin" /> {loadingLabel}</> : <>{icon} {label}</>}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0B0C09" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
