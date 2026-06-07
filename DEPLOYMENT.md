# Deploying FitVoice — Step-by-Step Guide

This guide deploys the **frontend to Vercel** (free) and the **backend to Render**
(free tier), wired together with **GitHub Actions** so every push to `main`
auto-deploys.

> 💡 Production deployments are automatically pinned to **cloud STT (Groq)** —
> the local-Whisper toggle is hidden once `ENVIRONMENT=production` is set
> (see `backend/main.py` → `IS_PRODUCTION`). This avoids loading a multi-GB
> model into a free tier's limited RAM.

---

## Prerequisites

- [ ] Code pushed to GitHub (`master`/`main` branch)
- [ ] A free [Groq API key](https://console.groq.com/keys) — required for cloud STT in production
- [ ] A free [Anthropic API key](https://console.anthropic.com/settings/keys) — required for the LangGraph pipeline
- [ ] (Optional) A free [Tavily API key](https://tavily.com) — for web-search ingredient fallback

---

## Part 1 — Deploy the Backend (Render)

### 1. Create a Render account
Go to [render.com](https://render.com) → sign up with GitHub.

### 2. Create a new Web Service
1. Dashboard → **New** → **Web Service**
2. Connect your GitHub repo (`FitAI`)
3. Configure:

| Setting | Value |
|---|---|
| **Name** | `fitvoice-backend` |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 3. Add environment variables
In the service → **Environment** tab, add:

```
ENVIRONMENT=production
```

> That's it for required env vars! Your **API Key Manager UI** lets you add
> `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, and `TAVILY_API_KEY` directly from the
> running app — they're stored in the database and hot-loaded, no redeploy needed.
>
> ⚠️ Caveat: Render's free tier has an **ephemeral filesystem** — your SQLite
> DB (and any keys saved through the UI) reset on every redeploy/restart. To
> persist keys permanently, either:
> - Add them as Render environment variables instead (`ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `TAVILY_API_KEY`), **or**
> - Upgrade to a paid Render plan with a persistent disk, **or**
> - Use Fly.io instead (supports free persistent volumes — see "Alternatives" below)

### 4. Deploy
Click **Create Web Service**. Render builds and deploys automatically.
Your backend will be live at something like:

```
https://fitvoice-backend.onrender.com
```

> Note the free tier **sleeps after 15 minutes of inactivity** — the first
> request after sleeping takes ~30 seconds to "wake up".

---

## Part 2 — Deploy the Frontend (Vercel)

### 1. Create a Vercel account
Go to [vercel.com](https://vercel.com) → sign up with GitHub.

### 2. Import your project
1. Dashboard → **Add New** → **Project**
2. Import your `FitAI` repo
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Next.js (auto-detected) |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `.next` (default) |

### 3. Update the API base URL
Your frontend currently calls `http://localhost:8000` directly. Before deploying,
replace these hardcoded URLs with an environment variable:

```ts
// Add to the top of frontend/src/app/page.tsx
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Then replace every occurrence of:
fetch("http://localhost:8000/api/...")
// with:
fetch(`${API_BASE}/api/...`)
```

### 4. Add the environment variable in Vercel
In your Vercel project → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://fitvoice-backend.onrender.com
```

### 5. Deploy
Click **Deploy**. Vercel builds and gives you a live URL like:

```
https://fitvoice.vercel.app
```

### 6. Update backend CORS
In `backend/main.py`, update the CORS origins to include your live frontend URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://fitvoice.vercel.app",   # ← add your real Vercel URL
    ],
    ...
)
```

Commit and push — Render will auto-redeploy with the updated CORS config.

---

## Part 3 — CI/CD: Auto-deploy on push to `main`

Both Vercel and Render **already auto-deploy on every push** once connected to
your GitHub repo — no extra YAML needed! That's the simplest possible CI/CD setup.

### Optional: Add a GitHub Actions check before deploy
If you want tests/linting to run before triggering a deploy, add
`.github/workflows/ci.yml`:

```yaml
name: CI Checks

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm install && npm run build

  backend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: cd backend && pip install -r requirements.txt
```

This runs build checks on every push; Render/Vercel deploy independently once
the push lands on `main`.

---

## Part 4 — Final checklist after deploy

1. Visit your Vercel frontend URL
2. Open **API Keys** in the header → confirm **Anthropic** and **Groq** show "Set"
   (add them via the UI if Render's filesystem reset cleared them, or set as
   Render env vars for permanence)
3. Record a test meal → confirm transcription + macro resolution works end-to-end
4. Confirm the **Brand Preferences** and **Meal Logs** sections work correctly

---

## Alternatives (if Render free tier is too limiting)

| Platform | Why consider it |
|---|---|
| **Fly.io** | Free persistent volumes — your SQLite DB & saved keys survive restarts |
| **Railway** | $5/month free credit, very simple, persistent storage |
| **Hugging Face Spaces** | Good if you want to containerize with Docker; free CPU tier |

For Fly.io, the rough flow is:
```bash
cd backend
fly launch                 # generates fly.toml, choose a free region
fly volumes create data --size 1
fly deploy
```
Then mount the volume to wherever `meal_tracker.db` lives so it persists.

---

## Summary — What auto-deploys where

```
git push origin main
        │
        ├──► Vercel detects push → builds frontend → live in ~1 min
        │
        └──► Render detects push → builds backend  → live in ~2-3 min
```

No manual redeploy steps needed once both are connected to GitHub. 🎉
