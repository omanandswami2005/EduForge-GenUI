import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
    primary: "bg-accent text-accent-fg hover:bg-accent-hover font-semibold shadow-lg shadow-accent/10",
    secondary: "bg-surface-2 text-fg-muted border border-line hover:bg-surface-3 hover:text-fg",
    ghost: "text-fg-subtle hover:text-fg hover:bg-surface-2",
    danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-sm px-6 py-2.5",
};

/** Class string for button-styled elements that aren't <button> (e.g. next/link). */
export function buttonVariants({
    variant = "primary",
    size = "md",
    className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
    return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant, size, className, ...props },
    ref,
) {
    return <button ref={ref} className={buttonVariants({ variant, size, className })} {...props} />;
});
