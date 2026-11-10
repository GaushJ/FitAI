import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { colors } from "@/theme/colors";

/** Web's `bg-dots` utility: 1px dots on a 16px grid behind app pages. */
export function DotsBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="dots" width={16} height={16} patternUnits="userSpaceOnUse">
          <Circle cx={1} cy={1} r={1} fill={colors.surfaceHighest} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dots)" />
    </Svg>
  );
}
