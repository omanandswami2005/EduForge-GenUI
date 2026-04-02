"""
Core BKT computation engine.
Implements Bayesian Knowledge Tracing update equations.
"""
import numpy as np
from dataclasses import dataclass, field


@dataclass
class BKTParams:
    """BKT parameters for a single concept."""
    concept_id: str
    p_initial: float = 0.2
    p_learn: float = 0.2
    p_slip: float = 0.1
    p_guess: float = 0.25


@dataclass
class StudentConceptState:
    """Current BKT state for one student on one concept."""
    student_id: str
    concept_id: str
    subtopic_id: str
    lesson_id: str = ""
    p_mastery: float = 0.2
    attempts: int = 0
    correct_streak: int = 0
    mastered: bool = False
    consecutive_wrong: int = 0
    response_history: list = field(default_factory=list)


class BKTEngine:
    """
    Core BKT computation engine.
    Wraps the Bayesian update equations.
    """

    MASTERY_THRESHOLD = 0.95

    def __init__(self, params: BKTParams):
        self.params = params

    def update(self, state: StudentConceptState, is_correct: bool) -> StudentConceptState:
        """
        Bayesian update after student answers a question.
        Returns new immutable state.
        """
        p_l = state.p_mastery
        p_t = self.params.p_learn
        p_s = self.params.p_slip
        p_g = self.params.p_guess

        # Step 1: Update P(L|observation) via Bayes
        if is_correct:
            p_correct = p_l * (1 - p_s) + (1 - p_l) * p_g
            if p_correct == 0:
                p_correct = 1e-10
            p_l_given_obs = (p_l * (1 - p_s)) / p_correct
        else:
            p_incorrect = p_l * p_s + (1 - p_l) * (1 - p_g)
            if p_incorrect == 0:
                p_incorrect = 1e-10
            p_l_given_obs = (p_l * p_s) / p_incorrect

        # Step 2: Apply learning opportunity
        p_l_new = p_l_given_obs + (1 - p_l_given_obs) * p_t

        # Clamp to valid probability range
        p_l_new = max(0.001, min(0.999, p_l_new))

        # Update streaks and history
        new_streak = state.correct_streak + 1 if is_correct else 0
        new_consecutive_wrong = 0 if is_correct else state.consecutive_wrong + 1

        response_entry = {
            'is_correct': is_correct,
            'p_mastery_before': state.p_mastery,
            'p_mastery_after': p_l_new,
        }

        return StudentConceptState(
            student_id=state.student_id,
            concept_id=state.concept_id,
            subtopic_id=state.subtopic_id,
            lesson_id=state.lesson_id,
            p_mastery=p_l_new,
            attempts=state.attempts + 1,
            correct_streak=new_streak,
            mastered=p_l_new >= self.MASTERY_THRESHOLD,
            consecutive_wrong=new_consecutive_wrong,
            response_history=(state.response_history + [response_entry])[-20:],
        )

    def predict_next_correct(self, state: StudentConceptState) -> float:
        """Predict probability of correct answer on next question."""
        p_l = state.p_mastery
        return p_l * (1 - self.params.p_slip) + (1 - p_l) * self.params.p_guess
