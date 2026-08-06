"use client";

import { useOverallMastery } from "@/hooks/useOverallMastery";

function masteryColor(pMastery: number) {
    if (pMastery >= 0.95) return "bg-green-500";
    if (pMastery > 0.6) return "bg-blue-500";
    if (pMastery > 0.3) return "bg-yellow-500";
    return "bg-red-400";
}

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
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Mastery</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{totalConcepts} concepts practiced</span>
                    <span>{totalMastered} mastered</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round(overallAvgMastery * 100)}% average
                    </span>
                </div>
            </div>

            {lessonRows.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {lessonRows.map(({ lesson, summary }) => (
                        <div
                            key={lesson.id}
                            className="border border-gray-100 dark:border-gray-800 rounded-lg p-3"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {lesson.title}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                                    {Math.round(summary.avgMastery * 100)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${masteryColor(summary.avgMastery)}`}
                                    style={{ width: `${Math.round(summary.avgMastery * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {summary.masteredCount}/{summary.conceptCount} concepts mastered
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
