/**
 * Backend base URL. Defaults to localhost, which only works from an iOS
 * Simulator or web — an Android Emulator needs 10.0.2.2, and a physical
 * device needs the dev machine's LAN IP (see mobile/docs/design-tokens.md's
 * companion note in the project plan). Override via EXPO_PUBLIC_API_URL.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
