"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Maximize2, RefreshCw, X } from "lucide-react";
import { api, type JoinCodeInfo } from "@/lib/api";
import { EduForgeLogo } from "@/components/shared/EduForgeLogo";
import { Alert, Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Teacher-side sharing for a published lesson: the student join code, a
 * full-screen "present" view for the projector, and controls to close
 * enrollment or rotate a leaked code.
 */
export function JoinCodePanel({ token, lessonId, lessonTitle }: { token: string; lessonId: string; lessonTitle: string }) {
    const [info, setInfo] = useState<JoinCodeInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [confirmRegen, setConfirmRegen] = useState(false);
    const [presenting, setPresenting] = useState(false);

    useEffect(() => {
        api.getJoinCode(token, lessonId)
            .then(setInfo)
            .catch((err) => setError(err instanceof Error ? err.message : "Could not load join code"));
    }, [token, lessonId]);

    const run = async (fn: () => Promise<JoinCodeInfo>) => {
        setBusy(true);
        setError(null);
        try {
            setInfo(await fn());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setBusy(false);
            setConfirmRegen(false);
        }
    };

    const copy = () => {
        if (!info) return;
        navigator.clipboard.writeText(info.display);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (error && !info) return <Alert className="mt-5">{error}</Alert>;
    if (!info) {
        return (
            <div className="mt-5 flex items-center gap-2 text-xs font-mono text-fg-subtle">
                <Spinner className="size-3.5" /> Preparing join code...
            </div>
        );
    }

    return (
        <div
            className={cn(
                "mt-5 rounded-lg border p-4 sm:p-5",
                info.enabled ? "border-accent/30 bg-accent/5" : "border-line bg-surface-2/50",
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="eyebrow mb-1">Student join code</div>
                    <div
                        className={cn(
                            "font-mono text-3xl sm:text-4xl font-bold tracking-[0.2em]",
                            info.enabled ? "text-accent" : "text-fg-faint line-through decoration-2",
                        )}
                    >
                        {info.display}
                    </div>
                    <p className="mt-1 text-xs text-fg-subtle">
                        {info.enabled
                            ? "Students enter this under My Lessons → Join a lesson."
                            : "Joining is closed — enrolled students keep access."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={copy} disabled={!info.enabled}>
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {copied ? "Copied!" : "Copy code"}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setPresenting(true)} disabled={!info.enabled}>
                        <Maximize2 className="size-3.5" />
                        Present
                    </Button>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={info.enabled}
                        disabled={busy}
                        onClick={() => run(() => api.setJoinEnabled(token, lessonId, !info.enabled))}
                        className={cn(
                            "relative h-5 w-9 rounded-full transition-colors disabled:opacity-50",
                            info.enabled ? "bg-accent" : "bg-surface-3 border border-line-strong",
                        )}
                    >
                        <span
                            className={cn(
                                "absolute top-0.5 size-4 rounded-full bg-surface shadow transition-all",
                                info.enabled ? "left-[1.125rem]" : "left-0.5",
                            )}
                        />
                    </button>
                    <span className="text-sm text-fg-muted">Accepting new students</span>
                </label>

                {confirmRegen ? (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-fg-subtle">The old code stops working. Continue?</span>
                        <Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => api.regenerateJoinCode(token, lessonId))}>
                            New code
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmRegen(false)}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <Button size="sm" variant="ghost" onClick={() => setConfirmRegen(true)} disabled={busy}>
                        <RefreshCw className="size-3.5" />
                        Generate new code
                    </Button>
                )}
            </div>

            {error && <Alert className="mt-3">{error}</Alert>}

            {presenting && <PresentOverlay code={info.display} title={lessonTitle} onClose={() => setPresenting(false)} />}
        </div>
    );
}

/** Full-screen, projector-friendly code display. Esc or click to close. */
function PresentOverlay({ code, title, onClose }: { code: string; title: string; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal
            aria-label="Join code"
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-canvas flex flex-col items-center justify-center p-6 text-center cursor-pointer"
        >
            <div className="fixed inset-0 bg-grid opacity-40 pointer-events-none" />
            <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-5 right-5 size-10 rounded-full flex items-center justify-center text-fg-subtle hover:text-fg hover:bg-surface-2"
            >
                <X className="size-5" />
            </button>
            <div className="relative">
                <EduForgeLogo size={32} className="justify-center mb-10" />
                <div className="eyebrow text-base mb-2">Join the lesson</div>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-fg mb-10">{title}</h2>
                <div className="font-mono font-bold text-accent tracking-[0.15em] text-[18vw] sm:text-[12vw] leading-none">
                    {code}
                </div>
                <p className="mt-10 text-lg sm:text-xl text-fg-muted">
                    Open EduForge → <span className="text-fg font-semibold">My Lessons</span> → enter the code
                </p>
                <p className="mt-2 text-sm font-mono text-fg-faint">Not case-sensitive · the dash is optional</p>
            </div>
        </div>
    );
}
