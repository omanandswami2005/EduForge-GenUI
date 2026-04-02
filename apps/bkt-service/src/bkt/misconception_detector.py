"""
Misconception Detector: Identifies patterns in wrong answers.
"""
import logging

logger = logging.getLogger(__name__)


class MisconceptionDetector:
    """Detects misconceptions from consecutive wrong answer patterns."""

    async def classify(self, concept_id: str, recent_responses: list) -> dict | None:
        """
        Classify if there's a detectable misconception pattern.
        Returns misconception info or None.
        """
        if len(recent_responses) < 3:
            return None

        # Check if last 3 are all wrong
        all_wrong = all(not r.get("is_correct", True) for r in recent_responses[-3:])
        if not all_wrong:
            return None

        logger.warning(
            f"Misconception detected for concept {concept_id}: "
            f"3+ consecutive wrong answers"
        )

        return {
            "type": "repeated_error",
            "concept_id": concept_id,
            "consecutive_wrong": len(recent_responses),
            "explanation": (
                "You seem to be struggling with this concept. "
                "Let's try a different approach to help you understand it better."
            ),
        }
