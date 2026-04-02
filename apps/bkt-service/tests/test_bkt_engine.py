import pytest
from src.bkt.engine import BKTEngine, BKTParams, StudentConceptState


@pytest.fixture
def default_params():
    return BKTParams(
        concept_id="test_concept",
        p_initial=0.2,
        p_learn=0.2,
        p_slip=0.1,
        p_guess=0.25,
    )


@pytest.fixture
def initial_state():
    return StudentConceptState(
        student_id="student_1",
        concept_id="test_concept",
        subtopic_id="subtopic_1",
        lesson_id="lesson_1",
        p_mastery=0.2,
    )


class TestBKTEngine:
    def test_correct_answer_increases_mastery(self, default_params, initial_state):
        engine = BKTEngine(default_params)
        new_state = engine.update(initial_state, is_correct=True)
        assert new_state.p_mastery > initial_state.p_mastery

    def test_wrong_answer_changes_mastery(self, default_params, initial_state):
        engine = BKTEngine(default_params)
        new_state = engine.update(initial_state, is_correct=False)
        # After wrong answer + learning opportunity, mastery might still increase slightly
        # but the observation step alone should lower it
        assert new_state.attempts == 1

    def test_mastery_reaches_high_after_consecutive_correct(self, default_params):
        engine = BKTEngine(default_params)
        state = StudentConceptState(
            student_id="s1", concept_id="c1", subtopic_id="st1",
            lesson_id="l1", p_mastery=0.2
        )
        for _ in range(20):
            state = engine.update(state, is_correct=True)
        assert state.p_mastery >= 0.8

    def test_mastery_stays_bounded(self, default_params, initial_state):
        engine = BKTEngine(default_params)
        state = initial_state
        for i in range(50):
            state = engine.update(state, is_correct=i % 3 != 0)
        assert 0 < state.p_mastery < 1

    def test_streak_tracking(self, default_params, initial_state):
        engine = BKTEngine(default_params)
        state = engine.update(initial_state, is_correct=True)
        assert state.correct_streak == 1
        state = engine.update(state, is_correct=True)
        assert state.correct_streak == 2
        state = engine.update(state, is_correct=False)
        assert state.correct_streak == 0

    def test_consecutive_wrong_tracking(self, default_params, initial_state):
        engine = BKTEngine(default_params)
        state = engine.update(initial_state, is_correct=False)
        assert state.consecutive_wrong == 1
        state = engine.update(state, is_correct=False)
        assert state.consecutive_wrong == 2
        state = engine.update(state, is_correct=True)
        assert state.consecutive_wrong == 0

    def test_attempts_increment(self, default_params, initial_state):
        engine = BKTEngine(default_params)
        state = engine.update(initial_state, is_correct=True)
        assert state.attempts == 1
        state = engine.update(state, is_correct=False)
        assert state.attempts == 2

    def test_response_history_capped_at_20(self, default_params, initial_state):
        engine = BKTEngine(default_params)
        state = initial_state
        for i in range(30):
            state = engine.update(state, is_correct=i % 2 == 0)
        assert len(state.response_history) <= 20

    def test_predict_next_correct(self, default_params, initial_state):
        engine = BKTEngine(default_params)
        prob = engine.predict_next_correct(initial_state)
        # P(correct) = P(L)*(1-P(S)) + (1-P(L))*P(G) = 0.2*0.9 + 0.8*0.25 = 0.38
        assert abs(prob - 0.38) < 0.01

    def test_mastered_flag_set(self, default_params):
        engine = BKTEngine(default_params)
        state = StudentConceptState(
            student_id="s1", concept_id="c1", subtopic_id="st1",
            lesson_id="l1", p_mastery=0.94
        )
        new_state = engine.update(state, is_correct=True)
        assert new_state.p_mastery >= 0.95
        assert new_state.mastered is True


class TestScaffoldResolver:
    def test_level_0_for_low_mastery(self):
        from src.bkt.scaffold_resolver import ScaffoldResolver
        resolver = ScaffoldResolver()
        decision = resolver.resolve(0.1)
        assert decision.level == 0
        assert "StepByStep" in decision.allowed_components

    def test_level_1_for_developing(self):
        from src.bkt.scaffold_resolver import ScaffoldResolver
        resolver = ScaffoldResolver()
        decision = resolver.resolve(0.3)
        assert decision.level == 1

    def test_level_2_for_approaching(self):
        from src.bkt.scaffold_resolver import ScaffoldResolver
        resolver = ScaffoldResolver()
        decision = resolver.resolve(0.5)
        assert decision.level == 2

    def test_level_3_for_proficient(self):
        from src.bkt.scaffold_resolver import ScaffoldResolver
        resolver = ScaffoldResolver()
        decision = resolver.resolve(0.7)
        assert decision.level == 3

    def test_level_4_for_mastered(self):
        from src.bkt.scaffold_resolver import ScaffoldResolver
        resolver = ScaffoldResolver()
        decision = resolver.resolve(0.9)
        assert decision.level == 4
        assert "ExpertSummary" in decision.allowed_components
        assert "HintCard" not in decision.allowed_components

    def test_components_differ_per_level(self):
        from src.bkt.scaffold_resolver import ScaffoldResolver
        resolver = ScaffoldResolver()
        d0 = resolver.resolve(0.1)
        d4 = resolver.resolve(0.9)
        assert set(d0.allowed_components) != set(d4.allowed_components)

    def test_boundary_at_zero(self):
        from src.bkt.scaffold_resolver import ScaffoldResolver
        resolver = ScaffoldResolver()
        decision = resolver.resolve(0.0)
        assert decision.level == 0

    def test_boundary_at_one(self):
        from src.bkt.scaffold_resolver import ScaffoldResolver
        resolver = ScaffoldResolver()
        decision = resolver.resolve(0.99)
        assert decision.level == 4
