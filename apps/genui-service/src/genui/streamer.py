"""GenUI Streamer — Streams BKT-constrained visualizations from Claude API."""
import os
import json
import anthropic
from .prompt_builder import GenUIPromptBuilder
from .catalog import get_catalog_for_scaffold_level


client = anthropic.Anthropic(api_key=os.environ.get("CLAUDE_API_KEY", ""))


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

        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            for text in stream.text_stream:
                yield text

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

        messages = conversation_history + [
            {"role": "user", "content": student_message}
        ]

        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=tutor_system,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield text
