"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Upload } from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { api } from "@/lib/api";
import { LessonCard, type TeacherLesson } from "@/components/teacher/LessonCard";
import { EmptyState, Input, LoadingState, PageHeader, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "published", "processing", "failed", "draft"] as const;
type Filter = (typeof FILTERS)[number];

/**
 * The lesson library — every lesson with search and status filters.
 * Class-wide numbers live on the dashboard; per-lesson analytics on /lessons/[id].
 */
export default function TeacherLessonsPage() {
    const { token, loading } = useSessionStore();
    const [lessons, setLessons] = useState<TeacherLesson[]>([]);
    const [loading2, setLoading2] = useState(true);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");

    useEffect(() => {
        if (!loading && token) {
            api.getTeacherLessons(token)
                .then(setLessons)
                .catch(console.error)
                .finally(() => setLoading2(false));
        }
    }, [loading, token]);

    const counts = useMemo(() => {
        const c: Record<Filter, number> = { all: lessons.length, published: 0, processing: 0, failed: 0, draft: 0 };
        for (const l of lessons) if (l.status in c) c[l.status as Filter]++;
        return c;
    }, [lessons]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return lessons
            .filter((l) => filter === "all" || l.status === filter)
            .filter((l) => !q || l.title.toLowerCase().includes(q) || l.subject?.toLowerCase().includes(q))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [lessons, filter, query]);

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <PageHeader
                eyebrow="Library"
                title="All Lessons"
                description="Every lesson you've created. Open one for its heatmap, misconceptions, and topics."
                actions={
                    <Link href="/lessons/new" className={buttonVariants()}>
                        <Plus className="size-4" />
                        New Lesson
                    </Link>
                }
            />

            {loading2 ? (
                <LoadingState label="Loading lessons..." />
            ) : lessons.length === 0 ? (
                <EmptyState
                    icon={<Upload className="size-5" />}
                    title="No lessons yet"
                    description="Upload a .pptx and EduForge will extract topics, generate MCQs, and calibrate the BKT model."
                    action={
                        <Link href="/lessons/new" className={buttonVariants()}>
                            Create Lesson
                        </Link>
                    }
                />
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                        <div className="relative sm:w-72">
                            <Search className="size-4 text-fg-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search title or subject..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto">
                            {FILTERS.filter((f) => f === "all" || counts[f] > 0).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full border text-xs font-mono capitalize whitespace-nowrap transition-colors",
                                        filter === f
                                            ? "text-accent bg-accent/10 border-accent/30"
                                            : "text-fg-subtle border-line hover:text-fg",
                                    )}
                                >
                                    {f} <span className="text-fg-faint">{counts[f]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <p className="text-sm text-fg-subtle py-10 text-center">No lessons match.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {visible.map((lesson) => (
                                <LessonCard key={lesson.id} lesson={lesson} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
