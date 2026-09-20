import { Tag } from "lucide-react";
import { cn } from "@/lib/cn";

interface IngredientLabelProps {
  name: string;
  brand: string | null;
  /** Show the leading bullet dot (used in tables/lists, not in editors). */
  bullet?: boolean;
  truncate?: boolean;
}

export function IngredientLabel({ name, brand, bullet = true, truncate }: IngredientLabelProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {bullet && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />}
      <div className="min-w-0">
        <span className={cn("block text-xs font-medium capitalize text-slate-200", truncate && "truncate")}>
          {name}
        </span>
        {brand && (
          <span className="flex items-center gap-0.5 text-[9px] text-accent">
            <Tag className="h-2.5 w-2.5" />
            {brand}
          </span>
        )}
      </div>
    </div>
  );
}
