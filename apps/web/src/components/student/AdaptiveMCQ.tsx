"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, ProgressBar } from "@/components/ui";
import { masteryTone } from "@/lib/design";

interface MCQ {
    id: string;
    tier: 1 | 2 | 3;
    question: string;
    options: Record<"A" | "B" | "C" | "D", string>;
    correct_answer: "A" | "B" | "C" | "D";
    concept: string;
    explanation: string;
    misconceptions: Record<string, string>;
}

interface AdaptiveMCQProps {
    question: MCQ;
    onAnswer: (answer: string, isCorrect: boolean, timeTaken: number, misconceptionText?: string) => Promise<void>;
    bktUpdateResult?: {
        p_mastery_before: number;
        p_mastery_after: number;
        misconception?: { type: string; explanation: string };
        next_action: string;
    };
}

/** Fisher-Yates shuffle — returns new array, does not mutate */
function shuffleArray<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

const DISPLAY_LETTERS = ["A", "B", "C", "D"] as const;

/** Speak text via Web Speech API (no-op if unsupported) */
function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
}

const VALID_LETTERS = ["A", "B", "C", "D"];

/**
 * Dev-mode-only shape guard. The grading logic below does strict `===`
 * comparisons against `question.correct_answer` — if the data doesn't match
 * MCQ (letter-keyed options + a letter correct_answer), those comparisons
 * fail silently (e.g. string "0" !== number 0) and every answer reads as
 * wrong with no error anywhere. This surfaces that immediately instead of
 * requiring a live click-through to notice.
 */
function getShapeProblems(question: MCQ): string[] {
    const problems: string[] = [];
    if (Array.isArray(question.options) || typeof question.options !== "object" || question.options === null) {
        problems.push(
            `options must be an object keyed "A".."D" (got ${Array.isArray(question.options) ? "an array" : typeof question.options
            }). If this came from a seed/demo script, it's likely using {options: string[], correct_answer: number} — the wrong shape.`
        );
    } else {
        const keys = Object.keys(question.options);
        const badKeys = keys.filter((k) => !VALID_LETTERS.includes(k));
        if (badKeys.length > 0) {
            problems.push(`options has non-letter keys: ${badKeys.join(", ")} (expected only A-D).`);
        }
    }
    if (typeof question.correct_answer !== "string" || !VALID_LETTERS.includes(question.correct_answer)) {
        problems.push(
            `correct_answer must be one of "A"/"B"/"C"/"D" as a string (got ${JSON.stringify(
                question.correct_answer
            )} of type ${typeof question.correct_answer}).`
        );
    } else if (
        question.options &&
        typeof question.options === "object" &&
        !Array.isArray(question.options) &&
        !(question.correct_answer in question.options)
    ) {
        problems.push(`correct_answer "${question.correct_answer}" is not a key in options.`);
    }
    return problems;
}

export function AdaptiveMCQ({ question, onAnswer, bktUpdateResult }: AdaptiveMCQProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [startTime] = useState(Date.now());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const speechSupportedRef = useRef(typeof window !== "undefined" && "speechSynthesis" in window);

    const shapeProblems = useMemo(
        () => (process.env.NODE_ENV === "production" ? [] : getShapeProblems(question)),
        [question]
    );

    useEffect(() => {
        if (shapeProblems.length === 0) return;
        console.error(
            `[AdaptiveMCQ] Question ${question.id ?? "(no id)"} has an invalid shape — grading will silently mark every answer wrong:\n` +
            shapeProblems.map((p) => `  - ${p}`).join("\n"),
            question
        );
    }, [shapeProblems, question]);

    /**
     * Shuffle options once per question (keyed by question.id).
     * Each entry is [originalKey, text].
     * We remap displayed A/B/C/D → originalKey so grading still works.
     */
    const shuffledOptions = useMemo(() => {
        const entries = Object.entries(question.options) as ["A" | "B" | "C" | "D", string][];
        return shuffleArray(entries);
    }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Map displayed letter → original option key */
    const displayToOriginal = useMemo(
        () => Object.fromEntries(shuffledOptions.map(([orig], i) => [DISPLAY_LETTERS[i], orig])),
        [shuffledOptions]
    );

    /** Original correct_answer → displayed letter */
    const displayedCorrectLetter = useMemo(
        () =>
            (DISPLAY_LETTERS.find(
                (dl) => displayToOriginal[dl] === question.correct_answer
            ) ?? question.correct_answer) as string,
        [displayToOriginal, question.correct_answer]
    );

    const handleSelect = async (displayLetter: string) => {
        if (revealed || isSubmitting) return;
        setSelected(displayLetter);
        setIsSubmitting(true);
        const originalKey = displayToOriginal[displayLetter] ?? displayLetter;
        const isCorrect = originalKey === question.correct_answer;
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        // The specific misconception authored for whichever wrong option was
        // picked — feeds both the teacher-facing insights and, when the next
        // GenUI card is generated, gets addressed directly in the prompt.
        const misconceptionText = !isCorrect ? question.misconceptions?.[originalKey] : undefined;
        try {
            await onAnswer(originalKey, isCorrect, timeTaken, misconceptionText);
            setRevealed(true);
        } catch (err) {
            console.error("Failed to record answer:", err);
            setRevealed(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const optionColor = (displayLetter: string) => {
        if (!revealed) {
            if (isSubmitting && selected === displayLetter) {
                return "border-accent bg-accent/10 text-accent opacity-80";
            }
            return selected === displayLetter
                ? "border-accent bg-accent/10 text-accent"
                : "border-line bg-surface-2/40 hover:border-line-strong hover:bg-surface-2 cursor-pointer";
        }
        if (displayLetter === displayedCorrectLetter)
            return "border-success bg-success/10 text-success";
        if (displayLetter === selected)
            return "border-danger bg-danger/10 text-danger";
        return "border-line text-fg-subtle";
    };

    const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSpeak = useCallback(() => {
        const optionsText = shuffledOptions
            .map(([, text], i) => `${DISPLAY_LETTERS[i]}. ${text}`)
            .join(". ");
        const fullText = `${question.question}. Options: ${optionsText}`;
        setIsSpeaking(true);
        speak(fullText);
        // Reset speaking state after estimated duration; clear any previous timer
        if (speakTimerRef.current !== null) clearTimeout(speakTimerRef.current);
        const estimatedDuration = Math.max(3000, fullText.length * 60);
        speakTimerRef.current = setTimeout(() => {
            setIsSpeaking(false);
            speakTimerRef.current = null;
        }, estimatedDuration);
    }, [question.question, shuffledOptions]);

    const handleStopSpeak = useCallback(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    // Stop speech and clear timer when question changes or component unmounts
    useEffect(() => {
        return () => {
            if (speakTimerRef.current !== null) {
                clearTimeout(speakTimerRef.current);
                speakTimerRef.current = null;
            }
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [question.id]);

    return (
        <div className="space-y-4">
            {shapeProblems.length > 0 && (
                <div className="p-3 rounded-lg border-2 border-danger bg-danger/10 text-danger text-xs font-mono space-y-1">
                    <p className="font-sans font-semibold text-sm">
                        ⚠ Dev-only: this question&apos;s data shape is invalid — grading below will be wrong
                    </p>
                    {shapeProblems.map((p) => (
                        <p key={p}>• {p}</p>
                    ))}
                </div>
            )}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Badge tone={question.tier === 1 ? "info" : question.tier === 2 ? "violet" : "warning"}>
                        {question.tier === 1 ? "Foundation" : question.tier === 2 ? "Understanding" : "Analysis"}
                    </Badge>
                    <span className="text-xs font-mono text-fg-subtle">Testing: {question.concept}</span>
                </div>

                {/* TTS Speaker button */}
                {speechSupportedRef.current && (
                    <button
                        type="button"
                        onClick={isSpeaking ? handleStopSpeak : handleSpeak}
                        className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border transition-colors ${isSpeaking
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-line text-fg-subtle hover:border-line-strong"
                            }`}
                        aria-label={isSpeaking ? "Stop speaking" : "Read question aloud"}
                        title={isSpeaking ? "Stop speaking" : "Read question aloud"}
                    >
                        {isSpeaking ? (
                            <>
                                <span className="inline-block w-3 h-3 rounded-sm bg-current" />
                                Stop
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
                                    <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
                                </svg>
                                Read
                            </>
                        )}
                    </button>
                )}
            </div>

            <h3 className="text-base font-medium text-fg leading-relaxed">{question.question}</h3>

            <div className="space-y-2">
                {shuffledOptions.map(([, text], i) => {
                    const displayLetter = DISPLAY_LETTERS[i];
                    return (
                        <motion.button
                            key={displayLetter}
                            onClick={() => handleSelect(displayLetter)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${optionColor(displayLetter)}`}
                            whileTap={{ scale: revealed || isSubmitting ? 1 : 0.99 }}
                            disabled={revealed || isSubmitting}
                        >
                            <span className="font-mono font-semibold mr-2">{displayLetter}.</span>
                            {text}
                            {/* Loading spinner on the selected option while submitting */}
                            {isSubmitting && selected === displayLetter && (
                                <span className="ml-2 inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin align-middle" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Full-width submitting overlay message */}
            <AnimatePresence>
                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-sm text-accent"
                    >
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Checking answer...
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {revealed && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg ${selected === displayedCorrectLetter
                            ? "bg-success/10 border border-success/30"
                            : "bg-danger/10 border border-danger/30"
                            }`}
                    >
                        {selected === displayedCorrectLetter ? (
                            <div>
                                <p className="font-medium text-success">Correct!</p>
                                <p className="text-sm text-fg-muted mt-1">{question.explanation}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-danger">
                                    Not quite — the correct answer is {displayedCorrectLetter}
                                </p>
                                {selected &&
                                    question.misconceptions[displayToOriginal[selected] ?? selected] && (
                                        <p className="text-sm text-fg mt-1">
                                            {question.misconceptions[displayToOriginal[selected] ?? selected]}
                                        </p>
                                    )}
                                <p className="text-sm text-fg-muted mt-2">{question.explanation}</p>
                            </div>
                        )}

                        {bktUpdateResult && (
                            <div className="mt-3 pt-3 border-t border-line">
                                <div className="flex items-center gap-2">
                                    <span className="eyebrow">Mastery</span>
                                    <ProgressBar
                                        value={bktUpdateResult.p_mastery_after * 100}
                                        tone={masteryTone(bktUpdateResult.p_mastery_after)}
                                        size="sm"
                                        className="flex-1"
                                    />
                                    <span className="text-xs font-mono text-fg-subtle">
                                        {Math.round(bktUpdateResult.p_mastery_after * 100)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        {bktUpdateResult?.misconception && (
                            <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                <p className="text-sm font-medium text-warning">Let&apos;s clarify this misconception</p>
                                <p className="text-sm text-fg-muted mt-1">{bktUpdateResult.misconception.explanation}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
