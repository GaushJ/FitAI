export interface ApiKeyProvider {
  id: string;
  label: string;
  description: string;
  /** Shown while the key is missing. */
  badge: "Required" | "Optional";
  /** Tailwind classes for the provider's colour dot. */
  dotClassName: string;
}

export const API_KEY_PROVIDERS: readonly ApiKeyProvider[] = [
  {
    id: "anthropic",
    label: "Anthropic Claude",
    description: "Required for meal extraction, macro resolution & label vision.",
    badge: "Required",
    dotClassName: "bg-linear-to-r from-orange-500 to-amber-500",
  },
  {
    id: "groq",
    label: "Groq",
    description: "Ultra-fast Whisper speech-to-text.",
    badge: "Optional",
    dotClassName: "bg-accent",
  },
  {
    id: "tavily",
    label: "Tavily Search",
    description: "Web search fallback for unknown ingredients.",
    badge: "Optional",
    dotClassName: "bg-linear-to-r from-rose-500 to-pink-500",
  },
];
