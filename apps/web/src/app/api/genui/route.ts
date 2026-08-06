import { NextRequest, NextResponse } from "next/server";
import { streamText, Output } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { genUISchema, ALLOWED_MAP, LEVEL_NAMES, buildGenUIPrompt } from "@/lib/genui-schema";

const BKT_URL = process.env.BKT_SERVICE_URL || "http://localhost:8001";

const PRIMARY_MODEL = process.env.GROQ_GENUI_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODELS = (
    process.env.GROQ_GENUI_FALLBACK_MODELS || "llama-3.3-70b-versatile,llama-3.1-8b-instant"
)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
// Try the configured model first, then fall back in order if it errors (e.g. a
// free-tier rate limit mid-demo) — each candidate is only used if every prior
// one failed before it produced a single byte of output.
const MODEL_CANDIDATES = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

// Midpoint p_mastery used when a caller forces a scaffold level directly
// (comparison view) instead of going through the real BKT-driven lookup.
const SCAFFOLD_LEVEL_MIDPOINTS = [0.1, 0.3, 0.5, 0.7, 0.9];

const DEFAULT_BKT_STATE = (studentId: string, conceptId: string) => ({
    student_id: studentId,
    concept_id: conceptId,
    p_mastery: 0.2,
    attempts: 0,
    mastered: false,
    consecutive_wrong: 0,
});

const DEFAULT_SCAFFOLD = {
    level: 0,
    level_name: "foundational",
    allowed_components: ["StepByStep", "HintCard", "FormulaCard", "AnalogyCard"],
    p_mastery: 0.2,
    description: "Foundational support — step-by-step guidance with hints",
};

export const maxDuration = 30;

/**
 * Try each model in order. A model only "wins" once we've successfully pulled
 * its first chunk of output — that's what lets us fall back to the next
 * candidate on failure without having already committed a response to the
 * client. Returns a plain text stream (matching what toTextStreamResponse()
 * would produce) plus which model actually served the request.
 */
async function streamWithFallback(prompt: string) {
    let lastError: unknown;
    for (const modelName of MODEL_CANDIDATES) {
        try {
            const result = streamText({
                model: groq(modelName),
                output: Output.object({ schema: genUISchema }),
                prompt,
            });
            const iterator = result.textStream[Symbol.asyncIterator]();
            const first = await iterator.next();

            const encoder = new TextEncoder();
            const stream = new ReadableStream<Uint8Array>({
                async start(controller) {
                    try {
                        if (!first.done) controller.enqueue(encoder.encode(first.value));
                        while (true) {
                            const { value, done } = await iterator.next();
                            if (done) break;
                            controller.enqueue(encoder.encode(value));
                        }
                        controller.close();
                    } catch (err) {
                        controller.error(err);
                    }
                },
            });
            return { stream, modelUsed: modelName };
        } catch (err) {
            lastError = err;
            // eslint-disable-next-line no-console
            console.error(`[genui] model "${modelName}" failed, trying next fallback`, err);
        }
    }
    throw lastError instanceof Error ? lastError : new Error("All Groq model candidates failed");
}

export async function POST(req: NextRequest) {
    try {
        const { conceptId, subtopicId, lessonId, studentId, subtopicTitle, forceScaffoldLevel } = await req.json();

        if (!conceptId || !studentId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let scaffold: {
            level: number;
            level_name: string;
            allowed_components?: string[];
            p_mastery: number;
            description?: string;
        };

        if (typeof forceScaffoldLevel === "number" && forceScaffoldLevel >= 0 && forceScaffoldLevel <= 4) {
            // Comparison-view mode: skip the real BKT lookup entirely and render
            // this concept as if the student were at the requested scaffold level.
            scaffold = {
                level: forceScaffoldLevel,
                level_name: LEVEL_NAMES[forceScaffoldLevel]?.toLowerCase() ?? "unknown",
                allowed_components: ALLOWED_MAP[forceScaffoldLevel] ?? ALLOWED_MAP[0],
                p_mastery: SCAFFOLD_LEVEL_MIDPOINTS[forceScaffoldLevel] ?? 0.5,
            };
        } else {
            // 1. Get BKT state — fall back to default if service unavailable
            let bktState = DEFAULT_BKT_STATE(studentId, conceptId);
            try {
                const bktRes = await fetch(
                    `${BKT_URL}/state?studentId=${encodeURIComponent(studentId)}&conceptId=${encodeURIComponent(conceptId)}`,
                    { signal: AbortSignal.timeout(3000) }
                );
                if (bktRes.ok) bktState = await bktRes.json();
            } catch {
                // BKT unavailable — use default state (0.2 mastery = foundational scaffold)
            }

            // 2. Get scaffold decision — fall back to default if service unavailable
            scaffold = { ...DEFAULT_SCAFFOLD, p_mastery: bktState.p_mastery };
            try {
                const scaffoldRes = await fetch(
                    `${BKT_URL}/scaffold?p_mastery=${bktState.p_mastery || 0.2}`,
                    { signal: AbortSignal.timeout(3000) }
                );
                if (scaffoldRes.ok) scaffold = await scaffoldRes.json();
            } catch {
                // Use default scaffold
            }
        }

        // 3. Build a rich concept name from all available context clues.
        //    subtopicTitle is the full human-readable topic name (e.g. "Agent Development Kit (ADK)")
        //    which grounds the AI in the correct domain and avoids misinterpretation.
        const richConceptName = subtopicTitle
            ? `${subtopicTitle}${conceptId !== subtopicTitle ? ` — specifically: ${conceptId}` : ""}`
            : `${conceptId} (subtopic ${subtopicId}, lesson ${lessonId})`;

        // 4. Build prompt and stream structured output via Vercel AI SDK
        const allowed = scaffold.allowed_components ?? ALLOWED_MAP[scaffold.level] ?? ALLOWED_MAP[0];
        const prompt = buildGenUIPrompt({
            scaffoldLevel: scaffold.level,
            pMastery: scaffold.p_mastery ?? 0.2,
            allowed,
            conceptName: richConceptName,
        });

        // Use restricted schema so the model can only produce allowed component types
        const { stream, modelUsed } = await streamWithFallback(prompt);

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Genui-Model": modelUsed,
                "X-Scaffold-Level": String(scaffold.level),
                "X-Scaffold-Level-Name": scaffold.level_name,
                "X-P-Mastery": String(scaffold.p_mastery ?? 0.2),
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal error" },
            { status: 500 }
        );
    }
}
