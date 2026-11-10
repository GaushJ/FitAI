"use client";

import { useId, useState, type FormEvent } from "react";
import { CircleCheck, Crosshair, Save, SlidersHorizontal } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { FormField } from "@/components/molecules/FormField";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { PageHeader } from "@/features/app-shell/components/PageHeader";
import { useLogout } from "@/features/auth/hooks/useAuthSession";
import type { AccountProfile } from "@/features/profile/api";
import { useProfile } from "@/features/profile/ProfileProvider";
import { BodyProfileFields } from "@/features/settings/components/BodyProfileFields";
import { MacroTargetFields } from "@/features/settings/components/MacroTargetFields";
import { TargetPlanSummary } from "@/features/settings/components/TargetPlanSummary";
import { useMacroTargetsForm } from "@/features/settings/hooks/useMacroTargetsForm";

function SettingsForm({ profile, onSaved }: { profile: AccountProfile; onSaved: () => Promise<void> }) {
  const formId = useId();
  const logout = useLogout();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const form = useMacroTargetsForm(profile, async () => {
    await onSaved();
    setSavedAt(new Date());
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    form.save();
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="space-y-6">
          <SectionHeading icon={<SlidersHorizontal />} subtitle="Input" className="border-b border-line pb-4">
            Body stats &amp; goal calculator
          </SectionHeading>

          <FormField label="Display name">
            <Input type="text" required value={form.name} onChange={(e) => form.setName(e.target.value)} />
          </FormField>

          <BodyProfileFields
            body={form.body}
            onChange={form.setBodyField}
            canCalculate={form.bodyProfile !== null}
            calculating={form.calculating}
            onCalculate={form.calculate}
          />
          {form.plan && <TargetPlanSummary plan={form.plan} />}
        </Card>

        <Card className="space-y-6">
          <SectionHeading icon={<Crosshair />} subtitle="Ratios" className="border-b border-line pb-4">
            Daily macro targets
          </SectionHeading>
          <MacroTargetFields
            targets={form.targets}
            onMacroChange={form.setMacro}
            onCaloriesChange={form.setCaloriesText}
            onCaloriesCommit={form.commitCalories}
          />
        </Card>
      </div>

      <div className="mt-8 flex flex-col gap-4 border border-line bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span className="flex items-center gap-2">
            <CircleCheck className="size-4 text-success" />
            Signed in as <strong className="text-ink">{profile.username}</strong>
          </span>
          <button
            type="button"
            onClick={logout}
            className="cursor-pointer font-mono text-xs uppercase text-primary underline underline-offset-4"
          >
            Sign out
          </button>
          {savedAt && (
            <span className="font-mono text-xs uppercase">Saved at {savedAt.toLocaleTimeString()}</span>
          )}
        </div>
        <Button type="submit" size="lg" icon={<Save />} loading={form.saving} loadingText="Saving...">
          Save targets
        </Button>
      </div>
      {form.error && (
        <div className="mt-4">
          <Alert tone="error">{form.error}</Alert>
        </div>
      )}
    </form>
  );
}

export function SettingsScreen() {
  const { profile, refresh } = useProfile();

  return (
    <>
      <PageHeader
        eyebrow="Mifflin–St Jeor TDEE calculator"
        title="Settings & targets"
        description="Get suggested targets from your body stats and goal, then fine-tune your daily calorie and macro limits."
      />
      {profile ? (
        <SettingsForm profile={profile} onSaved={refresh} />
      ) : (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-primary" />
        </div>
      )}
    </>
  );
}
