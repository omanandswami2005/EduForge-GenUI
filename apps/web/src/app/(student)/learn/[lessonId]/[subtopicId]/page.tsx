"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { useBKTStore } from "@/stores/bktStore";
import { useGenUI } from "@/hooks/useGenUI";
import { api } from "@/lib/api";
import { AdaptiveMCQ } from "@/components/student/AdaptiveMCQ";
import { MasteryHUD } from "@/components/student/MasteryHUD";
import { GenUIRenderer } from "@/components/genui/GenUIRenderer";

export default function SubtopicLearnPage() {
    const { lessonId, subtopicId } = useParams<{ lessonId: string; subtopicId: string }>();
    const { user, token, loading } = useSessionStore();
    const [mcqs, setMcqs] = useState<any[]>([]);
    const [currentMCQIdx, setCurrentMCQIdx] = useState(0);
    const [bktResult, setBktResult] = useState<any>(null);
    const [subtopic, setSubtopic] = useState<any>(null);

    const studentId = user?.uid || "";
    const { components, isStreaming, error: genUIError, generate } = useGenUI(studentId);

    useEffect(() => {
        if (!loading && token && lessonId && subtopicId) {
            api.getMCQs(token, lessonId, subtopicId).then(setMcqs).catch(console.error);
            api.getSubtopics(token, lessonId).then((subs) => {
                const st = subs.find((s: any) => s.id === subtopicId);
                if (st) setSubtopic(st);
            }).catch(console.error);
        }
    }, [loading, token, lessonId, subtopicId]);

    // Generate initial visualization — only fires when subtopic loads.
    // generate() is stable (never changes identity) so it is intentionally
    // omitted from deps to avoid re-firing on every render.
    useEffect(() => {
        if (!subtopic || !subtopicId) return;
        // Use first keyConcept, fall back to subtopic title as conceptId
        const conceptId = subtopic?.keyConcepts?.[0] ?? subtopic.title;
        generate(conceptId, subtopicId, lessonId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtopic, subtopicId, lessonId]);

    const handleAnswer = useCallback(
        async (answer: string, isCorrect: boolean, timeTaken: number) => {
            if (!token || !studentId) return;
            const mcq = mcqs[currentMCQIdx];
            try {
                const result = await api.updateBKT(token, {
                    student_id: studentId,
                    concept_id: mcq.concept,
                    subtopic_id: subtopicId,
                    lesson_id: lessonId,
                    mcq_id: mcq.id,
                    selected_answer: answer,
                    is_correct: isCorrect,
                    time_taken_seconds: timeTaken,
                });
                setBktResult(result);

                // If scaffold level changed, force-refresh GenUI with new scaffold
                if (result.scaffold_level !== useBKTStore.getState().scaffoldLevel) {
                    useBKTStore.getState().setScaffoldDecision(
                        result.scaffold_level,
                        result.allowed_components
                    );
                    generate(mcq.concept, subtopicId, lessonId, true); // forceRefresh=true
                }
            } catch (err) {
                console.error("BKT update failed:", err);
            }
        },
        // generate is stable so safe to include; remove from eslint check
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [token, studentId, mcqs, currentMCQIdx, subtopicId, lessonId]
    );

    const nextQuestion = () => {
        if (currentMCQIdx < mcqs.length - 1) {
            setCurrentMCQIdx((i) => i + 1);
            setBktResult(null);
        }
    };

    const currentMCQ = mcqs[currentMCQIdx];

    return (
        <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: GenUI Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            AI Visualization
                            {isStreaming && (
                                <span className="ml-2 text-sm font-normal text-blue-500 animate-pulse">
                                    Generating...
                                </span>
                            )}
                        </h3>
                        {genUIError && (
                            <p className="text-sm text-red-500 dark:text-red-400 mb-3">
                                Visualization unavailable: {genUIError}
                            </p>
                        )}
                        <GenUIRenderer components={components} />
                    </div>

                    {/* MCQ Section */}
                    {currentMCQ && (
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Question {currentMCQIdx + 1} of {mcqs.length}
                                </h3>
                            </div>
                            <AdaptiveMCQ
                                key={currentMCQ.id}
                                question={currentMCQ}
                                onAnswer={handleAnswer}
                                bktUpdateResult={bktResult}
                            />
                            {bktResult && currentMCQIdx < mcqs.length - 1 && (
                                <button
                                    onClick={nextQuestion}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                                >
                                    Next Question →
                                </button>
                            )}
                            {bktResult && currentMCQIdx === mcqs.length - 1 && (
                                <div className="mt-4 flex gap-3">
                                    <Link
                                        href={`/learn/${lessonId}`}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                                    >
                                        ← Back to Lesson
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Mastery HUD */}
                <div>
                    <MasteryHUD
                        studentId={studentId}
                        lessonId={lessonId}
                        concepts={subtopic?.keyConcepts?.map((c: string) => ({ id: c, label: c })) || []}
                    />
                </div>
            </div>
        </main>
    );
}
