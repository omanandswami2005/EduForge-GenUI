"""Component catalog — maps scaffold levels to allowed GenUI components."""

COMPONENT_CATALOG: dict[int, list[str]] = {
    0: ["StepByStep", "HintCard", "FormulaCard", "AnalogyCard"],
    1: ["StepByStep", "HintCard", "FormulaCard", "ConceptDiagram"],
    2: ["ConceptDiagram", "FormulaCard", "HintCard", "PracticeExercise"],
    3: ["ConceptDiagram", "PracticeExercise", "ProofWalkthrough"],
    4: ["ConceptDiagram", "ExpertSummary", "ProofWalkthrough", "PracticeExercise"],
}

LEVEL_NAMES = ["novice", "developing", "approaching", "proficient", "mastered"]


def get_catalog_for_scaffold_level(level: int) -> list[str]:
    """Return allowed component names for a given scaffold level."""
    return COMPONENT_CATALOG.get(level, COMPONENT_CATALOG[2])


def get_system_prompt_fragment(level: int) -> str:
    """Return a system prompt fragment describing behavioral rules for this level."""
    fragments = {
        0: "Use simple language, step-by-step explanations, and real-world analogies. Never assume prior knowledge.",
        1: "Use clear explanations with some technical terms. Provide worked examples and diagrams with partial labels.",
        2: "Focus on application and connections. Use diagrams and practice exercises. Technical language is fine.",
        3: "Minimal scaffolding. Focus on edge cases, synthesis, and multi-step problem solving.",
        4: "Socratic method only. Ask leading questions. Never give direct answers. Challenge with expert-level problems.",
    }
    return fragments.get(level, fragments[2])
