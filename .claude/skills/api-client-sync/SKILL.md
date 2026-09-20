---
name: api-client-sync
description: Regenerate the mobile app's TypeScript API types from the FastAPI backend's live OpenAPI schema and report drift against the hand-written client methods in mobile/lib/api/. Use after backend routes/schemas change, or before building a mobile feature that calls an endpoint you're not sure is already wired up.
---

# API client sync

GetFitBro's mobile app talks to the same FastAPI backend as the web app. Types are generated
from the backend's live OpenAPI schema rather than hand-copied from `frontend/`, since the web
app has no extracted type layer to copy from. This skill keeps `mobile/lib/api/types.ts` in sync
and flags where the hand-written wrapper (`mobile/lib/api/client.ts` and its per-router method
files) needs a human/Claude decision — it never blindly rewrites the hand-written wrapper.

## When to use this

- A backend router file under `backend/routers/` changed (new endpoint, changed request/response
  shape, new/removed field) and mobile consumes or will consume it.
- Before implementing a mobile feature against an endpoint, to confirm the current request/
  response shape rather than trusting memory of an earlier version.
- Periodically as a sanity check during any milestone that adds new backend-consuming mobile code.

## Steps

1. **Ensure the backend is running locally** (`backend/.venv/Scripts/python.exe -m uvicorn main:app --port 8000` from `backend/`, or confirm it's already up) — the schema is generated live from
   the running app, there's no static OpenAPI file checked into the backend repo.
2. **Regenerate types**: from `mobile/`, run
   `npx openapi-typescript http://localhost:8000/openapi.json -o lib/api/types.ts`
   (wired as the `codegen:api` npm script — prefer `npm run codegen:api` if present).
3. **Diff against the previous `types.ts`** (git diff) to see exactly what changed: new endpoints/
   schemas, changed fields, removed endpoints.
4. **Cross-check against the hand-written client** in `mobile/lib/api/client.ts` and the per-router
   method files (`auth.ts`, `dashboard.ts`, `progress.ts`, `frequentMeals.ts`, `savedMeals.ts`,
   `ingredients.ts`, `brandPreferences.ts`, `keys.ts`, `users.ts`):
   - New endpoint with no corresponding method → flag it, don't add a method speculatively unless
     a mobile feature actually needs it right now.
   - Changed request/response shape for an endpoint with an existing method → this is the
     important case: update the method's usage sites too, and check multipart/file-upload methods
     especially carefully since generated types don't model `FormData`/file-URI upload shapes well
     — those stay hand-written, only the surrounding JSON shapes come from codegen.
   - Removed/renamed endpoint still referenced by a method → flag as broken, fix or remove the
     dependent mobile code.
5. **Report a short summary** of what changed and what (if anything) needs a corresponding edit in
   `client.ts`/method files/consuming components — apply straightforward fixes, surface judgment
   calls (e.g. a breaking shape change touching multiple screens) to the user before editing.

## Notes

- Never regenerate `client.ts` itself from the OpenAPI schema — it's intentionally hand-written
  because of multipart/auth-header/401-handling nuance that generated clients handle poorly.
- If `backend/routers/brand_preferences.py` changes as part of the user-scoping fix (M1), that's
  exactly the kind of breaking shape change (added `user_id` scoping, auth now required) this
  skill should catch and flag clearly.
