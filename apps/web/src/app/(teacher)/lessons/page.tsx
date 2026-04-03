"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { api } from "@/lib/api";

interface Lesson {
    id: string;
    title: string;
    subject: string;
    status: string;
    createdAt: string;
    ingestion?: { step: string; progress: number; message: string; subtopicsFound?: number; mcqsGenerated?: number };
}

export default function TeacherLessonsPage() {
    const { token, loading } = useSessionStore();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading2, setLoading2] = useState(true);

    useEffect(() => {
        if (!loading && token) {
            api.getTeacherLessons(token)
                .then(setLessons)
                .catch(console.error)
                .finally(() => setLoading2(false));
        }
    }, [loading, token]);

    const statusColor = (status: string) => {
        switch (status) {
            case "published": return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300";
            case "processing": return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300";
            case "failed": return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300";
            default: return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
        }
    };

    return (
        <main className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Lessons</h2>
                <Link
                    href="/lessons/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    + New Lesson
                </Link>
            </div>

            {loading2 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading lessons...</div>
            ) : lessons.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No lessons yet. Upload your first presentation!</p>
                    <Link href="/lessons/new" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Create Lesson
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {lessons.map((lesson) => (
                        <Link
                            key={lesson.id}
                            href={`/lessons/${lesson.id}`}
                            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{lesson.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.subject}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(lesson.status)}`}>
                                    {lesson.status}
                                </span>
                            </div>
                            {lesson.ingestion && lesson.status === "processing" && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        <span>{lesson.ingestion.message}</span>
                                        <span>{lesson.ingestion.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${lesson.ingestion.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {lesson.ingestion?.step === "complete" && (
                                <div className="mt-3 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{lesson.ingestion.subtopicsFound} subtopics</span>
                                    <span>{lesson.ingestion.mcqsGenerated} MCQs</span>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
