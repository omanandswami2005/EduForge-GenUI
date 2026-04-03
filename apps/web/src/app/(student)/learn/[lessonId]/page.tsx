"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { useBKTState } from "@/hooks/useBKTState";
import { api } from "@/lib/api";

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

    return (
        <main className="max-w-4xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{lesson?.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{lesson?.subject}</p>

            <div className="space-y-4">
                {subtopics.map((st: any, idx: number) => {
                    const mastery = getSubtopicMastery(st);
                    const masteryPct = Math.round(mastery * 100);

                    return (
                        <Link
                            key={st.id || idx}
                            href={`/learn/${lessonId}/${st.id}`}
                            className="block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {idx + 1}. {st.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{st.description}</p>
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{masteryPct}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${mastery >= 0.8
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
                        </Link>
                    );
                })}
            </div>
        </main>
    );
}
