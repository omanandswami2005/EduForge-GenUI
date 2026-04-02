"""Gemini-powered BKT parameter estimator — seeds initial BKT params per concept."""
import json
import google.generativeai as genai
import os
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))


class BKTParamsGenerator:
    """Estimates initial BKT parameters for each concept using Gemini."""

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def generate(self, subtopic: dict, concepts: list[str]) -> list[dict]:
        """
        Estimate BKT parameters for each concept in a subtopic.
        Returns params list with concept_id, p_initial, p_learn, p_slip, p_guess.
        """
        prompt = f"""You are an expert in Bayesian Knowledge Tracing (BKT). Estimate the BKT parameters for each concept in this educational subtopic.

SUBTOPIC: {subtopic['title']}
DIFFICULTY: {subtopic.get('difficulty', 'intermediate')}
CONCEPTS: {json.dumps(concepts)}

For each concept, estimate these BKT parameters:
- p_initial (P(L0)): Prior probability the student already knows this concept (0.05-0.4)
  - Lower for advanced/abstract concepts, higher for common knowledge
- p_learn (P(T)): Probability of learning on each practice opportunity (0.1-0.4)
  - Higher for straightforward concepts, lower for complex ones
- p_slip (P(S)): Probability of a careless error when mastered (0.05-0.2)
  - Higher for concepts with easy-to-make computational errors
- p_guess (P(G)): Probability of correct guess when not mastered (0.15-0.35)
  - For 4-option MCQs, baseline is 0.25. Adjust if some distractors are obviously wrong.

Output ONLY a valid JSON array:
[
  {{
    "concept_id": "concept_name_snake_case",
    "concept_label": "Human Readable Name",
    "p_initial": 0.2,
    "p_learn": 0.2,
    "p_slip": 0.1,
    "p_guess": 0.25
  }}
]

Rules:
- Be conservative: when in doubt, use lower p_initial and p_learn
- p_slip should ALWAYS be < p_guess (otherwise BKT becomes degenerate)
- Sum of p_slip + p_guess should be < 0.5
- Output ONLY the JSON array."""

        response = await self.model.generate_content_async(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        params = json.loads(text)

        # Validate and clamp parameters
        for p in params:
            p["p_initial"] = max(0.05, min(0.4, p.get("p_initial", 0.2)))
            p["p_learn"] = max(0.1, min(0.4, p.get("p_learn", 0.2)))
            p["p_slip"] = max(0.05, min(0.2, p.get("p_slip", 0.1)))
            p["p_guess"] = max(0.15, min(0.35, p.get("p_guess", 0.25)))
            # Ensure p_slip < p_guess
            if p["p_slip"] >= p["p_guess"]:
                p["p_slip"] = p["p_guess"] - 0.05

        logger.info("bkt_params_generated", subtopic=subtopic["title"], count=len(params))
        return params
