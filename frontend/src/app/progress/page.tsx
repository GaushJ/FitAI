"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Flame, Calendar, TrendingUp, Utensils, Loader2,
  AlertCircle, ChevronDown, ChevronUp, Tag, Award, BarChart2,
  Target, Activity,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUTH_TOKEN_KEY = "fitvoice_auth_token";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_count: number;
  target_calories: number;
  status: "met" | "over" | "under" | "minimal" | "empty";
}

interface ProgressStats {
  current_streak: number;
  best_streak: number;
  total_days_logged: number;
  total_meals: number;
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
  date: string;
  raw_transcript: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  ingredients: Ingredient[];
}

// ── Heatmap cell color by status ──────────────────────────────────────────────
const CELL_COLORS: Record<DaySummary["status"], string> = {
  empty:   "bg-slate-800/60",
  minimal: "bg-yellow-900/50 border-yellow-800/30",
  under:   "bg-green-900/60 border-green-800/30",
  met:     "bg-green-500 border-green-400/30",
  over:    "bg-orange-500 border-orange-400/30",
};

const CELL_HOVER: Record<DaySummary["status"], string> = {
  empty:   "",
  minimal: "hover:bg-yellow-800/60",
  under:   "hover:bg-green-800/60",
  met:     "hover:bg-green-400",
  over:    "hover:bg-orange-400",
};

const STATUS_LABEL: Record<DaySummary["status"], string> = {
  empty:   "No data",
  minimal: "Barely logged",
  under:   "Under goal",
  met:     "Goal met ✓",
  over:    "Over goal",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─────────────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const router = useRouter();

  const [summaries,    setSummaries]    = useState<DaySummary[]>([]);
  const [stats,        setStats]        = useState<ProgressStats | null>(null);
  const [targetCals,   setTargetCals]   = useState(2000);
  const [history,      setHistory]      = useState<MealLog[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage,  setHistoryPage]  = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [histLoading,  setHistLoading]  = useState(false);
  const [error,        setError]        = useState("");
  const [tooltip,      setTooltip]      = useState<{ day: DaySummary; x: number; y: number } | null>(null);
  const [expanded,     setExpanded]     = useState<Set<number>>(new Set());

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    fetchProgress();
    fetchHistory(1);
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/progress`, { headers: authHeaders() });
      if (res.status === 401) { router.replace("/login"); return; }
      if (!res.ok) throw new Error("Failed to load progress");
      const data = await res.json();
      setSummaries(data.summaries);
      setStats(data.stats);
      setTargetCals(data.target_calories);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (page: number) => {
    setHistLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/history?page=${page}&per_page=15`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setHistory(data.meals);
      setHistoryTotal(data.total);
      setHistoryPage(data.page);
    } catch { /* silent */ } finally {
      setHistLoading(false);
    }
  };

  const toggleMeal = (id: number) =>
    setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const macroActual = (per100: number, g: number) =>
    Math.round((per100 * g) / 100 * 10) / 10;

  // ── Build heatmap grid (13 cols × 7 rows = 91 days, oldest top-left) ─────────
  // Find the day-of-week of the first day to offset the grid correctly
  const buildGrid = () => {
    if (summaries.length === 0) return { weeks: [] as DaySummary[][], monthLabels: [] as {label: string; col: number}[] };

    const firstDate = new Date(summaries[0].date + "T00:00:00");
    const startOffset = firstDate.getDay(); // 0=Sun … 6=Sat

    // Pad the beginning with null slots so col 0 aligns to Sunday
    const padded: (DaySummary | null)[] = [
      ...Array(startOffset).fill(null),
      ...summaries,
    ];

    // Group into weeks (columns of 7)
    const weeks: DaySummary[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7) as DaySummary[]);
    }

    // Month labels: first week-col where a new month starts
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const realDay = week.find((d) => d !== null);
      if (!realDay) return;
      const m = new Date(realDay.date + "T00:00:00").getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: MONTHS[m], col: wi });
        lastMonth = m;
      }
    });

    return { weeks, monthLabels };
  };

  const { weeks, monthLabels } = buildGrid();

  // ── Weekly calorie chart data (last 13 weeks, Sun-Sat buckets) ──────────────
  const weeklyCalories = weeks.map((week) => ({
    total: week.reduce((s, d) => s + (d?.calories ?? 0), 0),
    target: targetCals * 7,
    label: week.find(Boolean)?.date?.slice(5) ?? "",
  }));
  const maxWeekly = Math.max(...weeklyCalories.map((w) => w.total), targetCals * 7);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white pb-16 relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/3 w-[40rem] h-[40rem] bg-purple-900/8 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 py-4 px-6 md:px-12 flex items-center gap-4">
        <button
          onClick={() => router.push("/")}
          className="w-9 h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Progress Overview</h1>
            <p className="text-[10px] text-slate-500">Last 90 days · Calorie &amp; macro history</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-8">

        {error && (
          <div className="bg-red-950/30 border border-red-500/20 text-red-300 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Flame className="w-5 h-5 text-orange-400" />,  label: "Current Streak", value: `${stats?.current_streak ?? 0} days`,     bg: "from-orange-950/30 to-red-950/30",    border: "border-orange-900/40" },
                { icon: <Award className="w-5 h-5 text-yellow-400" />,  label: "Best Streak",    value: `${stats?.best_streak ?? 0} days`,         bg: "from-yellow-950/30 to-amber-950/30",  border: "border-yellow-900/40" },
                { icon: <Calendar className="w-5 h-5 text-cyan-400" />, label: "Days Logged",    value: `${stats?.total_days_logged ?? 0} days`,   bg: "from-cyan-950/30 to-teal-950/30",     border: "border-cyan-900/40" },
                { icon: <Utensils className="w-5 h-5 text-purple-400" />, label: "Total Meals",  value: `${stats?.total_meals ?? 0} meals`,        bg: "from-purple-950/30 to-indigo-950/30", border: "border-purple-900/40" },
              ].map(({ icon, label, value, bg, border }) => (
                <div key={label} className={`bg-gradient-to-br ${bg} border ${border} rounded-2xl p-5`}>
                  <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-400">{label}</span></div>
                  <p className="text-2xl font-black text-slate-100">{value}</p>
                </div>
              ))}
            </div>

            {/* ── Activity Heatmap ── */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-400" /> Activity Heatmap
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">90 days of calorie logging — hover a cell for details</p>
                </div>
                {/* Legend */}
                <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500">
                  {(["empty","under","met","over"] as const).map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-sm border ${CELL_COLORS[s]}`} />
                      <span className="capitalize">{STATUS_LABEL[s]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block min-w-max">

                  {/* Month labels */}
                  <div className="flex mb-1 pl-8">
                    {weeks.map((_, wi) => {
                      const ml = monthLabels.find((m) => m.col === wi);
                      return (
                        <div key={wi} className="w-[14px] mr-[2px] text-[9px] text-slate-500 font-medium">
                          {ml ? ml.label : ""}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-0">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-[2px] mr-2 mt-0">
                      {DAYS_OF_WEEK.map((d, i) => (
                        <div key={d} className="h-[14px] text-[9px] text-slate-600 flex items-center justify-end pr-1 w-6">
                          {i % 2 === 1 ? d.slice(0, 1) : ""}
                        </div>
                      ))}
                    </div>

                    {/* Week columns */}
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[2px] mr-[2px]">
                        {Array.from({ length: 7 }).map((_, di) => {
                          const day = week[di] ?? null;
                          if (!day) return <div key={di} className="w-[14px] h-[14px]" />;
                          return (
                            <div
                              key={di}
                              className={`w-[14px] h-[14px] rounded-sm border border-transparent cursor-pointer transition-all duration-100 ${CELL_COLORS[day.status]} ${CELL_HOVER[day.status]}`}
                              onMouseEnter={(e) => {
                                const rect = (e.target as HTMLElement).getBoundingClientRect();
                                setTooltip({ day, x: rect.left + window.scrollX, y: rect.top + window.scrollY - 8 });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile legend */}
              <div className="flex sm:hidden flex-wrap items-center gap-3 mt-4 text-[10px] text-slate-500">
                {(["empty","under","met","over"] as const).map((s) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-sm border ${CELL_COLORS[s]}`} />
                    <span className="capitalize">{STATUS_LABEL[s]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Weekly calorie bar chart ── */}
            {weeklyCalories.length > 0 && (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> Weekly Calorie Intake
                  <span className="text-[10px] font-normal text-slate-500 ml-1">vs target ({(targetCals * 7).toLocaleString()} kcal/week)</span>
                </h2>
                <div className="flex items-end gap-1.5 h-36 relative">
                  {/* Target line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-purple-500/40 pointer-events-none"
                    style={{ bottom: `${(targetCals * 7 / maxWeekly) * 100}%` }}
                  />
                  {weeklyCalories.map((w, i) => {
                    const heightPct = maxWeekly > 0 ? (w.total / maxWeekly) * 100 : 0;
                    const isOver    = w.total > targetCals * 7 * 1.1;
                    const isMet     = w.total >= targetCals * 7 * 0.85 && !isOver;
                    const color     = isOver ? "from-orange-600 to-orange-500" : isMet ? "from-green-600 to-emerald-500" : "from-slate-700 to-slate-600";
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                          <div
                            className={`w-full rounded-t-md bg-gradient-to-t ${color} transition-all duration-500 min-h-[2px]`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-slate-600">{w.label}</span>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-10 shadow-xl">
                          {w.total > 0 ? `${Math.round(w.total).toLocaleString()} kcal` : "No data"}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gradient-to-t from-green-600 to-emerald-500" /> Goal met</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gradient-to-t from-orange-600 to-orange-500" /> Over goal</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-600" /> Under goal</div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-6 border-t border-dashed border-purple-500/60" />
                    <span>Weekly target</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Meal history ── */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" /> Meal History
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">{historyTotal} meals logged in total</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Page {historyPage}</span>
                  <div className="flex gap-1">
                    <button
                      disabled={historyPage <= 1 || histLoading}
                      onClick={() => fetchHistory(historyPage - 1)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition text-xs"
                    >←</button>
                    <button
                      disabled={history.length < 15 || histLoading}
                      onClick={() => fetchHistory(historyPage + 1)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition text-xs"
                    >→</button>
                  </div>
                </div>
              </div>

              {histLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-7 h-7 text-purple-500 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No meals logged yet. Start tracking on the dashboard!
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((meal) => {
                    const isExp = expanded.has(meal.id);
                    return (
                      <div key={meal.id} className="bg-slate-950/70 border border-slate-900 hover:border-slate-800 rounded-2xl overflow-hidden transition">
                        <button
                          onClick={() => toggleMeal(meal.id)}
                          className="w-full flex items-start justify-between gap-4 p-4 text-left cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 italic truncate">"{meal.raw_transcript}"</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(meal.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                              &nbsp;·&nbsp;{meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-right">
                              <span className="text-xs font-bold text-orange-400">{Math.round(meal.macros.calories)} kcal</span>
                              <div className="flex gap-2 text-[9px] text-slate-400 mt-0.5 font-mono">
                                <span className="text-purple-400">P {meal.macros.protein}g</span>
                                <span className="text-cyan-400">C {meal.macros.carbs}g</span>
                                <span className="text-rose-400">F {meal.macros.fat}g</span>
                              </div>
                            </div>
                            {isExp ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </div>
                        </button>

                        {isExp && (
                          <div className="border-t border-slate-900 px-4 pb-4 pt-3 space-y-2">
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
                                <span className="text-slate-500 font-mono text-[10px] text-right">{ing.weight_g}g</span>
                                <span className="text-orange-300 font-mono text-[10px] text-right font-semibold">{macroActual(ing.calories_per_100g, ing.weight_g)}</span>
                                <span className="text-purple-300 font-mono text-[10px] text-right">{macroActual(ing.protein_per_100g, ing.weight_g)}g</span>
                                <span className="text-cyan-300 font-mono text-[10px] text-right">{macroActual(ing.carbs_per_100g, ing.weight_g)}g</span>
                                <span className="text-rose-300 font-mono text-[10px] text-right">{macroActual(ing.fat_per_100g, ing.weight_g)}g</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 shadow-2xl text-xs pointer-events-none"
          style={{ left: tooltip.x + 18, top: tooltip.y - 60 }}
        >
          <p className="font-bold text-slate-200">
            {new Date(tooltip.day.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <p className={`font-semibold mt-0.5 ${
            tooltip.day.status === "met"   ? "text-green-400"  :
            tooltip.day.status === "over"  ? "text-orange-400" :
            tooltip.day.status === "under" ? "text-green-600"  :
            tooltip.day.status === "empty" ? "text-slate-500"  : "text-yellow-600"
          }`}>{STATUS_LABEL[tooltip.day.status]}</p>
          {tooltip.day.calories > 0 && (
            <>
              <p className="text-slate-400 mt-1">{Math.round(tooltip.day.calories)} / {Math.round(tooltip.day.target_calories)} kcal</p>
              <div className="flex gap-2 text-[10px] mt-0.5">
                <span className="text-purple-400">P {tooltip.day.protein}g</span>
                <span className="text-cyan-400">C {tooltip.day.carbs}g</span>
                <span className="text-rose-400">F {tooltip.day.fat}g</span>
              </div>
              <p className="text-slate-500 text-[10px]">{tooltip.day.meal_count} meal{tooltip.day.meal_count !== 1 ? "s" : ""}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
