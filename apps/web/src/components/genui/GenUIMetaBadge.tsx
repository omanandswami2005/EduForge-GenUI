"use client";

import { LEVEL_NAMES } from "@/lib/genui-schema";
import type { GenUIMeta } from "@/hooks/useGenUI";

const LEVEL_COLORS = [
    "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
    "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900",
    "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900",
    "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900",
];

/**
 * Surfaces *why* the student is seeing this particular content, and how it
 * was produced — the BKT → scaffold decision that gated it, and the LLM call
 * that generated it. Meant to make the neuro-symbolic pipeline legible to a
 * viewer instead of just showing polished output with no visible reasoning.
 */
export function GenUIMetaBadge({ meta }: { meta: GenUIMeta }) {
    if (meta.scaffoldLevel === null && meta.modelUsed === null) return null;

    const levelName = meta.scaffoldLevelName
        ? meta.scaffoldLevelName.charAt(0).toUpperCase() + meta.scaffoldLevelName.slice(1)
        : meta.scaffoldLevel !== null
            ? LEVEL_NAMES[meta.scaffoldLevel]
            : null;

    return (
        <div className="flex items-center gap-2 flex-wrap text-xs mb-3">
            {meta.scaffoldLevel !== null && (
                <span
                    className={`px-2 py-1 rounded-full border font-medium ${LEVEL_COLORS[meta.scaffoldLevel] ?? LEVEL_COLORS[2]}`}
                    title="Scaffold level chosen by the BKT engine for this content — gates which component types the AI is allowed to generate"
                >
                    Scaffold {meta.scaffoldLevel}/4 · {levelName}
                    {meta.pMastery !== null && ` (${Math.round(meta.pMastery * 100)}% mastery)`}
                </span>
            )}
            {meta.servedFromCache ? (
                <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    Served from cache
                </span>
            ) : (
                (meta.modelUsed || meta.durationMs !== null) && (
                    <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                        {meta.durationMs !== null && `Generated in ${(meta.durationMs / 1000).toFixed(1)}s`}
                        {meta.durationMs !== null && meta.modelUsed && " · "}
                        {meta.modelUsed && `via Groq (${meta.modelUsed})`}
                    </span>
                )
            )}
        </div>
    );
}
