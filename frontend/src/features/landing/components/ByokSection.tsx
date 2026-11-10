import { KeyRound } from "lucide-react";

const SAMPLE_KEYS = [
  { label: "Anthropic API key", masked: "sk-ant-••••" },
  { label: "Groq API key", masked: "gsk_••••" },
];

export function ByokSection() {
  return (
    <section id="byok" className="scroll-mt-24 py-6">
      <div className="grid grid-cols-1 items-center gap-6 border-2 border-ink bg-card p-6 shadow-hard sm:p-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
            <KeyRound className="size-4" /> Local key storage &amp; privacy
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase text-ink">Bring your own API keys</h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Prefer your own credentials? Save your personal <strong className="text-ink">Anthropic Claude</strong> and{" "}
            <strong className="text-ink">Groq</strong> keys in your browser — they&apos;re sent with each request and never
            stored on our servers.
          </p>
        </div>
        <ul className="w-full space-y-2 lg:w-80">
          {SAMPLE_KEYS.map((key) => (
            <li key={key.label} className="flex justify-between gap-4 border border-line bg-surface-low px-3 py-2.5 font-mono text-xs">
              <span className="text-ink">{key.label}</span>
              <span className="text-ink-muted">{key.masked}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
