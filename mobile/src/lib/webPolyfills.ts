import { Platform, TextInput } from "react-native";

/**
 * react-native-web's TextInput.State only implements `currentlyFocusedField`,
 * not the native `currentlyFocusedInput` that @gorhom/bottom-sheet's
 * BottomSheetTextInput calls on every blur. Without this, blurring any
 * bottom-sheet text field on web throws and crashes the app.
 */
if (Platform.OS === "web") {
  const state = TextInput.State as unknown as Record<string, unknown>;
  if (typeof state.currentlyFocusedInput !== "function" && typeof state.currentlyFocusedField === "function") {
    state.currentlyFocusedInput = state.currentlyFocusedField;
  }
}
