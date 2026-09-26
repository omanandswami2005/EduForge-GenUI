"use client";

import { useOverallMastery } from "@/hooks/useOverallMastery";
import { ProgressBar } from "@/components/ui";
import { masteryTone } from "@/lib/design";

/**
 * Cross-lesson mastery summary — unlike the per-lesson subtopic view, this
 * aggregates every concept a student has ever practiced, across every
 * lesson they're enrolled in, into one glance.
 */
export function OverallMasteryPanel({
    studentId,
    lessons,
}: {
    studentId: string;
    lessons: { id: string; title: string; subject?: string }[];
}) {
    const { perLesson, overallAvgMastery, totalConcepts, totalMastered } = useOverallMastery(studentId);

    if (totalConcepts === 0) return null;

    const lessonRows = lessons
        .map((lesson) => ({ lesson, summary: perLesson[lesson.id] }))
        .filter((row) => row.summary);

    return (
        <div className="bg-surface rounded-xl border border-line p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h3 className="text-base font-semibold text-fg">Overall Mastery</h3>
                <div className="flex items-center gap-4 text-xs font-mono text-fg-subtle">
                    <span>{totalConcepts} concepts practiced</span>
                    <span>{totalMastered} mastered</span>
                    <span className="font-medium text-fg">
                        {Math.round(overallAvgMastery * 100)}% average
                    </span>
                </div>
            </div>

            {lessonRows.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {lessonRows.map(({ lesson, summary }) => (
                        <div
                            key={lesson.id}
                            className="border border-line rounded-lg p-3"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-fg truncate">
                                    {lesson.title}
                                </span>
                                <span className="text-xs text-fg-subtle shrink-0 ml-2">
                                    {Math.round(summary.avgMastery * 100)}%
                                </span>
                            </div>
                            <ProgressBar
                                value={Math.round(summary.avgMastery * 100)}
                                tone={masteryTone(summary.avgMastery)}
                                size="sm"
                            />
                            <p className="text-xs text-fg-faint mt-1">
                                {summary.masteredCount}/{summary.conceptCount} concepts mastered
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
