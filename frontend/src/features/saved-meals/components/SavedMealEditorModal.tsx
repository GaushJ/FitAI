"use client";

import { Bookmark, Save, Zap } from "lucide-react";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { MacroInline } from "@/components/molecules/MacroInline";
import { Modal } from "@/components/organisms/Modal";
import type { Notifier } from "@/hooks/useFeedback";
import { AddIngredientForm } from "@/features/saved-meals/components/AddIngredientForm";
import { EditorIngredientRow } from "@/features/saved-meals/components/EditorIngredientRow";
import { useSavedMealEditor } from "@/features/saved-meals/hooks/useSavedMealEditor";
import type { SavedMealDraft } from "@/features/saved-meals/types";

interface SavedMealEditorModalProps {
  draft: SavedMealDraft;
  notify: Notifier;
  onClose: () => void;
  onTemplateSaved: () => Promise<void> | void;
  onLogged: () => Promise<void> | void;
}

/** Build or tweak a meal template, then save it for next time and/or log it now. */
export function SavedMealEditorModal({
  draft,
  notify,
  onClose,
  onTemplateSaved,
  onLogged,
}: SavedMealEditorModalProps) {
  const editor = useSavedMealEditor({ draft, notify, onTemplateSaved, onLogged });

  return (
    <Modal
      contained
      compact
      size="md"
      title={editor.isNew ? "New Saved Meal" : "Edit Saved Meal"}
      icon={<Bookmark className="text-accent" />}
      subtitle="Adjust quantities, add or remove ingredients, then log or save."
      onClose={onClose}
      bodyClassName="space-y-4"
      footer={
        <div className="space-y-3">
          {editor.notice && <Alert tone={editor.notice.tone}>{editor.notice.text}</Alert>}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              icon={<Save />}
              loading={editor.saving}
              title="Save changes to this meal template for next time"
              onClick={editor.saveTemplate}
            >
              Save Meal
            </Button>
            <Button
              className="flex-1"
              icon={<Zap />}
              loading={editor.saving}
              title="Log this meal now with these ingredients"
              onClick={() => editor.saveAndLog(onClose)}
            >
              Log Now
            </Button>
          </div>
        </div>
      }
    >
      <FormField label="Meal name" labelClassName="text-slate-400">
        <Input
          type="text"
          value={editor.name}
          placeholder="e.g. Omelette + Protein Shake"
          onChange={(e) => editor.setName(e.target.value)}
        />
      </FormField>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ingredients</p>
        {editor.ingredients.length === 0 ? (
          <p className="text-[11px] italic text-slate-600">No ingredients yet — add one below.</p>
        ) : (
          editor.ingredients.map((ingredient, index) => (
            <EditorIngredientRow
              key={index}
              ingredient={ingredient}
              onWeightChange={(grams) => editor.updateWeight(index, grams)}
              onRemove={() => editor.removeIngredient(index)}
            />
          ))
        )}
      </div>

      <AddIngredientForm
        value={editor.newIngredient}
        resolving={editor.resolving}
        onChange={editor.patchNewIngredient}
        onAdd={editor.addIngredient}
      />

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">Total macros</p>
        <MacroInline macros={editor.totals} />
      </div>
    </Modal>
  );
}
