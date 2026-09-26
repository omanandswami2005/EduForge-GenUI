import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { toneStyles, type Tone } from "@/lib/design";

/* ── Surfaces ─────────────────────────────────────────────────────────── */

export function Card({
    className,
    interactive = false,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
    return (
        <div
            className={cn(
                "bg-surface rounded-xl border border-line",
                interactive && "hover:border-line-strong hover:bg-surface-2/60 transition-colors",
                className,
            )}
            {...props}
        />
    );
}

/** Class string for Card-styled elements that aren't a <div> (e.g. next/link). */
export const cardClass = (interactive = false, className?: string) =>
    cn(
        "block bg-surface rounded-xl border border-line",
        interactive && "hover:border-line-strong hover:bg-surface-2/60 transition-colors",
        className,
    );

/* ── Typography ───────────────────────────────────────────────────────── */

export function Eyebrow({ className, tone, ...props }: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
    return <div className={cn("eyebrow", tone && toneStyles[tone].text, className)} {...props} />;
}

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    className,
}: {
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex items-end justify-between flex-wrap gap-4 mb-8", className)}>
            <div className="min-w-0">
                {eyebrow && (
                    <Eyebrow tone="accent" className="mb-1">
                        {eyebrow}
                    </Eyebrow>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">{title}</h1>
                {description && <p className="mt-1.5 text-sm text-fg-subtle max-w-2xl">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
    );
}

export function StatTile({
    label,
    value,
    hint,
    icon,
    tone = "accent",
    className,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    hint?: React.ReactNode;
    icon?: React.ReactNode;
    tone?: Tone;
    className?: string;
}) {
    return (
        <Card className={cn("p-5", className)}>
            <div className="flex items-center justify-between">
                <span className="eyebrow">{label}</span>
                {icon && (
                    <span className={cn("size-7 rounded-md flex items-center justify-center", toneStyles[tone].tint, toneStyles[tone].text)}>
                        {icon}
                    </span>
                )}
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tracking-tight text-fg">{value}</div>
            {hint && <div className="mt-1 text-xs text-fg-subtle">{hint}</div>}
        </Card>
    );
}

/* ── Status ───────────────────────────────────────────────────────────── */

export function Badge({
    tone = "neutral",
    dot = false,
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-[11px] font-medium",
                toneStyles[tone].soft,
                className,
            )}
            {...props}
        >
            {dot && <span className={cn("size-1.5 rounded-full", toneStyles[tone].solid)} />}
            {children}
        </span>
    );
}

export function Alert({
    tone = "danger",
    title,
    className,
    children,
}: {
    tone?: Tone;
    title?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <div role="alert" className={cn("p-3 rounded-lg border text-sm", toneStyles[tone].soft, className)}>
            {title && <div className="font-semibold mb-0.5">{title}</div>}
            {children}
        </div>
    );
}

export function ProgressBar({
    value,
    tone = "accent",
    size = "md",
    className,
}: {
    /** 0–100 */
    value: number;
    tone?: Tone;
    size?: "sm" | "md";
    className?: string;
}) {
    const h = size === "sm" ? "h-1.5" : "h-2";
    return (
        <div className={cn("w-full bg-surface-3 rounded-full overflow-hidden", h, className)}>
            <div
                className={cn(h, "rounded-full transition-all duration-500", toneStyles[tone].solid)}
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            />
        </div>
    );
}

export function Spinner({ className }: { className?: string }) {
    return (
        <span
            aria-hidden
            className={cn("inline-block size-4 rounded-full border-2 border-line-strong border-t-accent animate-spin", className)}
        />
    );
}

export function LoadingState({ label = "Loading...", className }: { label?: string; className?: string }) {
    return (
        <div className={cn("flex items-center justify-center gap-3 py-12 text-sm text-fg-subtle font-mono", className)}>
            <Spinner />
            {label}
        </div>
    );
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: {
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("text-center py-14 px-6 rounded-xl border border-dashed border-line-strong", className)}>
            {icon && (
                <div className="mx-auto mb-4 size-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    {icon}
                </div>
            )}
            <h3 className="text-base font-semibold text-fg">{title}</h3>
            {description && <p className="mt-1 text-sm text-fg-subtle max-w-md mx-auto">{description}</p>}
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </div>
    );
}

/* ── Forms ────────────────────────────────────────────────────────────── */

const fieldClass =
    "w-full px-3 py-2 rounded-lg bg-surface-2 border border-line-strong text-fg text-sm placeholder:text-fg-faint " +
    "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
    { className, ...props },
    ref,
) {
    return <input ref={ref} className={cn(fieldClass, className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
    { className, ...props },
    ref,
) {
    return <select ref={ref} className={cn(fieldClass, className)} {...props} />;
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={cn("block text-xs font-mono uppercase tracking-wider text-fg-subtle mb-1.5", className)} {...props} />;
}
