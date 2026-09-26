/**
 * LLM provider registry.
 *
 * Models are addressed as "<provider>:<model-id>", e.g.
 *   groq:openai/gpt-oss-120b
 *   openrouter:nvidia/nemotron-3-super-120b-a12b:free
 * (only the first ":" separates provider from model — OpenRouter ids contain ":free").
 *
 * Adding a provider = one entry in PROVIDERS. A provider whose API key isn't
 * configured is skipped automatically, so the same chain works on machines
 * that only have one of the keys.
 */
import type { LanguageModel } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export interface ProviderDef {
    /** Env var holding the API key; the provider is disabled when it's unset */
    apiKeyEnv: string;
    create: (apiKey: string) => (modelId: string) => LanguageModel;
    /** Provider-specific request options (passed as providerOptions[name]) */
    options?: Record<string, unknown>;
    /**
     * Provider runs in plain JSON mode (no native schema enforcement), so the
     * schema must be spelled out in the prompt — see generateStructured().
     */
    jsonMode?: boolean;
    /** Per-attempt timeout; free-tier queues are much slower than paid ones */
    timeoutMs: number;
}

export const PROVIDERS: Record<string, ProviderDef> = {
    groq: {
        apiKeyEnv: "GROQ_API_KEY",
        create: (apiKey) => {
            const groq = createGroq({ apiKey });
            return (id) => groq(id);
        },
        // Groq's strict server-side schema check intermittently rejects valid
        // attempts and returns *nothing* ("expected object, but got string").
        // JSON mode + our own zod validation lets us see and retry the output.
        options: { structuredOutputs: false },
        jsonMode: true,
        timeoutMs: 25_000,
    },
    openrouter: {
        apiKeyEnv: "OPENROUTER_API_KEY",
        create: (apiKey) => {
            const openrouter = createOpenAICompatible({
                name: "openrouter",
                baseURL: "https://openrouter.ai/api/v1",
                apiKey,
                supportsStructuredOutputs: true,
                headers: {
                    // Attribution headers OpenRouter uses for app rankings
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                    "X-Title": "EduForge",
                },
            });
            return (id) => openrouter.chatModel(id);
        },
        // Spread into the request body. Free reasoning models otherwise spend
        // most of their (slow, queued) budget thinking before emitting JSON.
        options: { reasoning: { effort: "low", exclude: true } },
        timeoutMs: 85_000,
    },
};

export interface ResolvedModel {
    spec: string;
    provider: string;
    modelId: string;
    model: LanguageModel;
    providerOptions?: Record<string, Record<string, unknown>>;
    jsonMode: boolean;
    timeoutMs: number;
}

const cache = new Map<string, (modelId: string) => LanguageModel>();

/** "provider:model" → a callable model, or null if the provider is unknown/unconfigured. */
export function resolveModel(spec: string): ResolvedModel | null {
    const idx = spec.indexOf(":");
    if (idx <= 0) return null;
    const provider = spec.slice(0, idx).trim();
    const modelId = spec.slice(idx + 1).trim();
    const def = PROVIDERS[provider];
    const apiKey = def && process.env[def.apiKeyEnv];
    if (!def || !apiKey || !modelId) return null;

    if (!cache.has(provider)) cache.set(provider, def.create(apiKey));
    return {
        spec,
        provider,
        modelId,
        model: cache.get(provider)!(modelId),
        providerOptions: def.options ? { [provider]: def.options } : undefined,
        jsonMode: Boolean(def.jsonMode),
        timeoutMs: def.timeoutMs,
    };
}

/** Parse a comma-separated chain, dropping blanks, duplicates, and unconfigured providers. */
export function resolveChain(specs: string): ResolvedModel[] {
    const seen = new Set<string>();
    return specs
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && !seen.has(s) && seen.add(s))
        .map(resolveModel)
        .filter((m): m is ResolvedModel => m !== null);
}
