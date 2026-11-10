"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormField } from "@/components/molecules/FormField";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import type { Notice } from "@/types/notice";
import { PageHeader } from "@/features/app-shell/components/PageHeader";
import { ProviderStatusList } from "@/features/api-keys/components/ProviderStatusList";
import { useApiKeys } from "@/features/api-keys/hooks/useApiKeys";
import { API_KEY_PROVIDERS } from "@/features/api-keys/providers";

function CredentialsGuide() {
  return (
    <Card>
      <SectionHeading className="mb-4 border-b border-line pb-3">Getting a key</SectionHeading>
      <ol className="divide-y divide-line">
        {API_KEY_PROVIDERS.map((provider, index) => (
          <li key={provider.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
            <span className="h-fit border border-line bg-surface-low px-1.5 font-mono text-xs text-ink">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink">{provider.label}</p>
              <a
                href={provider.console.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-mono text-xs text-primary hover:underline"
              >
                {provider.console.host} <ArrowUpRight className="size-3" />
              </a>
              <p className="mt-1 text-sm text-ink-muted">{provider.console.steps}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function ApiKeysScreen() {
  const apiKeys = useApiKeys();
  const [providerId, setProviderId] = useState(API_KEY_PROVIDERS[0].id);
  const [keyInput, setKeyInput] = useState("");
  const [reveal, setReveal] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selected = apiKeys.keys.find((k) => k.id === providerId);
  const setCount = apiKeys.keys.filter((k) => k.isSet).length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    apiKeys.save(providerId, keyInput.trim());
    setNotice({ tone: "success", text: `${selected?.label} key saved in this browser.` });
    setKeyInput("");
    setReveal(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Bring your own keys"
        title="API keys"
        description="Use your own Anthropic, Groq or Tavily credentials. Without a key, requests use the server's default key if one is configured."
      />

      <Card tone="muted" className="mb-8 flex gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center border border-line bg-card text-primary">
          <Lock className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold uppercase text-ink">Stored in this browser only</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Keys live in your browser&apos;s local storage and are attached as request headers when a meal, voice note
            or label is processed. They are never written to our database — clearing site data or switching browsers
            removes them.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-tight text-ink">Providers</h2>
              <Badge tone="muted">{setCount} set</Badge>
            </div>
            <ProviderStatusList keys={apiKeys.keys} onRemove={apiKeys.remove} />
          </section>

          <Card tone="raised">
            <SectionHeading className="mb-5" subtitle="Saving replaces any existing key for that provider">
              Add or update a key
            </SectionHeading>
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField label="Provider">
                <Select
                  value={providerId}
                  onChange={(e) => {
                    setProviderId(e.target.value);
                    setKeyInput("");
                    setNotice(null);
                  }}
                >
                  {apiKeys.keys.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.label} — {key.tag}
                      {key.isSet ? " (set)" : ""}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="API key" aside={selected?.badge}>
                <div className="relative">
                  <Input
                    type={reveal ? "text" : "password"}
                    required
                    autoComplete="off"
                    className="pr-11 font-mono"
                    placeholder={`Paste your ${selected?.label} key`}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    aria-label={reveal ? "Hide key" : "Show key"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-ink-muted hover:text-ink"
                  >
                    {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormField>

              <div className="flex gap-3">
                <Button type="submit" variant="dark" size="lg" className="flex-1" icon={<ShieldCheck />} disabled={!keyInput.trim()}>
                  Save API key
                </Button>
                <Button variant="outline" size="lg" disabled={!keyInput} onClick={() => setKeyInput("")}>
                  Clear
                </Button>
              </div>
              {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
            </form>
          </Card>
        </div>

        <aside className="lg:col-span-5">
          <CredentialsGuide />
        </aside>
      </div>
    </>
  );
}
