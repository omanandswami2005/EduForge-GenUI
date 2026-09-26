"use client";

import { useState } from "react";
import { useGenUI } from "@/hooks/useGenUI";
import { GenUIRenderer } from "@/components/genui/GenUIRenderer";
import { GenUIMetaBadge } from "@/components/genui/GenUIMetaBadge";

interface ScaffoldComparisonViewProps {
    studentId: string;
    conceptId: string;
    subtopicId: string;
    lessonId: string;
    subtopicTitle?: string;
}

const NOVICE_LEVEL = 0;
const MASTERED_LEVEL = 4;

/**
 * Renders the same concept at two extreme scaffold levels side by side, so
 * the BKT-gates-GenUI thesis is visible in one screenshot instead of
 * requiring a live click-through of several questions to demonstrate.
 * Generation only fires when the panel is opened — this is a demo/exploration
 * tool, not part of the normal learning flow, so it shouldn't cost tokens by default.
 */
export function ScaffoldComparisonView(props: ScaffoldComparisonViewProps) {
    const { studentId, conceptId, subtopicId, lessonId, subtopicTitle } = props;
    const [open, setOpen] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const novice = useGenUI(studentId);
    const mastered = useGenUI(studentId);

    const handleOpen = () => {
        setOpen(true);
        if (!hasGenerated) {
            setHasGenerated(true);
            novice.generate(conceptId, subtopicId, lessonId, true, subtopicTitle, NOVICE_LEVEL);
            // Stagger slightly rather than firing both at the exact same instant —
            // reduces the odds of both requests landing in the same rate-limit
            // window on Groq's free tier and one of them coming back truncated.
            setTimeout(() => {
                mastered.generate(conceptId, subtopicId, lessonId, true, subtopicTitle, MASTERED_LEVEL);
            }, 400);
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-line p-6">
            <button
                onClick={() => (open ? setOpen(false) : handleOpen())}
                className="flex items-center justify-between w-full text-left"
            >
                <div>
                    <div className="eyebrow text-accent mb-1">Ablation View</div>
                    <h3 className="text-base font-semibold text-fg">
                        Compare mastery levels
                    </h3>
                    <p className="text-sm text-fg-subtle mt-0.5">
                        See how content for this concept changes from novice to expert
                    </p>
                </div>
                <span className="text-fg-subtle text-xs font-mono px-2.5 py-1 rounded-full border border-line hover:text-fg">{open ? "Hide ▲" : "Show ▼"}</span>
            </button>

            {open && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <div className="border border-line bg-canvas/40 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-fg">Novice view</h4>
                            {novice.isStreaming && (
                                <span className="text-xs font-mono text-accent animate-pulse">generating...</span>
                            )}
                        </div>
                        <GenUIMetaBadge meta={novice.meta} />
                        <GenUIRenderer components={novice.components} />
                    </div>

                    <div className="border border-line bg-canvas/40 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-fg">Mastered view</h4>
                            {mastered.isStreaming && (
                                <span className="text-xs font-mono text-accent animate-pulse">generating...</span>
                            )}
                        </div>
                        <GenUIMetaBadge meta={mastered.meta} />
                        <GenUIRenderer components={mastered.components} />
                    </div>
                </div>
            )}
        </div>
    );
}
