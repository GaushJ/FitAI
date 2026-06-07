"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic, Square, Flame, Dumbbell, Settings, Check, AlertCircle,
  Loader2, Utensils, Calendar, Apple, TrendingUp, Sparkles,
  Tag, Trash2, ChevronDown, ChevronUp, Upload, X, BookMarked,
  Plus, KeyRound, Eye, EyeOff, ChevronDown as CaretDown, ShieldCheck
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  current_streak: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
}

interface Ingredient {
  name: string;
  brand: string | null;
  weight_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface MealLog {
  id: number;
  raw_transcript: string;
  date: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  ingredients: Ingredient[];
}

interface BrandPref {
  ingredient_name: string;
  preferred_brand: string;
}

interface APIKeyInfo {
  provider: string;
  label: string;
  description: string;
  env_key: string;
  is_set: boolean;
  masked_key: string;
}

// Backend API base URL — falls back to localhost for local development.
// Set NEXT_PUBLIC_API_URL in your hosting provider's env vars (e.g. Vercel)
// to point at your deployed backend (e.g. https://fitvoice-backend.onrender.com).
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "from-orange-500 to-amber-500",
  openai:    "from-emerald-500 to-teal-500",
  groq:      "from-purple-500 to-violet-500",
  gemini:    "from-blue-500 to-cyan-500",
  tavily:    "from-rose-500 to-pink-500",
};

const PROVIDER_BADGES: Record<string, string> = {
  anthropic: "Required",
  openai:    "Optional",
  groq:      "Optional",
  gemini:    "Optional",
  tavily:    "Optional",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  // ── Core state
  const [profile, setProfile] = useState<UserProfile>({
    name: "Gaurav", current_streak: 0,
    target_calories: 2000, target_protein: 150, target_carbs: 200, target_fat: 65,
  });
  const [totals, setTotals]   = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [meals, setMeals]     = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Recording / processing state
  const [isRecording, setIsRecording]   = useState(false);
  const [recordTime, setRecordTime]     = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textQuery, setTextQuery]       = useState("");
  const [errorMsg, setErrorMsg]         = useState("");
  const [successMsg, setSuccessMsg]     = useState("");

  // ── Settings drawer
  const [showConfig, setShowConfig]   = useState(false);
  const [editName, setEditName]       = useState(profile.name);
  const [editCalories, setEditCalories] = useState(profile.target_calories);
  const [editProtein, setEditProtein] = useState(profile.target_protein);
  const [editCarbs, setEditCarbs]     = useState(profile.target_carbs);
  const [editFat, setEditFat]         = useState(profile.target_fat);

  // ── Brand preferences state
  const [brandPrefs, setBrandPrefs]       = useState<BrandPref[]>([]);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandTab, setBrandTab]           = useState<"name" | "label">("name");
  const [prefIngredient, setPrefIngredient] = useState("");
  const [prefBrand, setPrefBrand]         = useState("");
  const [labelFile, setLabelFile]         = useState<File | null>(null);
  const [labelPreview, setLabelPreview]   = useState("");
  const [brandSaving, setBrandSaving]     = useState(false);
  const [brandMsg, setBrandMsg]           = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [extractedMacros, setExtractedMacros] = useState<Record<string, number> | null>(null);

  // ── API Keys state
  const [apiKeys, setApiKeys]             = useState<APIKeyInfo[]>([]);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [keyInput, setKeyInput]           = useState("");
  const [showKeyInput, setShowKeyInput]   = useState(false);
  const [keySaving, setKeySaving]         = useState(false);
  const [keyMsg, setKeyMsg]               = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [providerDropOpen, setProviderDropOpen] = useState(false);

  // ── STT engine settings (dev-only toggle: cloud vs local Whisper)
  const [sttSettings, setSttSettings] = useState<{
    allow_local_choice: boolean;
    current_mode: string;
    is_production: boolean;
    modes: Array<{ value: string; label: string; description: string }>;
  } | null>(null);
  const [sttSaving, setSttSaving] = useState(false);

  // ── Expanded meal cards
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set());

  // ── Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const timerRef         = useRef<NodeJS.Timeout | null>(null);
  const labelInputRef    = useRef<HTMLInputElement>(null);

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard`);
      if (!res.ok) throw new Error("Backend connection failed");
      const data = await res.json();
      setProfile(data.user);
      setTotals(data.totals);
      setMeals(data.meals);
      setEditName(data.user.name);
      setEditCalories(data.user.target_calories);
      setEditProtein(data.user.target_protein);
      setEditCarbs(data.user.target_carbs);
      setEditFat(data.user.target_fat);
      setErrorMsg("");
    } catch (err) {
      console.error(err);
      setErrorMsg(`Unable to connect to the FastAPI backend (${API_BASE}). Please ensure it is running and reachable.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandPrefs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/brand-preferences`);
      if (res.ok) setBrandPrefs(await res.json());
    } catch { /* silent */ }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/keys`);
      if (res.ok) setApiKeys(await res.json());
    } catch { /* silent */ }
  };

  const fetchSttSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stt-settings`);
      if (res.ok) setSttSettings(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchBrandPrefs();
    fetchApiKeys();
    fetchSttSettings();
  }, []);

  // ─── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordTime((p) => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // ─── Recording ─────────────────────────────────────────────────────────────

  const startRecording = async () => {
    setErrorMsg(""); setSuccessMsg("");
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let opts = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported(opts.mimeType)) opts = { mimeType: "audio/ogg" };
      if (!MediaRecorder.isTypeSupported(opts.mimeType)) (opts as any) = {};
      const mr = new MediaRecorder(stream, opts);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || "audio/webm" });
        await handleAudioUpload(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(200);
      setIsRecording(true);
    } catch (err) {
      setErrorMsg("Failed to access your microphone. Please verify browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (blob: Blob) => {
    setIsProcessing(true); setErrorMsg(""); setSuccessMsg("");
    const fd = new FormData();
    fd.append("file", blob, "recording.webm");
    try {
      const res = await fetch(`${API_BASE}/api/transcribe`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).detail || "Transcription failed");
      const data = await res.json();
      setTextQuery(data.transcript);
      setSuccessMsg("Voice transcribed! Review and edit below, then click Confirm & Log.");
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while transcribing.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Meal submit ───────────────────────────────────────────────────────────

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textQuery.trim()) return;
    setIsProcessing(true); setErrorMsg(""); setSuccessMsg("");
    const fd = new FormData();
    fd.append("text", textQuery.trim());
    try {
      const res = await fetch(`${API_BASE}/api/track-meal`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).detail || "Macro parsing failed");
      const result = await res.json();
      setSuccessMsg(`Meal logged! ${Math.round(result.macros?.calories ?? 0)} kcal tracked.`);
      setTextQuery("");
      await fetchDashboardData();
      // Auto-expand the newest meal
      setExpandedMeals((prev) => {
        const next = new Set(prev);
        if (result.id) next.add(result.id);
        return next;
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while processing meal.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Profile update ────────────────────────────────────────────────────────

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          target_calories: Number(editCalories),
          target_protein: Number(editProtein),
          target_carbs: Number(editCarbs),
          target_fat: Number(editFat),
        }),
      });
      if (!res.ok) throw new Error("Failed to update targets");
      setSuccessMsg("Macro targets updated!");
      setShowConfig(false);
      await fetchDashboardData();
    } catch (err: any) {
      setErrorMsg("Error saving profile.");
    }
  };

  // ─── STT engine mode (dev-only) ────────────────────────────────────────────

  const handleSttModeChange = async (mode: string) => {
    if (!sttSettings || sttSettings.is_production) return;
    setSttSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/stt-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error("Failed to update STT mode");
      await fetchSttSettings();
      setSuccessMsg(`Speech-to-text engine switched to "${sttSettings.modes.find(m => m.value === mode)?.label}".`);
    } catch {
      setErrorMsg("Failed to update STT engine preference.");
    } finally {
      setSttSaving(false);
    }
  };

  // ─── Brand preferences ─────────────────────────────────────────────────────

  const handleSaveBrandByName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefIngredient.trim() || !prefBrand.trim()) return;
    setBrandSaving(true); setBrandMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/brand-preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_name: prefIngredient.trim(), preferred_brand: prefBrand.trim() }),
      });
      if (!res.ok) throw new Error("Save failed");
      setBrandMsg({ type: "ok", text: `Saved! Next time you log "${prefIngredient}", the AI will use "${prefBrand}" data.` });
      setPrefIngredient(""); setPrefBrand("");
      await fetchBrandPrefs();
    } catch {
      setBrandMsg({ type: "err", text: "Failed to save brand preference." });
    } finally {
      setBrandSaving(false);
    }
  };

  const handleSaveBrandByLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefIngredient.trim() || !prefBrand.trim() || !labelFile) return;
    setBrandSaving(true); setBrandMsg(null); setExtractedMacros(null);
    const fd = new FormData();
    fd.append("ingredient_name", prefIngredient.trim());
    fd.append("preferred_brand", prefBrand.trim());
    fd.append("image", labelFile);
    try {
      const res = await fetch(`${API_BASE}/api/brand-preferences/label`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).detail || "Extraction failed");
      const data = await res.json();
      setExtractedMacros(data.macros);
      setBrandMsg({ type: "ok", text: `Label read! Exact macros for "${prefBrand} ${prefIngredient}" saved permanently.` });
      setPrefIngredient(""); setPrefBrand(""); setLabelFile(null); setLabelPreview("");
      await fetchBrandPrefs();
    } catch (err: any) {
      setBrandMsg({ type: "err", text: err.message || "Failed to extract label." });
    } finally {
      setBrandSaving(false);
    }
  };

  const handleDeletePref = async (name: string) => {
    try {
      await fetch(`${API_BASE}/api/brand-preferences/${encodeURIComponent(name)}`, { method: "DELETE" });
      await fetchBrandPrefs();
    } catch { /* silent */ }
  };

  const handleLabelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLabelFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLabelPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setExtractedMacros(null);
  };

  // ─── API Key handlers ──────────────────────────────────────────────────────

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !keyInput.trim()) return;
    setKeySaving(true); setKeyMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, api_key: keyInput.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Save failed");
      setKeyMsg({ type: "ok", text: "API key saved and hot-loaded — no restart needed!" });
      setKeyInput(""); setShowKeyInput(false);
      await fetchApiKeys();
    } catch (err: any) {
      setKeyMsg({ type: "err", text: err.message || "Failed to save key." });
    } finally {
      setKeySaving(false);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    try {
      await fetch(`${API_BASE}/api/keys/${provider}`, { method: "DELETE" });
      await fetchApiKeys();
      if (selectedProvider === provider) { setKeyInput(""); setKeyMsg(null); }
    } catch { /* silent */ }
  };

  const selectedKeyInfo = apiKeys.find((k) => k.provider === selectedProvider);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const pct = (cur: number, tgt: number) => (!tgt ? 0 : Math.min(Math.round((cur / tgt) * 100), 150));
  const barColor = (p: number) =>
    p > 100 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
    : p > 85  ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
    : "bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]";

  const toggleMeal = (id: number) =>
    setExpandedMeals((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const macroActual = (perHundred: number, weightG: number) =>
    Math.round((perHundred * weightG) / 100 * 10) / 10;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white pb-16">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[35rem] h-[35rem] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-200 to-cyan-200 bg-clip-text text-transparent flex items-center gap-1.5">
              FitVoice <span className="text-[10px] font-semibold tracking-widest text-purple-400 border border-purple-500/30 bg-purple-500/5 px-2 py-0.5 rounded-full uppercase">Active AI</span>
            </h1>
            <p className="text-[10px] text-slate-500">Voice-Driven Micro Macro Resolution</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-semibold">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-slate-300">Streak:</span>
            <span className="text-orange-400 font-bold text-sm">{profile.current_streak} days</span>
          </div>

          {/* API Keys button */}
          <button
            onClick={() => { setShowKeysModal(true); setKeyMsg(null); setSelectedProvider(""); setKeyInput(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
            title="Manage API Keys"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">API Keys</span>
            {apiKeys.filter((k) => !k.is_set).length > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {apiKeys.filter((k) => !k.is_set).length} missing
              </span>
            )}
          </button>

          {/* Brand preferences button */}
          <button
            onClick={() => { setShowBrandModal(true); setBrandMsg(null); setExtractedMacros(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
            title="Brand Preferences"
          >
            <BookMarked className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Brands</span>
            {brandPrefs.length > 0 && (
              <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{brandPrefs.length}</span>
            )}
          </button>

          <button
            onClick={() => setShowConfig(true)}
            className="w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-slate-800 transition border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200"
            title="Configure Targets"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Global messages */}
        {(errorMsg || successMsg) && (
          <div className="lg:col-span-12 space-y-3">
            {errorMsg && (
              <div className="bg-red-950/30 border border-red-500/20 text-red-300 p-4 rounded-xl flex items-center gap-3 text-sm shadow-lg backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="flex-1">{errorMsg}</span>
                <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-200 font-semibold px-2">×</button>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-sm shadow-lg backdrop-blur-sm">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="flex-1 font-medium">{successMsg}</span>
                <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-200 font-semibold px-2">×</button>
              </div>
            )}
          </div>
        )}

        {/* ── Left column: Voice panel ── */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden shadow-2xl min-h-[420px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-600/10 rounded-full blur-[40px] pointer-events-none" />

            <div className="w-full flex justify-between items-center z-10">
              <div className="flex items-center gap-2 bg-purple-950/30 border border-purple-500/15 px-3 py-1 rounded-full text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" /> Speech Recognition
              </div>
              {isRecording && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping mr-1" />
                  REC {formatTime(recordTime)}
                </div>
              )}
            </div>

            {/* Mic button */}
            <div className="my-8 flex flex-col items-center justify-center z-10">
              {isProcessing ? (
                <div className="w-32 h-32 rounded-full border border-slate-800 bg-slate-950/80 flex items-center justify-center flex-col gap-2 shadow-2xl">
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 animate-pulse">Analyzing</span>
                </div>
              ) : isRecording ? (
                <button onClick={stopRecording} className="w-32 h-32 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 hover:scale-105 transition active:scale-95 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.4)] relative cursor-pointer group">
                  <span className="absolute inset-0 rounded-full bg-red-600/30 animate-ping pointer-events-none" />
                  <Square className="w-10 h-10 text-white fill-white group-hover:scale-90 transition-transform" />
                </button>
              ) : (
                <button onClick={startRecording} className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:shadow-[0_0_60px_rgba(124,58,237,0.5)] cursor-pointer group relative">
                  <Mic className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                </button>
              )}
              <h3 className="mt-6 text-lg font-bold text-slate-100">
                {isRecording ? "Listening..." : isProcessing ? "Resolving ingredients..." : "Log your meal with voice"}
              </h3>
              <p className="mt-2 text-xs text-slate-400 max-w-[280px]">
                {isRecording
                  ? "Tap the red button to stop recording."
                  : isProcessing
                  ? "Whisper is transcribing and the AI is resolving nutrition data..."
                  : "Tap the mic and say what you ate. E.g. 'I had 200ml Nandini milk and 2 eggs'."}
              </p>
            </div>

            {/* Text confirm form */}
            <form onSubmit={handleTextSubmit} className="w-full mt-auto pt-6 border-t border-slate-900 flex flex-col gap-4 z-10">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-purple-400" /> Transcript / Manual Input
                </label>
                <textarea
                  rows={3}
                  placeholder="Transcribed voice will appear here, or type manually..."
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  disabled={isRecording || isProcessing}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-600/80 focus:ring-1 focus:ring-purple-600/20 disabled:opacity-50 resize-none leading-relaxed shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isRecording || isProcessing || !textQuery.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.01] active:scale-[0.99] hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-950/30 disabled:opacity-40 disabled:hover:scale-100 rounded-xl py-3 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Resolving Macros...</>
                ) : (
                  <><Sparkles className="w-4 h-4 text-purple-200" /> Confirm, Resolve Macros & Log</>
                )}
              </button>
            </form>
          </div>

          {/* Tips card */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex gap-3 text-xs text-slate-400">
            <Dumbbell className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-300">Tips</p>
              <p className="mt-1 leading-normal">
                Say brand names naturally — "200ml Nandini milk" or "1 scoop Optimum Nutrition whey".
                Save brand preferences via the <span className="text-purple-400 font-semibold">Brands</span> button to lock in exact label macros forever.
              </p>
            </div>
          </div>
        </section>

        {/* ── Right column ── */}
        <section className="lg:col-span-7 flex flex-col gap-6">

          {/* Dashboard summary */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> Today's Macros
                </h2>
                <p className="text-xs text-slate-500">Logged intake vs. daily targets</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Calories</span>
                <p className="text-lg font-black text-purple-400">{pct(totals.calories, profile.target_calories)}%</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Calories bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-300">Calories (kcal)</span>
                    <span className="text-slate-400"><strong className="text-slate-100">{Math.round(totals.calories)}</strong> / {profile.target_calories} kcal</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-850 p-[2px]">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor(pct(totals.calories, profile.target_calories))}`} style={{ width: `${pct(totals.calories, profile.target_calories)}%` }} />
                  </div>
                </div>

                {/* Sub-macro grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {[
                    { label: "Protein", key: "protein" as const, target: profile.target_protein, color: "purple", gradient: "from-purple-600 to-indigo-600" },
                    { label: "Carbs",   key: "carbs"   as const, target: profile.target_carbs,   color: "cyan",   gradient: "from-cyan-600 to-teal-600" },
                    { label: "Fat",     key: "fat"     as const, target: profile.target_fat,     color: "rose",   gradient: "from-rose-600 to-orange-600" },
                  ].map(({ label, key, target, color, gradient }) => (
                    <div key={key} className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span className={`text-${color}-300`}>{label}</span>
                        <span className="text-slate-400">{Math.round(totals[key])}g / {target}g</span>
                      </div>
                      <p className={`text-[10px] text-${color}-400 mb-2 font-bold`}>{pct(totals[key], target)}% reached</p>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                        <div className={`bg-gradient-to-r ${gradient} h-full rounded-full transition-all duration-700`} style={{ width: `${pct(totals[key], target)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Meal logs ── */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-purple-400" /> Today's Meals ({meals.length})
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-12 flex-1">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : meals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-slate-900 rounded-2xl flex-1">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center mb-3">
                  <Apple className="w-5 h-5 text-slate-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">No food logged today</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Speak or type your meals above to see them logged here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {meals.map((meal) => {
                  const isExpanded = expandedMeals.has(meal.id);
                  return (
                    <div key={meal.id} className="bg-slate-950/70 border border-slate-900 hover:border-slate-800 rounded-2xl overflow-hidden transition duration-200">
                      {/* Meal header — always visible */}
                      <button
                        onClick={() => toggleMeal(meal.id)}
                        className="w-full flex items-start justify-between gap-4 p-4 text-left cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 italic leading-snug truncate">"{meal.raw_transcript}"</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(meal.date).toLocaleDateString()} · {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Macro pill */}
                          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-right">
                            <span className="text-xs font-bold text-orange-400 leading-none">{Math.round(meal.macros.calories)} kcal</span>
                            <div className="flex gap-2 text-[9px] text-slate-400 mt-0.5 font-mono">
                              <span className="text-purple-400">P {meal.macros.protein}g</span>
                              <span className="text-cyan-400">C {meal.macros.carbs}g</span>
                              <span className="text-rose-400">F {meal.macros.fat}g</span>
                            </div>
                          </div>
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                        </div>
                      </button>

                      {/* Ingredient breakdown — expandable */}
                      {isExpanded && (
                        <div className="border-t border-slate-900 px-4 pb-4 pt-3 space-y-2">
                          {/* Column headers */}
                          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 text-[9px] uppercase tracking-wider font-bold text-slate-600 pb-1 border-b border-slate-900">
                            <span>Ingredient</span>
                            <span className="text-right">Weight</span>
                            <span className="text-right text-orange-500">kcal</span>
                            <span className="text-right text-purple-400">Protein</span>
                            <span className="text-right text-cyan-400">Carbs</span>
                            <span className="text-right text-rose-400">Fat</span>
                          </div>

                          {meal.ingredients.map((ing, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center text-xs py-1">
                              {/* Name + brand */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-slate-200 font-medium capitalize truncate block">{ing.name}</span>
                                  {ing.brand && (
                                    <span className="text-[9px] text-purple-400 flex items-center gap-0.5">
                                      <Tag className="w-2.5 h-2.5" />{ing.brand}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Weight */}
                              <span className="text-slate-500 font-mono text-[10px] text-right">{ing.weight_g}g</span>

                              {/* kcal */}
                              <span className="text-orange-300 font-mono text-[10px] text-right font-semibold">
                                {macroActual(ing.calories_per_100g, ing.weight_g)}
                              </span>

                              {/* Protein */}
                              <span className="text-purple-300 font-mono text-[10px] text-right">
                                {macroActual(ing.protein_per_100g, ing.weight_g)}g
                              </span>

                              {/* Carbs */}
                              <span className="text-cyan-300 font-mono text-[10px] text-right">
                                {macroActual(ing.carbs_per_100g, ing.weight_g)}g
                              </span>

                              {/* Fat */}
                              <span className="text-rose-300 font-mono text-[10px] text-right">
                                {macroActual(ing.fat_per_100g, ing.weight_g)}g
                              </span>
                            </div>
                          ))}

                          {/* Totals row */}
                          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center pt-2 mt-1 border-t border-slate-900">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                            <span />
                            <span className="text-orange-400 font-mono text-[10px] font-bold text-right">{Math.round(meal.macros.calories)}</span>
                            <span className="text-purple-400 font-mono text-[10px] font-bold text-right">{meal.macros.protein}g</span>
                            <span className="text-cyan-400 font-mono text-[10px] font-bold text-right">{meal.macros.carbs}g</span>
                            <span className="text-rose-400 font-mono text-[10px] font-bold text-right">{meal.macros.fat}g</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ══ API Keys Modal ═══════════════════════════════════════════════════ */}
      {showKeysModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl">

            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" /> API Key Manager
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Keys are stored in your local SQLite DB and hot-loaded — no restart needed.</p>
              </div>
              <button onClick={() => setShowKeysModal(false)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Provider status overview */}
              <div className="grid grid-cols-1 gap-2">
                {apiKeys.map((k) => (
                  <div key={k.provider} className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${k.is_set ? "bg-slate-950/60 border-slate-800" : "bg-amber-950/20 border-amber-500/20"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${k.is_set ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{k.label}</p>
                        <p className="text-[10px] text-slate-500">{k.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {k.is_set ? (
                        <>
                          <span className="text-[10px] font-mono text-slate-500">{k.masked_key}</span>
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-2.5 h-2.5" /> Set
                          </span>
                          <button onClick={() => handleDeleteKey(k.provider)} className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-red-900/40 flex items-center justify-center text-slate-500 hover:text-red-400 transition" title="Remove key">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          {PROVIDER_BADGES[k.provider]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-800" />

              {/* Add / Update key form */}
              <form onSubmit={handleSaveKey} className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add or Update a Key</p>

                {/* Provider dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select LLM / Service</label>
                  <button
                    type="button"
                    onClick={() => setProviderDropOpen((p) => !p)}
                    className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-left transition focus:outline-none focus:border-amber-500"
                  >
                    {selectedProvider ? (
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${PROVIDER_COLORS[selectedProvider]}`} />
                        <span className="text-slate-100 font-medium">{selectedKeyInfo?.label}</span>
                        <span className="text-slate-500 text-[10px]">({selectedKeyInfo?.env_key})</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Choose a provider...</span>
                    )}
                    <CaretDown className={`w-4 h-4 text-slate-500 transition-transform ${providerDropOpen ? "rotate-180" : ""}`} />
                  </button>

                  {providerDropOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
                      {apiKeys.map((k) => (
                        <button
                          key={k.provider}
                          type="button"
                          onClick={() => { setSelectedProvider(k.provider); setProviderDropOpen(false); setKeyInput(""); setKeyMsg(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition text-left"
                        >
                          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r flex-shrink-0 ${PROVIDER_COLORS[k.provider]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200">{k.label}</p>
                            <p className="text-[10px] text-slate-500 truncate">{k.env_key}</p>
                          </div>
                          {k.is_set && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key input — only shown after provider selected */}
                {selectedProvider && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      {selectedKeyInfo?.env_key}
                    </label>
                    <div className="relative">
                      <input
                        type={showKeyInput ? "text" : "password"}
                        required
                        placeholder={`Paste your ${selectedKeyInfo?.label} key here...`}
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyInput((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      >
                        {showKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">{selectedKeyInfo?.description}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={keySaving || !selectedProvider || !keyInput.trim()}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:hover:scale-100 rounded-xl py-2.5 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                >
                  {keySaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : <><ShieldCheck className="w-4 h-4" /> Save API Key</>}
                </button>
              </form>

              {/* Feedback */}
              {keyMsg && (
                <div className={`rounded-xl p-3 flex items-start gap-2 text-xs ${keyMsg.type === "ok" ? "bg-emerald-950/30 border border-emerald-500/20 text-emerald-300" : "bg-red-950/30 border border-red-500/20 text-red-300"}`}>
                  {keyMsg.type === "ok" ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {keyMsg.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Brand Preferences Modal ══════════════════════════════════════════ */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative">

            {/* Modal header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-purple-400" /> Brand Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save brand-specific macros. The AI will use these automatically every time you log that ingredient.
                </p>
              </div>
              <button onClick={() => setShowBrandModal(false)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Tabs */}
              <div className="flex bg-slate-950 rounded-xl p-1 gap-1">
                <button
                  onClick={() => { setBrandTab("name"); setBrandMsg(null); setExtractedMacros(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${brandTab === "name" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Tag className="w-3.5 h-3.5" /> By Brand Name
                </button>
                <button
                  onClick={() => { setBrandTab("label"); setBrandMsg(null); setExtractedMacros(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${brandTab === "label" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Label
                </button>
              </div>

              {/* ── Tab: By Name ── */}
              {brandTab === "name" && (
                <form onSubmit={handleSaveBrandByName} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter the ingredient and your preferred brand. The AI will fetch its nutritional data the next time you log it — or immediately on your next meal entry.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ingredient</label>
                      <input
                        type="text" required placeholder="e.g. milk"
                        value={prefIngredient} onChange={(e) => setPrefIngredient(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Brand</label>
                      <input
                        type="text" required placeholder="e.g. Nandini toned"
                        value={prefBrand} onChange={(e) => setPrefBrand(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={brandSaving}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl py-2.5 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                  >
                    {brandSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Save Preference</>}
                  </button>
                </form>
              )}

              {/* ── Tab: Upload Label ── */}
              {brandTab === "label" && (
                <form onSubmit={handleSaveBrandByLabel} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Photo the nutrition facts panel on the back of the pack. Claude will read the exact values and save them — no more guessing.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ingredient</label>
                      <input
                        type="text" required placeholder="e.g. milk"
                        value={prefIngredient} onChange={(e) => setPrefIngredient(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Brand</label>
                      <input
                        type="text" required placeholder="e.g. Nandini toned"
                        value={prefBrand} onChange={(e) => setPrefBrand(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Image upload area */}
                  <div
                    onClick={() => labelInputRef.current?.click()}
                    className="relative border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition min-h-[140px]"
                  >
                    {labelPreview ? (
                      <img src={labelPreview} alt="Label preview" className="max-h-32 rounded-lg object-contain" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-600" />
                        <p className="text-xs text-slate-500 text-center">Click to upload nutrition label photo<br /><span className="text-[10px] text-slate-600">JPG, PNG or WEBP</span></p>
                      </>
                    )}
                    <input ref={labelInputRef} type="file" accept="image/*" className="hidden" onChange={handleLabelFileChange} />
                  </div>

                  {/* Extracted macros preview */}
                  {extractedMacros && (
                    <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "kcal", key: "calories_per_100g", color: "text-orange-400" },
                        { label: "Protein", key: "protein_per_100g", color: "text-purple-400" },
                        { label: "Carbs",   key: "carbs_per_100g",   color: "text-cyan-400" },
                        { label: "Fat",     key: "fat_per_100g",     color: "text-rose-400" },
                      ].map(({ label, key, color }) => (
                        <div key={key}>
                          <p className={`text-sm font-bold ${color}`}>{extractedMacros[key]}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}/100g</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit" disabled={brandSaving || !labelFile}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl py-2.5 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                  >
                    {brandSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</> : <><Sparkles className="w-4 h-4" /> Extract & Save Label</>}
                  </button>
                </form>
              )}

              {/* Feedback message */}
              {brandMsg && (
                <div className={`rounded-xl p-3 flex items-start gap-2 text-xs ${brandMsg.type === "ok" ? "bg-emerald-950/30 border border-emerald-500/20 text-emerald-300" : "bg-red-950/30 border border-red-500/20 text-red-300"}`}>
                  {brandMsg.type === "ok" ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {brandMsg.text}
                </div>
              )}

              {/* Saved preferences list */}
              {brandPrefs.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Saved Preferences</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {brandPrefs.map((p) => (
                      <div key={p.ingredient_name} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Tag className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span className="text-slate-300 font-medium capitalize">{p.ingredient_name}</span>
                          <span className="text-slate-600">→</span>
                          <span className="text-purple-300 capitalize">{p.preferred_brand}</span>
                        </div>
                        <button
                          onClick={() => handleDeletePref(p.ingredient_name)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-red-900/40 flex items-center justify-center text-slate-500 hover:text-red-400 transition"
                          title="Remove preference"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brandPrefs.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-2">No brand preferences saved yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Settings Modal ═══════════════════════════════════════════════════ */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" /> Adjust Macro Targets
                </h3>
                <p className="text-xs text-slate-500">Customize your daily nutrition goals</p>
              </div>
              <button onClick={() => setShowConfig(false)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500" />
              </div>

              {/* STT Engine toggle — only shown in non-production / local dev environments */}
              {sttSettings?.allow_local_choice && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-purple-400" /> Speech-to-Text Engine
                    </label>
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Dev only</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Choose how voice recordings are transcribed on this machine. This option is hidden in production — deployed apps always use the cloud engine.
                  </p>
                  <div className="space-y-1.5">
                    {sttSettings.modes.map((m) => (
                      <label
                        key={m.value}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${sttSettings.current_mode === m.value ? "bg-purple-950/30 border-purple-500/40" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"}`}
                      >
                        <input
                          type="radio"
                          name="stt-mode"
                          checked={sttSettings.current_mode === m.value}
                          onChange={() => handleSttModeChange(m.value)}
                          disabled={sttSaving}
                          className="mt-0.5 accent-purple-600"
                        />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-200">{m.label}</p>
                          <p className="text-[10px] text-slate-500 leading-snug">{m.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Calories Goal (kcal)</label>
                  <input type="number" required min={1} value={editCalories} onChange={(e) => setEditCalories(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Protein Goal (g)</label>
                  <input type="number" required min={1} value={editProtein} onChange={(e) => setEditProtein(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Carbs Goal (g)</label>
                  <input type="number" required min={1} value={editCarbs} onChange={(e) => setEditCarbs(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fat Goal (g)</label>
                  <input type="number" required min={1} value={editFat} onChange={(e) => setEditFat(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 text-xs font-bold">
                <button type="button" onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-xl transition cursor-pointer">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition px-5 py-2.5 rounded-xl text-white shadow-lg shadow-purple-900/30 cursor-pointer">Save Targets</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
