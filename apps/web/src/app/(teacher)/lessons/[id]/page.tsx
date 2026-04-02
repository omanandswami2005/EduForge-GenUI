"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSessionStore } from "@/stores/sessionStore";
import { api } from "@/lib/api";

export default function LessonDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useSessionStore();
    const [lesson, setLesson] = useState<any>(null);
    const [subtopics, setSubtopics] = useState<any[]>([]);

    // Real-time listener for lesson (ingestion status updates)
    useEffect(() => {
        if (!id) return;
        const unsub = onSnapshot(doc(db, "lessons", id), (snap) => {
            if (snap.exists()) setLesson({ id: snap.id, ...snap.data() });
        });
        return unsub;
    }, [id]);

    // Load subtopics when lesson is published
    useEffect(() => {
        if (lesson?.status === "published" && token) {
            api.getSubtopics(token, id).then(setSubtopics).catch(console.error);
        }
    }, [lesson?.status, token, id]);

    if (!lesson) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-3">
                <h1 className="text-xl font-bold">
                    Edu<span className="text-blue-600">Forge</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">{lesson.title}</span>
                </h1>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
                            <p className="text-gray-500">{lesson.subject}</p>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${lesson.status === "published"
                                ? "bg-green-100 text-green-800"
                                : lesson.status === "processing"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                        >
                            {lesson.status}
                        </span>
                    </div>

                    {/* Ingestion progress */}
                    {lesson.ingestion && lesson.status === "processing" && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                                <span>{lesson.ingestion.message}</span>
                                <span>{lesson.ingestion.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${lesson.ingestion.progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {lesson.ingestion?.step === "complete" && (
                        <div className="mt-4 flex gap-4 text-sm text-gray-600">
                            <span>{lesson.ingestion.subtopicsFound} subtopics</span>
                            <span>{lesson.ingestion.mcqsGenerated} MCQs</span>
                        </div>
                    )}
                </div>

                {/* Subtopics list */}
                {subtopics.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics</h3>
                        <div className="space-y-3">
                            {subtopics.map((st: any, idx: number) => (
                                <div
                                    key={st.id || idx}
                                    className="bg-white rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                {idx + 1}. {st.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">{st.description}</p>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-medium ${st.difficulty === "foundational"
                                                ? "bg-green-100 text-green-700"
                                                : st.difficulty === "intermediate"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {st.difficulty}
                                        </span>
                                    </div>
                                    {st.keyConcepts && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {st.keyConcepts.map((c: string) => (
                                                <span
                                                    key={c}
                                                    className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                                                >
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
