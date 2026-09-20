import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";

interface AddIngredientFormProps {
  value: { name: string; brand: string; weight: number };
  resolving: boolean;
  onChange: (patch: Partial<{ name: string; brand: string; weight: number }>) => void;
  onAdd: () => void;
}

/** Name / brand / grams row; adding resolves the ingredient's macros server-side. */
export function AddIngredientForm({ value, resolving, onChange, onAdd }: AddIngredientFormProps) {
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Add ingredient</p>
      <div className="flex gap-2">
        <Input
          size="sm"
          className="min-w-0 flex-1"
          placeholder="Name (e.g. egg)"
          aria-label="Ingredient name"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <Input
          size="sm"
          className="w-28"
          placeholder="Brand (optional)"
          aria-label="Ingredient brand"
          value={value.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            size="sm"
            className="w-20 text-right"
            aria-label="Ingredient grams"
            value={value.weight}
            onChange={(e) => onChange({ weight: Number(e.target.value) })}
          />
          <span className="text-[10px] text-slate-500">g</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 font-semibold"
          icon={<Plus />}
          loading={resolving}
          loadingText="Resolving..."
          disabled={!value.name.trim()}
          onClick={onAdd}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
