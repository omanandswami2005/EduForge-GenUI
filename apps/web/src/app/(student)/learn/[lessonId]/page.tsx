"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { useBKTState } from "@/hooks/useBKTState";
import { api } from "@/lib/api";
import { ConceptDependencyGraph, UNLOCK_THRESHOLD } from "@/components/student/ConceptDependencyGraph";

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
        <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{lesson?.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{lesson?.subject}</p>

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
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        {locked && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400 shrink-0">
                                                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3h-.75a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3h-.75v-3C17.25 3.99 14.76 1.5 12 1.5Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        {idx + 1}. {st.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{st.description}</p>
                                    {locked && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                                            Complete {unmetPrereqs.map((p: any) => p.title).join(", ")} first
                                            (reach {Math.round(UNLOCK_THRESHOLD * 100)}% mastery)
                                        </p>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0 ml-2">{masteryPct}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${locked
                                        ? "bg-gray-400 dark:bg-gray-600"
                                        : mastery >= 0.8
                                            ? "bg-green-500"
                                            : mastery >= 0.5
                                                ? "bg-blue-500"
                                                : mastery >= 0.3
                                                    ? "bg-yellow-500"
                                                    : "bg-red-400"
                                        }`}
                                    style={{ width: `${masteryPct}%` }}
                                />
                            </div>
                        </>
                    );

                    if (locked) {
                        return (
                            <div
                                key={st.id || idx}
                                className="block bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-5 cursor-not-allowed opacity-75"
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
                            className="block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow"
                        >
                            {cardContent}
                        </Link>
                    );
                })}
            </div>
        </main>
    );
}
