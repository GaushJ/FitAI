import { useState } from "react";
import { Text, View } from "react-native";
import { CircleCheck, Crosshair, Save, SlidersHorizontal } from "lucide-react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { Alert, Button, Card, FormField, Input, PageHeader, SectionHeading, Spinner } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { useProfile, type AccountProfile } from "@/features/profile/ProfileProvider";
import { BodyProfileFields, MacroTargetFields, TargetPlanSummary } from "@/features/settings/components";
import { useTargetsForm } from "@/features/settings/useTargetsForm";
import { colors } from "@/theme/colors";

// Port of web's SettingsScreen.
function SettingsForm({ profile, onSaved }: { profile: AccountProfile; onSaved: () => Promise<void> }) {
  const { logout } = useAuth();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const form = useTargetsForm(profile, async () => {
    await onSaved();
    setSavedAt(new Date());
  });

  return (
    <View>
      <View className="gap-8">
        <Card className="gap-6">
          <SectionHeading icon={SlidersHorizontal} subtitle="Input" className="border-b border-line pb-4">
            Body stats &amp; goal calculator
          </SectionHeading>

          <FormField label="Display name">
            <Input value={form.name} onChangeText={form.setName} accessibilityLabel="Display name" />
          </FormField>

          <BodyProfileFields
            body={form.body}
            onChange={form.setBodyField}
            canCalculate={form.bodyProfile !== null}
            calculating={form.calculating}
            onCalculate={form.calculate}
          />
          {form.plan ? <TargetPlanSummary plan={form.plan} /> : null}
        </Card>

        <Card className="gap-6">
          <SectionHeading icon={Crosshair} subtitle="Ratios" className="border-b border-line pb-4">
            Daily macro targets
          </SectionHeading>
          <MacroTargetFields
            targets={form.targets}
            onMacroChange={form.setMacro}
            onCaloriesChange={form.setCaloriesText}
            onCaloriesCommit={form.commitCalories}
          />
        </Card>
      </View>

      <View className="mt-8 gap-4 border border-line bg-card p-5">
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
          <View className="flex-row items-center gap-2">
            <CircleCheck size={16} color={colors.success} />
            <Text className="font-sans text-sm text-ink-muted">
              Signed in as <Text className="font-sans-bold text-ink">{profile.username}</Text>
            </Text>
          </View>
          <Text onPress={logout} accessibilityRole="button" className="font-mono text-xs uppercase text-primary underline">
            Sign out
          </Text>
          {savedAt ? <Text className="font-mono text-xs uppercase text-ink-muted">Saved at {savedAt.toLocaleTimeString()}</Text> : null}
        </View>
        <Button size="lg" icon={Save} loading={form.saving} loadingText="Saving..." onPress={form.save}>
          Save targets
        </Button>
      </View>
      {form.error ? (
        <View className="mt-4">
          <Alert tone="error">{form.error}</Alert>
        </View>
      ) : null}
    </View>
  );
}

export default function SettingsScreen() {
  const { profile, refresh } = useProfile();

  return (
    <AppScreen>
      <PageHeader
        eyebrow="Mifflin–St Jeor TDEE calculator"
        title="Settings & targets"
        description="Get suggested targets from your body stats and goal, then fine-tune your daily calorie and macro limits."
      />
      {profile ? <SettingsForm profile={profile} onSaved={refresh} /> : <Spinner />}
    </AppScreen>
  );
}
