import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import type { BrandIdentity } from "@/features/brand-preferences/types";

interface BrandIdentityFieldsProps {
  value: BrandIdentity;
  onChange: (next: BrandIdentity) => void;
}

export function BrandIdentityFields({ value, onChange }: BrandIdentityFieldsProps) {
  return (
    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label={<>Ingredient <span className="text-primary">*</span></>}>
        <Input
          type="text"
          required
          placeholder="e.g. greek yogurt"
          value={value.ingredient}
          onChange={(e) => onChange({ ...value, ingredient: e.target.value })}
        />
      </FormField>
      <FormField label={<>Brand <span className="text-primary">*</span></>}>
        <Input
          type="text"
          required
          placeholder="e.g. Epigamia No Added Sugar"
          value={value.brand}
          onChange={(e) => onChange({ ...value, brand: e.target.value })}
        />
      </FormField>
    </div>
  );
}
