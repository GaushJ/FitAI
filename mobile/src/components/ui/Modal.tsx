import { useEffect, useRef } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { X, type LucideIcon } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { IconButton } from "./IconButton";

interface ModalProps {
  title: string;
  /** Icon shown before the title. */
  icon?: LucideIcon;
  subtitle?: string;
  onClose: () => void;
  /** Pinned below the scrolling body (web's `footer`). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
);

/**
 * Web's `organisms/Modal` as a bottom sheet: same header (icon + uppercase title + subtitle + close),
 * body and optional footer. Mount it conditionally like the web modals — it opens on mount and calls
 * `onClose` when swiped away, so form state resets every time it's reopened.
 */
export function Modal({ title, icon: Icon, subtitle, onClose, footer, children }: ModalProps) {
  const ref = useRef<BottomSheetModal>(null);
  const { height } = useWindowDimensions();

  useEffect(() => {
    ref.current?.present();
  }, []);

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      maxDynamicContentSize={height * 0.9}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.card, borderRadius: 0, borderTopWidth: 1, borderColor: colors.ink }}
      handleIndicatorStyle={{ backgroundColor: colors.lineStrong }}
    >
      <View className="flex-row items-start justify-between gap-3 border-b border-line px-5 pb-4 pt-1">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            {Icon ? <Icon size={20} color={colors.primary} /> : null}
            <Text className="flex-shrink font-display-semibold text-xl uppercase tracking-tight text-ink">{title}</Text>
          </View>
          {subtitle ? <Text className="mt-1 font-sans text-sm capitalize text-ink-muted">{subtitle}</Text> : null}
        </View>
        <IconButton label="Close" icon={X} onPress={onClose} />
      </View>

      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 p-5">
        {children}
      </BottomSheetScrollView>

      {footer ? <View className="border-t border-line p-5 pb-8">{footer}</View> : null}
    </BottomSheetModal>
  );
}
