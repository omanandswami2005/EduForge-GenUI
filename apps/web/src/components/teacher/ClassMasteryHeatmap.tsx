"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ClassAnalytics {
    lessonId: string;
    students: { id: string; name: string }[];
    concepts: string[];
    matrix: Record<string, Record<string, { pMastery: number; mastered: boolean; attempts: number }>>;
}

// Same red/yellow/blue/green thresholds as the student-facing MasteryHUD, so
// the color language is consistent across student and teacher views.
function cellColor(state: { pMastery: number; mastered: boolean } | undefined) {
    if (!state) return "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600";
    if (state.mastered) return "bg-green-500 text-white";
    if (state.pMastery > 0.6) return "bg-blue-500 text-white";
    if (state.pMastery > 0.3) return "bg-yellow-400 text-gray-900";
    return "bg-red-400 text-white";
}

export function ClassMasteryHeatmap({ token, lessonId }: { token: string; lessonId: string }) {
    const [data, setData] = useState<ClassAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !lessonId) return;
        setLoading(true);
        api
            .getClassAnalytics(token, lessonId)
            .then((result) => setData(result))
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load class analytics"))
            .finally(() => setLoading(false));
    }, [token, lessonId]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <p className="text-sm text-gray-400 dark:text-gray-500">Loading class mastery...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <p className="text-sm text-red-500 dark:text-red-400">Class analytics unavailable: {error}</p>
            </div>
        );
    }

    if (!data || data.students.length === 0 || data.concepts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Class Mastery</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                    No student activity yet — the heatmap fills in as students answer questions.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Mastery</h3>
            <div className="overflow-x-auto">
                <table className="border-separate border-spacing-1">
                    <thead>
                        <tr>
                            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pr-3 pb-1">
                                Student
                            </th>
                            {data.concepts.map((c) => (
                                <th
                                    key={c}
                                    className="text-xs font-medium text-gray-500 dark:text-gray-400 pb-1 px-1 max-w-[6rem] truncate"
                                    title={c}
                                >
                                    {c}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.students.map((s) => (
                            <tr key={s.id}>
                                <td className="text-sm text-gray-700 dark:text-gray-300 pr-3 whitespace-nowrap">
                                    {s.name}
                                </td>
                                {data.concepts.map((c) => {
                                    const state = data.matrix[s.id]?.[c];
                                    return (
                                        <td key={c}>
                                            <div
                                                className={`w-14 h-8 rounded flex items-center justify-center text-xs font-medium ${cellColor(state)}`}
                                                title={
                                                    state
                                                        ? `${s.name} · ${c}: ${Math.round(state.pMastery * 100)}% mastery (${state.attempts} attempts)`
                                                        : `${s.name} · ${c}: no attempts yet`
                                                }
                                            >
                                                {state ? `${Math.round(state.pMastery * 100)}%` : "—"}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Struggling</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Developing</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Proficient</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Mastered</span>
            </div>
        </div>
    );
}
