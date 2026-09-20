# GetFitBro mobile — design tokens

Single source of truth for every mobile screen mockup and RN implementation. Transcribed from
the web app (`frontend/src/app/globals.css`, `frontend/src/app/dashboard/page.tsx`,
`frontend/src/app/login/page.tsx`, `frontend/src/app/progress/page.tsx`) during the mobile-port
audit. Mirrored 1:1 into `mobile/tailwind.config.js` — when adding a new token, add it in both
places.

GetFitBro is **dark-theme only** on web; mobile follows the same, no light theme planned.

## Color palette

| Token (Tailwind class prefix) | Hex / value | Usage |
|---|---|---|
| `bg-bg` | `#0B0C09` | Screen background (near-black, olive-tinted) |
| `bg-surface` | `#16180F` | Card/panel background |
| `bg-surface-raised` | `#1A1C12` | Slightly raised panel (gradient partner) |
| `bg-surface-high` | `#1E2018` | Highest-elevation surface |
| `bg-surface-inset` | `#0F100B` | Inset/nested rows inside a card |
| `border-border` | `#2A2D1E` | Default card/input border |
| `border-border-subtle` | `rgba(255,255,255,0.08)` | Subtler divider |
| `text-text-primary` | `#F4F5EF` | Headings, primary body text |
| `text-text-secondary` | `#8E9085` | Captions, secondary labels |
| `text-text-muted` | `#6E7066` | Placeholders, least-important text |
| `text-text-tertiary` | `#A2A498` | Body copy between primary/secondary |
| `text-accent` / `bg-accent` | **`#C9F24D`** | **Brand lime** — primary CTA, active states, progress fills, focus rings |
| `accent-hover` | `#D4F56A` | Hover/pressed state of accent |
| `accent-dim` | `#AFDF33` | Accent gradient partner (e.g. protein bar) |
| `macro-calories` | `#fb923c` (orange-400) | Calorie numbers, streak flame |
| `macro-protein` | `#C9F24D` (= accent) | Protein progress bar |
| `macro-carbs` | `#22d3ee` (cyan-400) | Carbs progress bar |
| `macro-fat` | `#fb7185` (rose-400) | Fat progress bar |
| `success` | `#34d399` (emerald-400) | Success banners, "set" badges |
| `danger` | `#f87171` (red-400) | Error banners, destructive actions |
| `warn` | `#fbbf24` (amber-400) | API-key/warning accents |

## Typography

Three-font system, all Google Fonts, loaded via `@expo-google-fonts/*` + `expo-font`:

| Role | Family | Tailwind class |
|---|---|---|
| Display / headings | **Bricolage Grotesque** (600/700) | `font-display`, `font-display-medium` |
| Body / UI text | **Hanken Grotesk** (400/500/600/700) | `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold` |
| Numeric / mono data (macros, usernames, keys) | **JetBrains Mono** (500/700) | `font-mono`, `font-mono-bold` |

## Radius scale

| Token | Value | Usage |
|---|---|---|
| `rounded-xs` | 8px | Small buttons, inputs |
| `rounded-sm` | 12px | Inputs, small buttons |
| `rounded-md` | 16px | List-item cards, chips |
| `rounded-lg` | 24px | Main panel cards, modals |
| `rounded-full` | pill/circle | Icon buttons, badges, pills |

## Recurring component patterns (reference when mocking a new screen)

- **Glass card**: `surface` background, `border` border, `rounded-lg`, generous padding (~24px),
  soft shadow. The base panel for macro summaries, meal lists, saved meals, progress sections.
- **Inset row**: `surface-inset` background, `border-subtle` border, `rounded-md` — nested list
  rows inside a glass card (meal items, saved-meal chips, history rows).
- **Modal sheet**: full-screen dark scrim behind, `surface` panel with `rounded-lg` (top corners
  only if using a bottom-sheet presentation), header with icon+title+close, divider lines between
  header/body/footer.
- **Progress bar**: track = `surface-inset` background, `rounded-full`, fixed height (~12px);
  fill = macro-specific color, `rounded-full`, animated width.
- **Badge/pill**: `rounded-full`, small uppercase tracked-out text, colored border+background at
  low opacity of the relevant color (e.g. accent-colored "Active AI" badge).
- **Primary button**: `bg-accent`, dark text (`#0B0C09`) for contrast, `rounded-sm`/`rounded-full`,
  bold weight.
- **Secondary/ghost button**: `surface-high` background, `text-secondary` text.
- **Destructive hover/press**: red-tinted background on press for delete actions.
- **Mic/record button**: idle = `surface-high` circle with mic icon; recording = red circle with
  glowing shadow (`shadow` with red at ~50% opacity) + a pulsing dot and mono-font timer alongside.
- **Empty state**: dashed `border`, `rounded-md`, centered icon + muted text.
- **Loading state**: centered spinner in accent or a context color.
- **Error/success banner**: low-opacity `danger`/`success` background, matching border and text,
  icon + message, dismissible.
- **Horizontal chip row**: scrollable row of fixed-width cards (frequent meals, saved meals).
- **Expandable row**: header always visible, chevron indicates expand state, content reveals
  below on tap (meal logs, history entries).
- **Ambient glow**: large blurred color blobs positioned behind content for atmosphere — use
  sparingly on mobile (perf cost of blur on native), prefer a static radial-gradient-style image
  or `expo-blur`'s `BlurView` only where it earns its cost (e.g. modal scrims), not everywhere the
  web app used it.

## Browser → React Native replacements (do not reintroduce web-only APIs)

| Web API | Mobile replacement |
|---|---|
| `localStorage` | `expo-secure-store` (auth token, user, LLM provider keys) |
| `MediaRecorder` / `getUserMedia` | `expo-audio` recording to file |
| `Blob` / `FileReader` / `URL.createObjectURL` | `expo-file-system` (read/write files) |
| `<input type=file>` (camera/gallery) | `expo-image-picker` |
| `.xlsx` import `<input type=file>` | `expo-document-picker` |
| `.xlsx` export download link | `expo-file-system` write + `expo-sharing` |
| `backdrop-filter: blur()` | `expo-blur`'s `BlurView` (use sparingly, see above) |
