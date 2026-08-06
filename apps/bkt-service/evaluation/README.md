# BKT Engine Validation

Offline, standalone empirical validation of `src/bkt/engine.py` — does not
touch Firestore or any running service. Answers: does the tracked
`P(mastery)` actually track a student's real latent knowledge, and how much
does it degrade when the BKT params are wrong (the params in this project
are LLM-estimated by `apps/ingestion/src/generators/bkt_params.py`, not
psychometrically calibrated)?

## Run it

```bash
cd apps/bkt-service
./.venv/bin/pip install matplotlib   # one-time, not a runtime dependency of the service
./.venv/bin/python evaluation/validate_bkt.py
```

## Method

Monte Carlo simulation against BKT's own generative assumptions: 300
synthetic students per profile, sampled through the same process BKT
assumes (unknown → learns with `p_learn` → answers correct with `1-p_slip`
if known else `p_guess`). The population's true `P(known_t)`, averaged
across students, is the calibration target; the engine's mean `P(mastery_t)`
across the same students, fed only their observed responses, is what's
being validated. RMSE between the two curves is the calibration error.

Five profiles: fast/average/slow learners, an already-proficient starter,
and one **misspecified** profile where the true learner is fast but the
model is told a much slower `p_learn` — this is the realistic failure mode
(a bad AI-estimated param), and its RMSE is the headline number to quote:
it's several times higher than the correctly-specified profiles, which is
expected and is the actual finding — it quantifies how far a scaffold-level
decision can lag a student's true progress when the seeded BKT params are
inaccurate.

Also runs 4 structural consistency checks (probability bounds, monotonic
convergence, single-slip robustness, `p_slip < p_guess` well-posedness).

## Output

`results/` — one PNG per profile (true vs. model mastery curves, with a
sample of individual student trajectories underneath) plus
`bkt_validation_report.{json,md}` with the full metrics table. Regenerating
overwrites these; they're checked in so the numbers are visible without
re-running.
