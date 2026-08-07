# EduForge — Explainer & Presentation Guide

One-page reference for presenting EduForge: the core idea, what was built,
what's actually verified, and exactly how to run the demo.

## The one-sentence thesis

> Most AI tutors just chat with you regardless of what you actually know.
> EduForge is different — **a statistical model of your knowledge, not the
> AI, decides how hard the content is allowed to be.**

Concretely: a Bayesian Knowledge Tracing (BKT) engine tracks each student's
per-concept mastery probability from their MCQ responses. That probability
maps to a scaffold level (0–4), which restricts which of 8 GenUI component
types (StepByStep, HintCard, FormulaCard, ConceptDiagram, AnalogyCard,
PracticeExercise, ProofWalkthrough, ExpertSummary) the LLM is *allowed* to
generate. The LLM never decides the difficulty — the symbolic/statistical
model does. That's the "neuro-symbolic fusion": neural (LLM) generation,
constrained by a symbolic (BKT) gate.

## Architecture in one breath

Next.js 15 frontend (GenUI generation via Groq + Vercel AI SDK) · FastAPI
API gateway · FastAPI BKT service (numpy) · FastAPI ingestion service
(PPTX → topics/MCQs/BKT params) · Firestore for all data · Firebase Auth
for accounts. Everything now runs **fully locally** — Firebase Emulator
Suite for Auth/Firestore, Groq's free API for the only outbound LLM call.
See `RUNNING.md` for setup.

## What's in this build

**Core migration:** Gemini → Groq (free API), Firebase emulator (no GCP
project, no real Google login needed), single source of truth for the
scaffold-level mapping (was hand-duplicated across TS and Python, now
generated from `config/scaffold-levels.json`).

**Student-facing:**
- Adaptive MCQs with option shuffling, TTS ("Read" button), tiered
  difficulty (Foundation/Understanding/Analysis)
- GenUI visualization that regenerates when mastery crosses a scaffold
  boundary — content gets simpler or harder automatically
- **Misconception feedback loop**: a wrong answer looks up the specific
  misconception authored for that exact wrong option and feeds it into the
  *next* generation, which directly corrects that idea (verified live —
  see Testing status below)
- Scaffold/model/latency transparency badges on every generated card
- Side-by-side "Compare mastery levels" view (novice vs. mastered, same
  concept, same model, on demand)
- Concept dependency graph (ReactFlow) — subtopics lock until their
  prerequisites reach 40% mastery
- Cross-lesson "Overall Mastery" dashboard

**Teacher-facing:**
- Class mastery heatmap (student × concept, live)
- **Common Misconceptions** panel — ranks the specific wrong ideas
  students keep having per concept, not just low mastery scores

**Evaluation (the part most student projects skip):**
- `apps/bkt-service/evaluation/` — Monte Carlo validation of the BKT
  engine against its own generative assumptions (300 synthetic students ×
  5 profiles). Finding: a misspecified `p_learn` (simulating a bad
  LLM-estimated BKT param) produces ~3× the calibration error of a
  correctly-specified profile.
- `scripts/evaluation/` — ablation study quantifying the scaffolding
  effect: novice-scaffolded content averages a 5th-grade reading level,
  mastered-scaffolded averages 9th–10th grade, on identical topics and
  model. An unscaffolded control (naive "explain X" prompt) sits in
  between — one grade level for every student, regardless of where they
  actually are.

## Testing status — what's actually verified

| Area | Status |
|---|---|
| Register/login/enrollment (both roles) | ✅ Browser-tested |
| GenUI generation (all 7 component types) | ✅ Browser-tested |
| Full BKT loop (answer → mastery → scaffold change → regenerate) | ✅ Browser-tested |
| Scaffold/model/latency badges, comparison view | ✅ Browser-tested |
| Teacher heatmap, cross-lesson dashboard | ✅ Browser-tested |
| Misconception insights (teacher) | ✅ Browser-tested |
| Misconception feedback loop (student) | ✅ Browser-tested — confirmed actual regenerated content (a step titled "Inertia is not a force" after that exact wrong answer) |
| Concept dependency graph (lock/unlock) | ✅ Browser-tested |
| Mobile/tablet/desktop responsive layout | ✅ Browser-tested (390px / 820px / 1920px) |
| BKT validation, ablation study, codegen | ✅ Verified by running them — not browser UI, not applicable |
| **PPTX upload → AI ingestion pipeline** | ⚠️ **Never tested this session.** Every demo above used the seeded lesson (`demo_newtons_laws`). Don't live-demo a real upload unless you dry-run it first. |

**Known flakiness:** Groq's free tier occasionally rejects a generation at
the mastered/expert scaffold level (larger structured-output schema) or
under concurrent load (e.g. both panels of the comparison view firing at
once). It fails *visibly* now (a red error banner, not a silent hang) — if
a card sits on "Generating..." too long or errors, just retry the action.
This is documented, not a crash.

## Demo script (~8–10 min)

**1. Open on the comparison view (30s, highest-impact opener).**
Login as `alex.student@eduforge.test` / `TestPass123!`, open a subtopic,
scroll to "Compare mastery levels," click Show. Same concept, same model,
side by side: novice gets StepByStep, mastered gets ProofWalkthrough +
ExpertSummary. *"Same AI, same topic — the only thing that changed is what
the model knows about this student."*

**2. Live loop — answer wrong, watch it react (2 min, the core mechanic).**
Answer an MCQ incorrectly. Narrate as it happens: mastery number drops →
scaffold badge changes → "Generating..." fires → new content appears that
directly addresses the mistake. This is the neuro-symbolic loop closing in
real time.

**3. Answer correctly a few times — watch it escalate (1 min).**
Mastery crosses 40% / 60% / 80% → content shifts from StepByStep to
ConceptDiagram to PracticeExercise/ProofWalkthrough. Point at the scaffold
badge each time so the audience sees the *number* driving the change.

**4. Concept dependency graph (optional, if time allows).**
Back to the lesson's subtopic list — locked subtopics with lock icons.
*"You can't skip ahead until the model believes you're ready."*

**5. Switch to teacher view (2 min).**
Login as `priya.teacher@eduforge.test` / `TestPass123!`, open the lesson.
Class mastery heatmap, then **Common Misconceptions**. *"It's not just
'Bob is at 20% on inertia' — it's 'here's the exact wrong idea three
students keep having.'"*

**6. Close with evidence, not just a demo (2 min — the differentiator).**
Show the two chart images:
- `apps/bkt-service/evaluation/results/misspecified_params.png` —
  *"We validated the tracking model itself against 300 synthetic students
  — when the AI-estimated parameters are wrong, here's exactly how much
  the tracking degrades."*
- `scripts/evaluation/results/genui_ablation_grade_levels.png` —
  *"We measured the scaffolding effect instead of assuming it: novice
  content averages 5th-grade reading level, mastered averages 9th–10th,
  same topic, same model. A non-adaptive system sits in between —
  one-size-fits-all."*

## Quick reference

**Test accounts** (local emulator, created by earlier testing —
re-register if the emulator data was reset):
- Teacher: `priya.teacher@eduforge.test` / `TestPass123!`
- Student: `alex.student@eduforge.test` / `TestPass123!`
- Demo lesson ID to enroll: `demo_newtons_laws`

**Seed the demo lesson** (if starting from a clean emulator):
```bash
GOOGLE_CLOUD_PROJECT=demo-eduforge FIRESTORE_EMULATOR_HOST=localhost:9090 \
  apps/api/.venv/bin/python scripts/seed/seed_demo_lesson.py
```

**Start everything**: see `RUNNING.md` / `scripts/dev/start-everything.sh`.
