import type { ExpoConfig, ConfigContext } from "expo/config";

// Single source of truth for app identity — override via env vars for
// white-labeling/rebranding without touching any component code. (Kept
// inline here, not in a separate imported module: Expo's config loader
// only transpiles this one file, not further local TS imports from it.)
const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME ?? "GetFitBro";
const APP_SLUG = "getfitbro";
const APP_SCHEME = "getfitbro";
const IOS_BUNDLE_ID = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID ?? "com.getfitbro.app";
const ANDROID_PACKAGE = process.env.EXPO_PUBLIC_ANDROID_PACKAGE ?? "com.getfitbro.app";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: APP_SCHEME,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "dark",
  ios: {
    ...config.ios,
    bundleIdentifier: IOS_BUNDLE_ID,
    // Falls back to the top-level `icon` (1024x1024 PNG) rather than the
    // newer .icon/Icon Composer directory format — that format's JSON schema
    // isn't documented well enough yet to hand-author with confidence.
  },
  android: {
    ...config.android,
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      backgroundColor: "#0B0C09",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    ...config.web,
    output: "static",
    favicon: "./assets/images/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-audio",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0B0C09",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: "39091f51-7a44-443a-8929-2638783047da",
    },
  },
});
