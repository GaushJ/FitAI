import type { ApiKeyProvider } from "@/lib/api/apiKeyStorage";

export interface ProviderInfo {
  id: ApiKeyProvider;
  label: string;
  short: string;
  description: string;
  hint: string;
  required: boolean;
  placeholder: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    label: "Anthropic Claude",
    short: "Anthropic",
    description: "Meal parsing, macro lookup & label scanning",
    hint: "Required. Used for understanding what you ate, resolving macros, and reading nutrition labels.",
    required: true,
    placeholder: "sk-ant-...",
  },
  {
    id: "groq",
    label: "Groq",
    short: "Groq",
    description: "Voice-to-text for spoken meals",
    hint: "Optional. Only needed if you log meals by voice.",
    required: false,
    placeholder: "gsk_...",
  },
];

/** Shows just enough of a key to recognise it: first 6 and last 4 characters. */
export function maskKey(key: string): string {
  if (key.length <= 10) return "••••••";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}
