"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { useBKTState } from "@/hooks/useBKTState";
import { api } from "@/lib/api";
import { ConceptDependencyGraph, UNLOCK_THRESHOLD } from "@/components/student/ConceptDependencyGraph";
import { Lock } from "lucide-react";
import { LoadingState, PageHeader, ProgressBar, cardClass } from "@/components/ui";
import { masteryTone } from "@/lib/design";

export default function LessonLearnPage() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const { user, token, loading } = useSessionStore();
    const [subtopics, setSubtopics] = useState<any[]>([]);
    const [lesson, setLesson] = useState<any>(null);
    const bktStates = useBKTState(user?.uid || "", lessonId);

    useEffect(() => {
        if (!loading && token && lessonId) {
            api.getLesson(token, lessonId).then(setLesson).catch(console.error);
            api.getSubtopics(token, lessonId).then(setSubtopics).catch(console.error);
        }
    }, [loading, token, lessonId]);

    const getSubtopicMastery = (subtopic: any) => {
        const concepts = subtopic.keyConcepts || [];
        if (concepts.length === 0) return 0;
        const total = concepts.reduce((sum: number, c: string) => {
            const normalized = c.toLowerCase().replace(/\s+/g, "_");
            const state = bktStates[c] || bktStates[normalized] ||
                Object.values(bktStates).find((s) =>
                    s.conceptId.toLowerCase().replace(/\s+/g, "_") === normalized
                );
            return sum + (state ? state.pMastery : 0.2);
        }, 0);
        return total / concepts.length;
    };

    // Computed once per subtopics/bktStates change — feeds both the
    // dependency graph and the prerequisite-lock check below, so they can
    // never disagree about a subtopic's mastery.
    const masteryBySubtopic = useMemo(() => {
        const map: Record<string, number> = {};
        for (const st of subtopics) map[st.id] = getSubtopicMastery(st);
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtopics, bktStates]);

    const byId = useMemo(() => new Map(subtopics.map((s: any) => [s.id, s])), [subtopics]);

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            {lesson ? (
                <PageHeader eyebrow={lesson.subject || "Lesson"} title={lesson.title} />
            ) : (
                <LoadingState label="Loading lesson..." />
            )}

            {subtopics.length > 0 && (
                <ConceptDependencyGraph subtopics={subtopics} masteryBySubtopic={masteryBySubtopic} />
            )}

            {/* 2-up on wide screens — reading order (1,2 / 3,4 / ...) still tracks the
                curriculum sequence since subtopics are numbered explicitly below. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {subtopics.map((st: any, idx: number) => {
                    const mastery = masteryBySubtopic[st.id] ?? 0;
                    const masteryPct = Math.round(mastery * 100);

                    const prereqIds: string[] = st.prerequisiteSubtopicIds ?? [];
                    const unmetPrereqs = prereqIds
                        .map((id) => byId.get(id))
                        .filter((prereq: any) => prereq && (masteryBySubtopic[prereq.id] ?? 0) < UNLOCK_THRESHOLD);
                    const locked = unmetPrereqs.length > 0;

                    const cardContent = (
                        <>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-fg flex items-center gap-2">
                                        {locked && <Lock className="size-4 text-fg-faint shrink-0" />}
                                        <span className="font-mono text-fg-faint">{String(idx + 1).padStart(2, "0")}</span>
                                        {st.title}
                                    </h3>
                                    <p className="text-sm text-fg-subtle mt-1">{st.description}</p>
                                    {locked && (
                                        <p className="text-xs text-warning mt-1.5">
                                            Complete {unmetPrereqs.map((p: any) => p.title).join(", ")} first
                                            (reach {Math.round(UNLOCK_THRESHOLD * 100)}% mastery)
                                        </p>
                                    )}
                                </div>
                                <span className="text-sm font-mono font-medium text-fg-muted shrink-0 ml-2">{masteryPct}%</span>
                            </div>
                            <ProgressBar value={masteryPct} tone={locked ? "neutral" : masteryTone(mastery)} />
                        </>
                    );

                    if (locked) {
                        return (
                            <div
                                key={st.id || idx}
                                className="block bg-surface-2/50 rounded-xl border border-dashed border-line-strong p-5 cursor-not-allowed opacity-75"
                                title={`Locked — complete ${unmetPrereqs.map((p: any) => p.title).join(", ")} first`}
                            >
                                {cardContent}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={st.id || idx}
                            href={`/learn/${lessonId}/${st.id}`}
                            className={cardClass(true, "p-5")}
                        >
                            {cardContent}
                        </Link>
                    );
                })}
            </div>
        </main>
    );
}
