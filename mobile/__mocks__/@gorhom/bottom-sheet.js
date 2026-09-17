// Manual mock for @gorhom/bottom-sheet. Its real implementation pulls in
// react-native-reanimated's worklets runtime, which can't initialize under
// Jest (needs a device/simulator) even via reanimated's own mock. Tests only
// need to exercise the form logic inside a sheet, not its native slide/
// gesture animation, so this stands in with a minimal present()/dismiss().
const React = require("react");
const { View, TextInput, ScrollView } = require("react-native");

const BottomSheetModal = React.forwardRef(function BottomSheetModal({ children }, ref) {
  const [visible, setVisible] = React.useState(false);
  React.useImperativeHandle(ref, () => ({
    present: () => setVisible(true),
    dismiss: () => setVisible(false),
    close: () => setVisible(false),
    snapToIndex: () => {},
    snapToPosition: () => {},
    expand: () => {},
    collapse: () => {},
    forceClose: () => setVisible(false),
  }));
  return visible ? React.createElement(View, null, children) : null;
});

module.exports = {
  __esModule: true,
  BottomSheetModal,
  BottomSheetModalProvider: ({ children }) => children,
  BottomSheetView: View,
  BottomSheetScrollView: ScrollView,
  BottomSheetTextInput: TextInput,
  BottomSheetBackdrop: () => null,
};
