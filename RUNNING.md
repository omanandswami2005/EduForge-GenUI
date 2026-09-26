# Local Setup

Fully local dev/demo setup — no GCP project, no Firebase project, no real
Google login. Auth + Firestore run on the local Firebase Emulator Suite;
the only outbound network call the app makes is to Groq's free LLM API.
See `explainer.md` for what the project does and how to present it.

## Prerequisites

- Node.js 18+ and [pnpm](https://pnpm.io/installation)
- Python 3.10+
- Java (JRE 11+) — required by the Firestore emulator only
- A free [Groq API key](https://console.groq.com/keys)

## First-time setup

```bash
git clone <this repo> && cd EduForge-GenUI

# Fill in GROQ_API_KEY (everything else in .env.example already has sane local defaults)
cp .env.example .env.local

# Frontend deps
cd apps/web && pnpm install && cd ../..

# Backend deps — one venv per Python service
python3 -m venv apps/api/.venv          && apps/api/.venv/bin/pip install -r apps/api/requirements.txt
python3 -m venv apps/bkt-service/.venv  && apps/bkt-service/.venv/bin/pip install -r apps/bkt-service/requirements.txt
python3 -m venv apps/ingestion/.venv    && apps/ingestion/.venv/bin/pip install -r apps/ingestion/requirements.txt
```

## Start everything (recommended)

```bash
bash scripts/dev/start-everything.sh
```

One command, one terminal: boots the Firebase emulators, all 3 backend
services, and the Next.js frontend, in the right order, waiting for each
to be ready before starting the next. Ctrl+C stops everything cleanly.

If a previous run left stray processes (e.g. the terminal was closed
instead of Ctrl+C'd), clear them first:

```bash
bash scripts/dev/stop-everything.sh
```

Per-service logs land in `/tmp/eduforge-{emulators,bkt,api,ingestion,web}.log`
— tail one directly if something isn't behaving:

```bash
tail -f /tmp/eduforge-web.log
```

## Start services individually (for debugging one piece)

```bash
# Terminal 1 — Firebase emulators
bash scripts/dev/start-emulators.sh

# Terminal 2 — backend (BKT, API gateway, ingestion)
bash scripts/start-all.sh

# Terminal 3 — frontend
cd apps/web && pnpm dev
```

## Seed demo data

The app starts with an empty database. To get a ready-to-demo lesson
(Newton's Laws of Motion, 4 subtopics, MCQs, and two example students'
BKT states) without going through the PPTX upload pipeline:

```bash
GOOGLE_CLOUD_PROJECT=demo-eduforge FIRESTORE_EMULATOR_HOST=localhost:9090 \
  apps/api/.venv/bin/python scripts/seed/seed_demo_lesson.py
```

Safe to re-run — it overwrites the same fixed document IDs. Register a
teacher and a student account from `/register` (normal email/password —
this creates the account in the local Auth emulator, not a real Google
account), then enroll the student using lesson ID `demo_newtons_laws`.

## Service URLs

| Service              | URL                      |
|-----------------------|--------------------------|
| Frontend              | http://localhost:3000    |
| API gateway            | http://localhost:8000    |
| BKT service            | http://localhost:8001    |
| Ingestion service       | http://localhost:8003    |
| Firebase Emulator UI    | http://localhost:4000    |
| Auth emulator           | http://localhost:9099    |
| Firestore emulator      | http://localhost:9090    |

## Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | **Required.** Free key from console.groq.com/keys — the only external dependency |
| `GROQ_GENUI_MODEL` | Model for student-facing content generation (default `openai/gpt-oss-120b`) |
| `GROQ_INGESTION_MODEL` | Model for the PPTX ingestion pipeline (topics/MCQs/BKT params) |
| `OPENROUTER_API_KEY` | Optional second LLM provider (free tier, slow) used after Groq in the GenUI chain |
| `GENUI_MODELS` | GenUI model chain as `provider:model`, tried in order (default: Groq gpt-oss-120b → Groq gpt-oss-20b → OpenRouter Dots3 free). If all fail, curated content is shown |
| `GENUI_STRATEGY` | `fallback` (default) or `race` (all models in parallel, first valid wins) |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | Keep `true` for local dev — points the client SDK at the emulators |
| `GOOGLE_CLOUD_PROJECT` | Fake project ID used by the emulators (default `demo-eduforge`) — doesn't need to be a real GCP project |

## Troubleshooting

- **"Failed to fetch" on login/register** — the Auth emulator isn't up yet,
  or `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` isn't `true` in `.env.local`.
- **`apps/web/.env.local` missing** — Next.js only reads env files from its
  own directory, not the repo root. `start-everything.sh` symlinks it
  automatically; if running the frontend manually for the first time, run
  once: `cd apps/web && ln -sf ../../.env.local .env.local`
- **A GenUI card shows a "Curated content" badge** — every model in the
  `GENUI_MODELS` chain failed (rate limits, timeouts), so hand-written content
  for that scaffold level was shown instead. `[llm]` lines in
  `/tmp/eduforge-web.log` say why each model failed.
- **`pnpm install` fails on native build scripts** — run
  `pnpm approve-builds` once, or check `allowBuilds` in
  `pnpm-workspace.yaml` is set to `true` for `sharp`, `protobufjs`,
  `@firebase/util`, `unrs-resolver`.
- **Port already in use** — run `bash scripts/dev/stop-everything.sh` first.
