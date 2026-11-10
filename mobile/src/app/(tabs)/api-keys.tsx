import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { ArrowUpRight, CircleCheck, Eye, EyeOff, Lock, ShieldCheck, Trash2 } from "lucide-react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { Alert, Badge, Button, Card, FormField, IconButton, Input, PageHeader, SectionHeading, Select } from "@/components/ui";
import { useApiKeys, type ApiKeyStatus } from "@/features/apiKeys/useApiKeys";
import { API_KEY_PROVIDERS } from "@/features/apiKeys/providers";
import type { ApiKeyProvider } from "@/lib/api/apiKeyStorage";
import { colors } from "@/theme/colors";
import type { Notice } from "@/types/notice";

// Port of web's ApiKeysScreen + ProviderStatusList. Keys are kept on this device (SecureStore)
// rather than in a browser, so that's the only wording that differs.

function ProviderStatusList({ keys, onRemove }: { keys: ApiKeyStatus[]; onRemove: (id: ApiKeyProvider) => void }) {
  return (
    <View className="gap-4">
      {keys.map((key) => (
        <View key={key.id} className="gap-3 border border-line bg-card p-5">
          <View className="flex-row gap-3">
            <View className={`mt-2 h-2.5 w-2.5 rounded-full ${key.isSet ? "bg-success-bright" : "bg-line-strong"}`} />
            <View className="flex-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="font-display-semibold text-xl uppercase text-ink">{key.label}</Text>
                <Badge tone="muted">{key.tag}</Badge>
              </View>
              <Text className="mt-1 font-sans text-sm text-ink-muted">{key.description}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap items-center gap-2 pl-5">
            {key.isSet ? (
              <>
                <Text className="border border-line bg-surface-low px-2 py-1 font-mono text-xs text-ink">{key.maskedKey}</Text>
                <Badge tone="success" icon={CircleCheck}>
                  Set
                </Badge>
                <IconButton label={`Remove ${key.label} key`} variant="danger" icon={Trash2} onPress={() => onRemove(key.id)} />
              </>
            ) : (
              <Badge tone={key.badge === "Required" ? "warning" : "muted"}>{`Not set · ${key.badge}`}</Badge>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function CredentialsGuide() {
  return (
    <Card>
      <SectionHeading className="mb-4 border-b border-line pb-3">Getting a key</SectionHeading>
      {API_KEY_PROVIDERS.map((provider, index) => (
        <View key={provider.id} className={`flex-row gap-3 ${index > 0 ? "border-t border-line pt-4" : ""} ${index < API_KEY_PROVIDERS.length - 1 ? "pb-4" : ""}`}>
          <Text className="self-start border border-line bg-surface-low px-1.5 font-mono text-xs text-ink">
            {String(index + 1).padStart(2, "0")}
          </Text>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-semibold text-ink">{provider.label}</Text>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(provider.console.url)} className="flex-row items-center gap-0.5">
              <Text className="font-mono text-xs text-primary">{provider.console.host}</Text>
              <ArrowUpRight size={12} color={colors.primary} />
            </Pressable>
            <Text className="mt-1 font-sans text-sm text-ink-muted">{provider.console.steps}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

export default function ApiKeysScreen() {
  const apiKeys = useApiKeys();
  const [providerId, setProviderId] = useState<ApiKeyProvider>(API_KEY_PROVIDERS[0].id);
  const [keyInput, setKeyInput] = useState("");
  const [reveal, setReveal] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selected = apiKeys.keys.find((k) => k.id === providerId);
  const setCount = apiKeys.keys.filter((k) => k.isSet).length;

  const handleSubmit = async () => {
    if (!keyInput.trim()) return;
    await apiKeys.save(providerId, keyInput.trim());
    setNotice({ tone: "success", text: `${selected?.label} key saved on this device.` });
    setKeyInput("");
    setReveal(false);
  };

  return (
    <AppScreen>
      <PageHeader
        eyebrow="Bring your own keys"
        title="API keys"
        description="Use your own Anthropic, Groq or Tavily credentials. Without a key, requests use the server's default key if one is configured."
      />

      <Card tone="muted" className="mb-8 flex-row gap-4">
        <View className="h-10 w-10 items-center justify-center border border-line bg-card">
          <Lock size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="font-display-semibold text-xl uppercase text-ink">Stored on this device only</Text>
          <Text className="mt-1 font-sans text-sm text-ink-muted">
            Keys live in this device&apos;s secure storage and are attached as request headers when a meal, voice note or label is
            processed. They are never written to our database — deleting the app or switching devices removes them.
          </Text>
        </View>
      </Card>

      <View className="gap-8">
        <View>
          <View className="mb-4 flex-row items-center gap-3">
            <Text className="font-display-semibold text-2xl uppercase tracking-tight text-ink">Providers</Text>
            <Badge tone="muted">{`${setCount} set`}</Badge>
          </View>
          <ProviderStatusList keys={apiKeys.keys} onRemove={apiKeys.remove} />
        </View>

        <Card tone="raised">
          <SectionHeading className="mb-5" subtitle="Saving replaces any existing key for that provider">
            Add or update a key
          </SectionHeading>
          <View className="gap-5">
            <FormField label="Provider">
              <Select
                accessibilityLabel="Provider"
                value={providerId}
                options={apiKeys.keys.map((key) => ({
                  value: key.id,
                  label: `${key.label} — ${key.tag}${key.isSet ? " (set)" : ""}`,
                }))}
                onChange={(id) => {
                  setProviderId(id);
                  setKeyInput("");
                  setNotice(null);
                }}
              />
            </FormField>

            <FormField label="API key" aside={selected?.badge}>
              <View className="justify-center">
                <Input
                  mono
                  secureTextEntry={!reveal}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="pr-11"
                  placeholder={`Paste your ${selected?.label} key`}
                  accessibilityLabel="API key"
                  value={keyInput}
                  onChangeText={setKeyInput}
                />
                <Pressable
                  onPress={() => setReveal((r) => !r)}
                  accessibilityRole="button"
                  accessibilityLabel={reveal ? "Hide key" : "Show key"}
                  hitSlop={8}
                  className="absolute right-3"
                >
                  {reveal ? <EyeOff size={16} color={colors.inkMuted} /> : <Eye size={16} color={colors.inkMuted} />}
                </Pressable>
              </View>
            </FormField>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button variant="dark" size="lg" fullWidth icon={ShieldCheck} disabled={!keyInput.trim()} onPress={handleSubmit}>
                  Save API key
                </Button>
              </View>
              <Button variant="outline" size="lg" disabled={!keyInput} onPress={() => setKeyInput("")}>
                Clear
              </Button>
            </View>
            {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
          </View>
        </Card>

        <CredentialsGuide />
      </View>
    </AppScreen>
  );
}
