export const MARQUEE_WORDS = [
  "Whey protein",
  "Brown rice",
  "Greek yogurt",
  "Almonds",
  "Chicken breast",
  "Oats",
  "Peanut butter",
  "Eggs",
  "Sweet potato",
  "Banana",
];

export const HERO_PERKS = ["No credit card", "Free to start", "5-second logs"];

export const RESOLVED_ITEMS: Array<[label: string, macros: string]> = [
  ["2 eggs · scrambled", "156 kcal · 13P"],
  ["Oats · 80g", "303 kcal · 11P"],
  ["Banana · 1 medium", "105 kcal · 1P"],
];

export const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "Log your meal",
    description: "Type what you ate, or tap the mic and say it — brand, quantity, prep, all understood.",
    iconPath: "M21 21l-4.34-4.34M18.67 10.67a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  },
  {
    number: "02",
    title: "AI resolves macros",
    description: "The pipeline extracts ingredients, matches your brands and calculates exact macros.",
    iconPath: "M12 2a9 9 0 1 0 9 9M12 2v9l6 4",
  },
  {
    number: "03",
    title: "Track & keep streaks",
    description: "Daily totals, weekly charts and a 90-day heatmap update the instant you log.",
    iconPath: "M3 17l6-6 4 4 8-8M21 7v6h-6",
  },
];

export const ENGINE_POINTS = [
  { title: "Brand-aware", description: "Knows your usual whey, your rice, your peanut butter." },
  { title: "Portion smart", description: '"A handful", "80 grams", "one medium" — all understood.' },
  { title: "Fills the gaps", description: "Pulls missing nutrition data from the web automatically." },
];

export const ENGINE_STEPS = [
  "Understands what you typed or said",
  "Splits the meal into ingredients",
  "Matches your preferred brands automatically",
];

export const STREAK_STATS = [
  { value: "12", label: "Current streak", valueClassName: "text-heat" },
  { value: "28", label: "Best streak", valueClassName: "text-accent" },
  { value: "76", label: "Days logged", valueClassName: "text-slate-100" },
];

export const HEATMAP_CELL_COUNT = 91;
/** Heat-level colours, quietest → busiest. */
export const HEAT_COLORS = ["rgba(255,255,255,0.05)", "rgba(201,242,77,0.3)", "rgba(201,242,77,0.6)", "#C9F24D"];

export const COUNTER_STATS = [
  { target: 2840, suffix: "", label: "Avg daily calories tracked", highlight: true },
  { target: 196, suffix: "g", label: "Avg protein logged / day", highlight: false },
  { target: 142000, suffix: "+", label: "Meals resolved by AI", highlight: false },
  { target: 11800, suffix: "+", label: "Active trackers", highlight: true },
];
