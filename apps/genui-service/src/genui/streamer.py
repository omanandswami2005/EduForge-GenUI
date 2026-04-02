"""GenUI Streamer — Streams BKT-constrained visualizations from Gemini API."""
import os
import json
import google.generativeai as genai
from .prompt_builder import GenUIPromptBuilder
from .catalog import get_catalog_for_scaffold_level

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

model = genai.GenerativeModel("gemini-2.5-flash")


class GenUIStreamer:
    """
    Streams a BKT-constrained GenUI visualization for a concept.
    The BKT scaffold level determines which OpenUI components the LLM can use.

    Core neuro-symbolic fusion:
    Symbolic BKT posterior -> component catalog constraint -> Neural LLM generation
    """

    def stream_visualization(
        self,
        concept: str,
        concept_content: str,
        bkt_state: dict,
        scaffold_decision: dict,
        student_name: str = "the student",
    ):
        prompt_builder = GenUIPromptBuilder()
        system_prompt = prompt_builder.build(
            allowed_components=scaffold_decision["allowed_components"],
            scaffold_level=scaffold_decision["level"],
            p_mastery=bkt_state["p_mastery"],
        )

        user_message = f"""Create a learning visualization for this concept:

CONCEPT: {concept}

CONTENT FROM LESSON:
{concept_content}

STUDENT STATE:
- Mastery: {bkt_state['p_mastery']:.2f} ({scaffold_decision['level_name']})
- Attempts: {bkt_state.get('attempts', 0)}
- Last answer correct: {bkt_state.get('last_correct', None)}

Generate the most appropriate visualization using ONLY the allowed components.
Tailor the depth, complexity, and language to the student's mastery level."""

        response = model.generate_content(
            [system_prompt + "\n\n" + user_message],
            generation_config=genai.types.GenerationConfig(max_output_tokens=2000),
            stream=True,
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text

    def stream_tutor_response(
        self,
        student_message: str,
        concept: str,
        bkt_state: dict,
        scaffold_decision: dict,
        conversation_history: list,
    ):
        prompt_builder = GenUIPromptBuilder()
        tutor_system = prompt_builder.build_tutor_prompt(
            concept_name=concept,
            scaffold_level=scaffold_decision["level"],
            p_mastery=bkt_state["p_mastery"],
            allowed_components=scaffold_decision["allowed_components"],
        )

        # Build conversation context for Gemini
        context_parts = [tutor_system + "\n\nConversation so far:\n"]
        for msg in conversation_history:
            role = "Student" if msg["role"] == "user" else "Tutor"
            context_parts.append(f"{role}: {msg['content']}")
        context_parts.append(f"Student: {student_message}")
        context_parts.append("Tutor:")

        full_prompt = "\n".join(context_parts)

        response = model.generate_content(
            [full_prompt],
            generation_config=genai.types.GenerationConfig(max_output_tokens=800),
            stream=True,
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
