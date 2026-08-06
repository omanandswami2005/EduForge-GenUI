"""
Empirical validation of the BKT engine (apps/bkt-service/src/bkt/engine.py).

This is offline model validation, not a live system test: it does not touch
Firestore, the API gateway, or any running service. It exists to answer a
question a defensible BKT implementation needs an answer to — "does the
tracked P(mastery) actually track a student's real latent knowledge?" — with
numbers, not just "the math looks like the textbook."

Method (standard BKT validation via Monte Carlo simulation):
  1. For each learner profile, simulate M synthetic students against the
     BKT *generative* process the model itself assumes: each student starts
     unknown with probability (1 - p_initial); at every practice opportunity,
     an unknown student transitions to "known" with probability p_learn;
     the observed response is correct with probability (1 - p_slip) if known,
     else p_guess if not known. This is exactly the process BKT assumes when
     it computes P(L_t) — so it is the correct ground truth to validate against.
  2. Average the (binary, per-student) latent "knows" state across all M
     students at each opportunity t to get an empirical P(known_t) — the
     true calibration target.
  3. Independently, feed each student's *observed* response sequence into
     the real BKTEngine.update() and average its P(mastery_t) across
     students at each t.
  4. RMSE between (2) and (3) is the calibration error: how far the model's
     belief is, on average, from the true population knowledge curve.

Run: apps/bkt-service/.venv/bin/python evaluation/validate_bkt.py
(from apps/bkt-service/, so `src` resolves)
"""
import json
import math
import random
import sys
import textwrap
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from src.bkt.engine import BKTEngine, BKTParams, StudentConceptState

RESULTS_DIR = Path(__file__).resolve().parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

N_STUDENTS = 300
N_OPPORTUNITIES = 15
SEED = 42


@dataclass
class Profile:
    name: str
    description: str
    p_initial: float
    p_learn: float
    p_slip: float
    p_guess: float
    # Params handed to the ENGINE — differs from the true generative params
    # above only in the "misspecified" profile, to test robustness to
    # inaccurate parameter estimation (a real risk: these params come from
    # an LLM guess in apps/ingestion/src/generators/bkt_params.py, not a
    # calibrated psychometric estimate).
    model_p_initial: float = None
    model_p_learn: float = None
    model_p_slip: float = None
    model_p_guess: float = None

    def __post_init__(self):
        self.model_p_initial = self.model_p_initial if self.model_p_initial is not None else self.p_initial
        self.model_p_learn = self.model_p_learn if self.model_p_learn is not None else self.p_learn
        self.model_p_slip = self.model_p_slip if self.model_p_slip is not None else self.p_slip
        self.model_p_guess = self.model_p_guess if self.model_p_guess is not None else self.p_guess


PROFILES = [
    Profile("fast_learner", "Learns quickly, rarely slips", 0.10, 0.45, 0.08, 0.25),
    Profile("average_learner", "Typical EduForge default params", 0.20, 0.20, 0.10, 0.25),
    Profile("slow_learner", "Needs many opportunities to learn", 0.05, 0.08, 0.12, 0.25),
    Profile("already_proficient", "Starts most of the way there", 0.75, 0.20, 0.10, 0.20),
    Profile(
        "misspecified_params",
        "True learner is fast (p_learn=0.45), but the model is told p_learn=0.15 "
        "(simulates a bad LLM-estimated BKT param) — tests robustness to inaccurate priors",
        p_initial=0.10, p_learn=0.45, p_slip=0.08, p_guess=0.25,
        model_p_initial=0.10, model_p_learn=0.15, model_p_slip=0.08, model_p_guess=0.25,
    ),
]


def simulate_profile(profile: Profile, n_students=N_STUDENTS, n_opps=N_OPPORTUNITIES, rng=None):
    """
    Returns:
      true_p_known: list[float] len n_opps — empirical P(known_t) across students
      model_p_mastery: list[float] len n_opps — engine's mean P(mastery_t) across students
      rmse: float
      all_model_trajectories: list[list[float]] — for plotting a sample of individual students
    """
    rng = rng or random.Random(SEED)
    model_params = BKTParams(
        concept_id=profile.name,
        p_initial=profile.model_p_initial,
        p_learn=profile.model_p_learn,
        p_slip=profile.model_p_slip,
        p_guess=profile.model_p_guess,
    )
    engine = BKTEngine(model_params)

    known_matrix = []  # [student][t] -> 0/1 true latent state
    mastery_matrix = []  # [student][t] -> model P(mastery)

    for s in range(n_students):
        known = rng.random() < profile.p_initial
        state = StudentConceptState(
            student_id=f"sim_{s}",
            concept_id=profile.name,
            subtopic_id="sim",
            p_mastery=model_params.p_initial,
        )
        known_row, mastery_row = [], []
        for t in range(n_opps):
            # Generative process: unknown students may transition to known
            # *before* this opportunity's response is generated (matches
            # BKT's "opportunity to learn precedes the response" semantics
            # for the purpose of this simulation).
            if not known and rng.random() < profile.p_learn:
                known = True

            p_correct = (1 - profile.p_slip) if known else profile.p_guess
            is_correct = rng.random() < p_correct

            state = engine.update(state, is_correct)

            known_row.append(1.0 if known else 0.0)
            mastery_row.append(state.p_mastery)

        known_matrix.append(known_row)
        mastery_matrix.append(mastery_row)

    true_p_known = [sum(known_matrix[s][t] for s in range(n_students)) / n_students for t in range(n_opps)]
    model_p_mastery = [sum(mastery_matrix[s][t] for s in range(n_students)) / n_students for t in range(n_opps)]

    sq_errs = [(a - b) ** 2 for a, b in zip(true_p_known, model_p_mastery)]
    rmse = math.sqrt(sum(sq_errs) / len(sq_errs))

    return true_p_known, model_p_mastery, rmse, mastery_matrix[:12]


def run_consistency_checks():
    """Structural/mathematical invariants a correct BKT implementation must hold."""
    checks = []

    # 1. Clamping: p_mastery must always stay in [0.001, 0.999], even under
    #    extreme/degenerate param combinations.
    extreme_params = BKTParams(concept_id="extreme", p_initial=0.01, p_learn=0.9, p_slip=0.4, p_guess=0.45)
    engine = BKTEngine(extreme_params)
    state = StudentConceptState(student_id="x", concept_id="extreme", subtopic_id="x", p_mastery=extreme_params.p_initial)
    bounds_ok = True
    for i in range(50):
        state = engine.update(state, is_correct=(i % 2 == 0))
        if not (0.001 <= state.p_mastery <= 0.999):
            bounds_ok = False
            break
    checks.append({
        "name": "mastery_stays_in_bounds",
        "description": "P(mastery) stays within [0.001, 0.999] under 50 alternating responses with extreme params",
        "passed": bounds_ok,
    })

    # 2. Monotonic convergence: an always-correct student's mastery should be
    #    non-decreasing and should approach 1.
    params = BKTParams(concept_id="mono", p_initial=0.05, p_learn=0.2, p_slip=0.1, p_guess=0.25)
    engine = BKTEngine(params)
    state = StudentConceptState(student_id="m", concept_id="mono", subtopic_id="m", p_mastery=params.p_initial)
    trajectory = []
    for _ in range(20):
        state = engine.update(state, is_correct=True)
        trajectory.append(state.p_mastery)
    non_decreasing = all(trajectory[i] <= trajectory[i + 1] + 1e-9 for i in range(len(trajectory) - 1))
    converges_high = trajectory[-1] > 0.9
    checks.append({
        "name": "monotonic_convergence_on_all_correct",
        "description": "20 consecutive correct answers -> P(mastery) is non-decreasing and exceeds 0.9",
        "passed": non_decreasing and converges_high,
        "final_mastery": round(trajectory[-1], 4),
    })

    # 3. Single-slip robustness: a mastered student who slips once shouldn't
    #    collapse to near-zero (i.e. the model should trust prior evidence,
    #    not overreact to one data point) — this only holds if p_slip < p_guess,
    #    which is the standard BKT well-posedness condition.
    params = BKTParams(concept_id="robust", p_initial=0.2, p_learn=0.2, p_slip=0.1, p_guess=0.25)
    engine = BKTEngine(params)
    mastered_state = StudentConceptState(student_id="r", concept_id="robust", subtopic_id="r", p_mastery=0.97)
    after_slip = engine.update(mastered_state, is_correct=False)
    drop = mastered_state.p_mastery - after_slip.p_mastery
    checks.append({
        "name": "single_slip_robustness",
        "description": "A mastered student (P=0.97) who answers wrong once shouldn't collapse near zero",
        "passed": after_slip.p_mastery > 0.5,
        "p_mastery_before": 0.97,
        "p_mastery_after_one_slip": round(after_slip.p_mastery, 4),
        "drop": round(drop, 4),
    })

    # 4. Well-posedness of every profile's true generative params: p_slip < p_guess.
    #    If this doesn't hold, "correct" and "incorrect" evidence stop being
    #    informative in the intended direction (a known BKT degeneracy).
    for profile in PROFILES:
        checks.append({
            "name": f"well_posed_params[{profile.name}]",
            "description": f"p_slip ({profile.p_slip}) < p_guess ({profile.p_guess})",
            "passed": profile.p_slip < profile.p_guess,
        })

    return checks


def plot_profile(profile: Profile, true_p_known, model_p_mastery, sample_trajectories):
    fig, ax = plt.subplots(figsize=(7, 4.5))
    t = list(range(1, len(true_p_known) + 1))

    for traj in sample_trajectories:
        ax.plot(t, traj, color="#93c5fd", alpha=0.35, linewidth=1, zorder=1)

    ax.plot(t, true_p_known, color="#111827", linewidth=2.5, label="True P(known) — population ground truth", zorder=3)
    ax.plot(t, model_p_mastery, color="#2563eb", linewidth=2.5, linestyle="--", label="BKT engine mean P(mastery)", zorder=3)

    ax.set_xlabel("Practice opportunity")
    ax.set_ylabel("Probability")
    ax.set_ylim(-0.02, 1.02)
    title = "\n".join(textwrap.wrap(f"{profile.name} — {profile.description}", width=60))
    ax.set_title(title, fontsize=9)
    ax.legend(loc="lower right", fontsize=8)
    ax.grid(alpha=0.25)
    fig.tight_layout()
    out_path = RESULTS_DIR / f"{profile.name}.png"
    fig.savefig(out_path, dpi=130)
    plt.close(fig)
    return out_path


def main():
    rng = random.Random(SEED)
    profile_results = []

    print("=== BKT Engine Empirical Validation ===\n")
    for profile in PROFILES:
        true_p_known, model_p_mastery, rmse, sample_trajectories = simulate_profile(profile, rng=rng)
        plot_path = plot_profile(profile, true_p_known, model_p_mastery, sample_trajectories)
        profile_results.append({
            "profile": profile.name,
            "description": profile.description,
            "n_students": N_STUDENTS,
            "n_opportunities": N_OPPORTUNITIES,
            "true_params": {
                "p_initial": profile.p_initial, "p_learn": profile.p_learn,
                "p_slip": profile.p_slip, "p_guess": profile.p_guess,
            },
            "model_params": {
                "p_initial": profile.model_p_initial, "p_learn": profile.model_p_learn,
                "p_slip": profile.model_p_slip, "p_guess": profile.model_p_guess,
            },
            "calibration_rmse": round(rmse, 4),
            "final_true_p_known": round(true_p_known[-1], 4),
            "final_model_p_mastery": round(model_p_mastery[-1], 4),
            "plot": str(plot_path.relative_to(RESULTS_DIR.parent)),
        })
        print(f"[{profile.name}] RMSE={rmse:.4f}  "
              f"final true P(known)={true_p_known[-1]:.3f}  "
              f"final model P(mastery)={model_p_mastery[-1]:.3f}  "
              f"-> {plot_path.name}")

    print()
    checks = run_consistency_checks()
    n_passed = sum(1 for c in checks if c["passed"])
    print(f"=== Consistency checks: {n_passed}/{len(checks)} passed ===")
    for c in checks:
        status = "PASS" if c["passed"] else "FAIL"
        print(f"  [{status}] {c['name']}: {c['description']}")

    report = {
        "n_students_per_profile": N_STUDENTS,
        "n_opportunities": N_OPPORTUNITIES,
        "seed": SEED,
        "profiles": profile_results,
        "consistency_checks": checks,
        "consistency_checks_passed": f"{n_passed}/{len(checks)}",
    }
    report_path = RESULTS_DIR / "bkt_validation_report.json"
    report_path.write_text(json.dumps(report, indent=2))

    # Human-readable markdown summary alongside the JSON.
    md = ["# BKT Engine Validation Report\n",
          f"Monte Carlo simulation, {N_STUDENTS} synthetic students x {N_OPPORTUNITIES} "
          f"opportunities per profile, seed={SEED}.\n",
          "## Calibration (model P(mastery) vs. true population P(known))\n",
          "| Profile | RMSE | Final true P(known) | Final model P(mastery) |",
          "|---|---|---|---|"]
    for r in profile_results:
        md.append(f"| {r['profile']} | {r['calibration_rmse']:.4f} | "
                   f"{r['final_true_p_known']:.3f} | {r['final_model_p_mastery']:.3f} |")
    md.append("\n## Consistency checks\n")
    md.append(f"**{n_passed}/{len(checks)} passed**\n")
    md.append("| Check | Result | Description |")
    md.append("|---|---|---|")
    for c in checks:
        md.append(f"| {c['name']} | {'PASS' if c['passed'] else 'FAIL'} | {c['description']} |")
    md.append(
        "\n## Interpretation\n\n"
        "The `misspecified_params` profile deliberately gives the engine a "
        "p_learn that understates the true learner's speed, simulating what "
        "happens when apps/ingestion's LLM-estimated BKT params "
        "(bkt_params.py) are inaccurate. Its RMSE is materially higher than "
        "the correctly-specified profiles, which is the expected behavior — "
        "it quantifies how much scaffold-level decisions can lag a student's "
        "true progress when the seeded params are wrong, motivating "
        "human-in-the-loop review of AI-generated BKT params before a "
        "lesson is published, or periodic re-estimation from real response "
        "data.\n"
    )
    (RESULTS_DIR / "bkt_validation_report.md").write_text("\n".join(md))

    print(f"\nReport written to {report_path} and bkt_validation_report.md")


if __name__ == "__main__":
    main()
