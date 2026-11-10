import { Text, View } from "react-native";

// Mirrors frontend/src/components/molecules/FormField.tsx.
interface FormFieldProps {
  label: string;
  /** Marks the field required with a red asterisk (web's `<span className="text-primary">*</span>`). */
  required?: boolean;
  /** Right-aligned note beside the label. */
  aside?: string;
  /** Overrides the label colour, e.g. to colour-code a macro. */
  labelClassName?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, aside, labelClassName, hint, className = "", children }: FormFieldProps) {
  return (
    <View className={className}>
      <View className="mb-1.5 flex-row items-baseline justify-between gap-2">
        <Text className={`font-mono-medium text-[11px] uppercase tracking-widest ${labelClassName ?? "text-ink-muted"}`}>
          {label}
          {required ? <Text className="text-primary"> *</Text> : null}
        </Text>
        {aside ? <Text className="font-mono text-[11px] uppercase tracking-wider text-ink-subtle">{aside}</Text> : null}
      </View>
      {children}
      {hint ? <Text className="mt-1.5 font-sans text-xs text-ink-muted">{hint}</Text> : null}
    </View>
  );
}
