# GetFitBro — project memory (read this first in a fresh session)

Snapshot as of 2026-09-19. Everything below was learned/decided during the mobile-app build; code details are
derivable from the repo, so this file records **rules, decisions, gotchas and open items**, not architecture dumps.

## 1. What this project is
- **GetFitBro** (legacy internal name "FitVoice") — voice/text meal tracker. Three apps in one repo:
  - `frontend/` Next.js web app (already live)
  - `backend/` FastAPI + SQLAlchemy async + LangGraph/Claude pipeline, **Postgres/Supabase only** (no SQLite fallback)
  - `mobile/` **Expo SDK 57 / React Native 0.86 / expo-router / NativeWind v4 / TypeScript strict** — the thing we built
- Brand name is configurable (`mobile/app.config.ts`, `EXPO_PUBLIC_APP_NAME`, default "GetFitBro"). Bundle/package `com.getfitbro.app`.
- Expo docs must be read at the **v57** versioned URL before writing Expo code (see `mobile/AGENTS.md`).

## 2. HARD RULES (do not break)
1. **Git:** work only on branch `feature/mobile-app`. **Never push to or commit on `master`** — Render auto-deploys `master`
   (backend at `https://fitvoice-backend-vqgr.onrender.com`, service `fitvoice-backend`, repo GaushJ/FitAI). Local commits per finished
   feature are expected; **no pushing** unless the user explicitly asks. Commit trailer: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
2. **Never touch/stage the user's own WIP files** (always shown as modified): `backend/routers/ingredients.py`,
   `backend/routers/progress.py`, `frontend/src/app/dashboard/page.tsx`. Stage files by name, never `git add -A`.
3. **Mockup-first gate:** no React Native code for a new screen/modal until the user approves an interactive mockup.
   Use the `mobile-screen-mockup` skill (`.claude/skills/`). Loop: publish artifact → user feedback → revise same URL → explicit "go ahead/build it".
   Small tweaks to already-shipped RN code don't need a mockup.
4. **Don't disturb the user's running dev server.** They run `npx expo start` (Metro on **8081**) for their Android phone. If 8081 is
   busy, skip live browser E2E (rely on Jest) instead of killing/duplicating it. If you temporarily overwrite `mobile/.env.local`,
   **restore it** (currently `EXPO_PUBLIC_API_URL=http://192.168.0.5:8000`).
5. Keep code clean/scalable (user's stated top priority): feature-first folders, thin screens, no premature abstraction,
   no dead code, comments only for non-obvious WHY.
6. User prefers short, direct replies; asks "walk me through" questions in plain language. When unsure of scope, make the reasonable call
   and say so (Auto Mode was on) — but I once misread "API keys will be added from frontend only" as "skip on mobile"; it meant
   client-side-stored keys. Re-read ambiguous notes literally.

## 3. Mobile architecture & conventions
- Layout: `mobile/src/app/` (expo-router: `(auth)/login`, `(tabs)/dashboard|progress`), `src/features/<feature>/{api.ts,types.ts,components/,__tests__}`,
  `src/components/ui/` (GlassCard, Button, Badge, ProgressBar, Banner, EmptyState, LoadingSpinner, ExpandableRow),
  `src/lib/api/` (`client.ts` apiRequest wrapper w/ centralized 401 + LLM key headers, `authStorage.ts`, `apiKeyStorage.ts`, `secureStorage.ts`, `config.ts`).
- Features built: auth, dashboard (composer w/ text+voice+label-scan, macros, frequent meals, today's meals), settings, savedMeals,
  brandPreferences, apiKeys, progress. Design tokens: `mobile/docs/design-tokens.md` + `tailwind.config.js` (mirror each other).
- **All modals are `@gorhom/bottom-sheet` `BottomSheetModal`** opened via parent-held ref `.present()`. Patterns:
  short sheets → `BottomSheetView`; long/scrolling → `maxDynamicContentSize={windowHeight*0.85}` + `BottomSheetScrollView`
  (never `snapPoints` percentages — sheet got stuck off-screen on web). Text fields must be `BottomSheetTextInput`.
  `mobile/src/lib/webPolyfills.ts` aliases `TextInput.State.currentlyFocusedInput` on web (RN-web lacks it → crash on blur).
- API convention: every feature has its own `api.ts` using `apiRequest`; small duplication across features is fine (no shared package).
  Multipart uploads use RN's `{uri,name,type} as unknown as Blob` cast. Destructive actions confirm via `Alert.alert` in the **screen**
  (presentational list components just call `onDelete`). After mutations the dashboard refetches via `loadDashboard()`.
- Header icons on Dashboard (API Keys, Brand Preferences, Settings) render only when `dashboard` data loaded — if the API is
  unreachable they all silently vanish (this was mistaken once for a Brand Preferences bug).
- LLM keys: stored device-only (SecureStore; localStorage on web), sent as `X-Anthropic-Key` / `X-Groq-Key` on authenticated requests only.
  Backend reads only those two headers (Tavily is server env only).
- Skipped deliberately: Excel import/export tab for Brand Preferences; `suggest-meals` endpoint not ported; no charting lib
  (heatmap + weekly chart are plain Views — 90 days = 13 columns fits a phone width, no scrolling needed).

## 4. Testing
- **Mobile:** `cd mobile && npm test` (Jest + jest-expo + RNTL v14) — **84 tests / 25 suites passing**. RNTL v14: `await render(...)`,
  `await fireEvent.press/changeText(...)` (all async; wrap state-changing ones in `act`). Global mocks in `jest.setup.js`
  (expo-secure-store, expo-audio, expo-image-picker) and `__mocks__/@gorhom/bottom-sheet.js` (reanimated 4 worklets can't run under Jest).
  `lucide-react-native` mapped to CJS via `moduleNameMapper`. Use regex text queries when a `<Text>` mixes literals + expressions.
  `npx tsc --noEmit` shows unrelated "Cannot find name describe/jest" errors in `__tests__` files (pre-existing, jest types) — ignore;
  only non-test errors matter (`... | grep -v __tests__ | grep -v .test.tsx`).
- **Backend:** `cd backend && ./.venv/Scripts/python.exe -m pytest -q` — 52 passing (auth, users, saved meals, frequent meals, dashboard,
  progress/history, brand-prefs scoping). Needs local Docker Postgres: `backend/docker-compose.test.yml` (container `backend-postgres-test-1`, port 5433).
  LLM-dependent routes (track-meal, transcribe, scan-labels, label extraction, resolve-ingredient, suggest-meals) are **untested**.
  Tests seed data via the saved-meals `/log` endpoint (no LLM).
- **Live web E2E recipe** (used many times): start backend on 8010 with
  `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/getfitbro_test EXTRA_CORS_ORIGINS=http://localhost:8081 ... uvicorn main:app --port 8010`,
  write `mobile/.env.local` → `http://localhost:8010`, `preview_start` "mobile-web" (`.claude/launch.json`), sign up via curl, seed
  `localStorage` keys `getfitbro_auth_token` / `getfitbro_auth_user`, resize to mobile. RN-web quirks: ref-clicks are flaky after re-renders →
  use `document.querySelector('[aria-label=...]').click()`; `Alert.alert` is a no-op on web; bottom sheets render in-flow (scroll down).
  Camera/mic can't be exercised in the browser. Clean up afterwards (stop servers, restore `.env.local`).
- **Maestro** flows in `mobile/.maestro/` (login, signup w/ random user, track meal, saved meal→history, logout, empty states, login error):
  **written but never run** (no simulator/adb/Maestro here). Known risk: "Sign In"/"Create Account" appear as both tab and submit button →
  disambiguated with `index: 1` (unverified). README explains setup.

## 5. Environment / deployment facts
- Windows 11, Git Bash + PowerShell. Python 3.14 venv at `backend/.venv`. No Android SDK / `adb` / Java on the machine.
- Local dev on a real phone: **Expo Go + QR** (`npx expo start`, not `npm run android` which needs adb). Phone must share Wi-Fi;
  `EXPO_PUBLIC_API_URL` must be the PC's LAN IP (currently 192.168.0.5:8000; backend must run with `--host 0.0.0.0 --port 8000`);
  Windows Firewall must allow Node. Env vars are baked in at Metro start → restart after editing `.env.local`.
- `backend/.env` `DATABASE_URL` already points at the real Supabase project (`botuqvsizmpgqdwqisse`, "FitAI"); running the backend normally uses live data.
  The `0002_brand_preferences_user_scope.sql` migration was applied there. Supabase MCP tools exist.
- **EAS:** account `@gaushj`, project `getfitbro`, projectId in `app.config.ts` `extra.eas` (added by hand — dynamic config can't be auto-patched).
  `mobile/eas.json`: `development`, `preview` (APK), `production` (AAB); preview+production bake in
  `EXPO_PUBLIC_API_URL=https://fitvoice-backend-vqgr.onrender.com`. Free-tier builds queue for hours; local `--local` builds need the Android SDK.
  User already got one `.aab` (built before the Render URL was baked in and before several features) — needs a **rebuild** (`eas build --platform android --profile preview` for an installable APK).
- Render free tier cold-starts (~40 s first request).
- Branded icon/splash assets (lime dumbbell on `#0B0C09`) replaced the Expo template; iOS uses top-level `icon` (dropped `.icon` override).

## 6. Status by milestone (all on `feature/mobile-app`, latest commit `4a64d9f`)
- M0–M1 scaffold + auth + brand-prefs user-scoping fix · M2 dashboard core loop · M3 settings, ingredient/portion editors, saved meals,
  nutrition-label scan, brand preferences, **API keys** · M4 progress screen · M5 backend tests, branded assets, logout button,
  Maestro flows, EAS config. Also: Today's Meals now shows kcal/P/C/F, per-meal delete, per-ingredient edit.
- Design canvases (claude.ai artifacts) exist for each screen; the API Keys one is `https://claude.ai/artifact/JwRanwaEAgW2fNrqB7mJp2`.
  Design canvas type_url: `https://claude.ai/artifact/QKN21svewxgyPb6SYRqWnd`. Publish flow: create with `type_url`+`title`, write
  `project/canvas.json` + `project/Main.dc.html` under the scratchpad, republish with `root` + `file_path` (canvas.json, forward slashes) +
  `files: {"project/Main.dc.html":"project/Main.dc.html"}`. Latest type wants `<title>` and `<script type="text/x-dc" data-dc-script>`.

## 6b. Web frontend architecture (refactored 2026-09-20, uncommitted on `feature/mobile-app`)
- `frontend/src/app/*` are **thin route files only** (`<RequireAuth><XScreen/></RequireAuth>`); no logic there. The old 2.7k-line
  `dashboard/page.tsx` monolith (which held the user's WIP: label scan, ingredient edit, delete) is now split — WIP behaviour is preserved,
  a pristine pre-refactor copy was kept in the session scratchpad only. Still don't stage/commit it without the user's say-so.
- Layers: `components/{atoms,molecules,organisms}` (Button, IconButton, Input, Card, Alert, Modal, FormField…) · `features/<name>/{api.ts,types.ts,hooks/,components/}`
  (auth, dashboard, meals, frequent-meals, saved-meals, brand-preferences, api-keys, settings, progress, landing, ingredients) · `lib/` (API client
  `lib/api/client.ts`, `lib/storage/*`, nutrition math) · `hooks/` (useFeedback, useRemoteList, useInView, useCountUp).
- Conventions: all HTTP goes through `request()`/`apiFetch()` (auth header **on by default**, `llmKeys: true` for LLM endpoints); features hold their own
  `api.ts`; modals are conditionally mounted so their form state resets on close; brand tokens are `accent`/`accent-light`/`ink`/`heat` in `globals.css`.
- Fonts come from `next/font/google` in `layout.tsx` (Hanken/Bricolage/JetBrains → `font-sans`/`font-display`/`font-mono`). The old `@import url(fonts…)` in
  `globals.css` was silently dropped by Next's CSS pipeline, so only the old landing page (inline `<style>`) ever got the real fonts.
- Verify recipe: `npx tsc --noEmit && npx eslint src && npx next build` (all clean). For UI checks don't use the user's :3000/:8000; run a copy of `src`
  on another port against a mock API (Turbopack rejects a junctioned node_modules → use `next dev --webpack`; Next also ignores a junctioned `src`).

## 6c. Macro-target calculator (added 2026-09-20, uncommitted)
- Backend: `backend/services/nutrition_targets.py` — **pure formulas, no AI** (Mifflin–St Jeor → ×activity factor → goal adjustment → protein g/kg, fat ~25 %,
  carbs remainder; Atwater 4/4/9). Sources are cited in the module docstring next to each constant. Endpoint `POST /api/user/targets/calculate` (suggests, saves nothing);
  `POST /api/user` now also accepts optional `sex, age, height_cm, weight_kg, activity_level, goal` (None = leave unchanged); `/api/user` + `/api/dashboard` return them.
- DB: `migrations/0004_user_body_profile.sql` (6 nullable columns on `users`) — **already applied to live Supabase** (project `botuqvsizmpgqdwqisse`), as was
  `0003_drop_global_unique_brand_ingredient_index.sql` (the old global-unique index that broke Excel import). Tests: 98 passing.
- Web UI: `frontend/src/features/settings/` (MacroTargetsModal → BodyProfileFields / TargetPlanSummary / MacroTargetFields, hook `useMacroTargetsForm`).
  Editing a macro re-derives calories (4P+4C+9F); editing calories rescales macros proportionally on blur. Metric units only; adults 18+.
- Known caveat: the 1.2–1.9 activity multipliers are the de-facto standard but we couldn't trace a peer-reviewed origin. **Mobile app not updated** (mockup-first rule);
  backend changes are backward-compatible with it. The running backend must be restarted to pick up the new endpoint; Render (`master`) has none of this until merged.

## 6d. Mobile ⇄ web parity (2026-11-10, uncommitted, on `feature/web-redesign` working tree)
- **User rule: web and mobile must not differ in features or UI. The WEB app is the source of truth** — when web changes, port it to mobile.
  (A first pass that followed a separate mobile-only Stitch project, "React Native App Design" `5738784946986574141`, was replaced by this.)
- Mobile mirrors web 1:1: same token names/values (`tailwind.config.js` ⇄ `frontend/src/app/globals.css` ⇄ `src/theme/colors.ts`),
  same component names/props in `src/components/ui`, same copy, section order and per-endpoint error strings. Mapping + the list of
  intentional platform differences is in `mobile/docs/design-tokens.md`.
- User decisions (asked 2026-11-10): mobile tabs mirror web's 5 pages (Dashboard · Brands · Progress · API Keys · Settings);
  mobile shows PRO status but "Upgrade to Pro" opens the web dashboard (store billing rules) — `EXPO_PUBLIC_WEB_URL`, default the Vercel URL.
- Ported to mobile in that pass: Excel import/export (expo-document-picker/file-system/sharing), save-logged-meal-as-template, remove frequent meal,
  editable weights in the saved-meal editor, voice → /api/transcribe → review before sending, Tavily key (stored, not sent — same as web;
  backend reads only X-Anthropic-Key/X-Groq-Key). Deletes have no confirm dialog, like web.
- Fixed mobile bug: editing only the brand of a brand preference was never saved (rename was only called when the name changed).
- Jest stubs only `useFocusEffect` from expo-router; expo-file-system/sharing/document-picker are mocked in `jest.setup.js`. 87 tests pass.
- Adding a route needs regenerated typed routes: run `CI=1 npx expo start --port <free>` briefly (only if 8081 isn't the user's Metro).

## 7. Open items / known gaps
1. **Deployed backend (`master`, commit da0a6a6) lacks** `/api/ingredients/scan-labels` and `/api/progress` + `/api/history` (they exist only in the
   user's uncommitted local files) → on the Render-backed app the **Progress tab 404s and label scanning fails** until the user commits+pushes those to master.
2. The API Keys / Anthropic "no key configured" backend message says "Settings → API Keys"; the icon is actually in the dashboard header
   (message lives in the user's WIP `ingredients.py`, so not edited).
3. Not yet verified on a real device: camera/library pickers, voice recording, SecureStore, API Keys header flow end-to-end, Maestro flows.
4. `saved-meals` list has no server-side cap (fine now). No list virtualization (not needed at current data sizes).
5. TestFlight / Play Console / store submission are the user's own responsibility (needs their Apple/Google accounts).
6. Possible future work: port `suggest-meals`, Brand Preferences Excel import/export, mocked-LLM backend tests, CI.
7. If the user reports "feature X not showing": first check the phone has a rebuilt app / reloaded Metro and that the API URL is reachable.
