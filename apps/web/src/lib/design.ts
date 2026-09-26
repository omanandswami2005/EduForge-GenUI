/**
 * Semantic color mapping for the EduForge design system.
 *
 * Colors themselves live as CSS variables in app/globals.css. This module
 * decides *which* tone a piece of domain state (mastery, scaffold level,
 * lesson status) gets, so those decisions are made once instead of per page.
 *
 * Class strings are spelled out in full so Tailwind's JIT can see them.
 */

export type Tone = "neutral" | "accent" | "success" | "info" | "warning" | "danger" | "violet";

interface ToneStyle {
    /** Filled background with contrasting text — bars, dots, solid chips */
    solid: string;
    /** Tinted background + tone text + tinted border — badges, callouts */
    soft: string;
    /** Tone-colored text only */
    text: string;
    /** Tinted background only */
    tint: string;
    /** Tone border only */
    border: string;
}

export const toneStyles: Record<Tone, ToneStyle> = {
    neutral: {
        solid: "bg-fg-faint text-canvas",
        soft: "bg-surface-2 text-fg-muted border-line",
        text: "text-fg-muted",
        tint: "bg-surface-2",
        border: "border-line",
    },
    accent: {
        solid: "bg-accent text-accent-fg",
        soft: "bg-accent/10 text-accent border-accent/30",
        text: "text-accent",
        tint: "bg-accent/10",
        border: "border-accent/30",
    },
    success: {
        solid: "bg-success text-accent-fg",
        soft: "bg-success/10 text-success border-success/30",
        text: "text-success",
        tint: "bg-success/10",
        border: "border-success/30",
    },
    info: {
        solid: "bg-info text-accent-fg",
        soft: "bg-info/10 text-info border-info/30",
        text: "text-info",
        tint: "bg-info/10",
        border: "border-info/30",
    },
    warning: {
        solid: "bg-warning text-accent-fg",
        soft: "bg-warning/10 text-warning border-warning/30",
        text: "text-warning",
        tint: "bg-warning/10",
        border: "border-warning/30",
    },
    danger: {
        solid: "bg-danger text-accent-fg",
        soft: "bg-danger/10 text-danger border-danger/30",
        text: "text-danger",
        tint: "bg-danger/10",
        border: "border-danger/30",
    },
    violet: {
        solid: "bg-violet text-accent-fg",
        soft: "bg-violet/10 text-violet border-violet/30",
        text: "text-violet",
        tint: "bg-violet/10",
        border: "border-violet/30",
    },
};

/** Mastery ranges: struggling → developing → progressing → mastered. */
export function masteryTone(pMastery: number, mastered = false): Tone {
    if (mastered || pMastery >= 0.95) return "success";
    if (pMastery > 0.6) return "info";
    if (pMastery > 0.3) return "warning";
    return "danger";
}

/** Scaffold levels 0–4 (novice → mastered). */
export const SCAFFOLD_LEVEL_TONES: Tone[] = ["danger", "warning", "warning", "info", "success"];

export function scaffoldTone(level: number | null | undefined): Tone {
    return level == null ? "neutral" : SCAFFOLD_LEVEL_TONES[level] ?? "neutral";
}

export function lessonStatusTone(status: string | undefined): Tone {
    switch (status) {
        case "published":
            return "success";
        case "processing":
            return "warning";
        case "failed":
            return "danger";
        default:
            return "neutral";
    }
}
