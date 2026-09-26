"""Teacher dashboard aggregation — pure functions over already-fetched data.

Kept free of Firestore so the math is unit-testable; the router gathers the
per-lesson class analytics / misconception insights and hands them here.
"""

# Same bands as the frontend's masteryTone() (apps/web/src/lib/design.ts), so
# counts on the dashboard match the colors in the heatmap.
MASTERED_AT = 0.95
PROFICIENT_ABOVE = 0.6
DEVELOPING_ABOVE = 0.3

TOP_N = 5


def mastery_band(p_mastery: float, mastered: bool = False) -> str:
    if mastered or p_mastery >= MASTERED_AT:
        return "mastered"
    if p_mastery > PROFICIENT_ABOVE:
        return "proficient"
    if p_mastery > DEVELOPING_ABOVE:
        return "developing"
    return "struggling"


def _avg(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def build_teacher_overview(
    lessons: list[dict],
    class_by_lesson: dict[str, dict],
    insights_by_lesson: dict[str, dict],
) -> dict:
    """
    lessons:            teacher's lesson docs ({id, title, subject, status, ingestion})
    class_by_lesson:    lesson_id -> get_class_analytics() result
    insights_by_lesson: lesson_id -> get_misconception_insights() result
    """
    status_counts = {"published": 0, "processing": 0, "failed": 0, "draft": 0}
    distribution = {"struggling": 0, "developing": 0, "proficient": 0, "mastered": 0}
    all_students: set[str] = set()
    all_masteries: list[float] = []
    total_subtopics = total_mcqs = total_responses = total_wrong = 0

    lesson_rows: list[dict] = []
    student_rows: list[dict] = []
    concept_rows: list[dict] = []
    misconception_rows: list[dict] = []

    for lesson in lessons:
        lid = lesson["id"]
        status = lesson.get("status", "draft")
        status_counts[status] = status_counts.get(status, 0) + 1
        ingestion = lesson.get("ingestion") or {}
        if ingestion.get("step") == "complete":
            total_subtopics += ingestion.get("subtopicsFound") or 0
            total_mcqs += ingestion.get("mcqsGenerated") or 0

        cls = class_by_lesson.get(lid) or {}
        matrix: dict = cls.get("matrix") or {}
        names = {s["id"]: s.get("name", s["id"]) for s in cls.get("students", [])}
        lesson_masteries: list[float] = []
        per_concept: dict[str, list[float]] = {}

        for sid, concepts in matrix.items():
            all_students.add(sid)
            student_masteries = []
            for concept_id, state in concepts.items():
                p = float(state.get("pMastery", 0))
                distribution[mastery_band(p, state.get("mastered", False))] += 1
                student_masteries.append(p)
                per_concept.setdefault(concept_id, []).append(p)
            lesson_masteries.extend(student_masteries)
            if student_masteries:
                student_rows.append({
                    "id": sid,
                    "name": names.get(sid, sid),
                    "lessonId": lid,
                    "lessonTitle": lesson.get("title", lid),
                    "avgMastery": _avg(student_masteries),
                    "conceptsTracked": len(student_masteries),
                })
        all_masteries.extend(lesson_masteries)

        for concept_id, ps in per_concept.items():
            concept_rows.append({
                "conceptId": concept_id,
                "lessonId": lid,
                "lessonTitle": lesson.get("title", lid),
                "avgMastery": _avg(ps),
                "students": len(ps),
            })

        ins = insights_by_lesson.get(lid) or {}
        responses = ins.get("responsesAnalyzed", 0)
        wrong = ins.get("wrongAnswers", 0)
        total_responses += responses
        total_wrong += wrong
        for concept in ins.get("byConcept", []):
            for m in concept.get("topMisconceptions", []):
                misconception_rows.append({
                    "conceptId": concept["conceptId"],
                    "text": m["text"],
                    "count": m["count"],
                    "lessonId": lid,
                    "lessonTitle": lesson.get("title", lid),
                })

        lesson_rows.append({
            "id": lid,
            "title": lesson.get("title", lid),
            "subject": lesson.get("subject", ""),
            "status": status,
            "ingestion": ingestion or None,
            "students": len(matrix),
            "avgMastery": _avg(lesson_masteries),
            "responses": responses,
            "accuracy": (responses - wrong) / responses if responses else None,
        })

    student_rows.sort(key=lambda r: r["avgMastery"])
    concept_rows.sort(key=lambda r: r["avgMastery"])
    misconception_rows.sort(key=lambda r: r["count"], reverse=True)

    return {
        "totals": {
            "lessons": len(lessons),
            **status_counts,
            "students": len(all_students),
            "subtopics": total_subtopics,
            "mcqs": total_mcqs,
            "responses": total_responses,
            "accuracy": (total_responses - total_wrong) / total_responses if total_responses else None,
            "avgMastery": _avg(all_masteries),
            "conceptStates": len(all_masteries),
        },
        "masteryDistribution": distribution,
        "lessons": lesson_rows,
        # Only surface students/concepts that are actually below proficient
        "strugglingStudents": [r for r in student_rows if r["avgMastery"] <= PROFICIENT_ABOVE][:TOP_N],
        "weakConcepts": [r for r in concept_rows if r["avgMastery"] <= PROFICIENT_ABOVE][:TOP_N],
        "topMisconceptions": misconception_rows[:TOP_N],
    }
