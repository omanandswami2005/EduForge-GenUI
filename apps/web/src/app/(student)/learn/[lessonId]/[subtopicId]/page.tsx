"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSessionStore } from "@/stores/sessionStore";
import { useBKTStore } from "@/stores/bktStore";
import { useGenUI } from "@/hooks/useGenUI";
import { api } from "@/lib/api";
import { AdaptiveMCQ } from "@/components/student/AdaptiveMCQ";
import { MasteryHUD } from "@/components/student/MasteryHUD";
import { GenUIRenderer } from "@/components/genui/GenUIRenderer";

export default function SubtopicLearnPage() {
    const { lessonId, subtopicId } = useParams<{ lessonId: string; subtopicId: string }>();
    const { user, token } = useSessionStore();
    const [mcqs, setMcqs] = useState<any[]>([]);
    const [currentMCQIdx, setCurrentMCQIdx] = useState(0);
    const [bktResult, setBktResult] = useState<any>(null);
    const [subtopic, setSubtopic] = useState<any>(null);

    const studentId = user?.uid || "";
    const { components, isStreaming, generate } = useGenUI(studentId);

    useEffect(() => {
        if (token && lessonId && subtopicId) {
            api.getMCQs(token, lessonId, subtopicId).then(setMcqs).catch(console.error);
            api.getSubtopics(token, lessonId).then((subs) => {
                const st = subs.find((s: any) => s.id === subtopicId);
                if (st) setSubtopic(st);
            }).catch(console.error);
        }
    }, [token, lessonId, subtopicId]);

    // Generate initial visualization
    useEffect(() => {
        if (subtopic?.keyConcepts?.[0] && subtopicId) {
            generate(subtopic.keyConcepts[0], subtopicId, lessonId);
        }
    }, [subtopic, subtopicId, lessonId, generate]);

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

                // If scaffold level changed, regenerate GenUI
                if (result.scaffold_level !== useBKTStore.getState().scaffoldLevel) {
                    useBKTStore.getState().setScaffoldDecision(
                        result.scaffold_level,
                        result.allowed_components
                    );
                    generate(mcq.concept, subtopicId, lessonId);
                }
            } catch (err) {
                console.error("BKT update failed:", err);
            }
        },
        [token, studentId, mcqs, currentMCQIdx, subtopicId, lessonId, generate]
    );

    const nextQuestion = () => {
        if (currentMCQIdx < mcqs.length - 1) {
            setCurrentMCQIdx((i) => i + 1);
            setBktResult(null);
        }
    };

    const currentMCQ = mcqs[currentMCQIdx];

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-3">
                <h1 className="text-xl font-bold">
                    Edu<span className="text-blue-600">Forge</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">
                        {subtopic?.title || "Loading..."}
                    </span>
                </h1>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: GenUI Visualization */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                AI Visualization
                                {isStreaming && (
                                    <span className="ml-2 text-sm font-normal text-blue-500 animate-pulse">
                                        Generating...
                                    </span>
                                )}
                            </h3>
                            <GenUIRenderer components={components} />
                        </div>

                        {/* MCQ Section */}
                        {currentMCQ && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Question {currentMCQIdx + 1} of {mcqs.length}
                                    </h3>
                                </div>
                                <AdaptiveMCQ
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
        </div>
    );
}
