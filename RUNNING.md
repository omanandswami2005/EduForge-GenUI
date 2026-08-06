# Running EduForge

Fully local dev setup — no GCP project, no Firebase project, no Google
login. Auth + Firestore run on the local Firebase Emulator Suite; the only
outbound network call is to Groq's free LLM API.

### First time setup
```bash
cp .env.example .env.local   # fill in GROQ_API_KEY (free at console.groq.com/keys)
cd apps/web && pnpm install
python3 -m venv apps/api/.venv && apps/api/.venv/bin/pip install -r apps/api/requirements.txt
python3 -m venv apps/bkt-service/.venv && apps/bkt-service/.venv/bin/pip install -r apps/bkt-service/requirements.txt
python3 -m venv apps/ingestion/.venv && apps/ingestion/.venv/bin/pip install -r apps/ingestion/requirements.txt
```

### Start emulators (Terminal 1)
```bash
bash scripts/dev/start-emulators.sh
```

### Start backend (Terminal 2)
```bash
bash scripts/start-all.sh
```

### Start frontend (Terminal 3)
```bash
cd apps/web && pnpm dev
```

| Service        | URL                    |
|----------------|------------------------|
| Frontend       | http://localhost:3000  |
| API            | http://localhost:8000  |
| BKT            | http://localhost:8001  |
| Ingestion      | http://localhost:8003  |
| Emulator UI    | http://localhost:4000  |
| Auth emulator  | http://localhost:9099  |
| Firestore emu. | http://localhost:9090  |

Register a user from the login page as normal (email/password) — it's
created in the local Auth emulator, not a real Google account.
