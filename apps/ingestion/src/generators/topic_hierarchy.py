"""Gemini-powered topic hierarchy generator."""
import json
import google.generativeai as genai
import os
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))


class TopicHierarchyGenerator:
    """Uses Gemini to generate a topic hierarchy from slide content."""

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def generate(self, slides_data: list[dict], lesson_title: str) -> list[dict]:
        """
        Generate subtopics from extracted slide data.
        Returns list of subtopic dicts with title, description, order,
        difficulty, slideNumbers, keyConcepts, learningObjectives, prerequisiteSubtopicIds.
        """
        slides_text = ""
        for s in slides_data:
            slides_text += f"\n--- Slide {s['slide_number']}: {s['title']} ---\n"
            slides_text += s["text_content"] + "\n"
            if s["notes"]:
                slides_text += f"[Speaker Notes: {s['notes']}]\n"

        prompt = f"""Analyze these lecture slides and generate a structured topic hierarchy.

LESSON TITLE: {lesson_title}

SLIDES:
{slides_text}

Generate a JSON array of subtopics. Each subtopic should:
1. Group related slides together
2. Have clear, descriptive title and description
3. List key concepts that students must learn
4. List measurable learning objectives
5. Identify prerequisite subtopics (by their order number)
6. Classify difficulty as foundational, intermediate, or advanced

Output ONLY a valid JSON array with this schema:
[
  {{
    "title": "string",
    "description": "string (2-3 sentences)",
    "order": 1,
    "difficulty": "foundational | intermediate | advanced",
    "slideNumbers": [1, 2, 3],
    "keyConcepts": ["concept1", "concept2"],
    "learningObjectives": ["Students will be able to..."],
    "prerequisiteSubtopicOrders": []
  }}
]

Rules:
- 3-6 subtopics per lesson (not too granular, not too broad)
- Each slide must belong to exactly one subtopic
- First subtopic should always be foundational
- Prerequisites must reference subtopics with a lower order number
- Output ONLY the JSON array, no markdown fences or explanation."""

        response = await self.model.generate_content_async(prompt)
        text = response.text.strip()

        # Clean markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        subtopics = json.loads(text)
        logger.info("topic_hierarchy_generated", count=len(subtopics), lesson=lesson_title)
        return subtopics
