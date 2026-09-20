"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { FormField } from "@/components/molecules/FormField";
import { AuthInput } from "@/features/auth/components/AuthInput";

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Adds a show/hide toggle. */
  revealable?: boolean;
  invalid?: boolean;
}

export function PasswordField({ label, value, onChange, revealable, invalid, ...rest }: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <FormField label={label} labelClassName="text-slate-600">
      <AuthInput
        icon={Lock}
        type={revealed ? "text" : "password"}
        required
        value={value}
        invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
        trailing={
          revealable && (
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-600"
            >
              {revealed ? <EyeOff className="size-[15px]" /> : <Eye className="size-[15px]" />}
            </button>
          )
        }
        {...rest}
      />
    </FormField>
  );
}
