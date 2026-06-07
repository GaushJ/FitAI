# FitVoice — Architecture Overview

## High-Level Flow

```
User speaks
    ↓
Browser (Next.js) records audio
    ↓
FastAPI backend receives audio
    ↓
Faster-Whisper transcribes speech → text
    ↓
LangGraph pipeline resolves ingredients + macros
    ↓
Results saved to SQLite → returned to UI
```

---

## Tech Stack

### Frontend

| Layer   | Tech                              |
|---------|-----------------------------------|
| Framework | **Next.js 15** (React, TypeScript) |
| Styling   | **Tailwind CSS**                  |
| Icons     | **Lucide React**                  |
| Audio     | Browser native `MediaRecorder` API |
| State     | React `useState` / `useRef` hooks |

### Backend

| Layer    | Tech                          |
|----------|-------------------------------|
| API Server | **FastAPI** (Python)        |
| ORM        | **SQLAlchemy** (async)      |
| Database   | **SQLite** via `aiosqlite`  |
| Env/Config | `python-dotenv`             |

---

## AI Stack

```
┌─────────────────────────────────────────────────┐
│                  AI PIPELINE                    │
│                                                 │
│  Audio → [Faster-Whisper] → Text               │
│                ↓                               │
│         [LangGraph Workflow]                   │
│         ┌──────────────────┐                  │
│         │  Node 1          │                  │
│         │  Extraction      │  Claude Sonnet   │
│         │  (Claude)  ──────┼─ structured      │
│         │                  │  output          │
│         └────────┬─────────┘                  │
│                  ↓                             │
│         ┌──────────────────┐                  │
│         │  Node 2          │                  │
│         │  Resolution      │  SQLite cache    │
│         │  ├─ Cache hit?───┼─ → use it        │
│         │  └─ Cache miss?──┼─ Tavily search   │
│         │         └────────┼─ Claude parses   │
│         └────────┬─────────┘                  │
│                  ↓                             │
│         ┌──────────────────┐                  │
│         │  Node 3          │                  │
│         │  Calculation     │  Pure math       │
│         │  (no AI)         │  weight × macro  │
│         └──────────────────┘                  │
│                                                 │
│  + Claude Vision (label image → macros)        │
└─────────────────────────────────────────────────┘
```

### AI Tools Breakdown

| Tool | Role | Model/Version |
|------|------|---------------|
| **Faster-Whisper** | Speech → Text (STT) | `large-v3` on CPU/CUDA |
| **LangChain + LangGraph** | Orchestrates the 3-node AI pipeline | — |
| **Claude (via LangChain)** | Extraction node — parses raw transcript into structured ingredients | `claude-sonnet-4-6` |
| **Claude (via LangChain)** | Resolution node — reads web search results, estimates macros | `claude-sonnet-4-6` |
| **Claude Vision (Anthropic SDK)** | Reads nutrition label photos, extracts per-100g macros | `claude-sonnet-4-6` |
| **Tavily Search** | Web search fallback for unknown ingredients/brands | — |

---

## Data Flow in Detail

### 1. Speech-to-Text (`stt_worker.py`)

```
Audio blob (webm/ogg)
    → faster_whisper WhisperModel("large-v3")
    → raw transcript string
    → returned to FastAPI
```

### 2. LangGraph Pipeline (`graph_engine.py`)

Three sequential nodes compiled into a state machine:

#### Node 1 — Extraction
- **Input:** raw transcript string
- Uses Claude with **structured output** (Pydantic schema)
- **Output:** list of `{name, brand, weight_g}` objects
- Example: *"200ml Nandini milk and 2 eggs"* → `[{name:"milk", brand:"nandini", weight_g:200}, {name:"egg", brand:null, weight_g:100}]`

#### Node 2 — Resolution
For each ingredient, checks in order:

1. **Brand preferences table** → inject preferred brand if user set one
2. **SQLite ingredient cache** → instant lookup, no AI needed
3. **Tavily web search** → fetches nutritional data from the web
4. **Claude fallback** → uses its own knowledge if search fails

- Saves new results back to SQLite cache
- **Output:** same list enriched with `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`

#### Node 3 — Calculation
- Pure math, no AI
- Formula: `actual_macro = (per_100g × weight_g) / 100`
- Sums all ingredients → total meal macros

### 3. Label Vision (`main.py`)

```
Image upload
    → base64 encode
    → Anthropic SDK (direct, not LangChain)
    → Claude vision prompt: "extract per-100g macros"
    → parse JSON from response
    → save to ingredient_cache + brand_preferences
```

---

## Database Schema

```
SQLite (meal_tracker.db)
├── users              — profile + daily macro targets
├── ingredient_cache   — {name, brand, calories, protein, carbs, fat per 100g}
├── brand_preferences  — {ingredient_name → preferred_brand}
└── daily_food_logs    — {transcript, date, computed_macros JSON}
```

---

## Architectural Decisions

| Decision | Reason |
|----------|--------|
| LangGraph over plain LangChain | Explicit node graph = easier to debug each step independently |
| SQLite cache | Avoids re-calling AI/web for the same ingredient repeatedly — fast and free |
| Structured output (Pydantic) | Forces Claude to return predictable JSON, no regex parsing needed |
| Anthropic SDK direct for vision | LangChain's multimodal support is less stable; direct SDK is cleaner for image input |
| Faster-Whisper local | No API cost, works offline, `large-v3` is near OpenAI Whisper API quality |
