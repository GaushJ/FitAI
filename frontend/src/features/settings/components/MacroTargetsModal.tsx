"use client";

import { useId, type FormEvent } from "react";
import { Settings } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { Modal } from "@/components/organisms/Modal";
import { BodyProfileFields } from "@/features/settings/components/BodyProfileFields";
import { MacroTargetFields } from "@/features/settings/components/MacroTargetFields";
import { TargetPlanSummary } from "@/features/settings/components/TargetPlanSummary";
import { useMacroTargetsForm } from "@/features/settings/hooks/useMacroTargetsForm";
import type { UserProfile } from "@/features/settings/types";

interface MacroTargetsModalProps {
  profile: UserProfile;
  onClose: () => void;
  /** Runs after a successful save (refresh data, show a message, close). */
  onSaved: () => Promise<void> | void;
}

function SectionTitle({ children }: { children: string }) {
  return <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</h4>;
}

export function MacroTargetsModal({ profile, onClose, onSaved }: MacroTargetsModalProps) {
  const formId = useId();
  const form = useMacroTargetsForm(profile, onSaved);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    form.save();
  };

  return (
    <Modal
      contained
      size="lg"
      title="Adjust Macro Targets"
      icon={<Settings className="text-accent" />}
      subtitle="Get suggested targets from your body stats and goal, then fine-tune them"
      onClose={onClose}
      bodyClassName="space-y-6"
      footer={
        <div className="space-y-3">
          {form.error && <Alert tone="error">{form.error}</Alert>}
          <div className="flex justify-end gap-3 text-xs font-bold">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={form.saving} className="px-5 shadow-lg shadow-accent/20">
              Save Targets
            </Button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Your Name" variant="plain">
          <Input type="text" required size="lg" value={form.name} onChange={(e) => form.setName(e.target.value)} />
        </FormField>

        <section className="space-y-4">
          <SectionTitle>Your body &amp; goal</SectionTitle>
          <BodyProfileFields
            body={form.body}
            onChange={form.setBodyField}
            canCalculate={form.bodyProfile !== null}
            calculating={form.calculating}
            onCalculate={form.calculate}
          />
          {form.plan && <TargetPlanSummary plan={form.plan} />}
        </section>

        <section className="space-y-4 border-t border-slate-800 pt-6">
          <SectionTitle>Daily targets</SectionTitle>
          <MacroTargetFields
            targets={form.targets}
            onMacroChange={form.setMacro}
            onCaloriesChange={form.setCaloriesText}
            onCaloriesCommit={form.commitCalories}
          />
        </section>
      </form>
    </Modal>
  );
}
