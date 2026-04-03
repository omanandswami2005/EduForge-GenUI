"use client";

import { useBKTState } from "@/hooks/useBKTState";

export function MasteryHUD({
    studentId,
    lessonId,
    concepts,
}: {
    studentId: string;
    lessonId: string;
    concepts: { id: string; label: string }[];
}) {
    const bktStates = useBKTState(studentId, lessonId);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Concept Mastery</h3>
            <div className="space-y-2">
                {concepts.map((c) => {
                    const normalized = c.id.toLowerCase().replace(/\s+/g, "_");
                    const state = bktStates[c.id] || bktStates[normalized] ||
                        Object.values(bktStates).find((s) =>
                            s.conceptId.toLowerCase().replace(/\s+/g, "_") === normalized
                        ) || null;
                    const p = state?.pMastery ?? 0.2;
                    const pct = Math.round(p * 100);

                    return (
                        <div key={c.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-28 truncate" title={c.label}>
                                {c.label}
                            </span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${state?.mastered
                                        ? "bg-green-500"
                                        : p > 0.6
                                            ? "bg-blue-500"
                                            : p > 0.3
                                                ? "bg-yellow-500"
                                                : "bg-red-400"
                                        }`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{pct}%</span>
                        </div>
                    );
                })}
            </div>

            {concepts.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">No concepts loaded yet.</p>
            )}
        </div>
    );
}
