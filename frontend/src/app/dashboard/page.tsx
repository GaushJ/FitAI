"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, Square, Flame, Dumbbell, Settings, Check, AlertCircle,
  Loader2, Utensils, Calendar, Apple, TrendingUp, Sparkles,
  Tag, Trash2, ChevronDown, ChevronUp, Upload, X, BookMarked,
  Plus, KeyRound, Eye, EyeOff, ChevronDown as CaretDown, ShieldCheck,
  LogOut, BarChart2, Zap, Sliders, RefreshCw, Pencil,
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
  calories_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
  unit?: "g" | "ml";
}

interface APIKeyInfo {
  provider: string;
  label: string;
  description: string;
  is_set: boolean;
  masked_key: string;
}

interface FrequentMeal {
  id: number;
  display_name: string;
  ingredients: Array<{ name: string; grams?: number; calories?: number; protein?: number; carbs?: number; fat?: number; [key: string]: any }>;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  log_count: number;
  last_logged: string;
}


// Backend API base URL — falls back to localhost for local development.
// Set NEXT_PUBLIC_API_URL in your hosting provider's env vars (e.g. Vercel)
// to point at your deployed backend (e.g. https://fitvoice-backend.onrender.com).
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Local-storage API key persistence ─────────────────────────────────────
// Render's free tier uses an EPHEMERAL filesystem — the SQLite DB (and any
// ─── API key localStorage helpers ────────────────────────────────────────────
// Keys never leave the browser — they are stored here and sent as request
// headers (X-Anthropic-Key etc.) so the backend never persists them.
const LOCAL_KEYS_STORAGE_KEY = "fitvoice_api_keys";

const loadLocalKeys = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_KEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveLocalKey = (provider: string, apiKey: string) => {
  if (typeof window === "undefined") return;
  try {
    const all = loadLocalKeys();
    all[provider] = apiKey;
    window.localStorage.setItem(LOCAL_KEYS_STORAGE_KEY, JSON.stringify(all));
  } catch { /* private browsing — ignore */ }
};

const removeLocalKey = (provider: string) => {
  if (typeof window === "undefined") return;
  try {
    const all = loadLocalKeys();
    delete all[provider];
    window.localStorage.setItem(LOCAL_KEYS_STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
};

// Returns headers containing any stored API keys — merged into fetch calls
// for endpoints that invoke LLMs. The backend reads X-Anthropic-Key per-request.
const apiKeyHeaders = (): Record<string, string> => {
  const keys = loadLocalKeys();
  const headers: Record<string, string> = {};
  if (keys["anthropic"]) headers["X-Anthropic-Key"] = keys["anthropic"];
  if (keys["groq"])      headers["X-Groq-Key"]      = keys["groq"];
  return headers;
};

// ─── Auth token helpers ───────────────────────────────────────────────────────
// The JWT returned by /api/auth/login (or /signup) is stored here.
// Every authenticated request must send it as "Authorization: Bearer <token>".
const AUTH_TOKEN_KEY = "fitvoice_auth_token";
const AUTH_USER_KEY  = "fitvoice_auth_user";

const getStoredToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

const getStoredUser = (): { id: number; name: string; username: string } | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

// Build the Authorization header for every authenticated fetch call.
const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${getStoredToken() ?? ""}`,
});

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "from-orange-500 to-amber-500",
  openai:    "from-emerald-500 to-teal-500",
  groq:      "bg-[#C9F24D]",
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
  const router = useRouter();

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
  const [brandTab, setBrandTab]           = useState<"name" | "label" | "excel">("name");
  const [xlsxImporting, setXlsxImporting] = useState(false);
  const [xlsxMsg, setXlsxMsg]             = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const xlsxInputRef                      = useRef<HTMLInputElement>(null);
  const [prefIngredient, setPrefIngredient] = useState("");
  const [prefBrand, setPrefBrand]         = useState("");
  const [labelFile, setLabelFile]         = useState<File | null>(null);
  const [labelPreview, setLabelPreview]   = useState("");
  const [labelUnit, setLabelUnit]         = useState<"g" | "ml">("g");
  const [brandSaving, setBrandSaving]     = useState(false);
  const [brandMsg, setBrandMsg]           = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [extractedMacros, setExtractedMacros] = useState<Record<string, number> | null>(null);
  const [extractedUnit, setExtractedUnit] = useState<"g" | "ml">("g");

  // ── Brand name-tab: auto-fetched & editable macros
  const [fetchedMacros, setFetchedMacros] = useState<{ calories: string; protein: string; carbs: string; fat: string } | null>(null);
  const [macroFetching, setMacroFetching] = useState(false);
  const [macroFetchMsg, setMacroFetchMsg] = useState<string | null>(null);
  // inline edit for existing saved prefs
  const [editingPref, setEditingPref]     = useState<string | null>(null);
  const [editMacros, setEditMacros]       = useState({ calories: "", protein: "", carbs: "", fat: "" });
  const [editBrand, setEditBrand]         = useState("");
  const [macroSaving, setMacroSaving]     = useState(false);
  const [macroMsg, setMacroMsg]           = useState<{ type: "ok" | "err"; text: string } | null>(null);

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

  // ── Meal deletion
  const [deletingMealId, setDeletingMealId] = useState<number | null>(null);

  // ── Frequent meals
  const [frequentMeals, setFrequentMeals]         = useState<FrequentMeal[]>([]);
  const [quickLogging, setQuickLogging]           = useState<number | null>(null);

  // ── Portion editor modal
  const [portionMeal, setPortionMeal]             = useState<FrequentMeal | null>(null);
  const [portionGrams, setPortionGrams]           = useState<Record<string, number>>({});


  // ── Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const timerRef         = useRef<NodeJS.Timeout | null>(null);
  const labelInputRef    = useRef<HTMLInputElement>(null);

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard`, { headers: authHeaders() });
      if (res.status === 401) { handleLogout(); return; }
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

  const fetchApiKeys = () => {
    // Keys live only in localStorage — build the display list from there.
    const stored = loadLocalKeys();
    const providers = [
      { provider: "anthropic", label: "Anthropic Claude",  description: "Required for meal extraction, macro resolution & label vision." },
      { provider: "groq",      label: "Groq",              description: "Ultra-fast Whisper speech-to-text." },
      { provider: "tavily",    label: "Tavily Search",     description: "Web search fallback for unknown ingredients." },
    ];
    setApiKeys(providers.map((p) => ({
      ...p,
      is_set: Boolean(stored[p.provider]),
      masked_key: stored[p.provider] ? stored[p.provider].slice(0, 4) + "••••••••" + stored[p.provider].slice(-4) : "",
    })));
  };

  const fetchSttSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stt-settings`);
      if (res.ok) setSttSettings(await res.json());
    } catch { /* silent */ }
  };

  const fetchFrequentMeals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/frequent-meals`, { headers: authHeaders() });
      if (res.ok) setFrequentMeals(await res.json());
    } catch { /* silent */ }
  };



  // ── Logout helper ──────────────────────────────────────────────────────────
  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  useEffect(() => {
    // Redirect to login if no JWT is stored
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    fetchDashboardData();
    fetchBrandPrefs();
    fetchApiKeys();
    fetchSttSettings();
    fetchFrequentMeals();

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
      const res = await fetch(`${API_BASE}/api/transcribe`, { method: "POST", body: fd, headers: { ...authHeaders(), ...apiKeyHeaders() } });
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
      const res = await fetch(`${API_BASE}/api/track-meal`, { method: "POST", body: fd, headers: { ...authHeaders(), ...apiKeyHeaders() } });
      if (!res.ok) throw new Error((await res.json()).detail || "Macro parsing failed");
      const result = await res.json();
      setSuccessMsg(`Meal logged! ${Math.round(result.macros?.calories ?? 0)} kcal tracked.`);
      if (result.warning) setErrorMsg(`⚠️ ${result.warning}`);
      setTextQuery("");
      await fetchDashboardData();
      fetchFrequentMeals();
  
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
        headers: { "Content-Type": "application/json", ...authHeaders() },
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
        headers: { "Content-Type": "application/json", ...authHeaders() },
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

  const fetchMacrosForBrand = async (ingredient: string, brand: string) => {
    if (!ingredient.trim() || !brand.trim()) return;
    setMacroFetching(true); setMacroFetchMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/resolve-ingredient`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(), ...apiKeyHeaders() },
        body: JSON.stringify({ name: ingredient.trim(), brand: brand.trim(), weight_g: 100 }),
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setFetchedMacros({
        calories: String(data.calories_per_100g ?? ""),
        protein:  String(data.protein_per_100g  ?? ""),
        carbs:    String(data.carbs_per_100g    ?? ""),
        fat:      String(data.fat_per_100g      ?? ""),
      });
      setMacroFetchMsg("Macros fetched — edit if needed, then save.");
    } catch {
      setMacroFetchMsg("Could not auto-fetch macros. Enter them manually.");
    } finally {
      setMacroFetching(false);
    }
  };

  const handleSaveMacrosForPref = async (ingredientName: string) => {
    setMacroSaving(true); setMacroMsg(null);
    try {
      const nameChanged  = editName.trim().toLowerCase()  !== ingredientName.toLowerCase();
      const brandChanged = editBrand.trim().toLowerCase() !== brandPrefs.find(p => p.ingredient_name === ingredientName)?.preferred_brand?.toLowerCase();

      // Rename if name or brand changed
      if (nameChanged || brandChanged) {
        const renameRes = await fetch(`${API_BASE}/api/brand-preferences/${encodeURIComponent(ingredientName)}/rename`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_ingredient_name: editName.trim(), new_brand: editBrand.trim() }),
        });
        if (!renameRes.ok) throw new Error("Rename failed");
      }

      // Save macros if any are filled in
      const macroBody = {
        calories_per_100g: parseFloat(editMacros.calories),
        protein_per_100g:  parseFloat(editMacros.protein),
        carbs_per_100g:    parseFloat(editMacros.carbs),
        fat_per_100g:      parseFloat(editMacros.fat),
      };
      if (!Object.values(macroBody).some(isNaN)) {
        const targetName = nameChanged ? editName.trim() : ingredientName;
        const macroRes = await fetch(`${API_BASE}/api/brand-preferences/${encodeURIComponent(targetName)}/macros`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(macroBody),
        });
        if (!macroRes.ok) throw new Error("Macro save failed");
      }

      setMacroMsg({ type: "ok", text: "Saved." });
      setEditingPref(null);
      await fetchBrandPrefs();
    } catch (err: any) {
      setMacroMsg({ type: "err", text: err.message || "Failed to save." });
    } finally {
      setMacroSaving(false);
    }
  };

  const handleSaveBrandByName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefIngredient.trim() || !prefBrand.trim()) return;
    setBrandSaving(true); setBrandMsg(null);
    try {
      const body: Record<string, any> = { ingredient_name: prefIngredient.trim(), preferred_brand: prefBrand.trim() };
      if (fetchedMacros) {
        const cal = parseFloat(fetchedMacros.calories);
        const pro = parseFloat(fetchedMacros.protein);
        const carb = parseFloat(fetchedMacros.carbs);
        const fat = parseFloat(fetchedMacros.fat);
        if (!isNaN(cal) && !isNaN(pro) && !isNaN(carb) && !isNaN(fat)) {
          body.calories_per_100g = cal;
          body.protein_per_100g  = pro;
          body.carbs_per_100g    = carb;
          body.fat_per_100g      = fat;
        }
      }
      const res = await fetch(`${API_BASE}/api/brand-preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      setBrandMsg({ type: "ok", text: `Saved "${prefBrand} ${prefIngredient}" with macros.` });
      setPrefIngredient(""); setPrefBrand(""); setFetchedMacros(null); setMacroFetchMsg(null);
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
    fd.append("unit", labelUnit);
    try {
      const res = await fetch(`${API_BASE}/api/brand-preferences/label`, { method: "POST", body: fd, headers: apiKeyHeaders() });
      if (!res.ok) throw new Error((await res.json()).detail || "Extraction failed");
      const data = await res.json();
      setExtractedMacros(data.macros);
      setExtractedUnit((data.unit as "g" | "ml") || "g");
      setBrandMsg({ type: "ok", text: `Label read! Exact macros for "${prefBrand} ${prefIngredient}" saved permanently.` });
      setPrefIngredient(""); setPrefBrand(""); setLabelFile(null); setLabelPreview(""); setLabelUnit("g");
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

  const handleDeleteMeal = async (mealId: number) => {
    setDeletingMealId(mealId);
    try {
      const res = await fetch(`${API_BASE}/api/meals/${mealId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Delete failed");
      setSuccessMsg("Meal deleted.");
      await fetchDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete meal.");
    } finally {
      setDeletingMealId(null);
    }
  };

  // ── Excel export (download) ────────────────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/brand-preferences/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      // Use the filename the server suggests, or fall back to a default
      const cd   = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? "fitvoice_brand_preferences.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setXlsxMsg({ type: "err", text: "Failed to download Excel file." });
    }
  };

  // ── Excel import (upload) ──────────────────────────────────────────────────
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
    setXlsxImporting(true); setXlsxMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/brand-preferences/import`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Import failed");
      const warn = data.warnings?.length ? `  ⚠️ ${data.warnings.length} warning(s).` : "";
      setXlsxMsg({ type: "ok", text: `${data.message}${warn}` });
      await fetchBrandPrefs();
    } catch (err: any) {
      setXlsxMsg({ type: "err", text: err.message || "Failed to import Excel file." });
    } finally {
      setXlsxImporting(false);
    }
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

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !keyInput.trim()) return;
    setKeySaving(true); setKeyMsg(null);
    try {
      saveLocalKey(selectedProvider, keyInput.trim());
      setKeyMsg({ type: "ok", text: "Key saved locally — never sent to the server." });
      setKeyInput(""); setShowKeyInput(false);
      fetchApiKeys();
    } catch {
      setKeyMsg({ type: "err", text: "Failed to save key." });
    } finally {
      setKeySaving(false);
    }
  };

  const handleDeleteKey = (provider: string) => {
    removeLocalKey(provider);
    fetchApiKeys();
    if (selectedProvider === provider) { setKeyInput(""); setKeyMsg(null); }
  };

  const selectedKeyInfo = apiKeys.find((k) => k.provider === selectedProvider);

  // ─── Quick-log a frequent meal (with optional portion override) ────────────

  const handleQuickLog = async (meal: FrequentMeal, portions?: Record<string, number>) => {
    setQuickLogging(meal.id);
    setErrorMsg(""); setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/frequent-meals/${meal.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ portions: portions ?? {} }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Quick-log failed");
      const data = await res.json();
      setSuccessMsg(`Quick-logged "${data.display_name}" — ${Math.round(data.macros?.calories ?? 0)} kcal`);
      setPortionMeal(null);
      await fetchDashboardData();
      fetchFrequentMeals();
  
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to quick-log meal.");
    } finally {
      setQuickLogging(null);
    }
  };

  const openPortionEditor = (meal: FrequentMeal) => {
    // Pre-fill with current gram values
    const initial: Record<string, number> = {};
    meal.ingredients.forEach((ing) => {
      if (ing.name) initial[ing.name] = ing.grams ?? 100;
    });
    setPortionGrams(initial);
    setPortionMeal(meal);
  };

  const handleDeleteFrequent = async (mealId: number) => {
    try {
      await fetch(`${API_BASE}/api/frequent-meals/${mealId}`, { method: "DELETE", headers: authHeaders() });
      setFrequentMeals((prev) => prev.filter((m) => m.id !== mealId));
    } catch { /* silent */ }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const pct = (cur: number, tgt: number) => (!tgt ? 0 : Math.min(Math.round((cur / tgt) * 100), 150));
  const barColor = (p: number) =>
    p > 100 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
    : p > 85  ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
    : "bg-[#C9F24D] shadow-[0_0_10px_rgba(201,242,77,0.5)]";

  const toggleMeal = (id: number) =>
    setExpandedMeals((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const macroActual = (perHundred: number, weightG: number) =>
    Math.round((perHundred * weightG) / 100 * 10) / 10;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 font-sans selection:bg-[#C9F24D] selection:text-[#0B0C09] pb-16">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-[#C9F24D]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[35rem] h-[35rem] bg-[#C9F24D]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 py-4 px-4 sm:px-6 md:px-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C9F24D] flex items-center justify-center shadow-lg shadow-[rgba(201,242,77,0.25)] flex-shrink-0">
            <Utensils className="w-5 h-5 text-[#0B0C09]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#C9F24D] flex items-center gap-1.5">
              FitVoice <span className="text-[10px] font-semibold tracking-widest text-[#C9F24D] border border-[#C9F24D]/30 bg-[#C9F24D]/5 px-2 py-0.5 rounded-full uppercase">Active AI</span>
            </h1>
            <p className="text-[10px] text-slate-500">Voice-Driven Micro Macro Resolution</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
          <div className="flex-shrink-0 bg-slate-900/80 border border-slate-800/80 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-semibold">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-slate-300">Streak:</span>
            <span className="text-orange-400 font-bold text-sm">{profile.current_streak} days</span>
          </div>

          {/* API Keys button */}
          <button
            onClick={() => { setShowKeysModal(true); setKeyMsg(null); setSelectedProvider(""); setKeyInput(""); }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-[#F4F5EF] transition"
            title="Manage API Keys"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">API Keys</span>
            {apiKeys.filter((k) => !k.is_set).length > 0 && (
              <span className="bg-[#FF8A4C] text-[#0B0C09] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {apiKeys.filter((k) => !k.is_set).length} missing
              </span>
            )}
          </button>

          {/* Brand preferences button */}
          <button
            onClick={() => { setShowBrandModal(true); setBrandMsg(null); setExtractedMacros(null); }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-[#F4F5EF] transition"
            title="Brand Preferences"
          >
            <BookMarked className="w-4 h-4 text-[#C9F24D]" />
            <span className="hidden sm:inline">Brands</span>
            {brandPrefs.length > 0 && (
              <span className="bg-[#C9F24D] text-[#0B0C09] text-[9px] font-bold px-1.5 py-0.5 rounded-full">{brandPrefs.length}</span>
            )}
          </button>

          {/* Progress / history page */}
          <button
            onClick={() => router.push("/progress")}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-[#F4F5EF] transition"
            title="View Progress"
          >
            <BarChart2 className="w-4 h-4 text-[#C9F24D]" />
            <span className="hidden sm:inline">Progress</span>
          </button>

          <button
            onClick={() => setShowConfig(true)}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-slate-800 transition border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200"
            title="Configure Targets"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-red-900/40 border border-slate-800 hover:border-red-900 transition flex items-center justify-center text-slate-500 hover:text-red-400"
            title={`Sign out (${getStoredUser()?.username ?? ""})`}
          >
            <LogOut className="w-4 h-4" />
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#C9F24D]/8 rounded-full blur-[40px] pointer-events-none" />

            <div className="w-full flex justify-between items-center z-10">
              <div className="flex items-center gap-2 bg-[#C9F24D]/10 border border-[#C9F24D]/20 px-3 py-1 rounded-full text-[10px] text-[#C9F24D] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#C9F24D] animate-spin" /> Speech Recognition
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
                  <Loader2 className="w-10 h-10 text-[#C9F24D] animate-spin" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 animate-pulse">Analyzing</span>
                </div>
              ) : isRecording ? (
                <button onClick={stopRecording} className="w-32 h-32 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 hover:scale-105 transition active:scale-95 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.4)] relative cursor-pointer group">
                  <span className="absolute inset-0 rounded-full bg-red-600/30 animate-ping pointer-events-none" />
                  <Square className="w-10 h-10 text-white fill-white group-hover:scale-90 transition-transform" />
                </button>
              ) : (
                <button onClick={startRecording} className="w-32 h-32 rounded-full bg-[#C9F24D] hover:bg-[#D4F56A] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_40px_rgba(201,242,77,0.35)] hover:shadow-[0_0_60px_rgba(201,242,77,0.5)] cursor-pointer group relative">
                  <Mic className="w-12 h-12 text-[#0B0C09] group-hover:scale-110 transition-transform" />
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
                  <Utensils className="w-3.5 h-3.5 text-[#C9F24D]" /> Transcript / Manual Input
                </label>
                <textarea
                  rows={3}
                  placeholder="Transcribed voice will appear here, or type manually..."
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  disabled={isRecording || isProcessing}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#C9F24D]/80 focus:ring-1 focus:ring-[#C9F24D]/20 disabled:opacity-50 resize-none leading-relaxed shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isRecording || isProcessing || !textQuery.trim()}
                className="w-full bg-[#C9F24D] hover:bg-[#D4F56A] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-[rgba(201,242,77,0.2)] disabled:opacity-40 disabled:hover:scale-100 rounded-xl py-3 text-xs font-bold text-[#0B0C09] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Resolving Macros...</>
                ) : (
                  <><Sparkles className="w-4 h-4 text-[#0B0C09]" /> Confirm, Resolve Macros & Log</>
                )}
              </button>
            </form>
          </div>

          {/* Tips card */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex gap-3 text-xs text-slate-400">
            <Dumbbell className="w-5 h-5 text-[#C9F24D] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-300">Tips</p>
              <p className="mt-1 leading-normal">
                Say brand names naturally — "200ml Nandini milk" or "1 scoop Optimum Nutrition whey".
                Save brand preferences via the <span className="text-[#C9F24D] font-semibold">Brands</span> button to lock in exact label macros forever.
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
                  <TrendingUp className="w-4 h-4 text-[#C9F24D]" /> Today's Macros
                </h2>
                <p className="text-xs text-slate-500">Logged intake vs. daily targets</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Calories</span>
                <p className="text-lg font-black text-[#C9F24D]">{pct(totals.calories, profile.target_calories)}%</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-[#C9F24D] animate-spin" />
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
                    { label: "Protein", key: "protein" as const, target: profile.target_protein, color: "purple", gradient: "from-[#C9F24D] to-[#AFDF33]" },
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

          {/* ── Frequent Meals Quick-Log Row ── */}
          {frequentMeals.length > 0 && (
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> Frequent Meals
                </h2>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tap to quick-log</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
                {frequentMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex-shrink-0 w-44 bg-slate-950/70 border border-slate-800 hover:border-[#C9F24D]/30 rounded-2xl p-3 flex flex-col gap-2 group relative transition"
                  >
                    {/* Name */}
                    <p className="text-xs font-semibold text-slate-200 leading-tight line-clamp-2">{meal.display_name}</p>

                    {/* Macros */}
                    <div className="text-[10px] text-slate-500 flex flex-col gap-0.5">
                      <span className="text-orange-400 font-bold">{Math.round(meal.macros.calories)} kcal</span>
                      <span className="text-slate-500">P {meal.macros.protein}g · C {meal.macros.carbs}g · F {meal.macros.fat}g</span>
                      <span className="text-slate-600">{meal.log_count}× logged</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-auto">
                      {/* Quick-log (exact portions) */}
                      <button
                        onClick={() => handleQuickLog(meal)}
                        disabled={quickLogging === meal.id}
                        className="flex-1 flex items-center justify-center gap-1 bg-[#C9F24D] hover:bg-[#D4F56A] disabled:opacity-50 rounded-lg py-1.5 text-[10px] font-bold text-[#0B0C09] transition cursor-pointer"
                        title="Log this meal now"
                      >
                        {quickLogging === meal.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Zap className="w-3 h-3" />}
                        Log
                      </button>
                      {/* Portion editor */}
                      <button
                        onClick={() => openPortionEditor(meal)}
                        className="w-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        title="Adjust portions before logging"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>
                      {/* Delete frequent */}
                      <button
                        onClick={() => handleDeleteFrequent(meal.id)}
                        className="w-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-red-900/40 hover:border-red-800/40 text-slate-500 hover:text-red-400 transition cursor-pointer"
                        title="Remove from frequent meals"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Meal logs ── */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[#C9F24D]" /> Today's Meals ({meals.length})
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-12 flex-1">
                <Loader2 className="w-8 h-8 text-[#C9F24D] animate-spin" />
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
                      <div className="flex items-start gap-2 pr-3">
                        {/* Expand/collapse toggle — takes up most of the row */}
                        <button
                          onClick={() => toggleMeal(meal.id)}
                          className="flex-1 flex items-start justify-between gap-4 p-4 text-left cursor-pointer min-w-0"
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
                                <span className="text-[#C9F24D]">P {meal.macros.protein}g</span>
                                <span className="text-[#C9F24D]">C {meal.macros.carbs}g</span>
                                <span className="text-rose-400">F {meal.macros.fat}g</span>
                              </div>
                            </div>
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                          </div>
                        </button>

                        {/* Delete button — outside the expand toggle so it doesn't trigger expand */}
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          disabled={deletingMealId === meal.id}
                          className="self-center w-7 h-7 flex-shrink-0 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-800/60 flex items-center justify-center text-slate-600 hover:text-red-400 transition disabled:opacity-40"
                          title="Delete this meal"
                        >
                          {deletingMealId === meal.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Ingredient breakdown — expandable */}
                      {isExpanded && (
                        <div className="border-t border-slate-900 px-4 pb-4 pt-3 space-y-2">
                          {/* Column headers */}
                          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 text-[9px] uppercase tracking-wider font-bold text-slate-600 pb-1 border-b border-slate-900">
                            <span>Ingredient</span>
                            <span className="text-right">Weight</span>
                            <span className="text-right text-orange-500">kcal</span>
                            <span className="text-right text-[#C9F24D]">Protein</span>
                            <span className="text-right text-[#C9F24D]">Carbs</span>
                            <span className="text-right text-rose-400">Fat</span>
                          </div>

                          {meal.ingredients.map((ing, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center text-xs py-1">
                              {/* Name + brand */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4F56A] flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-slate-200 font-medium capitalize truncate block">{ing.name}</span>
                                  {ing.brand && (
                                    <span className="text-[9px] text-[#C9F24D] flex items-center gap-0.5">
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
                              <span className="text-[#D4F56A] font-mono text-[10px] text-right">
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
                            <span className="text-[#C9F24D] font-mono text-[10px] font-bold text-right">{meal.macros.protein}g</span>
                            <span className="text-[#C9F24D] font-mono text-[10px] font-bold text-right">{meal.macros.carbs}g</span>
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
              <button onClick={() => setShowKeysModal(false)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-[#F4F5EF] transition">
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
                        <span className="text-slate-500 text-[10px]">({selectedKeyInfo?.description})</span>
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
                            <p className="text-[10px] text-slate-500 truncate">{k.description}</p>
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
                      {selectedKeyInfo?.label} Key
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
                  <BookMarked className="w-5 h-5 text-[#C9F24D]" /> Brand Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save brand-specific macros. The AI will use these automatically every time you log that ingredient.
                </p>
              </div>
              <button onClick={() => setShowBrandModal(false)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-[#F4F5EF] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Tabs */}
              <div className="flex bg-slate-950 rounded-xl p-1 gap-1">
                <button
                  onClick={() => { setBrandTab("name"); setBrandMsg(null); setExtractedMacros(null); setXlsxMsg(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${brandTab === "name" ? "bg-[#C9F24D] text-[#0B0C09] shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Tag className="w-3.5 h-3.5" /> By Name
                </button>
                <button
                  onClick={() => { setBrandTab("label"); setBrandMsg(null); setExtractedMacros(null); setXlsxMsg(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${brandTab === "label" ? "bg-[#C9F24D] text-[#0B0C09] shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Upload className="w-3.5 h-3.5" /> Label
                </button>
                <button
                  onClick={() => { setBrandTab("excel"); setBrandMsg(null); setXlsxMsg(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${brandTab === "excel" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Plus className="w-3.5 h-3.5" /> Excel
                </button>
              </div>

              {/* ── Tab: By Name ── */}
              {brandTab === "name" && (
                <form onSubmit={handleSaveBrandByName} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter the ingredient and brand — macros are fetched automatically and can be edited before saving.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ingredient</label>
                      <input
                        type="text" required placeholder="e.g. milk"
                        value={prefIngredient}
                        onChange={(e) => { setPrefIngredient(e.target.value); setFetchedMacros(null); setMacroFetchMsg(null); }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#C9F24D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Brand</label>
                      <input
                        type="text" required placeholder="e.g. Nandini toned"
                        value={prefBrand}
                        onChange={(e) => { setPrefBrand(e.target.value); setFetchedMacros(null); setMacroFetchMsg(null); }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#C9F24D]"
                      />
                    </div>
                  </div>

                  {/* Fetch macros button */}
                  <button
                    type="button"
                    disabled={!prefIngredient.trim() || !prefBrand.trim() || macroFetching}
                    onClick={() => fetchMacrosForBrand(prefIngredient, prefBrand)}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl py-2 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition"
                  >
                    {macroFetching
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching macros...</>
                      : <><Sparkles className="w-3.5 h-3.5 text-[#C9F24D]" /> Fetch Macros</>}
                  </button>

                  {macroFetchMsg && (
                    <p className="text-[10px] text-slate-500 -mt-1">{macroFetchMsg}</p>
                  )}

                  {/* Editable macro grid */}
                  {fetchedMacros && (
                    <div className="bg-slate-950 border border-[#C9F24D]/20 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#C9F24D] mb-2">Per 100g — edit if needed</p>
                      <div className="grid grid-cols-4 gap-2">
                        {([
                          { key: "calories" as const, label: "Calories", unit: "kcal", color: "text-orange-400" },
                          { key: "protein"  as const, label: "Protein",  unit: "g",    color: "text-[#C9F24D]" },
                          { key: "carbs"    as const, label: "Carbs",    unit: "g",    color: "text-[#C9F24D]" },
                          { key: "fat"      as const, label: "Fat",      unit: "g",    color: "text-rose-400"  },
                        ] as const).map(({ key, label, unit, color }) => (
                          <div key={key} className="flex flex-col gap-1">
                            <label className={`text-[9px] font-bold uppercase tracking-wider ${color}`}>{label}<span className="text-slate-600 normal-case font-normal"> /{unit}</span></label>
                            <input
                              type="number" step="0.1" min="0"
                              value={fetchedMacros[key]}
                              onChange={(e) => setFetchedMacros((m) => m ? { ...m, [key]: e.target.value } : m)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D] text-center font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit" disabled={brandSaving}
                    className="w-full bg-[#C9F24D] hover:bg-[#D4F56A] disabled:opacity-40 rounded-xl py-2.5 text-xs font-bold text-[#0B0C09] flex items-center justify-center gap-2 transition"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ingredient</label>
                      <input
                        type="text" required placeholder="e.g. milk"
                        value={prefIngredient} onChange={(e) => setPrefIngredient(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#C9F24D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Brand</label>
                      <input
                        type="text" required placeholder="e.g. Nandini toned"
                        value={prefBrand} onChange={(e) => setPrefBrand(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#C9F24D]"
                      />
                    </div>
                  </div>

                  {/* Unit toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit</span>
                    <div className="flex rounded-lg overflow-hidden border border-slate-700">
                      {(["g", "ml"] as const).map((u) => (
                        <button
                          key={u} type="button"
                          onClick={() => setLabelUnit(u)}
                          className={`px-3 py-1 text-xs font-semibold transition ${labelUnit === u ? "bg-[#C9F24D] text-[#0B0C09]" : "bg-slate-900 text-slate-400 hover:text-slate-200"}`}
                        >{u}</button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-600">per 100{labelUnit}</span>
                  </div>

                  {/* Image upload area */}
                  <div
                    onClick={() => labelInputRef.current?.click()}
                    className="relative border-2 border-dashed border-slate-700 hover:border-[#C9F24D] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition min-h-[140px]"
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
                        { label: "Protein", key: "protein_per_100g", color: "text-[#C9F24D]" },
                        { label: "Carbs",   key: "carbs_per_100g",   color: "text-[#C9F24D]" },
                        { label: "Fat",     key: "fat_per_100g",     color: "text-rose-400" },
                      ].map(({ label, key, color }) => (
                        <div key={key}>
                          <p className={`text-sm font-bold ${color}`}>{extractedMacros[key]}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}/100{extractedUnit}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit" disabled={brandSaving || !labelFile}
                    className="w-full bg-[#C9F24D] hover:bg-[#D4F56A] disabled:opacity-40 rounded-xl py-2.5 text-xs font-bold text-[#0B0C09] flex items-center justify-center gap-2 transition"
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
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {brandPrefs.map((p) => (
                      <div key={p.ingredient_name} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                        {/* Header row */}
                        <div className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Tag className="w-3.5 h-3.5 text-[#C9F24D] flex-shrink-0" />
                            <span className="text-slate-300 font-medium capitalize">{p.ingredient_name}</span>
                            <span className="text-slate-600">→</span>
                            <span className="text-[#D4F56A] capitalize">{p.preferred_brand}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                if (editingPref === p.ingredient_name) { setEditingPref(null); return; }
                                setEditingPref(p.ingredient_name);
                                setEditName(p.ingredient_name);
                                setEditBrand(p.preferred_brand);
                                setEditMacros({
                                  calories: p.calories_per_100g != null ? String(p.calories_per_100g) : "",
                                  protein: p.protein_per_100g != null ? String(p.protein_per_100g) : "",
                                  carbs: p.carbs_per_100g != null ? String(p.carbs_per_100g) : "",
                                  fat: p.fat_per_100g != null ? String(p.fat_per_100g) : "",
                                });
                                setMacroMsg(null);
                              }}
                              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-[#C9F24D] transition"
                              title="Edit macros"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePref(p.ingredient_name)}
                              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-red-900/40 flex items-center justify-center text-slate-500 hover:text-red-400 transition"
                              title="Remove preference"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Macro pills row */}
                        {(p.calories_per_100g || p.protein_per_100g || p.carbs_per_100g || p.fat_per_100g) && editingPref !== p.ingredient_name && (
                          <div className="px-3 pb-2 flex gap-2 flex-wrap">
                            {[
                              { label: "Cal", value: p.calories_per_100g, color: "text-orange-400" },
                              { label: "P",   value: p.protein_per_100g,  color: "text-[#C9F24D]" },
                              { label: "C",   value: p.carbs_per_100g,    color: "text-[#C9F24D]" },
                              { label: "F",   value: p.fat_per_100g,      color: "text-rose-400"  },
                            ].map(({ label, value, color }) => value != null ? (
                              <span key={label} className="flex items-baseline gap-0.5 text-[9px] bg-slate-900 rounded-md px-1.5 py-0.5">
                                <span className={`font-bold ${color}`}>{label}</span>
                                <span className="text-slate-400 font-mono">{Number(value).toFixed(1)}</span>
                              </span>
                            ) : null)}
                            <span className="text-[9px] text-slate-600 self-center">/100{p.unit ?? "g"}</span>
                          </div>
                        )}

                        {/* Inline edit form */}
                        {editingPref === p.ingredient_name && (
                          <div className="border-t border-slate-800 px-3 py-2.5 space-y-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#C9F24D]">Edit preference</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="flex flex-col gap-0.5">
                                <label className="text-[8px] font-bold uppercase text-slate-500">Ingredient</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D]"
                                />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <label className="text-[8px] font-bold uppercase text-slate-500">Brand</label>
                                <input
                                  type="text"
                                  value={editBrand}
                                  onChange={(e) => setEditBrand(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D]"
                                />
                              </div>
                            </div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Macros per 100g</p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {([
                                { key: "calories" as const, label: "Cal",    color: "text-orange-400" },
                                { key: "protein"  as const, label: "Protein", color: "text-[#C9F24D]" },
                                { key: "carbs"    as const, label: "Carbs",   color: "text-[#C9F24D]" },
                                { key: "fat"      as const, label: "Fat",     color: "text-rose-400"  },
                              ] as const).map(({ key, label, color }) => (
                                <div key={key} className="flex flex-col gap-0.5">
                                  <label className={`text-[8px] font-bold uppercase ${color}`}>{label}</label>
                                  <input
                                    type="number" step="0.1" min="0"
                                    value={editMacros[key]}
                                    onChange={(e) => setEditMacros((m) => ({ ...m, [key]: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D] text-center font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              disabled={macroSaving}
                              onClick={() => handleSaveMacrosForPref(p.ingredient_name)}
                              className="w-full bg-[#C9F24D] hover:bg-[#D4F56A] disabled:opacity-40 rounded-lg py-1.5 text-[10px] font-bold text-[#0B0C09] flex items-center justify-center gap-1.5 transition"
                            >
                              {macroSaving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : <><Check className="w-3 h-3" /> Save</>}
                            </button>
                            {macroMsg && <p className={`text-[10px] ${macroMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>{macroMsg.text}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab: Excel Import / Export ── */}
              {brandTab === "excel" && (
                <div className="space-y-5">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Download your current brand preferences as a spreadsheet, edit it offline,
                    then re-upload to restore or bulk-add preferences in one go.
                  </p>

                  {/* Hidden file input for import */}
                  <input
                    ref={xlsxInputRef}
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleImportExcel}
                  />

                  {/* Export card */}
                  <div className="bg-slate-950/60 border border-emerald-900/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <span className="text-emerald-400">↓</span> Download Preferences
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Exports all {brandPrefs.length} saved brand{brandPrefs.length !== 1 ? "s" : ""} with their nutrition data
                        as a styled .xlsx file.
                      </p>
                    </div>
                    <button
                      onClick={handleExportExcel}
                      disabled={brandPrefs.length === 0}
                      className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition shadow w-full sm:w-auto"
                    >
                      <Plus className="w-3.5 h-3.5 rotate-45" /> Export .xlsx
                    </button>
                  </div>

                  {/* Import card */}
                  <div className="bg-slate-950/60 border border-[#C9F24D]/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <span className="text-[#C9F24D]">↑</span> Upload &amp; Restore
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Upload a .xlsx file in the same format to bulk-set preferences
                        and nutrition data in one step.
                      </p>
                    </div>
                    <button
                      onClick={() => xlsxInputRef.current?.click()}
                      disabled={xlsxImporting}
                      className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9F24D] hover:bg-[#D4F56A] disabled:opacity-40 text-[#0B0C09] text-xs font-bold transition shadow w-full sm:w-auto"
                    >
                      {xlsxImporting
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...</>
                        : <><Upload className="w-3.5 h-3.5" /> Import .xlsx</>}
                    </button>
                  </div>

                  {/* Format reminder */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expected columns</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[9px] text-center">
                      {["Ingredient", "Brand", "Calories/100g", "Protein/100g", "Carbs/100g", "Fat/100g"].map((h, i) => (
                        <div key={h} className={`px-1 py-1 rounded font-mono font-bold ${i < 2 ? "bg-[#C9F24D]/10 text-[#D4F56A] border border-[#C9F24D]/15" : "bg-slate-950 text-slate-400 border border-slate-800"}`}>
                          {h}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2">
                      Columns A–B are required. C–F are optional — fill them to also update the ingredient cache.
                    </p>
                  </div>

                  {/* Feedback */}
                  {xlsxMsg && (
                    <div className={`rounded-xl p-3 flex items-start gap-2 text-xs ${xlsxMsg.type === "ok" ? "bg-emerald-950/30 border border-emerald-500/20 text-emerald-300" : "bg-red-950/30 border border-red-500/20 text-red-300"}`}>
                      {xlsxMsg.type === "ok"
                        ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      {xlsxMsg.text}
                    </div>
                  )}
                </div>
              )}

              {brandPrefs.length === 0 && brandTab !== "excel" && (
                <p className="text-xs text-slate-600 text-center py-2">No brand preferences saved yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Portion Editor Modal ═════════════════════════════════════════════ */}
      {portionMeal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#C9F24D]" /> Adjust Portions
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{portionMeal.display_name}</p>
              </div>
              <button onClick={() => setPortionMeal(null)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-[#F4F5EF] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {portionMeal.ingredients.map((ing) => {
                const name = ing.name || "";
                const grams = portionGrams[name] ?? ing.grams ?? 100;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="flex-1 text-xs text-slate-300 font-medium capitalize">{name}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={grams}
                        onChange={(e) => setPortionGrams((prev) => ({ ...prev, [name]: Number(e.target.value) }))}
                        className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 text-right focus:outline-none focus:border-[#C9F24D]"
                      />
                      <span className="text-[10px] text-slate-500 w-4">g</span>
                    </div>
                  </div>
                );
              })}

              {/* Preview scaled macros */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mt-2">
                <p className="text-[9px] uppercase font-bold text-slate-600 mb-2 tracking-wider">Estimated macros with these portions</p>
                {(() => {
                  let cal = 0, pro = 0, crb = 0, fat = 0;
                  portionMeal.ingredients.forEach((ing) => {
                    const name = ing.name || "";
                    const newG = portionGrams[name] ?? ing.grams ?? 100;
                    const oldG = ing.grams ?? 100;
                    const ratio = oldG > 0 ? newG / oldG : 1;
                    cal += (ing.calories ?? 0) * ratio;
                    pro += (ing.protein  ?? 0) * ratio;
                    crb += (ing.carbs    ?? 0) * ratio;
                    fat += (ing.fat      ?? 0) * ratio;
                  });
                  return (
                    <div className="flex gap-3 text-[10px] font-mono">
                      <span className="text-orange-400">{Math.round(cal)} kcal</span>
                      <span className="text-[#C9F24D]">P {Math.round(pro)}g</span>
                      <span className="text-[#C9F24D]">C {Math.round(crb)}g</span>
                      <span className="text-rose-400">F {Math.round(fat)}g</span>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPortionMeal(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleQuickLog(portionMeal, portionGrams)}
                  disabled={quickLogging === portionMeal.id}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#0B0C09] bg-[#C9F24D] hover:bg-[#D4F56A] disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {quickLogging === portionMeal.id
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging...</>
                    : <><Zap className="w-4 h-4" /> Log with These Portions</>}
                </button>
              </div>
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
                  <Settings className="w-5 h-5 text-[#C9F24D]" /> Adjust Macro Targets
                </h3>
                <p className="text-xs text-slate-500">Customize your daily nutrition goals</p>
              </div>
              <button onClick={() => setShowConfig(false)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-[#F4F5EF] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D]" />
              </div>

              {/* STT Engine toggle — only shown in non-production / local dev environments */}
              {sttSettings?.allow_local_choice && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#C9F24D]" /> Speech-to-Text Engine
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
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${sttSettings.current_mode === m.value ? "bg-[#C9F24D]/10 border-[#C9F24D]/40" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"}`}
                      >
                        <input
                          type="radio"
                          name="stt-mode"
                          checked={sttSettings.current_mode === m.value}
                          onChange={() => handleSttModeChange(m.value)}
                          disabled={sttSaving}
                          className="mt-0.5 accent-[#C9F24D]"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Protein Goal (g)</label>
                  <input type="number" required min={1} value={editProtein} onChange={(e) => setEditProtein(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Carbs Goal (g)</label>
                  <input type="number" required min={1} value={editCarbs} onChange={(e) => setEditCarbs(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fat Goal (g)</label>
                  <input type="number" required min={1} value={editFat} onChange={(e) => setEditFat(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#C9F24D]" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 text-xs font-bold">
                <button type="button" onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-xl transition cursor-pointer">Cancel</button>
                <button type="submit" className="bg-[#C9F24D] hover:bg-[#D4F56A] transition rounded-xl px-5 py-2.5 text-[#0B0C09] shadow-lg shadow-[rgba(201,242,77,0.2)] cursor-pointer">Save Targets</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




