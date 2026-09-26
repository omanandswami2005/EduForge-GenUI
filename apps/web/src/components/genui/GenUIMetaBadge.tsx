"use client";

import { LEVEL_NAMES } from "@/lib/genui-schema";
import type { GenUIMeta } from "@/hooks/useGenUI";
import { scaffoldTone, toneStyles } from "@/lib/design";

/** "groq:openai/gpt-oss-120b" → "Groq · gpt-oss-120b" */
function formatModel(spec: string) {
    const [provider, ...rest] = spec.split(":");
    if (!rest.length) return spec;
    const name = { groq: "Groq", openrouter: "OpenRouter" }[provider] ?? provider;
    const model = rest.join(":").split("/").pop()?.replace(/:free$/, "") ?? rest.join(":");
    return `${name} · ${model}`;
}

/**
 * Surfaces *why* the student is seeing this particular content, and how it
 * was produced — the BKT → scaffold decision that gated it, and the LLM call
 * that generated it. Meant to make the neuro-symbolic pipeline legible to a
 * viewer instead of just showing polished output with no visible reasoning.
 */
export function GenUIMetaBadge({ meta }: { meta: GenUIMeta }) {
    if (meta.scaffoldLevel === null && meta.modelUsed === null && !meta.servedFallback && !meta.servedFromCache) return null;

    const levelName = meta.scaffoldLevelName
        ? meta.scaffoldLevelName.charAt(0).toUpperCase() + meta.scaffoldLevelName.slice(1)
        : meta.scaffoldLevel !== null
            ? LEVEL_NAMES[meta.scaffoldLevel]
            : null;

    return (
        <div className="flex items-center gap-2 flex-wrap text-xs mb-3">
            {meta.scaffoldLevel !== null && (
                <span
                    className={`px-2 py-1 rounded-full border font-mono font-medium ${toneStyles[scaffoldTone(meta.scaffoldLevel)].soft}`}
                    title="Scaffold level chosen by the BKT engine for this content — gates which component types the AI is allowed to generate"
                >
                    Scaffold {meta.scaffoldLevel}/4 · {levelName}
                    {meta.pMastery !== null && ` (${Math.round(meta.pMastery * 100)}% mastery)`}
                </span>
            )}
            {meta.servedFallback ? (
                <span
                    className="px-2 py-1 rounded-full border border-line font-mono text-fg-subtle"
                    title="Hand-authored content for this scaffold level, shown because live AI generation was unavailable"
                >
                    Curated content
                </span>
            ) : meta.servedFromCache ? (
                <span className="px-2 py-1 rounded-full border border-line font-mono text-fg-subtle">
                    Served from cache
                </span>
            ) : (
                (meta.modelUsed || meta.durationMs !== null) && (
                    <span className="px-2 py-1 rounded-full border border-line font-mono text-fg-subtle">
                        {meta.durationMs !== null && `Generated in ${(meta.durationMs / 1000).toFixed(1)}s`}
                        {meta.durationMs !== null && meta.modelUsed && " · "}
                        {meta.modelUsed && `via ${formatModel(meta.modelUsed)}`}
                    </span>
                )
            )}
        </div>
    );
}
