# Evaluation Scripts

Standalone evaluation tooling — not part of the running app, not imported by
any service. Both write their results into `results/` (checked in, so the
numbers are visible without re-running).

## `genui_ablation.py` — does scaffolding actually change content?

Tests the project's core claim directly: BKT-driven scaffolding produces
measurably different (simpler for a novice, more advanced for a mastered
student) GenUI content for the *same* concept and the *same* underlying
model — versus a naive, non-adaptive "just ask the LLM" control.

Three conditions per concept, scored with Flesch-Kincaid Grade Level:
1. `scaffolded_novice` — the real `/api/genui` route at scaffold level 0
2. `scaffolded_mastered` — the real `/api/genui` route at scaffold level 4
3. `unscaffolded_control` — a direct Groq call with a generic "explain X"
   prompt, no scaffold constraints — what a non-adaptive tutor would produce

Requires the Next.js dev server running (`cd apps/web && pnpm dev`),
`GROQ_API_KEY` set, and matplotlib (reuses `apps/bkt-service/.venv` — see
that service's evaluation README for the one-time install).

```bash
cd /path/to/EduForge-GenUI
set -a && source .env.local && set +a
apps/bkt-service/.venv/bin/python scripts/evaluation/genui_ablation.py
```

Known limitation surfaced by running this: Groq's structured-output
validation occasionally rejects a generation outright at higher scaffold
levels (more/larger required components strain the discriminated-union
schema), which the server-side model fallback chain doesn't fully recover
from if the failure happens after the first streamed chunk. The script
retries the whole request client-side as a pragmatic workaround; making
`streamWithFallback` itself recover mid-stream is real follow-up work
(resilience hardening, deliberately out of scope for this pass).

## `../../apps/bkt-service/evaluation/validate_bkt.py` — is the BKT engine calibrated?

Monte Carlo validation of the BKT engine against its own generative
assumptions — see `apps/bkt-service/evaluation/README.md`.
