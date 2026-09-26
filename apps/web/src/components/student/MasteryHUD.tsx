"use client";

import { useBKTState } from "@/hooks/useBKTState";
import { ProgressBar } from "@/components/ui";
import { masteryTone } from "@/lib/design";

export function MasteryHUD({
    studentId,
    lessonId,
    concepts,
}: {
    studentId: string;
    lessonId: string;
    concepts: { id: string; label: string }[];
}) {
    const bktStates = useBKTState(studentId, lessonId);

    return (
        <div className="bg-surface rounded-xl border border-line p-4">
            <h3 className="eyebrow mb-3">Concept Mastery</h3>
            <div className="space-y-2">
                {concepts.map((c) => {
                    const normalized = c.id.toLowerCase().replace(/\s+/g, "_");
                    const state = bktStates[c.id] || bktStates[normalized] ||
                        Object.values(bktStates).find((s) =>
                            s.conceptId.toLowerCase().replace(/\s+/g, "_") === normalized
                        ) || null;
                    const p = state?.pMastery ?? 0.2;
                    const pct = Math.round(p * 100);

                    return (
                        <div key={c.id} className="flex items-center gap-2">
                            <span className="text-xs text-fg-muted w-28 truncate" title={c.label}>
                                {c.label}
                            </span>
                            <ProgressBar value={pct} tone={masteryTone(p, state?.mastered)} className="flex-1" />
                            <span className="text-xs font-mono text-fg-subtle w-9 text-right">{pct}%</span>
                        </div>
                    );
                })}
            </div>

            {concepts.length === 0 && (
                <p className="text-sm text-fg-faint">No concepts loaded yet.</p>
            )}
        </div>
    );
}
