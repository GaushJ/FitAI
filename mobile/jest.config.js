module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // lucide-react-native's package "exports" points the react-native/import
    // conditions at ESM (.mjs), which jest-expo's transform doesn't cover —
    // force resolution to its plain-CJS build instead.
    "^lucide-react-native$": "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|native-base|react-native-svg|lucide-react-native)",
  ],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/app/**"],
};
