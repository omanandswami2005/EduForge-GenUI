"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { masteryTone, toneStyles, type Tone } from "@/lib/design";

interface ClassAnalytics {
    lessonId: string;
    students: { id: string; name: string }[];
    concepts: string[];
    matrix: Record<string, Record<string, { pMastery: number; mastered: boolean; attempts: number }>>;
}

// masteryTone() is shared with the student-facing MasteryHUD, so the color
// language is consistent across student and teacher views.
function cellColor(state: { pMastery: number; mastered: boolean } | undefined) {
    if (!state) return "bg-surface-2 text-fg-faint";
    return toneStyles[masteryTone(state.pMastery, state.mastered)].solid;
}

const LEGEND: [Tone, string][] = [
    ["danger", "Struggling"],
    ["warning", "Developing"],
    ["info", "Proficient"],
    ["success", "Mastered"],
];

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
            <div className="bg-surface rounded-xl border border-line p-6">
                <p className="text-sm text-fg-faint">Loading class mastery...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-surface rounded-xl border border-line p-6">
                <p className="text-sm text-danger">Class analytics unavailable: {error}</p>
            </div>
        );
    }

    if (!data || data.students.length === 0 || data.concepts.length === 0) {
        return (
            <div className="bg-surface rounded-xl border border-line p-6">
                <h3 className="text-base font-semibold text-fg mb-1">Class Mastery</h3>
                <p className="text-sm text-fg-faint">
                    No student activity yet — the heatmap fills in as students answer questions.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-xl border border-line p-6">
            <h3 className="text-base font-semibold text-fg mb-4">Class Mastery</h3>
            <div className="overflow-x-auto">
                <table className="border-separate border-spacing-1">
                    <thead>
                        <tr>
                            <th className="text-left text-xs font-medium text-fg-subtle pr-3 pb-1">
                                Student
                            </th>
                            {data.concepts.map((c) => (
                                <th
                                    key={c}
                                    className="text-xs font-medium text-fg-subtle pb-1 px-1 max-w-[6rem] truncate"
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
                                <td className="text-sm text-fg-muted pr-3 whitespace-nowrap">
                                    {s.name}
                                </td>
                                {data.concepts.map((c) => {
                                    const state = data.matrix[s.id]?.[c];
                                    return (
                                        <td key={c}>
                                            <div
                                                className={`w-14 h-8 rounded flex items-center justify-center text-xs font-mono font-medium ${cellColor(state)}`}
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
            <div className="flex items-center flex-wrap gap-4 mt-4 text-xs font-mono text-fg-subtle">
                {LEGEND.map(([tone, label]) => (
                    <span key={label} className="flex items-center gap-1.5">
                        <span className={`size-3 rounded inline-block ${toneStyles[tone].solid}`} /> {label}
                    </span>
                ))}
            </div>
        </div>
    );
}
