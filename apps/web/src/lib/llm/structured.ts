/**
 * Provider-agnostic structured generation with validation and failover.
 *
 * Every candidate's output is validated against the zod schema before it is
 * accepted, so callers only ever see a complete, schema-valid object.
 *
 * Strategies:
 *   "fallback" — try candidates in order (cheapest on free-tier quotas)
 *   "race"     — run candidates in parallel, first valid result wins and
 *                the rest are aborted (lowest latency, uses more quota)
 */
import { generateText, Output, zodSchema } from "ai";
import type { z } from "zod";
import type { ResolvedModel } from "./providers";

export type Strategy = "fallback" | "race";

export interface StructuredResult<T> {
    object: T;
    modelSpec: string;
    attempts: number;
    durationMs: number;
}

export interface AttemptFailure {
    modelSpec: string;
    error: string;
}

export class AllModelsFailedError extends Error {
    constructor(public failures: AttemptFailure[]) {
        super(
            failures.length === 0
                ? "No LLM provider is configured (set GROQ_API_KEY or OPENROUTER_API_KEY)"
                : `All models failed: ${failures.map((f) => `${f.modelSpec} → ${f.error}`).join("; ")}`,
        );
    }
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

/** Pull the JSON object out of a model reply (tolerates ``` fences / leading prose). */
function extractJson(text: string): unknown {
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch {
        const start = trimmed.indexOf("{");
        const end = trimmed.lastIndexOf("}");
        if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
        throw new Error("reply contained no JSON object");
    }
}

/** For JSON-mode providers: spell the schema out (JSON mode also requires the word "JSON"). */
function withJsonInstructions<T>(prompt: string, schema: z.ZodType<T>): string {
    const jsonSchema = JSON.stringify(zodSchema(schema).jsonSchema);
    return `${prompt}\n\nRespond with ONLY a single JSON object (no markdown, no prose) that validates against this JSON Schema:\n${jsonSchema}`;
}

async function attempt<T>(
    candidate: ResolvedModel,
    prompt: string,
    schema: z.ZodType<T>,
    accept: (value: T) => string | null,
    abortSignal?: AbortSignal,
    timeoutMs = candidate.timeoutMs,
): Promise<T> {
    const signal = abortSignal
        ? AbortSignal.any([abortSignal, AbortSignal.timeout(timeoutMs)])
        : AbortSignal.timeout(timeoutMs);

    const result = await generateText({
        model: candidate.model,
        output: Output.object({ schema }),
        prompt: candidate.jsonMode ? withJsonInstructions(prompt, schema) : prompt,
        providerOptions: candidate.providerOptions as never,
        abortSignal: signal,
        maxRetries: 0, // failover is handled here, across models
    });

    // Validate the raw text ourselves: the SDK's own parse error hides *what* was wrong
    const parsed = schema.safeParse(extractJson(result.text));
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new Error(`schema mismatch at ${issue?.path.join(".") || "(root)"}: ${issue?.message}`);
    }
    const rejection = accept(parsed.data);
    if (rejection) throw new Error(rejection);
    return parsed.data;
}

export async function generateStructured<T>({
    candidates,
    prompt,
    schema,
    strategy = "fallback",
    accept = () => null,
    log = true,
}: {
    candidates: ResolvedModel[];
    prompt: string;
    schema: z.ZodType<T>;
    strategy?: Strategy;
    /** Extra semantic check; return a reason string to reject a schema-valid object */
    accept?: (value: T) => string | null;
    log?: boolean;
}): Promise<StructuredResult<T>> {
    const started = Date.now();
    const failures: AttemptFailure[] = [];
    const fail = (spec: string, e: unknown) => {
        failures.push({ modelSpec: spec, error: errMsg(e) });
        // eslint-disable-next-line no-console
        if (log) console.error(`[llm] ${spec} failed: ${errMsg(e)}`);
    };

    if (strategy === "race" && candidates.length > 1) {
        const controller = new AbortController();
        try {
            const winner = await Promise.any(
                candidates.map((c) =>
                    attempt(c, prompt, schema, accept, controller.signal).then(
                        (object) => ({ object, spec: c.spec }),
                        (e) => {
                            if (!controller.signal.aborted) fail(c.spec, e);
                            throw e;
                        },
                    ),
                ),
            );
            controller.abort(); // cancel the losers
            return { object: winner.object, modelSpec: winner.spec, attempts: candidates.length, durationMs: Date.now() - started };
        } catch {
            throw new AllModelsFailedError(failures);
        }
    }

    for (const [i, c] of candidates.entries()) {
        try {
            const object = await attempt(c, prompt, schema, accept);
            return { object, modelSpec: c.spec, attempts: i + 1, durationMs: Date.now() - started };
        } catch (e) {
            fail(c.spec, e);
        }
    }
    throw new AllModelsFailedError(failures);
}
