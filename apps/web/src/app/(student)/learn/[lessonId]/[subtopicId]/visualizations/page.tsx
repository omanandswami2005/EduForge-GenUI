"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/stores/sessionStore";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { GenUIRenderer } from "@/components/genui/GenUIRenderer";

interface GenUIComponent {
    component: string;
    props: Record<string, unknown>;
}

interface SavedVisualization {
    components: GenUIComponent[];
    conceptId: string;
    updatedAt?: { seconds: number } | null;
}

export default function SavedVisualizationsPage() {
    const { lessonId, subtopicId } = useParams<{ lessonId: string; subtopicId: string }>();
    const { user, loading } = useSessionStore();
    const [visualization, setVisualization] = useState<SavedVisualization | null>(null);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (loading || !user?.uid || !subtopicId) return;

        setFetchLoading(true);
        const docRef = doc(db, "genui_cache", user.uid, "subtopics", subtopicId);
        getDoc(docRef)
            .then((snap) => {
                if (snap.exists()) {
                    setVisualization(snap.data() as SavedVisualization);
                } else {
                    setVisualization(null);
                }
            })
            .catch((err) => {
                setError(err.message ?? "Failed to load saved visualization");
            })
            .finally(() => setFetchLoading(false));
    }, [loading, user?.uid, subtopicId]);

    const formattedDate = visualization?.updatedAt?.seconds
        ? new Date(visualization.updatedAt.seconds * 1000).toLocaleString()
        : null;

    return (
        <main className="max-w-4xl mx-auto px-6 py-8">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <Link
                        href={`/learn/${lessonId}/${subtopicId}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        ← Back to learning
                    </Link>
                    <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                        My Saved Visualization
                    </h1>
                    {formattedDate && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Generated on {formattedDate}
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                {fetchLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-8 justify-center">
                        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Loading saved visualization...
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-500 dark:text-red-400 py-4">{error}</p>
                ) : visualization && visualization.components.length > 0 ? (
                    <>
                        <div className="mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Concept: <span className="font-medium">{visualization.conceptId}</span>
                            </p>
                        </div>
                        <GenUIRenderer components={visualization.components} />
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-3">
                            No saved visualization for this subtopic yet.
                        </p>
                        <Link
                            href={`/learn/${lessonId}/${subtopicId}`}
                            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
                        >
                            Go learn &amp; generate one →
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
