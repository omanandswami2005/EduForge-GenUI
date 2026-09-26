"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BookOpen,
    Brain,
    CheckCircle2,
    Loader2,
    Plus,
    Target,
    TrendingDown,
    Upload,
    Users,
} from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { api, type TeacherOverview } from "@/lib/api";
import {
    Alert,
    Badge,
    Card,
    EmptyState,
    Eyebrow,
    LoadingState,
    PageHeader,
    ProgressBar,
    StatTile,
    buttonVariants,
} from "@/components/ui";
import { lessonStatusTone, masteryTone, toneStyles, type Tone } from "@/lib/design";
import { cn } from "@/lib/utils";

const pct = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);

const BANDS: { key: keyof TeacherOverview["masteryDistribution"]; label: string; tone: Tone }[] = [
    { key: "struggling", label: "Struggling", tone: "danger" },
    { key: "developing", label: "Developing", tone: "warning" },
    { key: "proficient", label: "Proficient", tone: "info" },
    { key: "mastered", label: "Mastered", tone: "success" },
];

export default function TeacherDashboard() {
    const { token, loading } = useSessionStore();
    const [data, setData] = useState<TeacherOverview | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && token) {
            api.getTeacherOverview(token)
                .then(setData)
                .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
        }
    }, [loading, token]);

    const newLesson = (
        <Link href="/lessons/new" className={buttonVariants()}>
            <Plus className="size-4" />
            New Lesson
        </Link>
    );

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <PageHeader
                eyebrow="Teacher Dashboard"
                title="Class Overview"
                description="How your students are doing across every published lesson — live from the BKT engine."
                actions={newLesson}
            />

            {error ? (
                <Alert>{error}</Alert>
            ) : !data ? (
                <LoadingState label="Loading dashboard..." />
            ) : data.totals.lessons === 0 ? (
                <EmptyState
                    icon={<Upload className="size-5" />}
                    title="No lessons yet"
                    description="Upload a .pptx and EduForge will extract topics, generate MCQs, and calibrate the BKT model. Stats appear here once students start answering."
                    action={newLesson}
                />
            ) : (
                <Overview data={data} />
            )}
        </main>
    );
}

function Overview({ data }: { data: TeacherOverview }) {
    const { totals } = data;
    const inFlight = data.lessons.filter((l) => l.status === "processing");
    const distTotal = Object.values(data.masteryDistribution).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* Headline numbers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile
                    label="Lessons"
                    value={totals.lessons}
                    icon={<BookOpen className="size-4" />}
                    hint={`${totals.published} published · ${totals.subtopics} subtopics · ${totals.mcqs} MCQs`}
                />
                <StatTile
                    label="Students"
                    value={totals.students}
                    icon={<Users className="size-4" />}
                    tone="info"
                    hint={`${totals.conceptStates} concept states tracked`}
                />
                <StatTile
                    label="Avg Mastery"
                    value={pct(totals.avgMastery)}
                    icon={<Brain className="size-4" />}
                    tone={totals.avgMastery == null ? "neutral" : masteryTone(totals.avgMastery)}
                    hint="Mean P(L) across all students × concepts"
                />
                <StatTile
                    label="Accuracy"
                    value={pct(totals.accuracy)}
                    icon={<Target className="size-4" />}
                    tone="violet"
                    hint={`${totals.responses} answers recorded`}
                />
            </div>

            {/* Ingestion in progress / failed */}
            {inFlight.length > 0 && (
                <Card className="p-4 space-y-3">
                    {inFlight.map((l) => (
                        <Link key={l.id} href={`/lessons/${l.id}`} className="block group">
                            <div className="flex items-center justify-between text-xs font-mono text-fg-subtle mb-1.5">
                                <span className="flex items-center gap-2 min-w-0">
                                    <Loader2 className="size-3.5 animate-spin text-warning shrink-0" />
                                    <span className="text-fg group-hover:text-accent truncate">{l.title}</span>
                                    <span className="truncate">— {l.ingestion?.message}</span>
                                </span>
                                <span>{l.ingestion?.progress ?? 0}%</span>
                            </div>
                            <ProgressBar value={l.ingestion?.progress ?? 0} size="sm" />
                        </Link>
                    ))}
                </Card>
            )}
            {totals.failed > 0 && (
                <Alert title={`${totals.failed} lesson${totals.failed > 1 ? "s" : ""} failed ingestion`}>
                    Open it from <Link href="/lessons" className="underline">Lessons</Link> to see the error, then re-upload.
                </Alert>
            )}

            {/* Mastery distribution */}
            <Card className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <Eyebrow>Mastery Distribution</Eyebrow>
                    <span className="text-xs font-mono text-fg-faint">{distTotal} student × concept states</span>
                </div>
                {distTotal === 0 ? (
                    <p className="text-sm text-fg-subtle">No student activity yet — fills in as students answer questions.</p>
                ) : (
                    <>
                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-surface-3">
                            {BANDS.map(({ key, tone }) =>
                                data.masteryDistribution[key] > 0 ? (
                                    <div
                                        key={key}
                                        className={cn("h-full transition-all duration-500", toneStyles[tone].solid)}
                                        style={{ width: `${(data.masteryDistribution[key] / distTotal) * 100}%` }}
                                    />
                                ) : null,
                            )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {BANDS.map(({ key, label, tone }) => (
                                <div key={key} className="flex items-center gap-2">
                                    <span className={cn("size-2.5 rounded-sm", toneStyles[tone].solid)} />
                                    <span className="text-xs text-fg-subtle">{label}</span>
                                    <span className="text-xs font-mono font-semibold text-fg ml-auto sm:ml-0">
                                        {data.masteryDistribution[key]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Per-lesson performance */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                        <Eyebrow>Lesson Performance</Eyebrow>
                        <Link href="/lessons" className="text-xs font-mono text-fg-subtle hover:text-accent">
                            All lessons →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-y border-line bg-surface-2/50 text-left">
                                    {["Lesson", "Students", "Avg mastery", "Accuracy"].map((h) => (
                                        <th key={h} className="eyebrow font-normal px-5 py-2 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.lessons.map((l) => (
                                    <tr key={l.id} className="border-b border-line last:border-0 hover:bg-surface-2/40">
                                        <td className="px-5 py-3">
                                            <Link href={`/lessons/${l.id}`} className="font-medium text-fg hover:text-accent">
                                                {l.title}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-fg-faint">{l.subject}</span>
                                                {l.status !== "published" && (
                                                    <Badge tone={lessonStatusTone(l.status)}>{l.status}</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 font-mono text-fg-muted">{l.students}</td>
                                        <td className="px-5 py-3 min-w-[9rem]">
                                            {l.avgMastery == null ? (
                                                <span className="text-fg-faint font-mono">—</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <ProgressBar
                                                        value={l.avgMastery * 100}
                                                        tone={masteryTone(l.avgMastery)}
                                                        size="sm"
                                                        className="w-20"
                                                    />
                                                    <span className="font-mono text-xs text-fg-muted">{pct(l.avgMastery)}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 font-mono text-fg-muted whitespace-nowrap">
                                            {pct(l.accuracy)}
                                            {l.responses > 0 && <span className="text-fg-faint text-xs"> / {l.responses}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Needs attention */}
                <div className="space-y-6">
                    <AttentionList
                        title="Struggling Students"
                        icon={<TrendingDown className="size-3.5" />}
                        empty="Every student is at proficient or above."
                        items={data.strugglingStudents.map((s) => ({
                            key: `${s.id}-${s.lessonId}`,
                            href: `/lessons/${s.lessonId}`,
                            primary: s.name,
                            secondary: `${s.lessonTitle} · ${s.conceptsTracked} concept${s.conceptsTracked === 1 ? "" : "s"}`,
                            value: s.avgMastery,
                        }))}
                    />
                    <AttentionList
                        title="Weakest Concepts"
                        icon={<Brain className="size-3.5" />}
                        empty="No concept is below proficient class-wide."
                        items={data.weakConcepts.map((c) => ({
                            key: `${c.lessonId}-${c.conceptId}`,
                            href: `/lessons/${c.lessonId}`,
                            primary: c.conceptId,
                            secondary: `${c.lessonTitle} · ${c.students} student${c.students === 1 ? "" : "s"}`,
                            value: c.avgMastery,
                        }))}
                    />
                    <Card className="p-5">
                        <Eyebrow className="flex items-center gap-1.5 mb-3">
                            <AlertTriangle className="size-3.5" />
                            Top Misconceptions
                        </Eyebrow>
                        {data.topMisconceptions.length === 0 ? (
                            <p className="text-sm text-fg-subtle flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-success" /> None flagged yet.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {data.topMisconceptions.map((m) => (
                                    <li key={`${m.lessonId}-${m.conceptId}-${m.text}`} className="flex gap-2.5">
                                        <span className="shrink-0 h-fit px-1.5 py-0.5 rounded bg-danger/10 text-danger text-xs font-mono">
                                            {m.count}×
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm text-fg-muted">{m.text}</p>
                                            <p className="text-xs font-mono text-fg-faint mt-0.5">{m.conceptId}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

function AttentionList({
    title,
    icon,
    empty,
    items,
}: {
    title: string;
    icon: React.ReactNode;
    empty: string;
    items: { key: string; href: string; primary: string; secondary: string; value: number }[];
}) {
    return (
        <Card className="p-5">
            <Eyebrow className="flex items-center gap-1.5 mb-3">
                {icon}
                {title}
            </Eyebrow>
            {items.length === 0 ? (
                <p className="text-sm text-fg-subtle flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" /> {empty}
                </p>
            ) : (
                <ul className="space-y-1">
                    {items.map((it) => (
                        <li key={it.key}>
                            <Link
                                href={it.href}
                                className="flex items-center justify-between gap-3 -mx-2 px-2 py-1.5 rounded-md hover:bg-surface-2"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm text-fg truncate">{it.primary}</p>
                                    <p className="text-xs text-fg-faint truncate">{it.secondary}</p>
                                </div>
                                <span className={cn("text-sm font-mono font-semibold shrink-0", toneStyles[masteryTone(it.value)].text)}>
                                    {pct(it.value)}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}
