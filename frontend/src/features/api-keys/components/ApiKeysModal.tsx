"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { Modal } from "@/components/organisms/Modal";
import type { Notice } from "@/types/notice";
import { ProviderSelect } from "@/features/api-keys/components/ProviderSelect";
import { ProviderStatusList } from "@/features/api-keys/components/ProviderStatusList";
import type { useApiKeys } from "@/features/api-keys/hooks/useApiKeys";

interface ApiKeysModalProps {
  apiKeys: ReturnType<typeof useApiKeys>;
  onClose: () => void;
}

export function ApiKeysModal({ apiKeys, onClose }: ApiKeysModalProps) {
  const [providerId, setProviderId] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [reveal, setReveal] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selected = apiKeys.keys.find((k) => k.id === providerId);

  const selectProvider = (id: string) => {
    setProviderId(id);
    setKeyInput("");
    setNotice(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!providerId || !keyInput.trim()) return;
    apiKeys.save(providerId, keyInput.trim());
    setNotice({ tone: "success", text: "Key saved locally — never sent to the server." });
    setKeyInput("");
    setReveal(false);
  };

  const handleRemove = (id: string) => {
    apiKeys.remove(id);
    if (providerId === id) {
      setKeyInput("");
      setNotice(null);
    }
  };

  return (
    <Modal
      title="API Key Manager"
      icon={<KeyRound className="text-amber-400" />}
      subtitle="Keys are stored in your local SQLite DB and hot-loaded — no restart needed."
      onClose={onClose}
      bodyClassName="space-y-5"
    >
      <ProviderStatusList keys={apiKeys.keys} onRemove={handleRemove} />

      <div className="border-t border-slate-800" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Add or Update a Key</p>

        <ProviderSelect keys={apiKeys.keys} selectedId={providerId} onSelect={selectProvider} />

        {selected && (
          <FormField label={`${selected.label} Key`} hint={selected.description}>
            <div className="relative">
              <Input
                type={reveal ? "text" : "password"}
                required
                size="lg"
                focusTone="amber"
                className="pr-10 font-mono"
                placeholder={`Paste your ${selected.label} key here...`}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide key" : "Show key"}
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-500 transition hover:text-slate-300"
              >
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
        )}

        <Button
          type="submit"
          variant="warning"
          fullWidth
          icon={<ShieldCheck />}
          disabled={!providerId || !keyInput.trim()}
        >
          Save API Key
        </Button>
      </form>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
    </Modal>
  );
}
