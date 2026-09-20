import { forwardRef } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Camera, Image as ImageIcon } from "lucide-react-native";

interface ScanLabelSheetProps {
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
}

/** Presented via a parent-held ref: `sheetRef.current?.present()`. */
export const ScanLabelSheet = forwardRef<BottomSheetModal, ScanLabelSheetProps>(function ScanLabelSheet(
  { onTakePhoto, onChooseLibrary },
  ref
) {
  const dismiss = () => {
    if (ref && "current" in ref) ref.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={ref}
      backgroundStyle={{ backgroundColor: "#16180F" }}
      handleIndicatorStyle={{ backgroundColor: "#2A2D1E" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
      )}
    >
      <BottomSheetView className="gap-2 px-5 pb-8 pt-1">
        <Text className="font-display text-[15px] text-text-primary">Scan Nutrition Label</Text>
        <Text className="mb-1 font-sans text-xs leading-5 text-text-secondary">
          Photograph the label and I&rsquo;ll read the macros straight from it.
        </Text>

        <Pressable
          onPress={() => {
            dismiss();
            onTakePhoto();
          }}
          className="flex-row items-center gap-3 rounded-md border border-border-subtle bg-surface-inset px-3.5 py-3"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-high">
            <Camera size={15} color="#C9F24D" />
          </View>
          <Text className="font-sans-semibold text-[13px] text-text-primary">Take Photo</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            dismiss();
            onChooseLibrary();
          }}
          className="flex-row items-center gap-3 rounded-md border border-border-subtle bg-surface-inset px-3.5 py-3"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-high">
            <ImageIcon size={15} color="#C9F24D" />
          </View>
          <View>
            <Text className="font-sans-semibold text-[13px] text-text-primary">Choose from Library</Text>
            <Text className="font-sans text-[10.5px] text-text-muted">Pick multiple labels at once</Text>
          </View>
        </Pressable>

        <Pressable onPress={dismiss} className="mt-2 items-center rounded-full bg-surface-high py-3.5">
          <Text className="font-sans-bold text-[13px] text-text-secondary">Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
