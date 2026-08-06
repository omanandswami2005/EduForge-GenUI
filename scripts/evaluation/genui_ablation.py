#!/usr/bin/env python3
"""
Ablation study: does BKT-driven scaffolding actually change GenUI content
complexity, or is the scaffold-level system just decoration around content
an LLM would produce anyway?

Three conditions per concept, all using the same underlying model
(GROQ_GENUI_MODEL) so the only variable is the prompting strategy:

  A. scaffolded_novice  — the REAL running system, /api/genui with
                           forceScaffoldLevel=0 (novice). Exercises the
                           actual production prompt-building code
                           (buildGenUIPrompt in genui-schema.ts), not a
                           reimplementation of it.
  B. scaffolded_mastered — same real endpoint, forceScaffoldLevel=4 (expert).
  C. unscaffolded_control — a naive "explain this concept" prompt sent
                             directly to Groq, no scaffold-level constraints,
                             no allowed-component restriction, no pedagogical
                             rules. Represents what a non-adaptive system
                             (an LLM tutor with no BKT gating) would produce —
                             the actual control this project's thesis needs.

For each response, extract all text and score it with two standard,
formula-based readability metrics (Flesch Reading Ease, Flesch-Kincaid
Grade Level) — implemented directly (no textstat dependency), plus average
sentence/word length. Compare grade level across conditions.

Requires: the Next.js dev server running locally (for conditions A/B) and
GROQ_API_KEY set (for condition C). Does not require the BKT/API/ingestion
services or Firestore — route.ts falls back to defaults when the BKT
service is unreachable, and forceScaffoldLevel bypasses the BKT lookup
entirely anyway.

Run: python3 scripts/evaluation/genui_ablation.py
"""
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent.parent
RESULTS_DIR = Path(__file__).resolve().parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

GENUI_URL = os.environ.get("GENUI_URL", "http://localhost:3000/api/genui")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_GENUI_MODEL", "openai/gpt-oss-120b")

CONCEPTS = [
    {"conceptId": "inertia", "subtopicTitle": "Inertia and Newton's First Law"},
    {"conceptId": "recursion", "subtopicTitle": "Recursion in Programming"},
    {"conceptId": "photosynthesis_light_reactions", "subtopicTitle": "Photosynthesis: Light-Dependent Reactions"},
]


def post_json(url, payload, headers=None, timeout=60, retry_on_429=2):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={
            "Content-Type": "application/json",
            # Groq's edge (Cloudflare) blocks urllib's default User-Agent
            # outright (403 / "error code: 1010") — a browser-ish UA is
            # enough to pass.
            "User-Agent": "curl/8.7.1",
            **(headers or {}),
        },
    )
    for attempt in range(retry_on_429 + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retry_on_429:
                wait = int(e.headers.get("Retry-After", 5)) if e.headers else 5
                print(f"    (rate limited, waiting {wait}s)")
                time.sleep(wait)
                continue
            raise


def call_genui_route(concept, scaffold_level, attempts=3):
    """
    Groq's structured-output validation occasionally rejects a generation
    entirely at higher scaffold levels (more/larger required components
    push against the discriminated-union schema's complexity) — the server
    retries across its own model fallback chain, but a request can still
    exhaust all of them. Retrying the whole request here is a pragmatic,
    evaluation-script-local fix; making streamWithFallback itself recover
    from a validation failure after the first chunk (not just a network/
    connection failure before it) is real follow-up work, tracked
    separately as resilience hardening.
    """
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            body = post_json(GENUI_URL, {
                "conceptId": concept["conceptId"],
                "subtopicId": "eval",
                "lessonId": "eval",
                "studentId": "eval_student",
                "subtopicTitle": concept["subtopicTitle"],
                "forceScaffoldLevel": scaffold_level,
            })
            if not body.strip():
                raise ValueError("empty response body")
            parsed = json.loads(body)
            return extract_text(parsed)
        except Exception as e:
            last_error = e
            if attempt < attempts:
                print(f"    (attempt {attempt} failed: {e} — retrying)")
    raise last_error


def call_groq_control(concept):
    prompt = (
        f"Explain {concept['subtopicTitle']} to a student. "
        "Provide a clear, complete educational explanation."
    )
    body = post_json(
        "https://api.groq.com/openai/v1/chat/completions",
        {"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}]},
        headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
    )
    parsed = json.loads(body)
    return parsed["choices"][0]["message"]["content"]


def extract_text(obj):
    """Recursively pull every string value out of the GenUI component JSON."""
    texts = []
    if isinstance(obj, str):
        texts.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            texts.extend(extract_text(v))
    elif isinstance(obj, list):
        for v in obj:
            texts.extend(extract_text(v))
    return texts


def join_text_fragments(texts: list) -> str:
    """
    Components like ExpertSummary hold arrays of short, punctuation-less
    phrases (key_ideas, common_pitfalls, ...) — joining those with a bare
    space collapses many bullet-style fragments into what looks to a
    sentence-boundary regex like one giant run-on sentence, wildly
    distorting avg-sentence-length-based readability formulas. Ensure every
    fragment ends with terminal punctuation before joining so each is
    counted as its own sentence, matching how it actually reads in the UI.
    """
    fixed = []
    for t in texts:
        t = t.strip()
        if not t:
            continue
        if t[-1] not in ".!?":
            t += "."
        fixed.append(t)
    return " ".join(fixed)


# ---- Readability (standard formulas, no external dependency) ----

VOWEL_GROUPS = re.compile(r"[aeiouyAEIOUY]+")


def count_syllables(word: str) -> int:
    word = re.sub(r"[^a-zA-Z]", "", word)
    if not word:
        return 0
    groups = VOWEL_GROUPS.findall(word)
    count = len(groups)
    if word.lower().endswith("e") and count > 1:
        count -= 1
    return max(1, count)


def readability(text: str) -> dict:
    # Strip LaTeX/markdown noise that would distort word/sentence counts.
    clean = re.sub(r"\$[^$]*\$", " ", text)
    clean = re.sub(r"[#*_`]", "", clean)

    sentences = [s for s in re.split(r"[.!?]+", clean) if s.strip()]
    words = re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", clean)

    n_sentences = max(1, len(sentences))
    n_words = max(1, len(words))
    n_syllables = sum(count_syllables(w) for w in words)

    avg_sentence_len = n_words / n_sentences
    avg_syllables_per_word = n_syllables / n_words
    avg_word_len = sum(len(w) for w in words) / n_words

    flesch_reading_ease = 206.835 - 1.015 * avg_sentence_len - 84.6 * avg_syllables_per_word
    flesch_kincaid_grade = 0.39 * avg_sentence_len + 11.8 * avg_syllables_per_word - 15.59

    return {
        "n_sentences": n_sentences,
        "n_words": n_words,
        "avg_sentence_length": round(avg_sentence_len, 2),
        "avg_word_length": round(avg_word_len, 2),
        "flesch_reading_ease": round(flesch_reading_ease, 1),
        "flesch_kincaid_grade": round(flesch_kincaid_grade, 1),
    }


def plot_results(results, condition_labels):
    concepts = [r["concept"] for r in results]
    colors = {"scaffolded_novice": "#22c55e", "scaffolded_mastered": "#2563eb", "unscaffolded_control": "#9ca3af"}
    display_names = {"scaffolded_novice": "Novice (scaffolded)", "scaffolded_mastered": "Mastered (scaffolded)",
                      "unscaffolded_control": "Unscaffolded control"}

    fig, ax = plt.subplots(figsize=(9, 5))
    x = range(len(concepts))
    width = 0.25
    for i, label in enumerate(condition_labels):
        grades = [r["conditions"].get(label, {}).get("flesch_kincaid_grade") for r in results]
        offset = (i - 1) * width
        positions = [xi + offset for xi in x]
        values = [g if g is not None else 0 for g in grades]
        ax.bar(positions, values, width=width, label=display_names[label], color=colors[label])

    ax.set_xticks(list(x))
    ax.set_xticklabels([c if len(c) < 30 else c[:27] + "..." for c in concepts], rotation=15, ha="right", fontsize=9)
    ax.set_ylabel("Flesch-Kincaid Grade Level")
    ax.set_title("GenUI content complexity by condition (lower = simpler)")
    ax.legend(fontsize=9)
    ax.grid(axis="y", alpha=0.25)
    fig.tight_layout()
    out_path = RESULTS_DIR / "genui_ablation_grade_levels.png"
    fig.savefig(out_path, dpi=130)
    plt.close(fig)
    return out_path


def check_server():
    try:
        urllib.request.urlopen(GENUI_URL.rsplit("/api", 1)[0], timeout=5)
    except urllib.error.URLError as e:
        print(f"ERROR: can't reach the Next.js dev server at {GENUI_URL} ({e}).")
        print("Start it first: cd apps/web && pnpm dev")
        sys.exit(1)


def main():
    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY not set (needed for the unscaffolded control condition).")
        sys.exit(1)
    check_server()

    results = []
    print("=== GenUI Scaffolding Ablation ===\n")
    for concept in CONCEPTS:
        print(f"[{concept['conceptId']}]")
        row = {"concept": concept["subtopicTitle"], "conditions": {}}

        for label, level in [("scaffolded_novice", 0), ("scaffolded_mastered", 4)]:
            try:
                texts = call_genui_route(concept, level)
                joined = join_text_fragments(texts)
                metrics = readability(joined)
                row["conditions"][label] = metrics
                print(f"  {label}: grade={metrics['flesch_kincaid_grade']}  "
                      f"words={metrics['n_words']}  avg_sentence_len={metrics['avg_sentence_length']}")
            except Exception as e:
                print(f"  {label}: FAILED ({e})")
                row["conditions"][label] = {"error": str(e)}
            time.sleep(3)  # stay well under Groq's free-tier rate limit

        try:
            control_text = call_groq_control(concept)
            metrics = readability(control_text)
            row["conditions"]["unscaffolded_control"] = metrics
            print(f"  unscaffolded_control: grade={metrics['flesch_kincaid_grade']}  "
                  f"words={metrics['n_words']}  avg_sentence_len={metrics['avg_sentence_length']}")
        except Exception as e:
            print(f"  unscaffolded_control: FAILED ({e})")
            row["conditions"]["unscaffolded_control"] = {"error": str(e)}
        time.sleep(3)

        results.append(row)
        print()

    # Averages across concepts, per condition (only over successful calls)
    condition_labels = ["scaffolded_novice", "scaffolded_mastered", "unscaffolded_control"]
    averages = {}
    for label in condition_labels:
        grades = [r["conditions"][label]["flesch_kincaid_grade"]
                  for r in results if "flesch_kincaid_grade" in r["conditions"].get(label, {})]
        if grades:
            averages[label] = round(sum(grades) / len(grades), 2)

    print("=== Average Flesch-Kincaid grade level across concepts ===")
    for label, avg in averages.items():
        print(f"  {label}: {avg}")

    plot_path = plot_results(results, condition_labels)
    print(f"Chart written to {plot_path}")

    gap = None
    if "scaffolded_novice" in averages and "scaffolded_mastered" in averages:
        gap = round(averages["scaffolded_mastered"] - averages["scaffolded_novice"], 2)
        print(f"\nNovice -> Mastered grade-level gap: {gap} "
              f"({'scaffolding measurably changes complexity' if gap and gap > 0 else 'no measurable effect'})")

    report = {
        "genui_url": GENUI_URL,
        "model": GROQ_MODEL,
        "concepts": results,
        "average_grade_by_condition": averages,
        "novice_to_mastered_grade_gap": gap,
    }
    (RESULTS_DIR / "genui_ablation_report.json").write_text(json.dumps(report, indent=2))

    md = ["# GenUI Scaffolding Ablation Report\n",
          f"Model: `{GROQ_MODEL}`. Readability via Flesch-Kincaid Grade Level "
          "(higher = harder to read / more advanced).\n",
          f"![Grade levels by condition]({plot_path.name})\n",
          "| Concept | Novice (scaffolded) | Mastered (scaffolded) | Unscaffolded control |",
          "|---|---|---|---|"]
    for r in results:
        c = r["conditions"]
        def g(label):
            return c.get(label, {}).get("flesch_kincaid_grade", "—")
        md.append(f"| {r['concept']} | {g('scaffolded_novice')} | {g('scaffolded_mastered')} | {g('unscaffolded_control')} |")
    md.append(f"\n**Average grade level** — novice: {averages.get('scaffolded_novice', '—')}, "
               f"mastered: {averages.get('scaffolded_mastered', '—')}, "
               f"unscaffolded control: {averages.get('unscaffolded_control', '—')}\n")
    if gap is not None:
        md.append(f"\nNovice -> mastered grade-level gap: **{gap}**. "
                   "A positive gap is the core claim under test: that BKT-driven "
                   "scaffolding produces measurably simpler content for a novice "
                   "than for a student who has mastered the concept, using the "
                   "identical underlying model and topic. The unscaffolded "
                   "control shows what a non-adaptive system (no BKT gating) "
                   "would produce for the same topic — one grade level for "
                   "every student regardless of where they actually are.\n")
    (RESULTS_DIR / "genui_ablation_report.md").write_text("\n".join(md))
    print(f"\nReport written to {RESULTS_DIR / 'genui_ablation_report.json'} and genui_ablation_report.md")


if __name__ == "__main__":
    main()
