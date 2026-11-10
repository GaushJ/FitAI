import { CircleCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { IconButton } from "@/components/atoms/IconButton";
import { cn } from "@/lib/cn";
import type { ApiKeyStatus } from "@/features/api-keys/hooks/useApiKeys";

interface ProviderStatusListProps {
  keys: ApiKeyStatus[];
  onRemove: (providerId: string) => void;
}

export function ProviderStatusList({ keys, onRemove }: ProviderStatusListProps) {
  return (
    <ul className="space-y-4">
      {keys.map((key) => (
        <li key={key.id} className="border border-line bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span
                className={cn("mt-2 size-2.5 shrink-0 rounded-full", key.isSet ? "bg-success-bright" : "bg-line-strong")}
              />
              <div>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-xl font-semibold uppercase text-ink">{key.label}</span>
                  <Badge tone="muted">{key.tag}</Badge>
                </p>
                <p className="mt-1 text-sm text-ink-muted">{key.description}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 pl-5 sm:pl-0">
              {key.isSet ? (
                <>
                  <span className="border border-line bg-surface-low px-2 py-1 font-mono text-xs text-ink">{key.maskedKey}</span>
                  <Badge tone="success">
                    <CircleCheck className="size-3" /> Set
                  </Badge>
                  <IconButton label={`Remove ${key.label} key`} variant="danger" onClick={() => onRemove(key.id)}>
                    <Trash2 />
                  </IconButton>
                </>
              ) : (
                <Badge tone={key.badge === "Required" ? "warning" : "muted"}>Not set · {key.badge}</Badge>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
