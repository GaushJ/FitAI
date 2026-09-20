import { ShieldCheck, Trash2 } from "lucide-react";
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
    <div className="grid grid-cols-1 gap-2">
      {keys.map((key) => (
        <div
          key={key.id}
          className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3 transition",
            key.isSet ? "border-slate-800 bg-slate-950/60" : "border-amber-500/20 bg-amber-950/20",
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("h-2 w-2 rounded-full", key.isSet ? "bg-emerald-400" : "animate-pulse bg-amber-400")} />
            <div>
              <p className="text-xs font-semibold text-slate-200">{key.label}</p>
              <p className="text-[10px] text-slate-500">{key.description}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {key.isSet ? (
              <>
                <span className="font-mono text-[10px] text-slate-500">{key.maskedKey}</span>
                <Badge tone="success">
                  <ShieldCheck className="h-2.5 w-2.5" /> Set
                </Badge>
                <IconButton label="Remove key" variant="danger" size="sm" onClick={() => onRemove(key.id)}>
                  <Trash2 />
                </IconButton>
              </>
            ) : (
              <Badge tone="warning">{key.badge}</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
