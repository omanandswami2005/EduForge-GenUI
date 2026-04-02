"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { useBKTState } from "@/hooks/useBKTState";
import { api } from "@/lib/api";

export default function LessonLearnPage() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const { user, token } = useSessionStore();
    const [subtopics, setSubtopics] = useState<any[]>([]);
    const [lesson, setLesson] = useState<any>(null);
    const bktStates = useBKTState(user?.uid || "", lessonId);

    useEffect(() => {
        if (token && lessonId) {
            api.getLesson(token, lessonId).then(setLesson).catch(console.error);
            api.getSubtopics(token, lessonId).then(setSubtopics).catch(console.error);
        }
    }, [token, lessonId]);

    const getSubtopicMastery = (subtopic: any) => {
        const concepts = subtopic.keyConcepts || [];
        if (concepts.length === 0) return 0;
        const total = concepts.reduce((sum: number, c: string) => {
            const key = Object.keys(bktStates).find((k) => k.includes(c.toLowerCase().replace(/\s+/g, "_")));
            return sum + (key ? bktStates[key].pMastery : 0.2);
        }, 0);
        return total / concepts.length;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-3">
                <h1 className="text-xl font-bold">
                    Edu<span className="text-blue-600">Forge</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">
                        {lesson?.title || "Loading..."}
                    </span>
                </h1>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{lesson?.title}</h2>
                <p className="text-gray-500 mb-8">{lesson?.subject}</p>

                <div className="space-y-4">
                    {subtopics.map((st: any, idx: number) => {
                        const mastery = getSubtopicMastery(st);
                        const masteryPct = Math.round(mastery * 100);

                        return (
                            <Link
                                key={st.id || idx}
                                href={`/learn/${lessonId}/${st.id}`}
                                className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {idx + 1}. {st.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">{st.description}</p>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">{masteryPct}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
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
        </div>
    );
}
