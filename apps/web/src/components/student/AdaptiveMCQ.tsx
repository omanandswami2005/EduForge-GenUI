"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    onAnswer: (answer: string, isCorrect: boolean, timeTaken: number) => Promise<void>;
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

export function AdaptiveMCQ({ question, onAnswer, bktUpdateResult }: AdaptiveMCQProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [startTime] = useState(Date.now());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const speechSupportedRef = useRef(typeof window !== "undefined" && "speechSynthesis" in window);

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
        try {
            await onAnswer(originalKey, isCorrect, timeTaken);
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
                return "border-blue-400 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 opacity-80";
            }
            return selected === displayLetter
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 cursor-pointer";
        }
        if (displayLetter === displayedCorrectLetter)
            return "border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100";
        if (displayLetter === selected)
            return "border-red-400 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300";
        return "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500";
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${question.tier === 1
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : question.tier === 2
                                ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                                : "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                            }`}
                    >
                        {question.tier === 1 ? "Foundation" : question.tier === 2 ? "Understanding" : "Analysis"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Testing: {question.concept}</span>
                </div>

                {/* TTS Speaker button */}
                {speechSupportedRef.current && (
                    <button
                        type="button"
                        onClick={isSpeaking ? handleStopSpeak : handleSpeak}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${isSpeaking
                            ? "border-blue-400 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400"
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

            <h3 className="text-base font-medium text-gray-900 dark:text-white leading-relaxed">{question.question}</h3>

            <div className="space-y-2">
                {shuffledOptions.map(([, text], i) => {
                    const displayLetter = DISPLAY_LETTERS[i];
                    return (
                        <motion.button
                            key={displayLetter}
                            onClick={() => handleSelect(displayLetter)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionColor(displayLetter)}`}
                            whileTap={{ scale: revealed || isSubmitting ? 1 : 0.99 }}
                            disabled={revealed || isSubmitting}
                        >
                            <span className="font-semibold mr-2">{displayLetter}.</span>
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
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
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
                            ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                            }`}
                    >
                        {selected === displayedCorrectLetter ? (
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-300">Correct!</p>
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">{question.explanation}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-300">
                                    Not quite — the correct answer is {displayedCorrectLetter}
                                </p>
                                {selected &&
                                    question.misconceptions[displayToOriginal[selected] ?? selected] && (
                                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                            {question.misconceptions[displayToOriginal[selected] ?? selected]}
                                        </p>
                                    )}
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{question.explanation}</p>
                            </div>
                        )}

                        {bktUpdateResult && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Mastery</span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-700"
                                            style={{ width: `${bktUpdateResult.p_mastery_after * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {Math.round(bktUpdateResult.p_mastery_after * 100)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        {bktUpdateResult?.misconception && (
                            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Let&apos;s clarify this misconception</p>
                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">{bktUpdateResult.misconception.explanation}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
