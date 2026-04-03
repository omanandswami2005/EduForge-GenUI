import { z } from "zod";

// ── Individual component schemas ──

const stepByStepSchema = z.object({
    component: z.literal("StepByStep"),
    props: z.object({
        concept: z.string().describe("The concept being explained"),
        steps: z.array(
            z.object({
                number: z.number(),
                title: z.string(),
                explanation: z.string(),
                example: z.string().optional(),
            })
        ),
        summary: z.string().optional(),
    }),
});

const hintCardSchema = z.object({
    component: z.literal("HintCard"),
    props: z.object({
        hint_level: z.enum(["gentle", "moderate", "direct"]),
        hint_text: z.string().describe("The hint content"),
        follow_up_question: z.string().optional().describe("Socratic follow-up"),
    }),
});

const formulaCardSchema = z.object({
    component: z.literal("FormulaCard"),
    props: z.object({
        formula: z.string().describe("Formula in LaTeX or plain text"),
        variables: z.array(
            z.object({
                symbol: z.string(),
                name: z.string(),
                unit: z.string(),
            })
        ),
        example: z.object({
            values: z.record(z.string(), z.string()),
            result: z.string(),
        }),
    }),
});

const conceptDiagramSchema = z.object({
    component: z.literal("ConceptDiagram"),
    props: z.object({
        title: z.string(),
        diagram_type: z.enum(["process_flow", "comparison", "hierarchy", "cycle", "relationship"]),
        elements: z.array(
            z.object({
                id: z.string(),
                label: z.string(),
                description: z.string().optional(),
                connects_to: z.array(z.string()),
            })
        ),
        annotations: z.array(z.string()),
    }),
});

const analogyCardSchema = z.object({
    component: z.literal("AnalogyCard"),
    props: z.object({
        abstract_concept: z.string(),
        real_world_analogy: z.string(),
        how_they_match: z.array(
            z.object({
                concept_aspect: z.string(),
                analogy_aspect: z.string(),
            })
        ),
        limitation: z.string().optional(),
    }),
});

const practiceExerciseSchema = z.object({
    component: z.literal("PracticeExercise"),
    props: z.object({
        problem: z.string(),
        hints: z.array(z.string()),
        worked_solution: z.string(),
        key_insight: z.string(),
    }),
});

const proofWalkthroughSchema = z.object({
    component: z.literal("ProofWalkthrough"),
    props: z.object({
        theorem: z.string(),
        proof_steps: z.array(
            z.object({
                step: z.number(),
                statement: z.string(),
                justification: z.string(),
            })
        ),
        conclusion: z.string(),
    }),
});

const expertSummarySchema = z.object({
    component: z.literal("ExpertSummary"),
    props: z.object({
        key_ideas: z.array(z.string()),
        common_pitfalls: z.array(z.string()),
        advanced_connections: z.array(z.string()),
        challenge_question: z.string(),
    }),
});

// ── Full discriminated union of all component types ──

export const genUIComponentSchema = z.discriminatedUnion("component", [
    stepByStepSchema,
    hintCardSchema,
    formulaCardSchema,
    conceptDiagramSchema,
    analogyCardSchema,
    practiceExerciseSchema,
    proofWalkthroughSchema,
    expertSummarySchema,
]);

// ── Schema for both server (Output.object) and client (useObject) ──

export const genUISchema = z.object({
    components: z.array(genUIComponentSchema).describe("1-3 educational UI components"),
});

// ── Types ──

export type GenUIComponent = z.infer<typeof genUIComponentSchema>;
export type GenUIOutput = z.infer<typeof genUISchema>;

// ── Scaffold-level → allowed component names ──

export const ALLOWED_MAP: Record<number, string[]> = {
    0: ["StepByStep", "HintCard", "FormulaCard", "AnalogyCard"],
    1: ["StepByStep", "HintCard", "FormulaCard", "ConceptDiagram"],
    2: ["ConceptDiagram", "FormulaCard", "HintCard", "PracticeExercise"],
    3: ["ConceptDiagram", "PracticeExercise", "ProofWalkthrough"],
    4: ["ConceptDiagram", "ExpertSummary", "ProofWalkthrough", "PracticeExercise"],
};

const ALL_COMPONENTS = [
    "StepByStep", "HintCard", "FormulaCard", "ConceptDiagram",
    "AnalogyCard", "PracticeExercise", "ProofWalkthrough", "ExpertSummary",
];

// ── Pedagogical rules (ported from Python prompt_builder.py) ──

const PEDAGOGICAL_RULES: Record<number, string> = {
    0: `SCAFFOLD LEVEL 0 — NOVICE (P(mastery) < 0.20)
STUDENT IS A COMPLETE BEGINNER. They have no prior understanding.

REQUIRED BEHAVIOR:
- Use StepByStep as PRIMARY — break everything into small numbered steps (max 8)
- ALWAYS include FormulaCard if the concept involves any formula
- Use AnalogyCard to connect abstract ideas to everyday experiences
- Use HintCard with hint_level="gentle" — give full explicit explanations
- Language: simple, short sentences. NO jargon. Define every technical term.
- Tone: warm, encouraging, patient.
- NEVER assume prior knowledge. NEVER skip steps.
- Include a concrete real-world example for EVERY step.`,

    1: `SCAFFOLD LEVEL 1 — DEVELOPING (P(mastery) 0.20–0.40)
STUDENT HAS SOME AWARENESS but doesn't reliably understand.

REQUIRED BEHAVIOR:
- Use StepByStep but can group simpler sub-steps (max 6 steps)
- Include ConceptDiagram with partial labels
- FormulaCard with a worked example
- HintCard with hint_level="moderate"
- Language: accessible but can introduce technical terms WITH definitions
- Focus on UNDERSTANDING, not just recall.`,

    2: `SCAFFOLD LEVEL 2 — APPROACHING (P(mastery) 0.40–0.60)
STUDENT HAS PARTIAL UNDERSTANDING. Basics ok, application struggles.

REQUIRED BEHAVIOR:
- Use ConceptDiagram as PRIMARY — fully labeled, showing relationships
- Include PracticeExercise with progressive hints
- FormulaCard for reference only
- Language: standard academic. Technical terms fine without definitions.
- Focus on APPLICATION and CONNECTIONS.`,

    3: `SCAFFOLD LEVEL 3 — PROFICIENT (P(mastery) 0.60–0.80)
STUDENT HAS GOOD UNDERSTANDING. Can apply reliably.

REQUIRED BEHAVIOR:
- Minimal scaffolding. NO step-by-step walkthroughs.
- ConceptDiagram showing advanced relationships and edge cases
- PracticeExercise with harder multi-step problems
- ProofWalkthrough if concept has formal proof
- Language: precise, academic.
- Focus on EDGE CASES and SYNTHESIS.`,

    4: `SCAFFOLD LEVEL 4 — MASTERED (P(mastery) > 0.80)
STUDENT IS AN EXPERT. Challenge them.

REQUIRED BEHAVIOR:
- Use ONLY: ConceptDiagram, ExpertSummary, ProofWalkthrough, PracticeExercise
- ExpertSummary: dense expert-level recap with pitfalls and advanced connections
- Use SOCRATIC METHOD: ask leading questions instead of giving answers
- Language: expert-level.
- NEVER give direct answers. Guide through questions.`,
};

const LEVEL_NAMES = ["Novice", "Developing", "Approaching", "Proficient", "Mastered"];

// ── Prompt builder (replaces Python GenUIPromptBuilder) ──

export function buildGenUIPrompt(opts: {
    scaffoldLevel: number;
    pMastery: number;
    allowed: string[];
    conceptName: string;
}): string {
    const { scaffoldLevel, pMastery, allowed, conceptName } = opts;
    const forbidden = ALL_COMPONENTS.filter((c) => !allowed.includes(c));

    return `You are EduForge's intelligent tutoring UI generator. Create educational visualizations as structured component objects.

Output 1-3 components per response.

STUDENT STATE:
- P(mastery) = ${pMastery.toFixed(2)}
- Scaffold Level: ${scaffoldLevel}/4
- Classification: ${LEVEL_NAMES[scaffoldLevel] ?? LEVEL_NAMES[2]}

ALLOWED COMPONENTS (you may ONLY use these): ${allowed.join(", ")}
FORBIDDEN COMPONENTS: ${forbidden.join(", ")}
If you output a forbidden component, it will be silently dropped.

PEDAGOGICAL RULES:
${PEDAGOGICAL_RULES[scaffoldLevel] ?? PEDAGOGICAL_RULES[2]}

TOPIC: ${conceptName}

HARD CONSTRAINTS:
1. Use ONLY allowed components. Forbidden components = empty response.
2. Every string value must be educationally accurate.
3. Keep individual text fields under 200 words.
4. LaTeX: $...$ inline, $$...$$ display.
5. NEVER mention P(mastery), BKT, scaffold levels, or system internals.
6. NEVER say "As an AI" or break character.`;
}
