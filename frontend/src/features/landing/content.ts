import { Camera, FileSpreadsheet, Mic, PencilLine, Search, type LucideIcon } from "lucide-react";

export const NAV_LINKS = [
  { href: "#logging", label: "Logging" },
  { href: "#brands", label: "Brand preferences" },
  { href: "#targets", label: "TDEE targets" },
  { href: "#targets", label: "Progress & history" },
];

export const HERO_PERKS = ["Claude / Groq AI parsing", "Per-100g brand defaults", "Mifflin–St Jeor TDEE"];

/** Illustrative numbers for the hero's dashboard preview. */
export const PREVIEW_MACROS = [
  { label: "Calories", value: "1,480", unit: "kcal", goal: "2,003", percent: 74, bar: "bg-ink" },
  { label: "Protein", value: "98g", unit: "/ 133g", goal: "133g", percent: 74, bar: "bg-primary" },
  { label: "Carbs", value: "162g", unit: "/ 244g", goal: "244g", percent: 66, bar: "bg-ink" },
  { label: "Fat", value: "42g", unit: "/ 55g", goal: "55g", percent: 76, bar: "bg-ink-muted" },
];

export const PREVIEW_PARSED = [
  { item: "Nandini Toned Milk (200ml)", macros: "116 kcal | 6.4g P" },
  { item: "Whole Egg (2 large, 100g)", macros: "144 kcal | 12.6g P" },
];

export interface Step {
  title: string;
  description: string;
  example: string;
  icon: LucideIcon;
}

export const LOGGING_STEPS: Step[] = [
  {
    title: "Text or type",
    description:
      "Write plain English or mixed regional food items. The AI parses quantities and units, and matches them to your saved brand macros.",
    example: '"2 chapatis, 150g curd, and 1 scoop whey"',
    icon: PencilLine,
  },
  {
    title: "Speak via microphone",
    description:
      "Tap the mic and say your meal. The recording is transcribed with Whisper, then parsed for macros like typed text.",
    example: "Tap the mic to dictate hands-free",
    icon: Mic,
  },
  {
    title: "Upload label photo",
    description:
      "Snap the nutrition table on the back of any pack. Claude Vision reads calories, protein, carbs and fat per 100g.",
    example: "Upload a .jpg / .png of the nutrition panel",
    icon: Camera,
  },
];

export const BRAND_METHODS = [
  {
    title: 'By name + "Fetch macros"',
    description: "Enter the ingredient (e.g. paneer) and brand (e.g. Amul Fresh). Fetch macros or fill them in per 100g.",
    icon: Search,
  },
  {
    title: "Upload a nutrition label photo",
    description: "Photograph the back of the pack. Claude extracts the nutrition table and saves it to your preferences.",
    icon: Camera,
  },
  {
    title: "Excel download & import",
    description: "Download every preference as .xlsx, edit or batch-add entries offline, then re-upload anytime.",
    icon: FileSpreadsheet,
  },
];

export const SAMPLE_BRANDS = [
  { name: "Amul Fresh Malai Paneer", trigger: "paneer", kcal: "265 kcal / 100g", p: "18.0g", c: "2.0g", f: "20.0g" },
  { name: "Nandini Toned Milk (Blue)", trigger: "milk", kcal: "58 kcal / 100ml", p: "3.2g", c: "4.7g", f: "3.0g" },
  { name: "Optimum Nutrition Gold Standard Whey", trigger: "whey", kcal: "400 kcal / 100g", p: "80.0g", c: "10.0g", f: "3.3g" },
];

export const SAMPLE_BODY_STATS = [
  { label: "Sex & age", value: "Male, 28 yrs" },
  { label: "Height & weight", value: "178 cm, 76 kg" },
  { label: "Activity level", value: "Moderate (3–5 days/wk)" },
  { label: "Goal", value: "Lose weight", accent: true },
];

export const SAMPLE_STREAK_STATS = [
  { label: "Current", value: "12", unit: "days", accent: true },
  { label: "Best", value: "24", unit: "days" },
  { label: "Logged", value: "58", unit: "total days" },
  { label: "Meals", value: "194", unit: "entries" },
];

/** Bar heights (%) for the illustrative heatmap strip — the last weeks run hot. */
export const SAMPLE_HEAT_BARS = [
  { height: 20, tone: "bg-surface-highest" },
  { height: 30, tone: "bg-surface-highest" },
  { height: 45, tone: "bg-primary/40" },
  { height: 55, tone: "bg-primary/60" },
  { height: 85, tone: "bg-primary" },
  { height: 75, tone: "bg-primary" },
  { height: 90, tone: "bg-primary" },
  { height: 70, tone: "bg-primary/70" },
  { height: 88, tone: "bg-primary" },
  { height: 92, tone: "bg-primary" },
  { height: 80, tone: "bg-primary" },
  { height: 95, tone: "bg-primary" },
];

export const PRO_PRICE = "₹499";

export const PRICING_POINTS = ["UPI, cards & netbanking via Razorpay", "Instant account unlock", "No renewals, ever"];

export const PRO_FEATURES = [
  "Natural-language text & mic voice logging",
  "Nutrition label photo scanner",
  "Custom brand preferences (name, photo, Excel)",
  "Frequent meals & saved meal templates",
  "Mifflin–St Jeor TDEE target calculator",
  "90-day activity heatmap & streak tracking",
];

export const FOOTER_COLUMNS = [
  {
    title: "Navigation",
    links: [
      { href: "#logging", label: "Meal logging" },
      { href: "#brands", label: "Brand preferences" },
      { href: "#targets", label: "TDEE target calculator" },
      { href: "#targets", label: "Activity heatmap" },
    ],
  },
  {
    title: "Architecture",
    links: [
      { href: "#pricing", label: "One-time Pro access" },
      { href: "#byok", label: "Bring your own keys" },
      { href: "#brands", label: "Excel import / export" },
      { href: "#byok", label: "Keys stay in your browser" },
    ],
  },
];
