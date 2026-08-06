# BKT Engine Validation Report

Monte Carlo simulation, 300 synthetic students x 15 opportunities per profile, seed=42.

## Calibration (model P(mastery) vs. true population P(known))

| Profile | RMSE | Final true P(known) | Final model P(mastery) |
|---|---|---|---|
| fast_learner | 0.0391 | 1.000 | 0.999 |
| average_learner | 0.0289 | 0.977 | 0.979 |
| slow_learner | 0.0267 | 0.747 | 0.759 |
| already_proficient | 0.0058 | 0.993 | 0.996 |
| misspecified_params | 0.0954 | 1.000 | 0.997 |

## Consistency checks

**8/8 passed**

| Check | Result | Description |
|---|---|---|
| mastery_stays_in_bounds | PASS | P(mastery) stays within [0.001, 0.999] under 50 alternating responses with extreme params |
| monotonic_convergence_on_all_correct | PASS | 20 consecutive correct answers -> P(mastery) is non-decreasing and exceeds 0.9 |
| single_slip_robustness | PASS | A mastered student (P=0.97) who answers wrong once shouldn't collapse near zero |
| well_posed_params[fast_learner] | PASS | p_slip (0.08) < p_guess (0.25) |
| well_posed_params[average_learner] | PASS | p_slip (0.1) < p_guess (0.25) |
| well_posed_params[slow_learner] | PASS | p_slip (0.12) < p_guess (0.25) |
| well_posed_params[already_proficient] | PASS | p_slip (0.1) < p_guess (0.2) |
| well_posed_params[misspecified_params] | PASS | p_slip (0.08) < p_guess (0.25) |

## Interpretation

The `misspecified_params` profile deliberately gives the engine a p_learn that understates the true learner's speed, simulating what happens when apps/ingestion's LLM-estimated BKT params (bkt_params.py) are inaccurate. Its RMSE is materially higher than the correctly-specified profiles, which is the expected behavior — it quantifies how much scaffold-level decisions can lag a student's true progress when the seeded params are wrong, motivating human-in-the-loop review of AI-generated BKT params before a lesson is published, or periodic re-estimation from real response data.
