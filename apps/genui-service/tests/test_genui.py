"""
Tests for GenUI service — prompt builder, catalog, and endpoint structure.
"""
import pytest
from unittest.mock import MagicMock, patch

# Mock anthropic before importing
with patch.dict("sys.modules", {
    "anthropic": MagicMock(),
    "google.cloud.firestore": MagicMock(),
}):
    from src.genui.prompt_builder import GenUIPromptBuilder
    from src.genui.catalog import (
        COMPONENT_CATALOG,
        LEVEL_NAMES,
        get_catalog_for_scaffold_level,
        get_system_prompt_fragment,
    )


class TestComponentCatalog:
    def test_all_5_levels_exist(self):
        assert set(COMPONENT_CATALOG.keys()) == {0, 1, 2, 3, 4}

    def test_level_0_has_step_by_step(self):
        assert "StepByStep" in COMPONENT_CATALOG[0]

    def test_level_4_has_expert_summary(self):
        assert "ExpertSummary" in COMPONENT_CATALOG[4]

    def test_level_4_no_hint_card(self):
        assert "HintCard" not in COMPONENT_CATALOG[4]

    def test_all_levels_have_components(self):
        for level in range(5):
            assert len(COMPONENT_CATALOG[level]) >= 3

    def test_get_catalog_for_scaffold_level(self):
        for level in range(5):
            result = get_catalog_for_scaffold_level(level)
            assert result == COMPONENT_CATALOG[level]

    def test_get_catalog_invalid_level_returns_default(self):
        result = get_catalog_for_scaffold_level(99)
        assert result == COMPONENT_CATALOG[2]

    def test_level_names(self):
        assert LEVEL_NAMES == ["novice", "developing", "approaching", "proficient", "mastered"]

    def test_get_system_prompt_fragment(self):
        for level in range(5):
            fragment = get_system_prompt_fragment(level)
            assert isinstance(fragment, str)
            assert len(fragment) > 0


class TestPromptBuilder:
    def test_build_contains_allowed_components(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build(
            allowed_components=["StepByStep", "HintCard"],
            scaffold_level=0,
            p_mastery=0.1,
        )
        assert "StepByStep" in prompt
        assert "HintCard" in prompt

    def test_build_marks_forbidden_components(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build(
            allowed_components=["StepByStep"],
            scaffold_level=0,
            p_mastery=0.1,
        )
        assert "FORBIDDEN COMPONENTS" in prompt

    def test_build_includes_pedagogical_rules(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build(
            allowed_components=["StepByStep"],
            scaffold_level=0,
            p_mastery=0.1,
        )
        assert "NOVICE" in prompt

    def test_build_includes_mastery_value(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build(
            allowed_components=["StepByStep"],
            scaffold_level=2,
            p_mastery=0.55,
        )
        assert "0.55" in prompt

    def test_build_includes_misconception_when_provided(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build(
            allowed_components=["StepByStep"],
            scaffold_level=0,
            p_mastery=0.1,
            misconception={"type": "repeated_error", "explanation": "Student confuses mass and weight"},
        )
        assert "MISCONCEPTION DETECTED" in prompt
        assert "mass and weight" in prompt

    def test_build_tutor_prompt_exists(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build_tutor_prompt(
            concept_name="Newton's First Law",
            scaffold_level=1,
            p_mastery=0.3,
            allowed_components=["StepByStep", "HintCard"],
        )
        assert "Newton's First Law" in prompt
        assert isinstance(prompt, str)
        assert len(prompt) > 100

    def test_build_tutor_prompt_level_0(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build_tutor_prompt(
            concept_name="Inertia",
            scaffold_level=0,
            p_mastery=0.1,
            allowed_components=["StepByStep"],
        )
        assert "Novice" in prompt

    def test_build_tutor_prompt_level_4(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build_tutor_prompt(
            concept_name="Vector Calculus",
            scaffold_level=4,
            p_mastery=0.9,
            allowed_components=["ExpertSummary"],
        )
        assert "Mastered" in prompt

    def test_hard_constraints_present(self):
        builder = GenUIPromptBuilder()
        prompt = builder.build(
            allowed_components=["StepByStep"],
            scaffold_level=0,
            p_mastery=0.1,
        )
        assert "HARD CONSTRAINTS" in prompt
        assert "valid JSON" in prompt

    def test_all_8_component_schemas_exist(self):
        builder = GenUIPromptBuilder()
        expected = [
            "StepByStep", "HintCard", "FormulaCard", "ConceptDiagram",
            "AnalogyCard", "PracticeExercise", "ProofWalkthrough", "ExpertSummary",
        ]
        for comp in expected:
            assert comp in builder.COMPONENT_SCHEMAS
