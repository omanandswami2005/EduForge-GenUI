"""Gemini-powered MCQ generator — generates tiered MCQs per subtopic."""
import json
import google.generativeai as genai
import os
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))


class MCQGenerator:
    """Generates 3-tiered MCQ banks per subtopic using Gemini."""

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def generate(
        self,
        subtopic: dict,
        slides_content: str,
        num_per_tier: int = 5,
    ) -> list[dict]:
        """
        Generate MCQs for a subtopic across 3 difficulty tiers.
        Each MCQ has a correct answer, explanation, and misconception mappings.
        """
        prompt = f"""Generate multiple-choice questions for this educational subtopic.

SUBTOPIC: {subtopic['title']}
DESCRIPTION: {subtopic['description']}
KEY CONCEPTS: {', '.join(subtopic.get('keyConcepts', []))}
LEARNING OBJECTIVES: {', '.join(subtopic.get('learningObjectives', []))}

SOURCE CONTENT:
{slides_content}

Generate {num_per_tier} questions for EACH of the 3 tiers:
- Tier 1 (Foundation): Simple recall and recognition. Test basic definitions and facts.
- Tier 2 (Understanding): Application of concepts. Students must apply rules to examples.
- Tier 3 (Analysis): Higher-order thinking. Requires synthesis, comparison, or evaluation.

Output ONLY a valid JSON array:
[
  {{
    "tier": 1,
    "concept": "the specific concept being tested",
    "question": "the question text",
    "options": {{"A": "option text", "B": "option text", "C": "option text", "D": "option text"}},
    "correct_answer": "A",
    "explanation": "why this answer is correct (2-3 sentences)",
    "misconceptions": {{
      "B": "why a student might choose B (common misconception)",
      "C": "why a student might choose C",
      "D": "why a student might choose D"
    }}
  }}
]

Rules:
- Each question must test a specific concept from the key concepts list
- Wrong options must represent realistic student misconceptions, not random wrong answers
- Explanations must be educational and help the student learn
- Misconception explanations must identify the specific misunderstanding
- Distribute questions evenly across all key concepts
- Output ONLY the JSON array, no markdown fences."""

        response = await self.model.generate_content_async(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        mcqs = json.loads(text)
        logger.info(
            "mcqs_generated",
            subtopic=subtopic["title"],
            count=len(mcqs),
            tiers={t: sum(1 for m in mcqs if m["tier"] == t) for t in [1, 2, 3]},
        )
        return mcqs
