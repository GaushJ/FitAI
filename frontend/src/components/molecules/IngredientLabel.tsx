import { Tag } from "lucide-react";
import { cn } from "@/lib/cn";

interface IngredientLabelProps {
  name: string;
  brand: string | null;
  /** Show the leading square bullet (used in tables/lists, not in editors). */
  bullet?: boolean;
  truncate?: boolean;
}

export function IngredientLabel({ name, brand, bullet = true, truncate }: IngredientLabelProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {bullet && <span className="size-1.5 shrink-0 bg-primary" />}
      <span className={cn("font-display text-sm font-medium capitalize text-ink", truncate && "truncate")}>
        {name}
      </span>
      {brand && (
        <span className="inline-flex shrink-0 items-center gap-1 border border-line bg-surface-low px-1.5 py-px font-mono text-[10px] text-ink-muted">
          <Tag className="size-2.5" />
          {brand}
        </span>
      )}
    </div>
  );
}
