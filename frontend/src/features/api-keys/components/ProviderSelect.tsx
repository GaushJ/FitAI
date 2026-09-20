"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ApiKeyStatus } from "@/features/api-keys/hooks/useApiKeys";

interface ProviderSelectProps {
  keys: ApiKeyStatus[];
  selectedId: string;
  onSelect: (providerId: string) => void;
}

/** Dropdown listing each provider with its colour dot and "key set" tick. */
export function ProviderSelect({ keys, selectedId, onSelect }: ProviderSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = keys.find((k) => k.id === selectedId);

  return (
    <div className="relative">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Select LLM / Service
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-left text-xs transition hover:border-slate-700 focus:border-amber-500 focus:outline-none"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", selected.dotClassName)} />
            <span className="font-medium text-slate-100">{selected.label}</span>
            <span className="text-[10px] text-slate-500">({selected.description})</span>
          </span>
        ) : (
          <span className="text-slate-500">Choose a provider...</span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl"
        >
          {keys.map((key) => (
            <button
              key={key.id}
              type="button"
              role="option"
              aria-selected={key.id === selectedId}
              onClick={() => {
                onSelect(key.id);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800"
            >
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", key.dotClassName)} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200">{key.label}</p>
                <p className="truncate text-[10px] text-slate-500">{key.description}</p>
              </div>
              {key.isSet && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
