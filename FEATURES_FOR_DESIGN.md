# GetFitBro — Feature Reference for Design

**Purpose of this document:** a complete, behaviour-level description of everything GetFitBro does today, written so a
designer can redesign the product from scratch. UX is the priority. Visual style is open for a full rethink. The current
look grew screen by screen, without a design system.

Each feature section covers:

- **What & why**: the user problem it solves
- **How it works**: the rules the design has to respect (these are real backend behaviours, not suggestions)
- **What the user sees / does**: data shown, actions available
- **States**: empty, loading, success, error, edge cases
- **Today's UX problems**: what's weak in the current build
- **Open design questions**: decisions for the designer

Snapshot: October 2026. Covers the **web app** (Next.js) and the **mobile app** (iOS/Android, Expo). Both talk to the same
backend. Section 20 lists where the two differ.

---

## 1. Product in one paragraph

GetFitBro is a **macro tracker you talk to**. Instead of searching a food database and picking servings, the user types
or says what they ate in plain language ("200ml Nandini milk and 2 eggs"). AI splits that into ingredients, estimates
the grams, looks up nutrition (calories, protein, carbs, fat) and logs the meal. Over time the app learns the user's
**brands**, spots **meals they repeat**, lets them save **meal templates**, and tracks **streaks** and **progress against
daily targets**.

**Primary audience:** gym-goers and people tracking macros (protein especially), currently Indian-market leaning
(INR pricing, Indian brands in the examples, e.g. Nandini milk).

**The core loop (the design must make this effortless):**

```
Open app → Log a meal (type / speak / one-tap repeat) → See today's totals move toward targets → Keep the streak alive
```

Logging a meal must be the fastest, most obvious action in the whole product. Everything else supports that.

---

## 2. Key concepts (glossary)

The designer needs these terms. Several are easy to confuse, and the current UI does not explain them.

| Concept | Meaning | Notes for design |
|---|---|---|
| **Meal log** | One entry in the user's food diary: the original sentence + resolved ingredients + total macros. | Always logged to **today**. No back-dating, no time of day, no breakfast/lunch/dinner. |
| **Ingredient** | One food item inside a meal: name, optional brand, weight in grams, and nutrition **per 100 g**. | The meal's totals are always computed from ingredients × weight. |
| **Per-100 g values** | All nutrition is stored per 100 g (or per 100 ml for liquids). | Users think in servings ("1 scoop"). The UI must translate between the two. |
| **Resolution** | The AI step that finds nutrition for an ingredient. | Sources: user's saved data → web search + AI → **generic guess** (inaccurate). |
| **Brand preference** | "When I say *milk*, I mean *Nandini toned milk*." A per-user rule. | Applied automatically when the user doesn't name a brand. |
| **Ingredient cache** | Shared nutrition database built up over time (from AI lookups, label scans, brand prefs). | Invisible to users today. |
| **Frequent meal** | Auto-detected: the same set of ingredients logged **2+ times**. | Created by the system. Can't be renamed. |
| **Saved meal** | A template the user deliberately created and named. | Fully editable. Logging it can use tweaked portions. |
| **Streak** | Consecutive days with at least one meal logged. | See §9 for its rules and quirks. |
| **Targets** | Daily goals: calories, protein, carbs, fat. | Can be calculated from body stats (§10). |
| **Pro** | One-time paid unlock (₹499). | Currently unlocks **nothing**. See §12. |

---

## 3. Current information architecture

### Web

```
/            Landing page (marketing)
/login       Sign in / Create account (tabs)
/dashboard   Everything else lives here:
               Header: Streak · Upgrade to Pro · API Keys · Brands · Progress · Targets(⚙) · Sign out
               Left column: Log-a-meal composer · Tips card
               Right column: Today's Macros · Frequent Meals · Saved Meals · Today's Meals
               Modals: API Keys · Brand Preferences · Macro Targets · Edit Ingredient ·
                       Adjust Portions · Saved Meal Editor
/progress    Stats · 90-day heatmap · weekly chart · paginated meal history
```

### Mobile

```
Login (Sign in / Create account tabs)
Tab bar: Dashboard | Progress
  Dashboard header: logo · streak pill · 🔑 API Keys · 🔖 Brand Preferences · ⚙ Settings
  Dashboard body: Macro progress · Composer · Frequent meals · Saved meals · Today's log
  Bottom sheets: API Keys · Brand Preferences · Settings (targets + body stats + Log out) ·
                 Scan Label · Edit Ingredient · Adjust Portions · Saved Meal Editor
Progress tab: Stats grid · heatmap · weekly chart · history
```

### IA problems to solve

- The web dashboard is **one dense page with 7 header buttons and 6 modals**. Settings-type items (API Keys, Targets,
  Sign out) sit at the same level as core features (Brands, Progress).
- "Brands" and "Scan label" both deal with packaged-food nutrition, but they are separate places with different rules (§7, §8).
- On mobile, the header icons (Keys, Brands, Settings) **disappear completely** if the server can't be reached. Users
  have mistaken this for a bug.
- There is no **onboarding**: a new user lands on an empty dashboard with default targets (2000 kcal / 150 P / 200 C / 65 F)
  and no explanation.

---

## 4. Feature: Accounts (Sign up / Sign in / Sign out)

**What & why:** Personal diary, so the user needs an account.

**How it works**
- Sign up: **Display name**, **Username** (min 3 chars; lowercased, spaces become `_` as you type), **Password** (min 6) + **Confirm**.
- Sign in: username + password.
- No email, no password reset, no "forgot password", no social login, no account deletion, no profile photo.
- Session is stored on the device. Users stay signed in until they sign out. If the session expires, they are sent back to login.
- Sign out: web = header button showing "Sign out (username)"; mobile = inside the Settings sheet.

**States:** "Username already taken", "Invalid username or password", password mismatch (shown inline as you type),
loading on submit.

**Today's UX problems**
- No recovery path at all if a password is forgotten.
- No onboarding after sign-up. The user lands straight on the dashboard.
- "Sign In" / "Create Account" labels appear both as tabs and as submit buttons.

**Open design questions**
- Should sign-up flow straight into a short onboarding (goal → body stats → calculated targets → first meal)? That
  would fix the "empty dashboard with default targets" problem.

---

## 5. Feature: Log a Meal (the composer) ★ core

**What & why:** The heart of the product. The user describes a meal in natural language and gets accurate macros
with no database searching.

**Input methods**

1. **Type**: free text, e.g. "2 rotis, 150g dal and a bowl of curd", "1 scoop Optimum Nutrition whey with 300ml milk".
2. **Speak**: tap mic → recording (red state, live timer mm:ss, pulsing dot) → tap stop.
   - **Web:** audio is transcribed and the text **drops into the text box for review/editing**. The user then taps send.
   - **Mobile:** audio is sent and **logged directly**, with no review step.
3. **Scan nutrition label(s)**: camera button. This does **not** log a meal. It is covered separately in §8.

**How it works (pipeline, takes several seconds)**
1. *Understand*: AI pulls out each ingredient, brand (if mentioned) and weight. If no amount is given it **estimates
   grams** ("an apple" ≈ 150 g, "two eggs" ≈ 100 g, "a scoop of whey" ≈ 30 g).
2. *Apply brand preferences*: if the user said "milk" with no brand and has a preference "milk → Nandini", Nandini is used.
3. *Find nutrition*, per ingredient, in order:
   1. Saved/known data (brand-specific first, then generic name)
   2. Web search + AI
   3. **Generic fallback**: a placeholder (100 kcal / 5 P / 10 C / 2 F per 100 g) that is **known to be inaccurate**
4. *Calculate* totals, log the meal for **today**, update the **streak**, update **frequent meals** detection.

**Feedback after logging**
- Success: "Meal logged! 412 kcal tracked."
- **Accuracy warning** when any ingredient used the generic fallback: *"Macros for "X" could not be found online and
  were estimated. For accurate tracking, add them manually via Brand Preferences."*
- The new meal appears at the top of Today's Meals (web expands it automatically) and the macro bars update.

**Status line under the box (web):** "Listening — tap the square to stop." / "Transcribing and resolving macros..." /
"Reading nutrition label(s)..."

**Error states:** couldn't capture speech, transcription failed, macro resolution failed, network/server unreachable,
no AI key available (§11). The free hosting tier can take **~40 seconds** on the first request after idle.

**Today's UX problems**
- **Long wait with no sense of progress.** Several seconds (up to ~40 s on a cold start) behind a spinner. Nothing shows
  *what* the AI is doing or what it understood.
- **No review before saving.** The meal is logged straight away. Wrong guesses (weights, wrong food) can only be fixed
  afterwards by editing ingredients one at a time.
- **The accuracy warning is shown as a red error banner**, even though the meal *was* logged successfully. The user
  gets mixed signals ("did it work?").
- **How confident each number is stays hidden.** The system knows whether each ingredient came from the user's own
  saved data, a web lookup or a rough guess, but the UI doesn't show it.
- Voice behaves differently on web (review first) and mobile (logs immediately).
- The composer uses three small round icon buttons (camera, mic, send). The camera button does something totally
  different (doesn't log a meal), but it looks like a sibling of the other two.

**Open design questions**
- Should the result appear as a **confirmation card** ("Here's what I understood: 2 eggs 100 g · 200 ml Nandini milk…
  [Edit] [Log it]") before saving? Or log instantly with a quick undo?
- How to show **per-ingredient confidence** (e.g. "from your label" / "looked up" / "estimated, tap to fix")?
- A progress/"thinking" state that shows ingredients appearing one by one?
- Example prompts / recent phrases as tappable chips for first-time users?

---

## 6. Feature: Today's Macros (daily progress vs targets) ★ core

**What & why:** Answers "how am I doing today?" at a glance.

**What the user sees**
- **Calories:** eaten / target (e.g. "1,240 / 2,000 kcal") + a large bar + % of target.
- **Protein, Carbs, Fat:** grams eaten / target + % reached + bar each.
- Bar colour for calories: normal → green from 85% → **red over 100%**.

**Data rules:** totals = sum of all of today's meal logs, recalculated after every log/edit/delete. Targets come from
§10 (defaults 2000 kcal / 150 g P / 200 g C / 65 g F).

**Macro colour convention used everywhere today:** calories = orange, protein = lime (brand accent), carbs = cyan, fat = rose.

**Today's UX problems**
- Shows only *consumed*, never **remaining** ("760 kcal / 62 g protein left"), which is what users actually decide with.
- Protein is the metric this audience cares most about, yet it gets the same weight as carbs and fat.
- Being over a macro target (except calories) isn't flagged.

**Open design questions**
- Ring vs bars vs "remaining" numbers? Hero metric = calories or protein?
- What does "over target" look like without being punitive?

---

## 7. Feature: Brand Preferences ★ differentiator

**What & why:** Generic nutrition data is wrong for packaged foods. One whey protein can differ a lot from another.
Brand Preferences let the user say "my milk is *Nandini toned*" **once**, with exact label macros. Every later "milk"
then resolves to those exact numbers automatically. This is the main thing that makes GetFitBro *accurate* for regulars.

**How it works**
- A preference = **ingredient name → preferred brand**, plus nutrition **per 100 g or per 100 ml**.
- Preferences are **per user**.
- When a logged meal mentions the ingredient **without a brand**, the preferred brand is injected and its exact
  nutrition is used.
- If the user names a different brand in the sentence, that brand wins.

**Three ways to add one**

| Method | Flow | Notes |
|---|---|---|
| **By Name** | Type ingredient + brand → **"Fetch Macros"** (AI web lookup) → editable per-100 g fields (Cal/P/C/F) → **Save Preference** | Changing the name/brand discards the fetched values. If fetching fails: "enter them manually". Saving without fetching stores just the mapping. |
| **By Label photo** | Type ingredient + brand → choose unit **g / ml** → photo of the nutrition facts panel → **"Extract & Save Label"** → AI reads exact values and saves | Ingredient + brand must be typed first. The photo only supplies the numbers. |
| **Excel import/export** *(web only)* | Export all preferences as a styled `.xlsx`. Import a `.xlsx` (columns: Ingredient, Brand, Calories/100g, Protein/100g, Carbs/100g, Fat/100g) | Columns A–B required, C–F optional. Result: "12 preference(s) imported, 2 skipped" + warnings. |

**Managing the list**
- List rows: `ingredient → brand` plus small macro pills (Cal / P / C / F per 100 g/ml).
- **Edit** (inline, one at a time): rename ingredient, change brand, edit the four macro values.
- **Delete** (web: no confirmation; mobile: confirmation dialog).
- Count badge on the header button (web "Brands [12]").

**Today's UX problems**
- Everything (add-by-name form, add-by-label form, Excel, the saved list) is squeezed into **one modal with tabs**. The
  list the user came to manage sits *below* the add-forms.
- No search or sort. Long lists become a 288 px-tall scroll box inside a modal.
- The feature's value ("log 'milk' and we'll use your exact Nandini numbers") is explained in a single subtitle line.
  Nothing in the meal log shows that a preference *was applied*. The only trace is a tiny brand tag under the ingredient.
- The accuracy warning (§5) sends the user to Brand Preferences, but there's no direct path. They have to find the header
  button, then retype the ingredient name.
- Overlaps with Label Scanning (§8) in a confusing way.

**Open design questions**
- Should Brand Preferences be a full screen (a "My Foods / Pantry" library) instead of a modal?
- Inline "Fix this ingredient → save as my brand" from a logged meal or from the fallback warning?
- Show "using your brand" badges on meal ingredients?
- Combine with label scanning into one "Add a packaged food" flow?

---

## 8. Feature: Quick Label Scan (from the composer)

**What & why:** On the go, the user snaps photos of one or **several** nutrition labels. The AI **detects the product
name and brand by itself** and stores the exact nutrition, so the next time they log that product by name, the numbers are exact.

**How it works**
- Camera button in the composer. Web: file picker/camera, multiple images. Mobile: sheet with **Take Photo** /
  **Choose from Library** (multiple).
- Each image → AI reads product name, brand, unit (g/ml) and per-100 values → saved to the shared nutrition database.
- Result message: "Saved macros for amul butter, yoga bar muesli. 1 label couldn't be read." / "Couldn't read any of the
  scanned labels. Try clearer, well-lit photos."

**Key difference from Brand Preferences:** a scan does **not** create a brand preference and does **not** log a meal.
The data is used only if the user later mentions that exact name + brand.

**Today's UX problems (significant)**
- **Scanned items vanish from view.** They appear in no list and can't be reviewed, corrected or deleted.
- Users will reasonably expect a scan to either *log the food* or *show up in Brands*. It does neither.
- The detected name/brand can't be confirmed or edited before saving (it might read "amul" when the user says "amul butter").
- It sits in the meal composer, which suggests it logs food.

**Open design questions**
- After scanning, show a **review card** per product (name, brand, per-100 values, editable), then let the user choose:
  "Save to my foods", "Set as my default brand for X", "Log a serving now (__ g)"?
- Should scanning and Brand Preferences become one concept?

---

## 9. Feature: Streaks ★ motivation

**What & why:** Daily-habit motivation. Logging any meal keeps the streak alive.

**How it works (exact rules)**
- A day "counts" if **at least one meal** is logged that day (any method: typed, voice, frequent, saved).
- On each log: if the last active day was **yesterday**, streak +1. If **today**, no change. Otherwise the streak **resets to 1**.
- The streak is **only recalculated when a meal is logged.** Consequence: after a missed day, the app **still shows the
  old streak** until the next log, at which point it suddenly drops to 1.
- Deleting all of a day's meals does **not** reduce the streak.
- **Best streak** (Progress page) is calculated separately from actual logged dates. It can therefore disagree with the
  current streak in edge cases.
- Not tied to hitting targets. Logging a 50-kcal snack counts.

**Where it appears:** web header pill "🔥 Streak: 12 days" (flame animates constantly). Mobile header pill "🔥 12".
Progress page tiles: Current Streak, Best Streak.

**Today's UX problems**
- Purely a number. No celebration, no milestones, no "log today to keep your 12-day streak" nudge, no at-risk state.
- Shows a stale value after a missed day (see rules above).
- Always-pulsing flame icon is visual noise.

**Open design questions**
- Streak states: active-today ✓ / at-risk (not logged yet today) / broken. How should each look?
- Milestones (7, 30, 100 days)? Streak freeze (a future Pro perk)?
- *(If the design needs the streak to show "at risk" or reset correctly on missed days, that's a small backend change.
  Flag it with the design.)*

---

## 10. Feature: Daily Targets & Body-Stats Calculator

**What & why:** Users need daily calorie and macro goals but often don't know their numbers. The calculator suggests
evidence-based targets from their body and goal. **Plain formulas, no AI**: Mifflin–St Jeor BMR × activity factor, goal
adjustment, protein by g/kg bodyweight.

**Inputs**
- **Name** (display name lives in this form today)
- **Sex:** Male / Female
- **Age** 18–100 · **Height** 120–230 cm · **Weight** 30–300 kg (**metric only**, adults only)
- **Activity level** (each has a helper hint):
  Sedentary (desk job) · Lightly active (1–3 days/wk) · Moderately active (3–5) · Very active (6–7) · Extra active (physical job / 2× a day)
- **Goal** (each has a hint):
  Lose weight (~0.75% bodyweight/week) · Maintain · Recomposition (lose fat + build muscle) · Build muscle (~10% surplus) · Gain weight (~20% surplus)

**Flow:** fill body stats → **"Calculate my targets"** → plan summary appears and fills the target fields → user can
tweak → **Save Targets**.

**Plan summary shows:** goal, **BMR**, **Maintenance (TDEE)**, **Deficit/Surplus** kcal, **BMI**, a one-line methodology
note, and **safety warnings** when relevant:
- Underweight BMI + "lose weight" → switched to maintenance targets, with an explanation
- BMI ≥ 30 + "build muscle/gain" → caution, suggests recomposition or weight loss
- Calories raised to the safe minimum (1,200 women / 1,500 men) → "talk to a doctor before eating less"

**Manual target fields (smart syncing)**
- Editing protein/carbs/fat **recalculates calories** (4/4/9 kcal per gram).
- Editing calories and leaving the field **rescales all three macros proportionally**.
- Changing any body stat clears the suggestion (it no longer matches).

**Today's UX problems**
- Buried behind a ⚙ gear icon labelled "Configure Targets". New users never find it and keep the 2000/150/200/65 defaults.
- One long modal mixes Name + body stats + plan + targets.
- The auto-sync between calories and macros is invisible. Numbers change on blur with no explanation.
- Metric only (no lb / ft-in).

**Open design questions**
- Make this the **onboarding flow** (a stepper: goal → body → activity → result → done)?
- How to visualise the plan (BMR → maintenance → goal) so it builds trust?
- Macro split shown as grams, % of calories, or both?

---

## 11. Feature: API Keys (bring your own AI key)

**What & why:** The AI features use paid providers. Users can supply their own keys. Keys are stored **only on the
device** (never in the database) and sent along with requests.

**Providers**

| Provider | Used for | Badge when missing |
|---|---|---|
| Anthropic Claude | Understanding meals, macro lookups, label reading | **Required** |
| Groq | Fast speech-to-text | Optional |
| Tavily *(web only)* | Web search for unknown ingredients | Optional |

**UI:** status list (each provider: set ✓ with masked key `sk-…abcd` + remove, or "Required/Optional" badge), then an
"Add or Update a Key" form (provider dropdown → password field with show/hide → Save). Web header button shows "API Keys
[2 missing]".

**Important behaviours the design should know**
- The server can have its **own** keys, so the app may work fine even with "missing" keys. The "missing" badge can be a false alarm.
- **The Tavily key entered in the UI is currently ignored** (the server only uses its own Tavily key). Mobile already
  leaves Tavily out.
- Copy bug: the web modal subtitle says keys are "stored in your local SQLite DB". That is wrong. They live in browser storage.
- An error message elsewhere says "Settings → API Keys", but API Keys is a header button, not part of Settings.

**Open design questions**
- Is this a power-user setting (tuck it into Settings → Advanced) rather than a top-level header button?
- With Pro being introduced (§12), should normal users ever see API keys at all?

---

## 12. Feature: Upgrade to Pro (payments, in progress)

**What & why:** Monetisation. One-time purchase **"Pro unlock" – ₹499** via Razorpay checkout.

**How it works**
- Web header: "✨ Upgrade to Pro" button → Razorpay checkout popup → on success: "Payment received — your Pro unlock is
  on its way!". The account is upgraded a moment later (the payment provider confirms it). The button then becomes a "✨ Pro" badge.
- Closing the checkout without paying does nothing (no error).
- Price is set on the server.

**Status:** being built on the `feature/payments` branch, not live. **Web only** (not on mobile yet).

**Big gap:** **Pro currently unlocks nothing.** No feature checks it. The design needs to define:
- What Pro includes (candidates: no API keys needed, unlimited label scans, meal suggestions §17, streak freeze, Excel
  export, advanced progress insights…)
- A **paywall / upgrade screen** that explains the value (today it's a bare button with no explanation)
- Pro identity in the UI, and the post-purchase "you're Pro" moment

---

## 13. Feature: Frequent Meals (auto-detected quick-log)

**What & why:** People eat the same things repeatedly. The app notices and offers **one-tap re-logging**, with no typing
and no AI wait.

**How it works (exact rules)**
- Every logged meal gets a fingerprint from its **set of ingredient names** (weights ignored, order ignored).
- The same set logged **2 or more times** becomes a frequent meal card.
- Up to **20** shown, most-logged first, then most recent.
- **Name is auto-generated** from the first 3 ingredients: "Eggs + Milk + Oats +2 more". It **can't be renamed**.
- The card's portions/macros reflect the **most recent** time it was logged.
- Logging a Saved Meal (§14) also counts toward frequent meals.

**Card shows:** name, kcal, P/C/F grams, "5× logged".

**Actions**
- **Log** (⚡): logs instantly with the stored portions. Instant, no AI.
- **Adjust portions** (sliders icon): sheet listing each ingredient with an editable grams field, a live "Estimated
  macros with these portions" preview, and **"Log with These Portions"**. Doesn't change the card's stored portions.
- **Remove** (trash): hides it. Web: no confirmation, fails silently. It will **reappear** if the meal is logged twice again.

**States:** the section is **completely hidden until the first frequent meal exists**. New users never learn this
feature exists.

**Today's UX problems**
- Hidden until earned, with no explanation.
- Auto-names are ugly and can't be edited. There is no "convert to Saved Meal".
- Two near-identical horizontal card rows (Frequent and Saved) sit next to each other with different rules.
- Horizontal scrolling rows with tiny 176 px cards. Three small buttons per card.

**Open design questions**
- Merge Frequent + Saved into one **"Quick add / My meals"** area (with "Suggested from your history" vs "Saved by you")?
- One-tap log with undo instead of a Log button?
- Let users "Save" a frequent meal to name it?

---

## 14. Feature: Saved Meals (user-made meal templates)

**What & why:** Intentional templates, e.g. "Breakfast Omelette + Protein Shake". Fully editable, logged in one tap,
adjustable each time.

**Ways to create**
1. **"+ New"**: blank editor.
2. **From a logged meal**: bookmark icon on any of Today's Meals → editor prefilled with its ingredients and a default
   name from the first 3 ingredients ("Eggs + Milk + Oats", falling back to "My Meal").

**Saved Meal editor (sheet/modal)**
- **Meal name** (required).
- **Ingredient list**: each row shows name, brand tag, kcal for the current weight, an editable **grams** field and remove (✕).
- **Add ingredient**: Name + Brand (optional) + grams → **Add**. The app looks up the nutrition (AI lookup, a few
  seconds, "Resolving...").
- **Total macros** live summary.
- Two actions:
  - **Save Meal**: save/update the template ("Meal saved.").
  - **Log Now**: logs with the *current* editor quantities. For a new meal it **saves the template first**. For an
    existing meal it logs **without** changing the saved template.
- Validation: "Give this meal a name." / "Add at least one ingredient."

**Card actions (in the Saved Meals row):** **Log** (exactly as saved, instant) · **Edit** (opens editor) · **Delete**
(web: no confirmation; mobile: confirmation).

**Sort:** most recently updated first. **Empty state:** explains the idea ("Save meals you eat often — e.g. 'Omelette +
Protein Shake' — then log them in one tap…").

**Today's UX problems**
- "Log Now" vs "Save Meal" is confusing in edit mode (does Log Now save my changes? No.).
- Editing per-100 g nutrition of a template ingredient isn't possible here (only grams), though it is for logged meals.
- Bookmark icon on a logged meal isn't self-explanatory.

---

## 15. Feature: Today's Meals (the daily log)

**What & why:** The list of what was eaten today, with the ability to inspect and correct.

**List item (collapsed):** the original sentence in quotes (e.g. *"200ml nandini milk and 2 eggs"*, or "Quick-logged:
Eggs + Milk" / "Logged saved meal: Breakfast"), date, ingredient count, kcal + P/C/F. Newest first.

**Expanded:** ingredient breakdown. Wide screens: a table (Ingredient + brand tag · Weight · kcal · Protein · Carbs · Fat ·
✏ edit) plus a **Total** row. Phones: stacked cards.

**Actions per meal**
- **Expand/collapse**
- **Save as reusable meal** (bookmark) → Saved Meal editor (§14)
- **Delete** (web: **instant, no confirmation, no undo**; mobile: confirmation dialog)
- **Edit an ingredient** (pencil per row) → sheet: **Weight (g)** + **Kcal / Protein / Carbs / Fat per 100 g**, live
  "Resulting macros for this ingredient" preview → Save. The meal's totals and the day's totals recalculate.

**Empty state:** "No food logged today. Type or speak your meals above to see them logged here."

**Today's UX problems**
- Fixing the AI's most common mistake (wrong grams) takes: expand → find row → pencil → edit field among five → save.
  Grams should be editable much more directly.
- Editing per-100 g values is the wrong mental model for most users (they know "1 scoop = 120 kcal", not per-100 g).
- The raw sentence is the meal's title. It is fine for typed meals but awkward for long or voice-transcribed ones.
- No adding/removing ingredients on an already-logged meal. No moving a meal to another day. No meal times or categories.
- Destructive delete without confirmation or undo (web).

---

## 16. Feature: Progress (history & trends)

**What & why:** Long-term motivation and accountability.

**Sections**

1. **Stats tiles:** Current Streak (days), Best Streak (days), Days Logged (all-time distinct days), Total Meals (all-time).
2. **90-day activity heatmap** (GitHub-style, 13 week-columns × 7 days, month labels). Each day is coloured by calories vs target:

   | Status | Rule (calories ÷ target) | Current colour |
   |---|---|---|
   | No data | nothing logged | dark grey |
   | Barely logged | < 50% | dim yellow *(hidden from the legend)* |
   | Under goal | 50–90% | dim green |
   | **Goal met ✓** | 90–115% | bright green |
   | Over goal | > 115% | orange |

   Hover (web) shows a tooltip: date, status, "1,840 / 2,000 kcal", P/C/F, meal count. Mobile has no hover. Only
   colours show.
3. **Weekly calorie chart:** one bar per week (total kcal) vs a dashed weekly-target line (daily target × 7). Bar colours:
   met (≥ 85%), over (> 110%), under. Hover shows the total.
4. **Meal history:** all meals ever, newest first, **20 per page** with ← / → buttons and "Page N". Same expandable
   meal card as Today's Meals but **read-only** (no edit/delete).

**Today's UX problems**
- **The "met" thresholds disagree** between heatmap (90–115%) and weekly chart (85–110%), so the same week can read
  "met" in one view and not the other. Design should pick one definition.
- Calories only. No protein trend (the metric this audience cares about most), no averages, no bodyweight tracking.
- Progress judges days against **today's** target, even for days logged before the target was changed.
- Tapping a heatmap day doesn't open that day's meals. History is a flat paginated list, not grouped by day.
- Mobile can't see per-day details (no hover).
- The web Progress page uses a purple theme unlike the rest of the app (lime).

**Open design questions**
- Should history be **day-grouped** (a calendar/diary view where tapping a day shows its meals and totals)?
- Which insights matter: avg protein/day, % days on target, weekly averages?

---

## 17. Built in the backend but has no UI: Meal Suggestions

**What it does:** works out **today's remaining macros** and asks the AI for **3 meal suggestions** that fill the gap,
preferring the user's frequent meals. Each suggestion has a name, a short description ("250 g grilled chicken + 150 g
rice"), estimated macros, a **fit score 1–10** and a one-line **fit reason**. Flags whether it's one of the user's
frequent meals, which could make it one-tap loggable.

**Status:** fully working on the server, **not shown anywhere** in web or mobile. A strong candidate for a "What should I
eat next?" card and/or a Pro feature.

---

## 18. Landing page (web, marketing)

Sections: nav · hero (perks: "No credit card", "Free to start", "5-second logs") with a mock meal-preview card ·
ingredient marquee · "How it works" (01 Log your meal → 02 AI resolves macros → 03 Track & keep streaks) · resolution-engine
explainer (Brand-aware / Portion smart / Fills the gaps) · streak section (mock stats + heatmap) · animated counter
stats · testimonial · CTA · footer.

⚠ The counter stats ("11,800+ active trackers", "142,000+ meals resolved") and streak numbers are **placeholder marketing
copy, not real data**. Replace them or design them as illustrative.

---

## 19. Cross-cutting UX behaviours

**Feedback & messages**
- Web: success/error banners appear at the **top of the dashboard** (often off-screen from where the user tapped).
  Errors stay until dismissed. Modals show their own inline notices.
- Mobile: banner at the top of the scroll view. Destructive actions use native confirmation dialogs.
- Needed: a consistent system (toast vs inline vs banner), **undo** for destructive and log actions, and a "success
  with caveat" tone (§5 warning).

**Waiting & latency** (design for these, they are real)
- AI meal logging: several seconds per meal.
- Adding an ingredient / fetching brand macros: a few seconds.
- Label scanning: a few seconds per image.
- Server cold start on the free hosting tier: **~40 s** for the first request after inactivity.
- Instant (no AI): frequent/saved meal logging, editing, deleting, targets, progress.

**Connectivity:** if the server is unreachable the dashboard shows a connection error. On mobile, header actions vanish.
No offline mode, no queued logging.

**Units & locale:** grams/ml only (household units like "scoop" or "cup" are understood in text but always shown as
grams). Metric body stats. INR pricing. English only.

**Day boundary:** "today" is decided by the **server's** clock/timezone, not the user's. Late-night logs can land on the
wrong day for users in other time zones. Worth a design note if meal times are introduced.

**Theme:** dark only, on both platforms. Current tokens (for reference only, open to change): background `#0B0C09`,
brand lime `#C9F24D`, fonts Bricolage Grotesque (display), Hanken Grotesk (UI), JetBrains Mono (numbers). Full list:
`mobile/docs/design-tokens.md`.

**Accessibility gaps today:** very small text (9–10 px labels are common), icon-only buttons, colour-only status in the
heatmap, hover-only details, constant pulse animations.

---

## 20. Web vs mobile differences

| Area | Web | Mobile |
|---|---|---|
| Navigation | Single dashboard + separate Progress page | Bottom tabs: Dashboard / Progress |
| Modals | Centered modals | Bottom sheets |
| Voice | Transcribe → editable text → send | Records and logs directly |
| Label scan | File picker / camera | Sheet: Take Photo / Choose from Library |
| Brand prefs: Excel import/export | ✅ | ❌ |
| API key providers | Anthropic, Groq, Tavily | Anthropic, Groq |
| Delete confirmations | ❌ none | ✅ native dialogs |
| Sign out | Header button | Inside Settings sheet |
| Upgrade to Pro | ✅ (in progress) | ❌ |
| Heatmap day details | Hover tooltip | None |
| Settings sheet | "Configure Targets" modal | "Settings" sheet (name, body stats, targets, Log out) |

---

## 21. Data reference (fields available to display)

- **User:** name, username, streak, Pro flag, targets (kcal, P, C, F), sex, age, height_cm, weight_kg, activity_level, goal.
- **Meal log:** id, date, original sentence, total macros (kcal, P, C, F), ingredients[].
- **Ingredient:** name, brand (optional), weight_g, kcal/P/C/F per 100 g, nutrition source (own data / looked up / estimated).
  *The source exists on newly logged meals but is never shown today.*
- **Frequent meal:** auto name, ingredients[], macros, times logged, last logged date.
- **Saved meal:** name, ingredients[], macros, created/updated dates.
- **Brand preference:** ingredient name, brand, kcal/P/C/F per 100, unit (g or ml).
- **Target plan (calculator output):** BMR, maintenance, adjustment (±kcal), BMI, goal applied, kcal/P/C/F, warnings[].
- **Progress:** 90 daily summaries (date, kcal, P, C, F, meal count, status), current & best streak, days logged, total
  meals. History pages of 20.
- **Meal suggestion (no UI yet):** name, description, estimated macros, fit score 1–10, fit reason, is-frequent flag.

---

## 22. Top UX priorities (summary for the redesign)

1. **Make logging feel instant and trustworthy:** progress feedback during the AI wait, a review/confirm step or undo,
   visible per-ingredient confidence, easy gram fixes.
2. **Onboarding:** goal + body stats → targets → first meal. Explain brands and quick-log along the way.
3. **Show "remaining today"**, not just consumed. Give protein prominence.
4. **Unify the food library:** Brand Preferences + Label Scans (+ maybe Saved/Frequent meals) into one coherent "My Foods" model.
5. **Simplify the IA:** core (Log, Today, Progress) vs settings (Targets, API Keys, Account) vs monetisation (Pro).
6. **Streak with states and moments** (at risk, kept, milestone), not just a number.
7. **Day-based history** with consistent "goal met" rules and protein trends.
8. **Define Pro** and design the paywall. Consider Meal Suggestions (§17) as a headline Pro feature.
9. **Consistent feedback system**: toasts, confirmations, undo, warnings that don't look like failures.
10. **Accessibility:** readable type sizes, labelled controls, no colour-only meaning.
