import { Text, View } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Bookmark, Plus, Save, X, Zap } from "lucide-react-native";
import { Alert, Button, FormField, IconButton, IngredientLabel, Input, MacroInline, Modal } from "@/components/ui";
import type { Notifier } from "@/hooks/useFeedback";
import { macroActual } from "@/lib/nutrition";
import { useSavedMealEditor } from "../hooks/useSavedMealEditor";
import type { SavedMealDraft } from "../types";

// Port of web's SavedMealEditorModal + EditorIngredientRow + AddIngredientForm.
interface SavedMealEditorModalProps {
  draft: SavedMealDraft;
  notify: Notifier;
  onClose: () => void;
  onTemplateSaved: () => Promise<void> | void;
  onLogged: () => Promise<void> | void;
}

/** Build or tweak a meal template, then save it for next time and/or log it now. */
export function SavedMealEditorModal({ draft, notify, onClose, onTemplateSaved, onLogged }: SavedMealEditorModalProps) {
  const editor = useSavedMealEditor({ draft, notify, onTemplateSaved, onLogged });

  return (
    <Modal
      title={editor.isNew ? "New saved meal" : "Edit saved meal"}
      icon={Bookmark}
      subtitle="Adjust quantities, add or remove ingredients, then log or save."
      onClose={onClose}
      footer={
        <View className="gap-3">
          {editor.notice ? <Alert tone={editor.notice.tone}>{editor.notice.text}</Alert> : null}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button variant="outline" fullWidth icon={Save} loading={editor.saving} onPress={editor.saveTemplate}>
                Save meal
              </Button>
            </View>
            <View className="flex-1">
              <Button fullWidth icon={Zap} loading={editor.saving} onPress={() => editor.saveAndLog(onClose)}>
                Log now
              </Button>
            </View>
          </View>
        </View>
      }
    >
      <FormField label="Meal name">
        <Input
          value={editor.name}
          placeholder="e.g. Omelette + Protein Shake"
          onChangeText={editor.setName}
          InputComponent={BottomSheetTextInput}
        />
      </FormField>

      <View className="gap-2">
        <Text className="font-mono-medium text-[11px] uppercase tracking-widest text-ink-muted">Ingredients</Text>
        {editor.ingredients.length === 0 ? (
          <Text className="font-sans text-sm italic text-ink-subtle">No ingredients yet — add one below.</Text>
        ) : (
          editor.ingredients.map((ingredient, index) => (
            <View key={index} className="flex-row items-center gap-2 border border-line bg-card px-3 py-2">
              <View className="min-w-0 flex-1">
                <IngredientLabel name={ingredient.name} brand={ingredient.brand} bullet={false} />
                <Text className="font-mono text-[11px] text-ink-muted">
                  {Math.round(macroActual(ingredient.calories_per_100g, ingredient.weight_g))} kcal
                </Text>
              </View>
              <Input
                size="sm"
                mono
                keyboardType="numeric"
                accessibilityLabel={`${ingredient.name} grams`}
                className="w-16 text-right"
                value={String(ingredient.weight_g)}
                onChangeText={(v) => editor.updateWeight(index, Number(v))}
                InputComponent={BottomSheetTextInput}
              />
              <Text className="w-3 font-mono text-xs text-ink-muted">g</Text>
              <IconButton label="Remove ingredient" variant="danger" size="sm" icon={X} onPress={() => editor.removeIngredient(index)} />
            </View>
          ))
        )}
      </View>

      <View className="gap-2 border border-dashed border-line-strong bg-surface-low p-3">
        <Text className="font-mono-medium text-[11px] uppercase tracking-widest text-ink-muted">Add ingredient</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              size="sm"
              placeholder="Name (e.g. egg)"
              accessibilityLabel="Ingredient name"
              value={editor.newIngredient.name}
              onChangeText={(name) => editor.patchNewIngredient({ name })}
              InputComponent={BottomSheetTextInput}
            />
          </View>
          <View className="w-36">
            <Input
              size="sm"
              placeholder="Brand (optional)"
              accessibilityLabel="Ingredient brand"
              value={editor.newIngredient.brand}
              onChangeText={(brand) => editor.patchNewIngredient({ brand })}
              InputComponent={BottomSheetTextInput}
            />
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-row items-center gap-1">
            <Input
              size="sm"
              mono
              keyboardType="numeric"
              className="w-20 text-right"
              accessibilityLabel="Ingredient grams"
              value={String(editor.newIngredient.weight)}
              onChangeText={(v) => editor.patchNewIngredient({ weight: Number(v) })}
              InputComponent={BottomSheetTextInput}
            />
            <Text className="font-mono text-xs text-ink-muted">g</Text>
          </View>
          <View className="flex-1">
            <Button
              variant="dark"
              size="sm"
              fullWidth
              icon={Plus}
              loading={editor.resolving}
              loadingText="Resolving..."
              disabled={!editor.newIngredient.name.trim()}
              onPress={editor.addIngredient}
            >
              Add
            </Button>
          </View>
        </View>
      </View>

      <View className="border border-line bg-surface-low p-3">
        <Text className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">Total macros</Text>
        <MacroInline macros={editor.totals} />
      </View>
    </Modal>
  );
}
