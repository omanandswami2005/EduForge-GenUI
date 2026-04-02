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
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Concept Mastery</h3>
            <div className="space-y-2">
                {concepts.map((c) => {
                    const key = Object.keys(bktStates).find((k) =>
                        k.includes(c.id.toLowerCase().replace(/\s+/g, "_"))
                    );
                    const state = key ? bktStates[key] : null;
                    const p = state?.pMastery ?? 0.2;
                    const pct = Math.round(p * 100);

                    return (
                        <div key={c.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-28 truncate" title={c.label}>
                                {c.label}
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
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
                            <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                    );
                })}
            </div>

            {concepts.length === 0 && (
                <p className="text-sm text-gray-400">No concepts loaded yet.</p>
            )}
        </div>
    );
}
