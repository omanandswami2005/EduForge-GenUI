"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSessionStore } from "@/stores/sessionStore";
import { api } from "@/lib/api";
import { ClassMasteryHeatmap } from "@/components/teacher/ClassMasteryHeatmap";
import { MisconceptionInsights } from "@/components/teacher/MisconceptionInsights";
import { JoinCodePanel } from "@/components/teacher/JoinCodePanel";
import { Alert, Badge, Button, Card, Eyebrow, LoadingState, ProgressBar } from "@/components/ui";
import { lessonStatusTone, type Tone } from "@/lib/design";

const DIFFICULTY_TONES: Record<string, Tone> = {
    foundational: "success",
    intermediate: "warning",
    advanced: "danger",
};

export default function LessonDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useSessionStore();
    const [lesson, setLesson] = useState<any>(null);
    const [subtopics, setSubtopics] = useState<any[]>([]);
    const [publishing, setPublishing] = useState(false);

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

    if (!lesson) return <LoadingState label="Loading lesson..." className="min-h-[60vh]" />;

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


    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <Card className="p-6 mb-6">
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="min-w-0">
                        <Eyebrow tone="accent" className="mb-1">
                            {lesson.subject || "Lesson"}
                        </Eyebrow>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">{lesson.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge tone={lessonStatusTone(lesson.status)} dot>
                            {lesson.status}
                        </Badge>
                        {lesson.ingestion?.step === "complete" && lesson.status !== "published" && (
                            <Button size="sm" onClick={handlePublish} disabled={publishing}>
                                {publishing ? "Publishing..." : "Publish"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Ingestion progress */}
                {lesson.ingestion && lesson.status === "processing" && (
                    <div className="mt-5">
                        <div className="flex items-center justify-between text-xs font-mono text-fg-subtle mb-1.5">
                            <span>{lesson.ingestion.message}</span>
                            <span>{lesson.ingestion.progress}%</span>
                        </div>
                        <ProgressBar value={lesson.ingestion.progress} />
                    </div>
                )}

                {lesson.ingestion?.step === "failed" && (
                    <Alert className="mt-5" title="Ingestion failed">
                        {lesson.ingestion.message}
                    </Alert>
                )}

                {lesson.ingestion?.step === "complete" && (
                    <div className="mt-5 flex gap-6">
                        <div>
                            <div className="eyebrow">Subtopics</div>
                            <div className="text-xl font-bold font-mono text-fg">{lesson.ingestion.subtopicsFound}</div>
                        </div>
                        <div>
                            <div className="eyebrow">MCQs</div>
                            <div className="text-xl font-bold font-mono text-fg">{lesson.ingestion.mcqsGenerated}</div>
                        </div>
                    </div>
                )}

                {/* Student join code */}
                {lesson.status === "published" && token && (
                    <JoinCodePanel token={token} lessonId={id} lessonTitle={lesson.title} />
                )}
            </Card>

            {/* Class mastery heatmap + misconception insights */}
            {lesson.status === "published" && token && (
                <div className="mb-6 space-y-6">
                    <ClassMasteryHeatmap token={token} lessonId={id} />
                    <MisconceptionInsights token={token} lessonId={id} />
                </div>
            )}

            {/* Subtopics list */}
            {subtopics.length > 0 && (
                <div>
                    <Eyebrow className="mb-3">Topics</Eyebrow>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {subtopics.map((st: any, idx: number) => (
                            <Card key={st.id || idx} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="font-medium text-fg">
                                            <span className="font-mono text-fg-faint mr-1.5">{String(idx + 1).padStart(2, "0")}</span>
                                            {st.title}
                                        </h4>
                                        <p className="text-sm text-fg-subtle mt-1">{st.description}</p>
                                    </div>
                                    {st.difficulty && (
                                        <Badge tone={DIFFICULTY_TONES[st.difficulty] ?? "neutral"} className="shrink-0">
                                            {st.difficulty}
                                        </Badge>
                                    )}
                                </div>
                                {st.keyConcepts && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {st.keyConcepts.map((c: string) => (
                                            <span
                                                key={c}
                                                className="px-2 py-0.5 bg-surface-2 border border-line text-fg-muted rounded text-xs font-mono"
                                            >
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
