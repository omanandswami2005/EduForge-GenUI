# Running EduForge

### First time setup
```bash
cp .env.example .env.local   # fill in GEMINI_API_KEY + Firebase keys
cd apps/web && pnpm install
```

### Start backend (Terminal 1)
```bash
bash scripts/start-all.sh
```

### Start frontend (Terminal 2)
```bash
cd apps/web && pnpm dev
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| API      | http://localhost:8000 |
| BKT      | http://localhost:8001 |
| Ingestion| http://localhost:8003 |
