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
    const [publishing, setPublishing] = useState(false);
    const [copied, setCopied] = useState(false);

    // Real-time listener for lesson (ingestion status updates)
    useEffect(() => {
        if (!id) return;
        const unsub = onSnapshot(doc(db, "lessons", id), (snap) => {
            if (snap.exists()) setLesson({ id: snap.id, ...snap.data() });
        });
        return unsub;
    }, [id]);

    // Load subtopics when lesson is published or ingestion is complete
    useEffect(() => {
        if ((lesson?.status === "published" || lesson?.ingestion?.step === "complete") && token) {
            api.getSubtopics(token, id).then(setSubtopics).catch(console.error);
        }
    }, [lesson?.status, lesson?.ingestion?.step, token, id]);

    if (!lesson) return <div className="flex items-center justify-center min-h-dvh text-gray-500 dark:text-gray-400">Loading...</div>;

    const handlePublish = async () => {
        if (!token) return;
        setPublishing(true);
        try {
            await api.publishLesson(token, id);
        } catch (err) {
            console.error(err);
        } finally {
            setPublishing(false);
        }
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="max-w-4xl mx-auto px-6 py-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{lesson.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${lesson.status === "published"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                                : lesson.status === "processing"
                                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                                }`}
                        >
                            {lesson.status}
                        </span>
                        {lesson.ingestion?.step === "complete" && lesson.status !== "published" && (
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {publishing ? "Publishing..." : "Publish"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Ingestion progress */}
                {lesson.ingestion && lesson.status === "processing" && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                            <span>{lesson.ingestion.message}</span>
                            <span>{lesson.ingestion.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${lesson.ingestion.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {lesson.ingestion?.step === "complete" && (
                    <div className="mt-4 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{lesson.ingestion.subtopicsFound} subtopics</span>
                        <span>{lesson.ingestion.mcqsGenerated} MCQs</span>
                    </div>
                )}

                {/* Share lesson ID for student enrollment */}
                {lesson.status === "published" && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Share with students</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">{id}</p>
                        </div>
                        <button
                            onClick={handleCopyId}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                        >
                            {copied ? "Copied!" : "Copy ID"}
                        </button>
                    </div>
                )}
            </div>

            {/* Subtopics list */}
            {subtopics.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Topics</h3>
                    <div className="space-y-3">
                        {subtopics.map((st: any, idx: number) => (
                            <div
                                key={st.id || idx}
                                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            {idx + 1}. {st.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{st.description}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${st.difficulty === "foundational"
                                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                            : st.difficulty === "intermediate"
                                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                                                : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
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
                                                className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-xs"
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
    );
}
