/** JS-side copies of the design tokens (tailwind.config.js ⇄ web globals.css) for props that can't
 * take a className — icon colours, placeholder colours, inline styles. Keep all three in sync. */
export const colors = {
  card: "#ffffff",
  surface: "#fbf9f5",
  surfaceLow: "#f5f3ef",
  surfaceContainer: "#efeeea",
  surfaceHighest: "#e4e2de",
  ink: "#1b1c1a",
  inkMuted: "#5f5e5e",
  inkSubtle: "#8b8a88",
  line: "#e4e2de",
  lineStrong: "#c8c6c5",
  primary: "#ba090a",
  primaryBright: "#df2c22",
  primaryDark: "#930003",
  primarySoft: "#ffdad5",
  success: "#15803d",
  successBright: "#22c55e",
  warning: "#b45309",
  danger: "#ba1a1a",
  white: "#ffffff",
} as const;

/** Web's `shadow-hard-sm`, `shadow-hard` and `shadow-hard-primary`. `boxShadow` renders on
 * iOS, Android (new architecture) and web alike. */
export const shadows = {
  hardSm: { boxShadow: `2px 2px 0px ${colors.ink}` },
  hard: { boxShadow: `4px 4px 0px ${colors.ink}` },
  hardPrimary: { boxShadow: `3px 3px 0px ${colors.primaryDark}` },
} as const;

/** Web's `press-3d`: while pressed the element sinks into its shadow. */
export const pressed = (depth: number) => ({ transform: [{ translateX: depth }, { translateY: depth }] });
