"use client";

import { useState } from "react";
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

export function AdaptiveMCQ({ question, onAnswer, bktUpdateResult }: AdaptiveMCQProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [startTime] = useState(Date.now());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = async (option: string) => {
        if (revealed || isSubmitting) return;
        setSelected(option);
        setIsSubmitting(true);
        const isCorrect = option === question.correct_answer;
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        try {
            await onAnswer(option, isCorrect, timeTaken);
            setRevealed(true);
        } catch (err) {
            console.error("Failed to record answer:", err);
            setRevealed(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const optionColor = (option: string) => {
        if (!revealed) {
            return selected === option
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 cursor-pointer";
        }
        if (option === question.correct_answer) return "border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100";
        if (option === selected) return "border-red-400 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300";
        return "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500";
    };

    return (
        <div className="space-y-4">
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

            <h3 className="text-base font-medium text-gray-900 dark:text-white leading-relaxed">{question.question}</h3>

            <div className="space-y-2">
                {(Object.entries(question.options) as ["A" | "B" | "C" | "D", string][]).map(
                    ([key, text]) => (
                        <motion.button
                            key={key}
                            onClick={() => handleSelect(key)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionColor(key)}`}
                            whileTap={{ scale: revealed ? 1 : 0.99 }}
                            disabled={revealed}
                        >
                            <span className="font-semibold mr-2">{key}.</span>
                            {text}
                        </motion.button>
                    )
                )}
            </div>

            <AnimatePresence>
                {revealed && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg ${selected === question.correct_answer
                            ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                            }`}
                    >
                        {selected === question.correct_answer ? (
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-300">Correct!</p>
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">{question.explanation}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-300">
                                    Not quite — the correct answer is {question.correct_answer}
                                </p>
                                {selected && question.misconceptions[selected] && (
                                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">{question.misconceptions[selected]}</p>
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
