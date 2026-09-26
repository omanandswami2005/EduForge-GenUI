import { NextRequest, NextResponse } from "next/server";
import { genUISchema, ALLOWED_MAP, LEVEL_NAMES, buildGenUIPrompt, type GenUIOutput } from "@/lib/genui-schema";
import { buildFallbackGenUI } from "@/lib/genui-fallback";
import { resolveChain } from "@/lib/llm/providers";
import { generateStructured, type Strategy } from "@/lib/llm/structured";

const BKT_URL = process.env.BKT_SERVICE_URL || "http://localhost:8001";

/**
 * Model chain as "provider:model" specs, tried in order (see lib/llm/providers.ts).
 * Default: Groq gpt-oss-120b (fast, ~5s) → Groq gpt-oss-20b → OpenRouter free
 * (slow queue, ~75s) → curated fallback content. Providers without an API
 * key are skipped automatically.
 */
const GENUI_MODELS =
    process.env.GENUI_MODELS ||
    [
        `groq:${process.env.GROQ_GENUI_MODEL || "openai/gpt-oss-120b"}`,
        "groq:openai/gpt-oss-20b",
        "openrouter:dots-studio/dots-3-note-preview:free",
    ].join(",");
const STRATEGY: Strategy = process.env.GENUI_STRATEGY === "race" ? "race" : "fallback";

// Midpoint p_mastery used when a caller forces a scaffold level directly
// (comparison view) instead of going through the real BKT-driven lookup.
const SCAFFOLD_LEVEL_MIDPOINTS = [0.1, 0.3, 0.5, 0.7, 0.9];

const DEFAULT_SCAFFOLD = {
    level: 0,
    level_name: "novice",
    allowed_components: ALLOWED_MAP[0],
    p_mastery: 0.2,
};

// Groq attempts are ~25s max each; the OpenRouter free queue needs up to ~85s
export const maxDuration = 150;

interface Scaffold {
    level: number;
    level_name: string;
    allowed_components?: string[];
    p_mastery: number;
}

async function resolveScaffold(studentId: string, conceptId: string, forceScaffoldLevel: unknown): Promise<Scaffold> {
    if (typeof forceScaffoldLevel === "number" && forceScaffoldLevel >= 0 && forceScaffoldLevel <= 4) {
        // Comparison-view mode: skip the real BKT lookup entirely and render
        // this concept as if the student were at the requested scaffold level.
        return {
            level: forceScaffoldLevel,
            level_name: LEVEL_NAMES[forceScaffoldLevel]?.toLowerCase() ?? "unknown",
            allowed_components: ALLOWED_MAP[forceScaffoldLevel] ?? ALLOWED_MAP[0],
            p_mastery: SCAFFOLD_LEVEL_MIDPOINTS[forceScaffoldLevel] ?? 0.5,
        };
    }

    // BKT unavailable at any step → foundational defaults
    let pMastery = 0.2;
    try {
        const res = await fetch(
            `${BKT_URL}/state?studentId=${encodeURIComponent(studentId)}&conceptId=${encodeURIComponent(conceptId)}`,
            { signal: AbortSignal.timeout(3000) },
        );
        if (res.ok) pMastery = (await res.json()).p_mastery ?? 0.2;
    } catch {}
    try {
        const res = await fetch(`${BKT_URL}/scaffold?p_mastery=${pMastery}`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) return await res.json();
    } catch {}
    return { ...DEFAULT_SCAFFOLD, p_mastery: pMastery };
}

function respond(body: GenUIOutput, headers: Record<string, string>) {
    return new Response(JSON.stringify(body), {
        headers: { "Content-Type": "text/plain; charset=utf-8", ...headers },
    });
}

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { conceptId, subtopicId, lessonId, studentId, subtopicTitle, forceScaffoldLevel, misconceptionContext } =
        body as Record<string, string | undefined> & { forceScaffoldLevel?: number };

    if (!conceptId || !studentId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const scaffold = await resolveScaffold(studentId, conceptId, forceScaffoldLevel);
    const allowed = scaffold.allowed_components ?? ALLOWED_MAP[scaffold.level] ?? ALLOWED_MAP[0];

    // subtopicTitle is the full human-readable topic name, which grounds the
    // model in the right domain and avoids misinterpreting a bare concept id.
    const conceptName = subtopicTitle
        ? `${subtopicTitle}${conceptId !== subtopicTitle ? ` — specifically: ${conceptId}` : ""}`
        : `${conceptId} (subtopic ${subtopicId}, lesson ${lessonId})`;

    const scaffoldHeaders = {
        "X-Scaffold-Level": String(scaffold.level),
        "X-Scaffold-Level-Name": scaffold.level_name,
        "X-P-Mastery": String(scaffold.p_mastery ?? 0.2),
    };

    try {
        const result = await generateStructured({
            candidates: resolveChain(GENUI_MODELS),
            strategy: STRATEGY,
            schema: genUISchema,
            prompt: buildGenUIPrompt({
                scaffoldLevel: scaffold.level,
                pMastery: scaffold.p_mastery ?? 0.2,
                allowed,
                conceptName,
                misconceptionContext: typeof misconceptionContext === "string" ? misconceptionContext : undefined,
            }),
            // Enforce the BKT gate on the output too, not just in the prompt
            accept: ({ components }) => {
                if (components.length === 0) return "zero components";
                const outside = components.filter((c) => !allowed.includes(c.component)).map((c) => c.component);
                return outside.length ? `components outside scaffold level ${scaffold.level}: ${outside.join(", ")}` : null;
            },
        });
        return respond(result.object, {
            ...scaffoldHeaders,
            "X-Genui-Model": result.modelSpec,
            "X-Genui-Attempts": String(result.attempts),
            "X-Genui-Source": "ai",
        });
    } catch (err) {
        // Every model failed — serve curated, level-appropriate content instead
        // of an error. The student sees a lesson either way.
        // eslint-disable-next-line no-console
        console.error("[genui] serving curated fallback:", err instanceof Error ? err.message : err);
        return respond(buildFallbackGenUI({ conceptName, scaffoldLevel: scaffold.level, allowed }), {
            ...scaffoldHeaders,
            "X-Genui-Model": "curated",
            "X-Genui-Source": "fallback",
        });
    }
}
