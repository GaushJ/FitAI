/**
 * Backend base URL. Defaults to localhost, which only works from an iOS
 * Simulator or web — an Android Emulator needs 10.0.2.2, and a physical
 * device needs the dev machine's LAN IP (see mobile/docs/design-tokens.md's
 * companion note in the project plan). Override via EXPO_PUBLIC_API_URL.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

/** The web app. Mobile sends people there for things the stores won't allow in-app (Pro checkout). */
export const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://fit-ai-black-one.vercel.app";
