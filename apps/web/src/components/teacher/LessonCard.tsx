import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge, ProgressBar, cardClass } from "@/components/ui";
import { lessonStatusTone } from "@/lib/design";

export interface TeacherLesson {
    id: string;
    title: string;
    subject: string;
    status: string;
    createdAt?: string;
    ingestion?: { step: string; progress: number; message: string; subtopicsFound?: number; mcqsGenerated?: number };
}

export function LessonCard({ lesson }: { lesson: TeacherLesson }) {
    return (
        <Link href={`/lessons/${lesson.id}`} className={cardClass(true, "group p-5")}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="eyebrow mb-1">{lesson.subject || "Lesson"}</div>
                    <h3 className="text-base font-semibold text-fg truncate group-hover:text-accent transition-colors">
                        {lesson.title}
                    </h3>
                </div>
                <Badge tone={lessonStatusTone(lesson.status)} dot className="shrink-0">
                    {lesson.status}
                </Badge>
            </div>

            {lesson.ingestion && lesson.status === "processing" && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-mono text-fg-subtle mb-1.5">
                        <span className="truncate">{lesson.ingestion.message}</span>
                        <span>{lesson.ingestion.progress}%</span>
                    </div>
                    <ProgressBar value={lesson.ingestion.progress} size="sm" />
                </div>
            )}

            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-mono text-fg-faint">
                {lesson.ingestion?.step === "complete" ? (
                    <span>
                        {lesson.ingestion.subtopicsFound ?? "–"} subtopics · {lesson.ingestion.mcqsGenerated ?? "–"} MCQs
                    </span>
                ) : (
                    <span>{lesson.id}</span>
                )}
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
            </div>
        </Link>
    );
}
