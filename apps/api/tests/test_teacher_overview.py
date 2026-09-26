"""Tests for the teacher dashboard aggregation (pure function, no Firestore)."""
from src.services.teacher_overview import build_teacher_overview, mastery_band


def test_mastery_bands_match_frontend_thresholds():
    assert mastery_band(0.2) == "struggling"
    assert mastery_band(0.3) == "struggling"
    assert mastery_band(0.31) == "developing"
    assert mastery_band(0.61) == "proficient"
    assert mastery_band(0.95) == "mastered"
    assert mastery_band(0.1, mastered=True) == "mastered"


def test_overview_aggregates_across_lessons():
    lessons = [
        {"id": "L1", "title": "Physics", "status": "published",
         "ingestion": {"step": "complete", "subtopicsFound": 4, "mcqsGenerated": 60}},
        {"id": "L2", "title": "Draft", "status": "processing", "ingestion": {"step": "generating_mcqs"}},
    ]
    classes = {"L1": {
        "students": [{"id": "a", "name": "Alice"}, {"id": "b", "name": "Bob"}],
        "matrix": {
            "a": {"inertia": {"pMastery": 0.96, "mastered": False}, "mass": {"pMastery": 0.7}},
            "b": {"inertia": {"pMastery": 0.2}, "mass": {"pMastery": 0.4}},
        },
    }}
    insights = {"L1": {"responsesAnalyzed": 10, "wrongAnswers": 4, "byConcept": [
        {"conceptId": "inertia", "topMisconceptions": [{"text": "force keeps things moving", "count": 3}]},
    ]}}

    out = build_teacher_overview(lessons, classes, insights)
    t = out["totals"]

    assert t["lessons"] == 2 and t["published"] == 1 and t["processing"] == 1
    assert t["students"] == 2 and t["subtopics"] == 4 and t["mcqs"] == 60
    assert t["responses"] == 10 and abs(t["accuracy"] - 0.6) < 1e-9
    assert abs(t["avgMastery"] - (0.96 + 0.7 + 0.2 + 0.4) / 4) < 1e-9
    assert out["masteryDistribution"] == {"struggling": 1, "developing": 1, "proficient": 1, "mastered": 1}

    # Only Bob (avg 0.3) is below proficient; Alice (0.83) is not flagged
    assert [s["name"] for s in out["strugglingStudents"]] == ["Bob"]
    # Weakest concept first: mass avg 0.55 < inertia avg 0.58 (both <= 0.6)
    assert [c["conceptId"] for c in out["weakConcepts"]] == ["mass", "inertia"]
    assert out["topMisconceptions"][0]["count"] == 3

    l2 = next(l for l in out["lessons"] if l["id"] == "L2")
    assert l2["students"] == 0 and l2["avgMastery"] is None and l2["accuracy"] is None


def test_overview_empty_teacher():
    out = build_teacher_overview([], {}, {})
    assert out["totals"]["lessons"] == 0
    assert out["totals"]["avgMastery"] is None and out["totals"]["accuracy"] is None
    assert out["strugglingStudents"] == [] and out["weakConcepts"] == []
