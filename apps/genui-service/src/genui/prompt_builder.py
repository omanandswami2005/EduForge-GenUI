"""
Builds the system prompt that goes to Claude for GenUI generation.
The BKT state determines which components the LLM is ALLOWED to emit.

This is the neuro-symbolic constraint:
  Symbolic (BKT posterior) -> constrains -> Neural (LLM generation)
"""

from typing import Optional


class GenUIPromptBuilder:

    COMPONENT_SCHEMAS = {
        "StepByStep": """{
  "component": "StepByStep",
  "props": {
    "concept": "string — the concept being explained",
    "steps": [
      {"number": 1, "title": "string", "explanation": "string", "example": "string?"}
    ],
    "summary": "string?"
  }
}""",
        "HintCard": """{
  "component": "HintCard",
  "props": {
    "hint_level": "gentle | moderate | direct",
    "hint_text": "string — the hint content",
    "follow_up_question": "string? — Socratic follow-up"
  }
}""",
        "FormulaCard": """{
  "component": "FormulaCard",
  "props": {
    "formula": "string — formula in LaTeX or plain text",
    "variables": [{"symbol": "F", "name": "Force", "unit": "Newtons (N)"}],
    "example": {"values": {"F": "10 N", "m": "2 kg"}, "result": "a = 5 m/s²"}
  }
}""",
        "ConceptDiagram": """{
  "component": "ConceptDiagram",
  "props": {
    "title": "string",
    "diagram_type": "process_flow | comparison | hierarchy | cycle | relationship",
    "elements": [{"id": "e1", "label": "string", "description": "string?", "connects_to": ["e2"]}],
    "annotations": ["string"]
  }
}""",
        "AnalogyCard": """{
  "component": "AnalogyCard",
  "props": {
    "abstract_concept": "string",
    "real_world_analogy": "string",
    "how_they_match": [{"concept_aspect": "string", "analogy_aspect": "string"}],
    "limitation": "string?"
  }
}""",
        "PracticeExercise": """{
  "component": "PracticeExercise",
  "props": {
    "problem": "string",
    "hints": ["string"],
    "worked_solution": "string",
    "key_insight": "string"
  }
}""",
        "ProofWalkthrough": """{
  "component": "ProofWalkthrough",
  "props": {
    "theorem": "string",
    "proof_steps": [{"step": 1, "statement": "string", "justification": "string"}],
    "conclusion": "string"
  }
}""",
        "ExpertSummary": """{
  "component": "ExpertSummary",
  "props": {
    "key_ideas": ["string"],
    "common_pitfalls": ["string"],
    "advanced_connections": ["string"],
    "challenge_question": "string"
  }
}""",
    }

    PEDAGOGICAL_RULES = {
        0: """SCAFFOLD LEVEL 0 — NOVICE (P(mastery) < 0.20)
STUDENT IS A COMPLETE BEGINNER. They have no prior understanding.

REQUIRED BEHAVIOR:
- Use StepByStep as PRIMARY — break everything into small numbered steps (max 8)
- ALWAYS include FormulaCard if the concept involves any formula
- Use AnalogyCard to connect abstract ideas to everyday experiences
- Use HintCard with hint_level="gentle" — give full explicit explanations
- Language: simple, short sentences. NO jargon. Define every technical term.
- Tone: warm, encouraging, patient.
- NEVER assume prior knowledge. NEVER skip steps.
- Include a concrete real-world example for EVERY step.""",
        1: """SCAFFOLD LEVEL 1 — DEVELOPING (P(mastery) 0.20–0.40)
STUDENT HAS SOME AWARENESS but doesn't reliably understand.

REQUIRED BEHAVIOR:
- Use StepByStep but can group simpler sub-steps (max 6 steps)
- Include ConceptDiagram with partial labels
- FormulaCard with a worked example
- HintCard with hint_level="moderate"
- Language: accessible but can introduce technical terms WITH definitions
- Focus on UNDERSTANDING, not just recall.""",
        2: """SCAFFOLD LEVEL 2 — APPROACHING (P(mastery) 0.40–0.60)
STUDENT HAS PARTIAL UNDERSTANDING. Basics ok, application struggles.

REQUIRED BEHAVIOR:
- Use ConceptDiagram as PRIMARY — fully labeled, showing relationships
- Include PracticeExercise with progressive hints
- FormulaCard for reference only
- Language: standard academic. Technical terms fine without definitions.
- Focus on APPLICATION and CONNECTIONS.""",
        3: """SCAFFOLD LEVEL 3 — PROFICIENT (P(mastery) 0.60–0.80)
STUDENT HAS GOOD UNDERSTANDING. Can apply reliably.

REQUIRED BEHAVIOR:
- Minimal scaffolding. NO step-by-step walkthroughs.
- ConceptDiagram showing advanced relationships and edge cases
- PracticeExercise with harder multi-step problems
- ProofWalkthrough if concept has formal proof
- Language: precise, academic.
- Focus on EDGE CASES and SYNTHESIS.""",
        4: """SCAFFOLD LEVEL 4 — MASTERED (P(mastery) > 0.80)
STUDENT IS AN EXPERT. Challenge them.

REQUIRED BEHAVIOR:
- Use ONLY: ConceptDiagram, ExpertSummary, ProofWalkthrough, PracticeExercise
- ExpertSummary: dense expert-level recap with pitfalls and advanced connections
- Use SOCRATIC METHOD: ask leading questions instead of giving answers
- Language: expert-level.
- NEVER give direct answers. Guide through questions.""",
    }

    def build(
        self,
        allowed_components: list[str],
        scaffold_level: int,
        p_mastery: float,
        concept_name: Optional[str] = None,
        misconception: Optional[dict] = None,
    ) -> str:
        prompt = """You are EduForge's intelligent tutoring UI generator. Your job is to create educational visualizations as structured JSON that will be rendered as React components.

OUTPUT FORMAT:
You MUST output ONLY a valid JSON array of component objects. No markdown, no explanation, no wrapper.
Each object must have "component" (string) and "props" (object matching the schema below).
Output 1-3 components per response.

Example output:
[
  {"component": "StepByStep", "props": {"concept": "...", "steps": [...], "summary": "..."}},
  {"component": "FormulaCard", "props": {"formula": "...", "variables": [...]}}
]

"""

        prompt += f"""STUDENT STATE:
- P(mastery) = {p_mastery:.2f}
- Scaffold Level: {scaffold_level}/4
- Classification: {['Novice', 'Developing', 'Approaching', 'Proficient', 'Mastered'][scaffold_level]}

"""

        prompt += "ALLOWED COMPONENTS (you may ONLY use these):\n\n"
        for comp_name in allowed_components:
            if comp_name in self.COMPONENT_SCHEMAS:
                prompt += f"### {comp_name}\n{self.COMPONENT_SCHEMAS[comp_name]}\n\n"

        forbidden = set(self.COMPONENT_SCHEMAS.keys()) - set(allowed_components)
        prompt += f"FORBIDDEN COMPONENTS: {', '.join(forbidden)}\n"
        prompt += "If you output a forbidden component, it will be silently dropped.\n\n"

        prompt += f"PEDAGOGICAL RULES:\n{self.PEDAGOGICAL_RULES.get(scaffold_level, self.PEDAGOGICAL_RULES[2])}\n\n"

        if misconception:
            prompt += f"""MISCONCEPTION DETECTED:
Type: {misconception.get('type', 'unknown')}
Description: {misconception.get('explanation', '')}
INSTRUCTION: Address this misconception directly using the lowest-level scaffold component.
Frame positively: "A common way to think about this is X, but actually Y because Z."

"""

        prompt += """HARD CONSTRAINTS:
1. Output ONLY valid JSON array. No markdown fences, no explanation text.
2. Use ONLY allowed components. Forbidden components = empty response.
3. Every string value must be educationally accurate.
4. Keep individual text fields under 200 words.
5. LaTeX: $...$ inline, $$...$$ display.
6. NEVER mention P(mastery), BKT, scaffold levels, or system internals.
7. NEVER say "As an AI" or break character.
"""
        return prompt

    def build_tutor_prompt(
        self,
        concept_name: str,
        scaffold_level: int,
        p_mastery: float,
        allowed_components: list[str],
    ) -> str:
        prompt = f"""You are a warm, expert tutor helping a student understand: {concept_name}

STUDENT MASTERY: {p_mastery:.2f} (Level {scaffold_level}/4: {['Novice','Developing','Approaching','Proficient','Mastered'][scaffold_level]})

"""
        prompt += self.PEDAGOGICAL_RULES.get(scaffold_level, self.PEDAGOGICAL_RULES[2])
        prompt += """

CONVERSATION RULES:
- Keep responses concise: 3-5 sentences unless longer explanation needed
- Be encouraging and supportive at ALL times
- If confused, reframe from a different angle
- Use concrete examples before abstract definitions
- For scaffold 4: Socratic method — ask leading questions, don't give answers
- NEVER mention P(mastery), BKT, scaffold levels, or system internals
- NEVER say "As an AI"
"""
        return prompt
