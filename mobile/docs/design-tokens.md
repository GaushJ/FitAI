# GetFitBro mobile — design system

**The web app is the source of truth.** Mobile uses the same tokens, component names, copy and page
structure as `frontend/` (Stitch project "Cross-Platform App Design System"). When the web UI changes,
change mobile to match — see "Where things live" below for the 1:1 file mapping.

## Tokens

Defined three times with identical names and values — keep them in sync:

| Place | File |
|---|---|
| Web (Tailwind v4 `@theme`) | `frontend/src/app/globals.css` |
| Mobile classes (NativeWind) | `mobile/tailwind.config.js` |
| Mobile JS values (icon colours, shadows) | `mobile/src/theme/colors.ts` |

- Surfaces: `card` #ffffff, `surface` #fbf9f5, `surface-low/-container/-high/-highest`.
- Text: `ink` #1b1c1a, `ink-muted` #5f5e5e, `ink-subtle` #8b8a88. Borders: `line` #e4e2de, `line-strong` #c8c6c5.
- Brand: `primary` #ba090a (+ `-bright`, `-dark`, `-soft`). Status: `success`, `warning`, `danger` (+ `-soft`).
- One colour per macro everywhere P/C/F appear: `macro-calories` red, `macro-protein` green, `macro-carbs` orange, `macro-fat` rose
  (`src/lib/macroStyles.ts`, same as web).
- Shadows: web's `shadow-hard-sm` / `shadow-hard` / `shadow-hard-primary` → `shadows.hardSm/hard/hardPrimary` (`boxShadow`).
  Web's `press-3d` (sink into the shadow) → `pressed(depth)` on press.
- Fonts: Oswald (`font-display*`), Inter (`font-sans*`), JetBrains Mono (`font-mono*`); RN needs a family per weight,
  so web's `font-display font-semibold` is `font-display-semibold`, etc.
- Web's `bg-dots` page backdrop → `components/layout/DotsBackground`.

## Where things live (web → mobile)

| Web | Mobile |
|---|---|
| `components/atoms/*`, `components/molecules/*`, `organisms/Modal` | `src/components/ui/*` (same names/props; Modal is a bottom sheet) |
| `features/app-shell` (sidebar, PageHeader) | `src/app/(tabs)/_layout.tsx` (tab bar), `components/layout/AppHeader`, `ui/PageHeader` |
| `features/dashboard`, `features/meals`, `features/frequent-meals` | `src/features/dashboard` |
| `features/saved-meals` | `src/features/savedMeals` |
| `features/brand-preferences` | `src/features/brandPreferences` + `app/(tabs)/brands.tsx` |
| `features/progress` | `src/features/progress` |
| `features/api-keys` | `src/features/apiKeys` + `app/(tabs)/api-keys.tsx` |
| `features/settings` | `src/features/settings` + `app/(tabs)/settings.tsx` |
| `features/profile/ProfileProvider` | `src/features/profile/ProfileProvider` |
| `lib/nutrition`, `lib/format`, `lib/errors`, `hooks/useFeedback`, `hooks/useRemoteList` | same paths under `src/` |

## Intentional platform differences (everything else matches)

| Web | Mobile | Why |
|---|---|---|
| Sidebar with "Brand Preferences", "Progress & Logs", "Settings & Targets" | Bottom tabs "Brands", "Progress", "Settings"; each page's header carries web's full title | Tab bar width |
| Upgrade to Pro → Razorpay checkout | Same button opens the web dashboard in the browser | App Store / Play rules on digital purchases |
| Excel export downloads a file | Export opens the share sheet (Files, Drive, email…) | No browser downloads |
| Hover tooltips (heatmap, weekly chart) | Tap to show the same tooltip | No hover on touch screens |
| Centred dialogs | Bottom sheets with the same header/body/footer | Phone convention |
| File chooser for label photos | Camera or photo library chooser | Native pickers |
| Keys "stored in this browser" | Keys "stored on this device" (SecureStore) | Where they actually live |
| Browser `required` validation | Explicit messages ("Name is required.", "Enter your username and password.") | RN has no form validation |
| Login has "← Back to home"; marketing landing page | Neither | The app has no marketing page |
