"use client";

import { useState, useCallback, useRef } from "react";
import { useBKTStore } from "@/stores/bktStore";

interface GenUIComponent {
    component: string;
    props: Record<string, unknown>;
}

const ALLOWED_MAP: Record<number, string[]> = {
    0: ["StepByStep", "HintCard", "FormulaCard", "AnalogyCard"],
    1: ["StepByStep", "HintCard", "FormulaCard", "ConceptDiagram"],
    2: ["ConceptDiagram", "FormulaCard", "HintCard", "PracticeExercise"],
    3: ["ConceptDiagram", "PracticeExercise", "ProofWalkthrough"],
    4: ["ConceptDiagram", "ExpertSummary", "ProofWalkthrough", "PracticeExercise"],
};

function validateComponents(raw: GenUIComponent[], level: number): GenUIComponent[] {
    const allowed = new Set(ALLOWED_MAP[level] ?? ALLOWED_MAP[2]);
    const filtered = raw.filter((item) => item.component && item.props && allowed.has(item.component));
    if (filtered.length === 0) {
        return level <= 1
            ? [{ component: "HintCard", props: { hint_level: "gentle", hint_text: "Let me help you understand this concept." } }]
            : [{ component: "ConceptDiagram", props: { title: "Loading...", diagram_type: "hierarchy", elements: [] } }];
    }
    return filtered;
}

export function useGenUI(studentId: string) {
    const [components, setComponents] = useState<GenUIComponent[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scaffoldLevel = useBKTStore((s) => s.scaffoldLevel);
    const abortRef = useRef<AbortController | null>(null);

    const generate = useCallback(
        async (conceptId: string, subtopicId: string, lessonId: string) => {
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            setIsStreaming(true);
            setError(null);
            setComponents([]);

            try {
                const res = await fetch("/api/genui", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ conceptId, subtopicId, lessonId, studentId, type: "visualize" }),
                    signal: abortRef.current.signal,
                });

                if (!res.ok) throw new Error(`GenUI stream failed: ${res.status}`);
                if (!res.body) throw new Error("No stream body");

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value, { stream: true });

                    // Parse SSE: strip "data: " prefix from each line
                    const lines = text.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const payload = line.slice(6);
                            if (payload === "[DONE]") continue;
                            accumulated += payload;
                        }
                    }

                    try {
                        const parsed = JSON.parse(accumulated);
                        if (Array.isArray(parsed)) {
                            setComponents(validateComponents(parsed, scaffoldLevel));
                        }
                    } catch {
                        // JSON not complete yet
                    }
                }

                try {
                    const final = JSON.parse(accumulated);
                    if (Array.isArray(final)) {
                        setComponents(validateComponents(final, scaffoldLevel));
                    }
                } catch {
                    setError("Failed to parse GenUI response");
                }
            } catch (e: unknown) {
                if (e instanceof Error && e.name !== "AbortError") {
                    setError(e.message);
                }
            } finally {
                setIsStreaming(false);
            }
        },
        [studentId, scaffoldLevel]
    );

    return { components, isStreaming, error, generate };
}
