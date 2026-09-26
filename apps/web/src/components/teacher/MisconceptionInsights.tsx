"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface MisconceptionEntry {
    text: string;
    count: number;
}

interface ConceptMisconceptions {
    conceptId: string;
    totalFlagged: number;
    topMisconceptions: MisconceptionEntry[];
}

interface MisconceptionInsightsData {
    lessonId: string;
    responsesAnalyzed: number;
    wrongAnswers: number;
    byConcept: ConceptMisconceptions[];
}

/**
 * Content-difficulty signal a mastery-only view can't show: two concepts
 * can have identical average mastery for very different reasons. This
 * surfaces *what specifically* students keep getting wrong, ranked by how
 * often the same misconception recurs, so a teacher knows which piece of
 * content to actually revise.
 */
export function MisconceptionInsights({ token, lessonId }: { token: string; lessonId: string }) {
    const [data, setData] = useState<MisconceptionInsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !lessonId) return;
        setLoading(true);
        api
            .getMisconceptionInsights(token, lessonId)
            .then((result) => setData(result))
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load misconception insights"))
            .finally(() => setLoading(false));
    }, [token, lessonId]);

    if (loading) {
        return (
            <div className="bg-surface rounded-xl border border-line p-6">
                <p className="text-sm text-fg-faint">Loading misconception insights...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-surface rounded-xl border border-line p-6">
                <p className="text-sm text-danger">Misconception insights unavailable: {error}</p>
            </div>
        );
    }

    if (!data || data.byConcept.length === 0) {
        return (
            <div className="bg-surface rounded-xl border border-line p-6">
                <h3 className="text-base font-semibold text-fg mb-1">Common Misconceptions</h3>
                <p className="text-sm text-fg-faint">
                    No flagged misconceptions yet — fills in as students answer questions wrong.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-xl border border-line p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h3 className="text-base font-semibold text-fg">Common Misconceptions</h3>
                <span className="text-xs text-fg-subtle">
                    {data.wrongAnswers} wrong answers across {data.responsesAnalyzed} responses
                </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {data.byConcept.map((concept) => (
                    <div
                        key={concept.conceptId}
                        className="border border-line rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-fg">{concept.conceptId}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning">
                                {concept.totalFlagged} flagged
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {concept.topMisconceptions.map((m) => (
                                <li key={m.text} className="flex items-start gap-2 text-sm">
                                    <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-danger/15 text-danger text-xs font-medium">
                                        {m.count}×
                                    </span>
                                    <span className="text-fg-muted">{m.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
