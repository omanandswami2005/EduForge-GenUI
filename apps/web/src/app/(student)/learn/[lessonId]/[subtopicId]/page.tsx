"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button, Eyebrow, buttonVariants } from "@/components/ui";
import { useSessionStore } from "@/stores/sessionStore";
import { useBKTStore } from "@/stores/bktStore";
import { useGenUI } from "@/hooks/useGenUI";
import { api } from "@/lib/api";
import { AdaptiveMCQ } from "@/components/student/AdaptiveMCQ";
import { MasteryHUD } from "@/components/student/MasteryHUD";
import { GenUIRenderer } from "@/components/genui/GenUIRenderer";
import { GenUIMetaBadge } from "@/components/genui/GenUIMetaBadge";
import { ScaffoldComparisonView } from "@/components/genui/ScaffoldComparisonView";

export default function SubtopicLearnPage() {
    const { lessonId, subtopicId } = useParams<{ lessonId: string; subtopicId: string }>();
    const { user, token, loading } = useSessionStore();
    const [mcqs, setMcqs] = useState<any[]>([]);
    const [currentMCQIdx, setCurrentMCQIdx] = useState(0);
    const [bktResult, setBktResult] = useState<any>(null);
    const [subtopic, setSubtopic] = useState<any>(null);

    const studentId = user?.uid || "";
    const { components, isStreaming, generate, meta } = useGenUI(studentId);

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
        // Pass the full subtopic title so the AI has proper domain context
        generate(conceptId, subtopicId, lessonId, false, subtopic.title);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtopic, subtopicId, lessonId]);

    const handleAnswer = useCallback(
        async (answer: string, isCorrect: boolean, timeTaken: number, misconceptionText?: string) => {
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
                    misconception_text: misconceptionText,
                });
                setBktResult(result);

                const scaffoldChanged = result.scaffold_level !== useBKTStore.getState().scaffoldLevel;
                if (scaffoldChanged) {
                    useBKTStore.getState().setScaffoldDecision(
                        result.scaffold_level,
                        result.allowed_components
                    );
                }
                // Regenerate when the scaffold level moved, OR when this wrong
                // answer revealed a specific misconception — the latter closes
                // the loop: the misconception text (already known client-side
                // from the MCQ's own authored data) gets threaded straight into
                // the next generation's prompt so it's directly addressed,
                // rather than only ever being displayed in the reveal panel.
                if (scaffoldChanged || misconceptionText) {
                    generate(mcq.concept, subtopicId, lessonId, true, subtopic?.title, undefined, misconceptionText);
                }
            } catch (err) {
                console.error("BKT update failed:", err);
            }
        },
        // generate is stable so safe to include; remove from eslint check
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [token, studentId, mcqs, currentMCQIdx, subtopicId, lessonId, subtopic]
    );

    const nextQuestion = () => {
        if (currentMCQIdx < mcqs.length - 1) {
            setCurrentMCQIdx((i) => i + 1);
            setBktResult(null);
        }
    };

    const currentMCQ = mcqs[currentMCQIdx];

    return (
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Breadcrumb / back link */}
            <div className="mb-6">
                <Link
                    href={`/learn/${lessonId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-fg-subtle hover:text-accent transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    Back to lesson
                </Link>
                {subtopic && (
                    <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-fg">
                        {subtopic.title}
                    </h1>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: GenUI Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface rounded-xl border border-line p-6">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <Eyebrow tone="accent" className="flex items-center gap-2">
                                <Sparkles className="size-3.5" />
                                AI Visualization
                                {isStreaming && (
                                    <span className="normal-case tracking-normal text-fg-subtle animate-pulse">
                                        generating...
                                    </span>
                                )}
                            </Eyebrow>
                            {/* Link to saved visualizations */}
                            {studentId && (
                                <Link
                                    href={`/learn/${lessonId}/${subtopicId}/visualizations`}
                                    className="text-xs font-mono text-fg-subtle hover:text-accent transition-colors"
                                >
                                    View saved visualizations →
                                </Link>
                            )}
                        </div>
                        <GenUIMetaBadge meta={meta} />
                        <GenUIRenderer components={components} />
                    </div>

                    {subtopic && studentId && (
                        <ScaffoldComparisonView
                            studentId={studentId}
                            conceptId={subtopic?.keyConcepts?.[0] ?? subtopic.title}
                            subtopicId={subtopicId}
                            lessonId={lessonId}
                            subtopicTitle={subtopic.title}
                        />
                    )}

                    {/* MCQ Section */}
                    {currentMCQ && (
                        <div className="bg-surface rounded-xl border border-line p-6">
                            <div className="flex items-center justify-between mb-4">
                                <Eyebrow>
                                    Question {currentMCQIdx + 1} of {mcqs.length}
                                </Eyebrow>
                            </div>
                            <AdaptiveMCQ
                                key={currentMCQ.id}
                                question={currentMCQ}
                                onAnswer={handleAnswer}
                                bktUpdateResult={bktResult}
                            />
                            {bktResult && currentMCQIdx < mcqs.length - 1 && (
                                <Button onClick={nextQuestion} className="mt-4">
                                    Next Question
                                    <ArrowRight className="size-4" />
                                </Button>
                            )}
                            {bktResult && currentMCQIdx === mcqs.length - 1 && (
                                <div className="mt-4 flex gap-3">
                                    <Link href={`/learn/${lessonId}`} className={buttonVariants()}>
                                        <ArrowLeft className="size-4" />
                                        Back to Lesson
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Mastery HUD — sticky so it stays useful while the (much
                    taller) left column scrolls, instead of scrolling away and
                    leaving the sidebar empty. */}
                <div className="lg:sticky lg:top-24 lg:self-start">
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
