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

    if (!lesson) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

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
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
                        <p className="text-gray-500">{lesson.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
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

                {/* Share lesson ID for student enrollment */}
                {lesson.status === "published" && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">Share with students</p>
                            <p className="text-xs text-blue-600 font-mono">{id}</p>
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
    );
}
