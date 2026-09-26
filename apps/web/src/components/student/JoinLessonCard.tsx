"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, KeyRound, User } from "lucide-react";
import { api, type JoinPreview } from "@/lib/api";
import {
    JOIN_CODE_LENGTH,
    cleanJoinCode,
    formatJoinCode,
    invalidJoinCodeChars,
    isCompleteJoinCode,
} from "@/lib/joinCode";
import { Alert, Button, Card, Eyebrow, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

type State =
    | { kind: "idle" }
    | { kind: "checking" }
    | { kind: "preview"; preview: JoinPreview }
    | { kind: "error"; message: string };

/**
 * Join a lesson with the 6-character code a teacher shares (e.g. FMA-234).
 * Looks the code up as soon as it's complete so the student sees *which*
 * lesson they're joining before committing.
 */
export function JoinLessonCard({
    token,
    onJoined,
    autoFocus = false,
    className,
}: {
    token: string;
    onJoined: (lessonId: string, alreadyEnrolled: boolean) => void;
    autoFocus?: boolean;
    className?: string;
}) {
    const [code, setCode] = useState(""); // cleaned: uppercase, no separators
    const [state, setState] = useState<State>({ kind: "idle" });
    const [joining, setJoining] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const badChars = invalidJoinCodeChars(code);
    const complete = isCompleteJoinCode(code);

    // Preview lookup whenever a full, well-formed code is entered
    useEffect(() => {
        if (!complete) {
            setState({ kind: "idle" });
            return;
        }
        let cancelled = false;
        setState({ kind: "checking" });
        api.previewJoinCode(token, code)
            .then((preview) => !cancelled && setState({ kind: "preview", preview }))
            .catch((err) => !cancelled && setState({ kind: "error", message: err instanceof Error ? err.message : "Lookup failed" }));
        return () => {
            cancelled = true;
        };
    }, [code, complete, token]);

    const handleJoin = async () => {
        if (state.kind !== "preview") return;
        if (state.preview.alreadyEnrolled) {
            onJoined(state.preview.lessonId, true);
            return;
        }
        setJoining(true);
        try {
            const res = await api.joinWithCode(token, code);
            onJoined(res.lessonId, res.alreadyEnrolled);
        } catch (err) {
            setState({ kind: "error", message: err instanceof Error ? err.message : "Could not join" });
        } finally {
            setJoining(false);
        }
    };

    return (
        <Card className={cn("p-5", className)}>
            <Eyebrow tone="accent" className="flex items-center gap-1.5 mb-1">
                <KeyRound className="size-3.5" />
                Join a lesson
            </Eyebrow>
            <p className="text-sm text-fg-subtle mb-4">Enter the 6-character code your teacher shared.</p>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleJoin();
                }}
            >
                <label htmlFor="join-code" className="sr-only">
                    Lesson code
                </label>
                <input
                    id="join-code"
                    ref={inputRef}
                    autoFocus={autoFocus}
                    value={formatJoinCode(code)}
                    onChange={(e) => setCode(cleanJoinCode(e.target.value).slice(0, JOIN_CODE_LENGTH))}
                    placeholder="ABC-123"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    inputMode="text"
                    aria-invalid={badChars.length > 0 || state.kind === "error"}
                    className={cn(
                        "w-full text-center font-mono text-2xl sm:text-3xl font-bold tracking-[0.3em] uppercase",
                        "px-4 py-3 rounded-lg bg-surface-2 border text-fg placeholder:text-fg-faint/50",
                        "focus:outline-none focus:ring-2 transition-colors",
                        badChars.length > 0 || state.kind === "error"
                            ? "border-danger focus:ring-danger/30"
                            : state.kind === "preview"
                              ? "border-accent focus:ring-accent/30"
                              : "border-line-strong focus:border-accent focus:ring-accent/30",
                    )}
                />

                {/* Progress dots — how many characters are left */}
                <div className="flex justify-center gap-1.5 mt-3" aria-hidden>
                    {Array.from({ length: JOIN_CODE_LENGTH }).map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                "h-1 w-5 rounded-full transition-colors",
                                i < code.length ? (badChars.length ? "bg-danger" : "bg-accent") : "bg-surface-3",
                            )}
                        />
                    ))}
                </div>

                <div className="mt-4 min-h-[3.5rem]" aria-live="polite">
                    {badChars.length > 0 ? (
                        <Alert>
                            Codes never contain {badChars.map((c) => `"${c}"`).join(", ")} — they don&apos;t use 0, O, 1, I or L.
                            Double-check with your teacher.
                        </Alert>
                    ) : state.kind === "checking" ? (
                        <div className="flex items-center justify-center gap-2 text-sm font-mono text-fg-subtle py-3">
                            <Spinner /> Looking up code...
                        </div>
                    ) : state.kind === "error" ? (
                        <Alert>{state.message}</Alert>
                    ) : state.kind === "preview" ? (
                        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                            <div className="eyebrow mb-0.5">{state.preview.subject || "Lesson"}</div>
                            <div className="text-base font-semibold text-fg">{state.preview.title}</div>
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-subtle">
                                {state.preview.subtopicCount != null && (
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="size-3.5" /> {state.preview.subtopicCount} topics
                                    </span>
                                )}
                                {state.preview.teacherName && (
                                    <span className="flex items-center gap-1">
                                        <User className="size-3.5" /> {state.preview.teacherName}
                                    </span>
                                )}
                                {state.preview.alreadyEnrolled && (
                                    <span className="flex items-center gap-1 text-success">
                                        <CheckCircle2 className="size-3.5" /> Already joined
                                    </span>
                                )}
                            </div>
                            <Button type="submit" className="w-full mt-4" disabled={joining}>
                                {joining ? (
                                    <>
                                        <Spinner className="border-accent-fg/30 border-t-accent-fg" /> Joining...
                                    </>
                                ) : state.preview.alreadyEnrolled ? (
                                    <>
                                        Open lesson <ArrowRight className="size-4" />
                                    </>
                                ) : (
                                    <>
                                        Join lesson <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-xs text-center text-fg-faint py-3">
                            Not case-sensitive · the dash is optional
                        </p>
                    )}
                </div>
            </form>
        </Card>
    );
}
