"""
Scaffold Resolver: Maps P(mastery) to scaffold level and allowed GenUI components.
"""
from dataclasses import dataclass


SCAFFOLD_LEVELS = [
    {"level": 0, "name": "novice", "range": (0.0, 0.2), "description": "Complete beginner — full guided walkthrough"},
    {"level": 1, "name": "developing", "range": (0.2, 0.4), "description": "Some awareness — structured scaffold"},
    {"level": 2, "name": "approaching", "range": (0.4, 0.6), "description": "Partial understanding — hints on request"},
    {"level": 3, "name": "proficient", "range": (0.6, 0.8), "description": "Good understanding — practice focus"},
    {"level": 4, "name": "mastered", "range": (0.8, 1.0), "description": "Expert — Socratic challenge mode"},
]

COMPONENT_CATALOG: dict[int, list[str]] = {
    0: ["StepByStep", "HintCard", "FormulaCard", "AnalogyCard"],
    1: ["StepByStep", "HintCard", "FormulaCard", "ConceptDiagram"],
    2: ["ConceptDiagram", "FormulaCard", "HintCard", "PracticeExercise"],
    3: ["ConceptDiagram", "PracticeExercise", "ProofWalkthrough"],
    4: ["ConceptDiagram", "ExpertSummary", "ProofWalkthrough", "PracticeExercise"],
}


@dataclass
class ScaffoldDecision:
    level: int
    level_name: str
    allowed_components: list[str]
    p_mastery: float
    description: str


class ScaffoldResolver:
    def resolve(self, p_mastery: float) -> ScaffoldDecision:
        """Maps P(mastery) to scaffold level and allowed components."""
        level_info = SCAFFOLD_LEVELS[0]
        for sl in SCAFFOLD_LEVELS:
            low, high = sl["range"]
            if low <= p_mastery < high:
                level_info = sl
                break
        else:
            if p_mastery >= 0.8:
                level_info = SCAFFOLD_LEVELS[4]

        level = level_info["level"]
        components = COMPONENT_CATALOG[level]

        return ScaffoldDecision(
            level=level,
            level_name=level_info["name"],
            allowed_components=components,
            p_mastery=p_mastery,
            description=level_info["description"],
        )
