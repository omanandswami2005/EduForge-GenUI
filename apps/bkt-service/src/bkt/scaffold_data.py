"""
GENERATED FILE — DO NOT EDIT BY HAND.
Source: config/scaffold-levels.json
Regenerate: python3 scripts/codegen/generate_scaffold_levels.py
"""

MASTERY_THRESHOLD = 0.95

SCAFFOLD_LEVELS = [
    {"level": 0, "name": "novice", "range": (0.0, 0.2), "description": "Complete beginner — full guided walkthrough"},
    {"level": 1, "name": "developing", "range": (0.2, 0.4), "description": "Some awareness — structured scaffold with hints"},
    {"level": 2, "name": "approaching", "range": (0.4, 0.6), "description": "Partial understanding — hints available on request"},
    {"level": 3, "name": "proficient", "range": (0.6, 0.8), "description": "Good understanding — minimal scaffold, practice focus"},
    {"level": 4, "name": "mastered", "range": (0.8, 1.0), "description": "Expert — challenge mode, Socratic only"},
]

COMPONENT_CATALOG: dict[int, list[str]] = {
    0: ["StepByStep", "HintCard", "FormulaCard", "AnalogyCard"],
    1: ["StepByStep", "HintCard", "FormulaCard", "ConceptDiagram"],
    2: ["ConceptDiagram", "FormulaCard", "HintCard", "PracticeExercise"],
    3: ["ConceptDiagram", "PracticeExercise", "ProofWalkthrough"],
    4: ["ConceptDiagram", "ExpertSummary", "ProofWalkthrough", "PracticeExercise"],
}
