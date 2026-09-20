import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import type { BrandIdentity } from "@/features/brand-preferences/types";

interface BrandIdentityFieldsProps {
  value: BrandIdentity;
  onChange: (next: BrandIdentity) => void;
}

export function BrandIdentityFields({ value, onChange }: BrandIdentityFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormField label="Ingredient">
        <Input
          type="text"
          required
          placeholder="e.g. milk"
          value={value.ingredient}
          onChange={(e) => onChange({ ...value, ingredient: e.target.value })}
        />
      </FormField>
      <FormField label="Brand">
        <Input
          type="text"
          required
          placeholder="e.g. Nandini toned"
          value={value.brand}
          onChange={(e) => onChange({ ...value, brand: e.target.value })}
        />
      </FormField>
    </div>
  );
}
