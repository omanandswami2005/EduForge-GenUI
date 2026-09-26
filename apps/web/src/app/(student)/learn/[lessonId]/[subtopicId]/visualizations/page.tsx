"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EmptyState, LoadingState, buttonVariants } from "@/components/ui";
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
                console.warn("Saved visualization unavailable:", err.message ?? "Failed to load saved visualization"); // falls through to the empty state
            })
            .finally(() => setFetchLoading(false));
    }, [loading, user?.uid, subtopicId]);

    const formattedDate = visualization?.updatedAt?.seconds
        ? new Date(visualization.updatedAt.seconds * 1000).toLocaleString()
        : null;

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <Link
                        href={`/learn/${lessonId}/${subtopicId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-fg-subtle hover:text-accent transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to learning
                    </Link>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-fg">
                        My Saved Visualization
                    </h1>
                    {formattedDate && (
                        <p className="text-xs font-mono text-fg-faint mt-1">
                            Generated on {formattedDate}
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-line p-6">
                {fetchLoading ? (
                    <LoadingState label="Loading saved visualization..." />
                ) : visualization && visualization.components.length > 0 ? (
                    <>
                        <div className="mb-4 pb-3 border-b border-line">
                            <p className="eyebrow">
                                Concept: <span className="text-fg-muted normal-case">{visualization.conceptId}</span>
                            </p>
                        </div>
                        <GenUIRenderer components={visualization.components} />
                    </>
                ) : (
                    <EmptyState
                        className="border-none"
                        title="No saved visualization yet"
                        description="Visualizations are saved automatically once generated for this subtopic."
                        action={
                            <Link href={`/learn/${lessonId}/${subtopicId}`} className={buttonVariants()}>
                                Go learn &amp; generate one →
                            </Link>
                        }
                    />
                )}
            </div>
        </main>
    );
}
