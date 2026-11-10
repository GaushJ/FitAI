/** @type {import('tailwindcss').Config} */
// Same token names and values as the web app (frontend/src/app/globals.css `@theme`).
// JS-side copies for icon colours and shadows live in src/theme/colors.ts. Change all three together.
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        card: "#ffffff",
        surface: {
          DEFAULT: "#fbf9f5",
          low: "#f5f3ef",
          container: "#efeeea",
          high: "#eae8e4",
          highest: "#e4e2de",
        },
        ink: {
          DEFAULT: "#1b1c1a",
          muted: "#5f5e5e",
          subtle: "#8b8a88",
        },
        line: {
          DEFAULT: "#e4e2de",
          strong: "#c8c6c5",
        },
        primary: {
          DEFAULT: "#ba090a",
          bright: "#df2c22",
          dark: "#930003",
          soft: "#ffdad5",
        },
        success: {
          DEFAULT: "#15803d",
          bright: "#22c55e",
          soft: "#dcfce7",
        },
        warning: {
          DEFAULT: "#b45309",
          soft: "#fef3c7",
        },
        danger: {
          DEFAULT: "#ba1a1a",
          soft: "#ffdad6",
        },
        macro: {
          calories: "#ba090a",
          protein: "#15803d",
          carbs: "#c2410c",
          fat: "#be123c",
        },
      },
      borderRadius: {
        xs: "2px",
      },
      fontFamily: {
        // Oswald (web `font-display` + weight)
        "display-medium": ["Oswald_500Medium"],
        "display-semibold": ["Oswald_600SemiBold"],
        display: ["Oswald_700Bold"],
        // Inter (web `font-sans` + weight)
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],
        // JetBrains Mono (web `font-mono` + weight)
        mono: ["JetBrainsMono_400Regular"],
        "mono-medium": ["JetBrainsMono_500Medium"],
        "mono-bold": ["JetBrainsMono_700Bold"],
      },
    },
  },
  plugins: [],
};
