"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { api } from "@/lib/api";
import { OverallMasteryPanel } from "@/components/student/OverallMasteryPanel";
import { JoinLessonCard } from "@/components/student/JoinLessonCard";
import { LoadingState, PageHeader, cardClass } from "@/components/ui";

export default function StudentLearnPage() {
    const { user, token, loading } = useSessionStore();
    const router = useRouter();
    const [lessons, setLessons] = useState<any[] | null>(null);

    const loadLessons = useCallback(() => {
        if (token && user) {
            api.getStudentLessons(token, user.uid).then(setLessons).catch(() => setLessons([]));
        }
    }, [token, user]);

    useEffect(() => {
        if (!loading) loadLessons();
    }, [loading, loadLessons]);

    // Joining lands the student straight in the lesson — that's why they joined
    const handleJoined = (lessonId: string) => router.push(`/learn/${lessonId}`);

    if (!token || lessons === null) return <LoadingState label="Loading your lessons..." className="min-h-[60vh]" />;

    if (lessons.length === 0) {
        return (
            <main className="max-w-md mx-auto px-4 sm:px-6 py-16">
                <div className="text-center mb-8">
                    <div className="eyebrow text-accent mb-1">Welcome{user?.displayName ? `, ${user.displayName}` : ""}</div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">Join your first lesson</h1>
                    <p className="mt-2 text-sm text-fg-subtle">
                        Your teacher will share a short code like <span className="font-mono text-fg-muted">ABC-234</span> —
                        on the board, in class chat, or out loud.
                    </p>
                </div>
                <JoinLessonCard token={token} onJoined={handleJoined} autoFocus />
            </main>
        );
    }

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <PageHeader
                eyebrow="Student"
                title="My Lessons"
                description="Your mastery updates live as you answer — content adapts to what you actually know."
            />

            {user && <OverallMasteryPanel studentId={user.uid} lessons={lessons} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {lessons.map((lesson: any) => (
                        <Link key={lesson.id} href={`/learn/${lesson.id}`} className={cardClass(true, "group p-5")}>
                            <div className="eyebrow mb-1">{lesson.subject || "Lesson"}</div>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-base font-semibold text-fg group-hover:text-accent transition-colors">
                                    {lesson.title}
                                </h3>
                                <ArrowUpRight className="size-4 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                            </div>
                            {lesson.ingestion?.subtopicsFound != null && (
                                <p className="mt-3 text-xs font-mono text-fg-faint">{lesson.ingestion.subtopicsFound} topics</p>
                            )}
                        </Link>
                    ))}
                </div>
                <JoinLessonCard token={token} onJoined={handleJoined} className="lg:sticky lg:top-24" />
            </div>
        </main>
    );
}
