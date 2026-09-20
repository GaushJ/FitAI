---
name: mobile-screen-mockup
description: Produce a phone-viewport interactive HTML/CSS mockup (as a Claude Artifact) of a GetFitBro mobile screen, using the project's extracted design tokens, for review and iteration BEFORE any React Native code is written for that screen. Use whenever building or redesigning a mobile screen/modal and no approved mockup exists yet for it.
---

# Mobile screen mockup

GetFitBro's mobile app has no designer and no Figma files. Every screen gets designed by
building an interactive, phone-sized HTML/CSS mockup here in chat, iterating on it with the
user's feedback, and only writing React Native code once the user explicitly approves it.
**This is a hard gate — never write `mobile/app/**` or `mobile/features/**` code for a screen
that hasn't been approved through this process.**

## When to use this

- Building a new mobile screen or modal that doesn't have an approved mockup yet.
- Reworking an existing mobile screen's layout/visual design significantly (not a small tweak
  to already-shipped RN code — that's a normal edit, not a new mockup).

## Inputs to gather before building the mockup

1. **The design tokens reference**: read `mobile/docs/design-tokens.md` (created once in M0) —
   this is the single source of truth for colors, fonts, radii, shadows, and component patterns.
   Never invent new colors or spacing values outside this file; if a screen needs something the
   tokens don't cover, add it to `design-tokens.md` first so future mockups stay consistent.
2. **The corresponding web screen**, if this mobile screen is porting an existing one — e.g.
   `frontend/src/app/dashboard/page.tsx` for the Dashboard. Read it (or the relevant section) to
   understand content, states, and behavior, not to copy web-specific layout 1:1 — mobile layout
   should feel native to a phone, not a shrunk browser page.
3. **A short spec** of what the screen needs to show/do, from the user's request or the project
   plan (e.g. "Dashboard: macro progress, frequent meals row, today's log list, voice/text
   composer").

## Building the mockup

- Use the `Artifact` tool. Load `artifact-design` guidance first as usual.
- Frame the mockup at real phone dimensions — a 390×844 (iPhone-class) viewport with a visible
  device-frame border, so scale reads correctly and isn't mistaken for a desktop layout.
- Apply the dark theme from `design-tokens.md`: near-black background, glass/translucent bordered
  cards, the lime accent for primary actions/active states, ambient blurred glow blobs, the
  established radius scale, and the three-font system (display/body/mono).
- Fake interactivity where it's cheap and communicates the design: tab switches, expand/collapse
  on list rows, modal open/close, a recording-active visual state — enough that the user can
  click around and get a feel for the real screen, not just look at a static picture.
- If this screen has genuinely distinct states worth separate review (e.g. Dashboard's resting
  state vs. voice-recording-active state), build/iterate on them as distinct mockup passes rather
  than cramming every state into one cluttered artifact.

## The approval loop

1. Publish the mockup artifact and tell the user what it covers.
2. The user leaves feedback in chat (or as artifact comments) — layout changes, spacing, color
   corrections, missing states.
3. Revise the same artifact in place (republish to the same URL) until the user gives explicit
   approval — a clear "looks good" / "build it" / equivalent. Don't infer approval from silence
   or from the user moving on to a different topic.
4. Once approved, that artifact is the visual reference for the React Native implementation.
   Note any spots where phone constraints (safe areas, native components, gesture conventions)
   mean the shipped screen will necessarily differ slightly from the mockup, and say so when
   presenting the built screen.

## Notes

- If `mobile/docs/design-tokens.md` doesn't exist yet, this is the very first mockup being built
  (M0's UI-primitives pass) — build the tokens doc first by transcribing the palette/fonts/radius/
  patterns from `frontend/src/app/globals.css`, then proceed.
- Don't reach for a Figma-style static image when this skill applies — the interactive-artifact
  loop is specifically what lets the user iterate without a design tool.
