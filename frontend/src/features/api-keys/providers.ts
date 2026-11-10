export interface ApiKeyProvider {
  id: string;
  label: string;
  /** Short capability tag, e.g. "Vision". */
  tag: string;
  description: string;
  /** Shown while the key is missing. */
  badge: "Required" | "Optional";
  /** Where to create a key, and how. */
  console: { url: string; host: string; steps: string };
}

export const API_KEY_PROVIDERS: readonly ApiKeyProvider[] = [
  {
    id: "anthropic",
    label: "Anthropic Claude",
    tag: "Primary · Vision",
    description: "Meal extraction, macro resolution and nutrition-label vision.",
    badge: "Required",
    console: {
      url: "https://console.anthropic.com/settings/keys",
      host: "console.anthropic.com",
      steps: "Sign in, open API Keys and create a key. Needed for parsing meals and reading label photos.",
    },
  },
  {
    id: "groq",
    label: "Groq",
    tag: "Whisper",
    description: "Fast Whisper speech-to-text for voice logging.",
    badge: "Optional",
    console: {
      url: "https://console.groq.com/keys",
      host: "console.groq.com",
      steps: "Create a free API key. Used only to transcribe what you say into the mic.",
    },
  },
  {
    id: "tavily",
    label: "Tavily Search",
    tag: "Web search",
    description: "Web search fallback for unknown ingredients.",
    badge: "Optional",
    console: {
      url: "https://app.tavily.com",
      host: "app.tavily.com",
      steps: "Create an account and copy your API key from the dashboard.",
    },
  },
];
