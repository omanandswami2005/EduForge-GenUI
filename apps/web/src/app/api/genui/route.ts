import { NextRequest, NextResponse } from "next/server";
import { streamText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { genUISchema, ALLOWED_MAP, buildGenUIPrompt } from "@/lib/genui-schema";

const BKT_URL = process.env.BKT_SERVICE_URL || "http://localhost:8001";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

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

export async function POST(req: NextRequest) {
    try {
        const { conceptId, subtopicId, lessonId, studentId } = await req.json();

        if (!conceptId || !studentId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

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
        let scaffold = { ...DEFAULT_SCAFFOLD, p_mastery: bktState.p_mastery };
        try {
            const scaffoldRes = await fetch(
                `${BKT_URL}/scaffold?p_mastery=${bktState.p_mastery || 0.2}`,
                { signal: AbortSignal.timeout(3000) }
            );
            if (scaffoldRes.ok) scaffold = await scaffoldRes.json();
        } catch {
            // Use default scaffold
        }

        // 3. Build prompt and stream structured output via Vercel AI SDK
        const allowed = scaffold.allowed_components ?? ALLOWED_MAP[scaffold.level] ?? ALLOWED_MAP[0];
        const prompt = buildGenUIPrompt({
            scaffoldLevel: scaffold.level,
            pMastery: scaffold.p_mastery ?? 0.2,
            allowed,
            conceptName: `${conceptId} (subtopic ${subtopicId}, lesson ${lessonId})`,
        });

        // Use restricted schema so Gemini can only produce allowed component types
        const result = streamText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: genUISchema }),
            prompt,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal error" },
            { status: 500 }
        );
    }
}
