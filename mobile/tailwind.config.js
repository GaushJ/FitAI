/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Base surfaces (dark theme — GetFitBro has no light theme on web)
        bg: "#0B0C09",
        surface: {
          DEFAULT: "#16180F",
          raised: "#1A1C12",
          high: "#1E2018",
          inset: "#0F100B",
        },
        border: {
          DEFAULT: "#2A2D1E",
          subtle: "rgba(255,255,255,0.08)",
        },
        text: {
          primary: "#F4F5EF",
          secondary: "#8E9085",
          muted: "#6E7066",
          tertiary: "#A2A498",
        },
        // Brand accent — the lime used for CTAs, active states, progress fills
        accent: {
          DEFAULT: "#C9F24D",
          hover: "#D4F56A",
          dim: "#AFDF33",
        },
        // Macro-specific colors (match web's per-macro coding)
        macro: {
          calories: "#fb923c", // orange-400
          protein: "#C9F24D", // accent lime
          carbs: "#22d3ee", // cyan-400
          fat: "#fb7185", // rose-400
        },
        success: {
          DEFAULT: "#34d399", // emerald-400
          bg: "rgba(16,185,129,0.08)",
        },
        danger: {
          DEFAULT: "#f87171", // red-400
          bg: "rgba(239,68,68,0.08)",
        },
        warn: {
          DEFAULT: "#fbbf24", // amber-400
        },
      },
      borderRadius: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        // full is already a Tailwind default (9999px)
      },
      fontFamily: {
        display: ["BricolageGrotesque_700Bold"],
        "display-medium": ["BricolageGrotesque_600SemiBold"],
        sans: ["HankenGrotesk_400Regular"],
        "sans-medium": ["HankenGrotesk_500Medium"],
        "sans-semibold": ["HankenGrotesk_600SemiBold"],
        "sans-bold": ["HankenGrotesk_700Bold"],
        mono: ["JetBrainsMono_500Medium"],
        "mono-bold": ["JetBrainsMono_700Bold"],
      },
    },
  },
  plugins: [],
};
