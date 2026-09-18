# Maestro flows

End-to-end flows driving the real compiled app (iOS Simulator, Android
Emulator, or a physical device) — the mobile equivalent of the Jest
component tests, but exercising the actual app rather than a component in
isolation.

**These have not been run.** This environment has no Maestro CLI, no
simulator/emulator, and no device, so every flow here was written directly
against the verified UI text/labels in the source but has never actually
been executed. Treat the first run of each as a debugging session, not a
known-good baseline. The two things most likely to need a small tweak:

- Every screen where a tab label and its submit button show the same text
  (`"Sign In"` / `"Create Account"` on the login screen) uses an `index:`
  selector to disambiguate, guessing that Maestro enumerates matches in
  render order (tab bar above the form). If Maestro reports an ambiguous
  match anyway, swap that step for a testID-based selector instead.
- `signup.yaml` uses `runScript: random_user.js` to generate a unique
  username per run (`output.username`, referenced as `${output.username}`).
  This is documented Maestro behavior but hasn't been exercised here either.

## Install Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

(macOS/Linux; see https://docs.maestro.dev/getting-started/installing-maestro
for Windows/other options.) Then confirm it's on your PATH:

```bash
maestro --version
```

## Get the app running somewhere Maestro can reach it

Maestro drives a real app process, not the web preview — build/run once via
Expo, pointed at whatever backend you want the flows to hit:

```bash
cd mobile
npx expo run:ios      # or: npx expo run:android
```

This needs a real device/simulator connected (Xcode's Simulator app, or an
Android emulator/physical device with USB debugging). Point the app at a
backend with a real `ANTHROPIC_API_KEY` configured — `track_meal_text.yaml`
and `saved_meal_and_history.yaml` both go through the same LLM-backed
ingredient resolution the app uses in production.

## One-time setup: the fixture account

`login.yaml` (and everything that composes it — `track_meal_text.yaml`,
`saved_meal_and_history.yaml`, `logout.yaml`) logs into a fixed account
rather than signing up fresh each time, so create it once: open the app
yourself and sign up with

- Display Name: anything
- Username: `maestro_fixed`
- Password: `Maestro1234`

`signup.yaml` and `empty_states.yaml` don't need this — they generate a
fresh, collision-free account every run instead.

## Running a flow

```bash
cd mobile
maestro test .maestro/login.yaml
maestro test .maestro/signup.yaml
maestro test .maestro/track_meal_text.yaml
maestro test .maestro/saved_meal_and_history.yaml
maestro test .maestro/logout.yaml
maestro test .maestro/empty_states.yaml
maestro test .maestro/login_error.yaml

# or all of them:
maestro test .maestro/
```

`maestro studio` (a local UI for recording/inspecting selectors live against
a running app) is the fastest way to fix any step that doesn't match —
open it alongside a failing flow to see exactly what Maestro can and can't
find on screen.
