import { forwardRef, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Check, Eye, EyeOff, KeyRound, Trash2 } from "lucide-react-native";
import { Banner } from "@/components/ui";
import { getAllApiKeys, removeApiKey, setApiKey, type ApiKeyProvider } from "@/lib/api/apiKeyStorage";
import { maskKey, PROVIDERS } from "../providers";

type StoredKeys = Record<ApiKeyProvider, string | null>;

const EMPTY_KEYS: StoredKeys = { anthropic: null, groq: null };

/** Presented via a parent-held ref: `sheetRef.current?.present()`. */
export const ApiKeysSheet = forwardRef<BottomSheetModal>(function ApiKeysSheet(_props, ref) {
  const [keys, setKeys] = useState<StoredKeys>(EMPTY_KEYS);
  const [selected, setSelected] = useState<ApiKeyProvider>("anthropic");
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getAllApiKeys().then(setKeys);
  }, []);

  const dismiss = () => {
    if (ref && "current" in ref) ref.current?.dismiss();
  };

  const provider = PROVIDERS.find((p) => p.id === selected)!;
  const alreadySet = !!keys[selected];

  const handleSave = async () => {
    const value = input.trim();
    if (!value || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      await setApiKey(selected, value);
      setKeys((prev) => ({ ...prev, [selected]: value }));
      setInput("");
      setShowInput(false);
      setFeedback({ type: "success", text: `${provider.label} key saved on this device.` });
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Could not save the key." });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: ApiKeyProvider) => {
    const label = PROVIDERS.find((p) => p.id === id)!.label;
    setFeedback(null);
    try {
      await removeApiKey(id);
      setKeys((prev) => ({ ...prev, [id]: null }));
      setFeedback({ type: "success", text: `${label} key removed.` });
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Could not remove the key." });
    }
  };

  const saveDisabled = !input.trim() || saving;

  return (
    <BottomSheetModal
      ref={ref}
      backgroundStyle={{ backgroundColor: "#16180F" }}
      handleIndicatorStyle={{ backgroundColor: "#2A2D1E" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
      )}
    >
      <BottomSheetView className="gap-4 px-5 pb-8 pt-1">
        <View>
          <View className="flex-row items-center gap-1.5">
            <KeyRound size={16} color="#fbbf24" />
            <Text className="font-display text-base text-text-primary">API Keys</Text>
          </View>
          <Text className="mt-1 font-sans text-[11px] leading-5 text-text-secondary">
            Your keys stay on this device and are sent only with your own requests &mdash; they&rsquo;re never stored on
            the server.
          </Text>
        </View>

        <View className="gap-2">
          {PROVIDERS.map((p) => {
            const key = keys[p.id];
            const warn = !key && p.required;
            return (
              <View
                key={p.id}
                className={`flex-row items-center justify-between gap-2.5 rounded-md border px-3.5 py-3 ${
                  warn ? "border-warn/25 bg-warn/5" : "border-border-subtle bg-surface-inset"
                }`}
              >
                <View className="flex-1 flex-row items-center gap-2.5">
                  <View className={`h-2 w-2 rounded-full ${key ? "bg-success" : warn ? "bg-warn" : "bg-text-muted"}`} />
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-xs text-text-primary">{p.label}</Text>
                    <Text className="mt-0.5 font-sans text-[10px] leading-4 text-text-secondary">{p.description}</Text>
                  </View>
                </View>
                {key ? (
                  <View className="flex-row items-center gap-1.5">
                    <Text className="font-mono text-[9.5px] text-text-muted">{maskKey(key)}</Text>
                    <View className="flex-row items-center gap-0.5 rounded-full border border-success/25 bg-success/10 px-1.5 py-0.5">
                      <Check size={9} color="#34d399" strokeWidth={2.6} />
                      <Text className="font-sans-bold text-[9px] text-success">Set</Text>
                    </View>
                    <Pressable
                      onPress={() => handleRemove(p.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${p.label} key`}
                      className="h-6 w-6 items-center justify-center rounded-xs bg-surface-high"
                    >
                      <Trash2 size={12} color="#8E9085" />
                    </Pressable>
                  </View>
                ) : (
                  <View
                    className={`rounded-full border px-2 py-0.5 ${
                      p.required ? "border-warn/25 bg-warn/10" : "border-border-subtle bg-surface-high"
                    }`}
                  >
                    <Text className={`font-sans-bold text-[9px] ${p.required ? "text-warn" : "text-text-secondary"}`}>
                      {p.required ? "Required" : "Optional"}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View className="border-t border-border-subtle" />

        <View className="gap-2.5">
          <Text className="font-sans-bold text-[9px] uppercase tracking-widest text-text-muted">Add or update a key</Text>

          <View className="flex-row gap-0.5 rounded-full bg-surface-inset p-1">
            {PROVIDERS.map((p) => {
              const active = p.id === selected;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setSelected(p.id);
                    setInput("");
                    setFeedback(null);
                  }}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2 ${active ? "bg-accent" : ""}`}
                >
                  <View
                    className={`h-1.5 w-1.5 rounded-full ${keys[p.id] ? "bg-success" : active ? "bg-bg" : "bg-text-muted"}`}
                  />
                  <Text className={`font-sans-bold text-xs ${active ? "text-bg" : "text-text-secondary"}`}>{p.short}</Text>
                </Pressable>
              );
            })}
          </View>

          <View className="gap-1.5">
            <Text className="font-sans-bold text-[9px] uppercase tracking-widest text-text-muted">{provider.label} key</Text>
            <View className="justify-center">
              <BottomSheetTextInput
                value={input}
                onChangeText={setInput}
                secureTextEntry={!showInput}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={alreadySet ? "Paste a new key to replace it" : provider.placeholder}
                placeholderTextColor="#6E7066"
                className="rounded-sm border border-border bg-bg py-3 pl-3.5 pr-11 font-mono text-xs text-text-primary"
              />
              <Pressable
                onPress={() => setShowInput((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showInput ? "Hide key" : "Show key"}
                hitSlop={8}
                className="absolute right-3"
              >
                {showInput ? <EyeOff size={16} color="#8E9085" /> : <Eye size={16} color="#8E9085" />}
              </Pressable>
            </View>
            <Text className="font-sans text-[10px] leading-4 text-text-muted">{provider.hint}</Text>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saveDisabled}
            className={`items-center rounded-sm bg-accent py-3 ${saveDisabled ? "opacity-45" : ""}`}
          >
            <Text className="font-sans-bold text-xs text-bg">
              {saving ? "Saving…" : alreadySet ? "Update Key" : "Save Key"}
            </Text>
          </Pressable>
        </View>

        {feedback ? <Banner variant={feedback.type} message={feedback.text} /> : null}

        <Pressable onPress={dismiss} className="items-center rounded-full border border-border bg-surface-high py-3">
          <Text className="font-sans-semibold text-[13px] text-text-secondary">Close</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
