// Manual mocks for native modules that touch platform APIs Jest can't run.
jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

// See __mocks__/@gorhom/bottom-sheet.js for why this needs a manual mock.
jest.mock("@gorhom/bottom-sheet");

jest.mock("expo-audio", () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    record: jest.fn(),
    stop: jest.fn(() => Promise.resolve()),
    uri: "file:///mock-recording.m4a",
  })),
}));

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
}));

// Components render outside a navigator in tests, so run focus effects like a plain mount effect.
// (Only useFocusEffect is stubbed: requiring the real module pulls in ESM Jest can't parse.)
jest.mock("expo-router", () => {
  const { useEffect } = require("react");
  return { useFocusEffect: (effect) => useEffect(effect, [effect]) };
});

jest.mock("expo-file-system", () => ({
  Paths: { cache: "file:///cache/" },
  Directory: jest.fn(),
  File: { downloadFileAsync: jest.fn(() => Promise.resolve({ uri: "file:///cache/brand_preferences.xlsx" })) },
}));

jest.mock("expo-sharing", () => ({ shareAsync: jest.fn(() => Promise.resolve()) }));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
}));
