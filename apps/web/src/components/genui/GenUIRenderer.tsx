"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MathText } from "./MathText";

interface GenUIComponent {
    component: string;
    props: Record<string, unknown>;
}

// ── Animation presets ──
const fadeUp = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.35, ease: "easeOut" },
};
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const scaleIn = {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 260, damping: 20 },
};

export function GenUIRenderer({ components }: { components: GenUIComponent[] }) {
    if (components.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <div className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <p className="mt-2">Generating visualization...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div className="space-y-6" {...stagger} initial="initial" animate="animate">
            {components.map((comp, idx) => (
                <motion.div key={`${comp.component}-${idx}`} {...fadeUp}>
                    <ComponentWrapper component={comp} />
                </motion.div>
            ))}
        </motion.div>
    );
}

function ComponentWrapper({ component: comp }: { component: GenUIComponent }) {
    try {
        return renderComponent(comp);
    } catch {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                Failed to render component: {comp.component}
            </div>
        );
    }
}

function renderComponent({ component, props }: GenUIComponent) {
    switch (component) {
        case "StepByStep":
            return <StepByStepView {...(props as any)} />;
        case "HintCard":
            return <HintCardView {...(props as any)} />;
        case "FormulaCard":
            return <FormulaCardView {...(props as any)} />;
        case "ConceptDiagram":
            return <ConceptDiagramView {...(props as any)} />;
        case "AnalogyCard":
            return <AnalogyCardView {...(props as any)} />;
        case "PracticeExercise":
            return <PracticeExerciseView {...(props as any)} />;
        case "ProofWalkthrough":
            return <ProofWalkthroughView {...(props as any)} />;
        case "ExpertSummary":
            return <ExpertSummaryView {...(props as any)} />;
        default:
            return <div className="text-sm text-gray-400 dark:text-gray-500">Unknown component: {component}</div>;
    }
}

function StepByStepView({ concept, steps, summary }: any) {
    const [activeStep, setActiveStep] = useState(0);
    const total = steps?.length ?? 0;

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
                <MathText inline>{concept}</MathText>
            </h4>

            {/* Interactive progress bar */}
            {total > 0 && (
                <div className="flex items-center gap-1">
                    {steps.map((_: any, i: number) => (
                        <button
                            key={`progress-${i}`}
                            onClick={() => setActiveStep(i)}
                            className="group flex-1 flex flex-col items-center gap-1"
                            title={`Step ${i + 1}`}
                        >
                            <motion.div
                                className={`h-1.5 w-full rounded-full transition-colors ${i <= activeStep
                                        ? "bg-blue-500 dark:bg-blue-400"
                                        : "bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-200 dark:group-hover:bg-blue-900"
                                    }`}
                                layoutId={undefined}
                                initial={false}
                                animate={{ scaleX: i <= activeStep ? 1 : 0.85 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            />
                        </button>
                    ))}
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                        {activeStep + 1}/{total}
                    </span>
                </div>
            )}

            {/* Animated step list */}
            <ol className="space-y-3">
                {steps?.map((step: any, idx: number) => (
                    <motion.li
                        key={`step-${idx}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            scale: idx === activeStep ? 1 : 0.97,
                        }}
                        transition={{ delay: idx * 0.06, duration: 0.3 }}
                        onClick={() => setActiveStep(idx)}
                        className={`flex gap-3 cursor-pointer rounded-lg p-2 -ml-2 transition-colors ${idx === activeStep
                                ? "bg-blue-50/70 dark:bg-blue-950/40"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                            }`}
                    >
                        <motion.span
                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${idx < activeStep
                                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                    : idx === activeStep
                                        ? "bg-blue-500 dark:bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                                }`}
                            animate={idx === activeStep ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {idx < activeStep ? "✓" : (step.number ?? idx + 1)}
                        </motion.span>
                        <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                                <MathText inline>{step.title}</MathText>
                            </p>
                            <AnimatePresence initial={false}>
                                {idx === activeStep && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            <MathText>{step.explanation}</MathText>
                                        </div>
                                        {step.example && (
                                            <div className="text-sm text-blue-600 dark:text-blue-400 mt-2 italic border-l-2 border-blue-300 dark:border-blue-700 pl-3">
                                                {"Example: "}<MathText inline>{step.example}</MathText>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.li>
                ))}
            </ol>

            {/* Step navigation */}
            {total > 1 && (
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                        disabled={activeStep === 0}
                        className="px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Prev
                    </button>
                    <button
                        onClick={() => setActiveStep(Math.min(total - 1, activeStep + 1))}
                        disabled={activeStep === total - 1}
                        className="px-3 py-1.5 text-xs rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Summary reveal */}
            {summary && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: activeStep === total - 1 ? 1 : 0.5 }}
                    className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900"
                >
                    <strong>{"Summary: "}</strong><MathText inline>{summary}</MathText>
                </motion.div>
            )}
        </div>
    );
}

function HintCardView({ hint_level, hint_text, follow_up_question }: any) {
    const [revealed, setRevealed] = useState(false);
    const colorMap = {
        gentle: {
            bg: "bg-green-50 dark:bg-green-950",
            border: "border-green-200 dark:border-green-800",
            text: "text-green-800 dark:text-green-300",
            accent: "bg-green-500",
            btn: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200",
        },
        moderate: {
            bg: "bg-yellow-50 dark:bg-yellow-950",
            border: "border-yellow-200 dark:border-yellow-800",
            text: "text-yellow-800 dark:text-yellow-300",
            accent: "bg-yellow-500",
            btn: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200",
        },
        direct: {
            bg: "bg-orange-50 dark:bg-orange-950",
            border: "border-orange-200 dark:border-orange-800",
            text: "text-orange-800 dark:text-orange-300",
            accent: "bg-orange-500",
            btn: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200",
        },
    };
    const c = colorMap[hint_level as keyof typeof colorMap] || colorMap.moderate;

    return (
        <motion.div
            className={`rounded-lg border overflow-hidden ${c.bg} ${c.border}`}
            {...scaleIn}
        >
            {/* Level indicator bar */}
            <div className={`h-1 ${c.accent}`} />
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <p className={`text-xs font-medium uppercase tracking-wide ${c.text}`}>
                        {hint_level === "gentle" ? "💡" : hint_level === "moderate" ? "🔍" : "🎯"}{" "}
                        {hint_level} hint
                    </p>
                    {!revealed && (
                        <button
                            onClick={() => setRevealed(true)}
                            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${c.btn}`}
                        >
                            Reveal hint
                        </button>
                    )}
                </div>

                <AnimatePresence initial={false}>
                    {revealed ? (
                        <motion.div
                            initial={{ opacity: 0, height: 0, filter: "blur(8px)" }}
                            animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="text-sm">
                                <MathText>{hint_text}</MathText>
                            </div>
                            {follow_up_question && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={`text-sm font-medium mt-3 italic p-2 rounded-md ${c.bg}`}
                                >
                                    {"🤔 "}<MathText inline>{follow_up_question}</MathText>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            className="text-sm select-none"
                            style={{ filter: "blur(6px)" }}
                        >
                            <MathText>{hint_text}</MathText>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function FormulaCardView({ formula, variables, example }: any) {
    const [showExample, setShowExample] = useState(false);
    const [highlightedVar, setHighlightedVar] = useState<string | null>(null);

    return (
        <motion.div
            className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            {...scaleIn}
        >
            {/* Formula display */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 text-center">
                <motion.div
                    className="py-2 overflow-x-auto"
                    animate={highlightedVar ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <MathText className="text-gray-900 dark:text-white text-lg">{formula}</MathText>
                </motion.div>
            </div>

            {/* Interactive variable list */}
            {variables && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Variables — click to highlight
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {variables.map((v: any, idx: number) => (
                            <motion.button
                                key={`var-${v.symbol ?? idx}`}
                                onClick={() => setHighlightedVar(
                                    highlightedVar === v.symbol ? null : v.symbol
                                )}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm border transition-all ${highlightedVar === v.symbol
                                        ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 ring-2 ring-blue-200 dark:ring-blue-800"
                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750"
                                    }`}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                                    <MathText inline>{v.symbol}</MathText>
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">=</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    <MathText inline>{v.name}</MathText>
                                </span>
                                {v.unit && (
                                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                                        {"("}<MathText inline>{v.unit}</MathText>{")"}
                                    </span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* Interactive example toggle */}
            {example && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setShowExample(!showExample)}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between"
                    >
                        <span>{showExample ? "Hide" : "Show"} worked example</span>
                        <motion.span
                            animate={{ rotate: showExample ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            ▼
                        </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                        {showExample && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 space-y-2">
                                    {example.values && (
                                        <motion.div
                                            className="flex flex-wrap gap-2"
                                            initial="initial"
                                            animate="animate"
                                            variants={stagger}
                                        >
                                            {Object.entries(example.values).map(([k, v], i) => (
                                                <motion.span
                                                    key={k}
                                                    variants={fadeUp}
                                                    className="px-2 py-1 bg-blue-50 dark:bg-blue-950 rounded text-sm text-gray-700 dark:text-gray-300 border border-blue-100 dark:border-blue-900"
                                                >
                                                    <MathText inline>{`${k} = ${String(v)}`}</MathText>
                                                </motion.span>
                                            ))}
                                        </motion.div>
                                    )}
                                    {example.result && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex items-center gap-2 font-medium text-gray-900 dark:text-white text-sm p-2 bg-green-50 dark:bg-green-950 rounded-md border border-green-100 dark:border-green-900"
                                        >
                                            <span className="text-green-600">→</span>
                                            <MathText inline>{example.result}</MathText>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}

function ConceptDiagramView({ title, diagram_type, elements, annotations }: any) {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const safeElements = elements ?? [];

    // Find which elements are connected to selected
    const connectedIds = new Set<string>();
    if (selectedNode) {
        const sel = safeElements.find((e: any) => e.id === selectedNode);
        sel?.connects_to?.forEach((id: string) => connectedIds.add(id));
        // Also find reverse connections
        safeElements.forEach((e: any) => {
            if (e.connects_to?.includes(selectedNode)) connectedIds.add(e.id);
        });
    }

    const diagramIcons: Record<string, string> = {
        process_flow: "→",
        comparison: "⇔",
        hierarchy: "▽",
        cycle: "↻",
        relationship: "◇",
    };

    return (
        <motion.div
            className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
            {...scaleIn}
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{diagramIcons[diagram_type] ?? "◈"}</span>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                    <MathText inline>{title}</MathText>
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {diagram_type?.replace("_", " ")}
                </span>
            </div>

            {/* Interactive nodes */}
            <div className="relative">
                <div className="flex flex-wrap gap-3">
                    {safeElements.map((el: any, idx: number) => {
                        const isSelected = selectedNode === el.id;
                        const isConnected = connectedIds.has(el.id);
                        const isDimmed = selectedNode && !isSelected && !isConnected;

                        return (
                            <motion.button
                                key={el.id ?? `elem-${idx}`}
                                onClick={() => setSelectedNode(isSelected ? null : el.id)}
                                className={`text-left px-3 py-2 rounded-lg text-sm border-2 transition-all ${isSelected
                                        ? "bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                                        : isConnected
                                            ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
                                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                                    }`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: isDimmed ? 0.4 : 1,
                                    scale: isSelected ? 1.05 : 1,
                                }}
                                transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
                                whileHover={{ scale: isSelected ? 1.05 : 1.03 }}
                            >
                                <p className={`font-medium ${isSelected
                                        ? "text-blue-800 dark:text-blue-200"
                                        : isConnected
                                            ? "text-green-800 dark:text-green-300"
                                            : "text-gray-800 dark:text-gray-200"
                                    }`}>
                                    <MathText inline>{el.label}</MathText>
                                </p>
                                {el.description && (
                                    <AnimatePresence>
                                        {(isSelected || !selectedNode) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-xs mt-1 text-gray-500 dark:text-gray-400"
                                            >
                                                <MathText inline>{el.description}</MathText>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                                {isSelected && el.connects_to?.length > 0 && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-xs text-blue-500 dark:text-blue-400 mt-1"
                                    >
                                        connects to: {el.connects_to.join(", ")}
                                    </motion.p>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Connection lines (animated arrows between selected and connected) */}
                {selectedNode && connectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 flex flex-wrap gap-1"
                    >
                        {Array.from(connectedIds).map((cid) => {
                            const target = safeElements.find((e: any) => e.id === cid);
                            return (
                                <motion.span
                                    key={`conn-${cid}`}
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                >
                                    {selectedNode} → {target?.label ?? cid}
                                </motion.span>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* Annotations */}
            {annotations?.length > 0 && (
                <motion.div
                    className="mt-4 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3"
                    initial="initial"
                    animate="animate"
                    variants={stagger}
                >
                    {annotations.map((a: string, i: number) => (
                        <motion.div
                            key={`ann-${i}`}
                            variants={fadeUp}
                            className="text-sm text-gray-600 dark:text-gray-400"
                        >
                            {"• "}<MathText inline>{a}</MathText>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {selectedNode && (
                <button
                    onClick={() => setSelectedNode(null)}
                    className="mt-3 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    Click a node or here to reset
                </button>
            )}
        </motion.div>
    );
}

function AnalogyCardView({ abstract_concept, real_world_analogy, how_they_match, limitation }: any) {
    const [revealedPairs, setRevealedPairs] = useState<Set<number>>(new Set());
    const [allRevealed, setAllRevealed] = useState(false);

    const togglePair = (i: number) => {
        setRevealedPairs((prev) => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i); else next.add(i);
            return next;
        });
    };

    const revealAll = () => {
        setAllRevealed(true);
        setRevealedPairs(new Set(how_they_match?.map((_: any, i: number) => i) ?? []));
    };

    return (
        <motion.div
            className="rounded-lg border border-purple-200 dark:border-purple-800 overflow-hidden"
            {...scaleIn}
        >
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
                    🔗 Analogy
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                    <motion.span
                        className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg font-medium text-purple-800 dark:text-purple-300 text-sm"
                        whileHover={{ scale: 1.03 }}
                    >
                        <MathText inline>{abstract_concept}</MathText>
                    </motion.span>
                    <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-purple-400"
                    >
                        ↔
                    </motion.span>
                    <motion.span
                        className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900 rounded-lg font-medium text-pink-800 dark:text-pink-300 text-sm"
                        whileHover={{ scale: 1.03 }}
                    >
                        <MathText inline>{real_world_analogy}</MathText>
                    </motion.span>
                </div>
            </div>

            {/* Interactive matching pairs */}
            {how_they_match?.length > 0 && (
                <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Tap each pair to explore the connection
                        </p>
                        {!allRevealed && (
                            <button
                                onClick={revealAll}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                            >
                                Reveal all
                            </button>
                        )}
                    </div>
                    {how_they_match.map((m: any, i: number) => {
                        const isRevealed = revealedPairs.has(i);
                        return (
                            <motion.button
                                key={`match-${i}`}
                                onClick={() => togglePair(i)}
                                className="w-full text-left"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isRevealed
                                        ? "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30"
                                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                                    }`}>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                                        <MathText inline>{m.concept_aspect}</MathText>
                                    </span>
                                    <AnimatePresence mode="wait">
                                        {isRevealed ? (
                                            <motion.span
                                                key="arrow"
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-purple-400 text-xs"
                                            >
                                                ↔
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="q"
                                                className="text-xs text-gray-400"
                                            >
                                                ?
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    <span className={`text-sm flex-1 text-right transition-all ${isRevealed
                                            ? "text-purple-700 dark:text-purple-400"
                                            : "text-transparent bg-purple-200 dark:bg-purple-800 rounded select-none"
                                        }`}>
                                        <MathText inline>{m.analogy_aspect}</MathText>
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {limitation && (
                <div className="px-4 pb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                        {"⚠ Limitation: "}<MathText inline>{limitation}</MathText>
                    </p>
                </div>
            )}
        </motion.div>
    );
}

function PracticeExerciseView({ problem, hints, worked_solution, key_insight }: any) {
    const [hintsRevealed, setHintsRevealed] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const [showInsight, setShowInsight] = useState(false);
    const totalHints = hints?.length ?? 0;

    return (
        <motion.div
            className="rounded-lg border border-emerald-200 dark:border-emerald-800 overflow-hidden"
            {...scaleIn}
        >
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 px-4 py-3">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    ✏️ Practice
                </p>
            </div>

            {/* Problem */}
            <div className="p-4">
                <div className="text-sm text-gray-900 dark:text-white font-medium mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <MathText>{problem}</MathText>
                </div>

                {/* Progressive hint system */}
                {totalHints > 0 && (
                    <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Hints ({hintsRevealed}/{totalHints})
                            </p>
                            {/* Hint progress dots */}
                            <div className="flex gap-1">
                                {hints.map((_: string, i: number) => (
                                    <div
                                        key={`hint-dot-${i}`}
                                        className={`w-2 h-2 rounded-full transition-colors ${i < hintsRevealed
                                                ? "bg-emerald-400 dark:bg-emerald-500"
                                                : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <AnimatePresence>
                            {hints.slice(0, hintsRevealed).map((h: string, i: number) => (
                                <motion.div
                                    key={`hint-${i}`}
                                    initial={{ opacity: 0, height: 0, x: -12 }}
                                    animate={{ opacity: 1, height: "auto", x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-sm text-emerald-700 dark:text-emerald-400 p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-md border-l-2 border-emerald-300 dark:border-emerald-700"
                                >
                                    <span className="font-medium">Hint {i + 1}: </span>
                                    <MathText inline>{h}</MathText>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {hintsRevealed < totalHints && (
                            <button
                                onClick={() => setHintsRevealed((n) => n + 1)}
                                className="text-sm px-3 py-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                            >
                                {hintsRevealed === 0 ? "Need a hint?" : "Another hint?"}
                            </button>
                        )}
                    </div>
                )}

                {/* Worked solution reveal */}
                <div className="space-y-2">
                    <button
                        onClick={() => setShowSolution(!showSolution)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-md font-medium transition-all flex items-center justify-between ${showSolution
                                ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            }`}
                    >
                        <span>{showSolution ? "Hide solution" : "Show full solution"}</span>
                        <motion.span animate={{ rotate: showSolution ? 180 : 0 }}>▼</motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                        {showSolution && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="p-3 bg-white dark:bg-gray-900 rounded border border-emerald-100 dark:border-emerald-900 text-sm text-gray-700 dark:text-gray-300">
                                    <MathText>{worked_solution}</MathText>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Key insight — appears after solution is viewed */}
                {key_insight && showSolution && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-3"
                    >
                        {!showInsight ? (
                            <button
                                onClick={() => setShowInsight(true)}
                                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                💡 See key insight
                            </button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-sm font-medium text-emerald-800 dark:text-emerald-300 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800"
                            >
                                {"💡 "}<MathText inline>{key_insight}</MathText>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

function ProofWalkthroughView({ theorem, proof_steps, conclusion }: any) {
    const [visibleSteps, setVisibleSteps] = useState(1);
    const total = proof_steps?.length ?? 0;

    return (
        <motion.div
            className="rounded-lg border border-indigo-200 dark:border-indigo-800 overflow-hidden"
            {...scaleIn}
        >
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950 px-4 py-3">
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                    📐 Proof
                </p>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                    <MathText>{theorem}</MathText>
                </div>
            </div>

            <div className="p-4">
                {/* Progress */}
                {total > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(visibleSteps / total) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            {visibleSteps}/{total}
                        </span>
                    </div>
                )}

                <ol className="space-y-2">
                    {proof_steps?.slice(0, visibleSteps).map((step: any, idx: number) => (
                        <motion.li
                            key={`proof-${idx}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx === visibleSteps - 1 ? 0.1 : 0 }}
                            className="text-sm p-2 rounded-md bg-indigo-50/50 dark:bg-indigo-950/30"
                        >
                            <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-medium">
                                    {step.step}
                                </span>
                                <div className="flex-1">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        <MathText inline>{step.statement}</MathText>
                                    </span>
                                    <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 italic">
                                        <MathText inline>{step.justification}</MathText>
                                    </div>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                </ol>

                {/* Reveal more or conclude */}
                <div className="flex gap-2 mt-3">
                    {visibleSteps < total && (
                        <button
                            onClick={() => setVisibleSteps((n) => Math.min(n + 1, total))}
                            className="text-sm px-3 py-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                        >
                            Next step →
                        </button>
                    )}
                    {visibleSteps > 1 && (
                        <button
                            onClick={() => setVisibleSteps((n) => Math.max(1, n - 1))}
                            className="text-sm px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            ← Back
                        </button>
                    )}
                    {visibleSteps < total && (
                        <button
                            onClick={() => setVisibleSteps(total)}
                            className="text-xs px-2 py-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            Show all
                        </button>
                    )}
                </div>

                {/* Conclusion — only after all steps */}
                {conclusion && visibleSteps >= total && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-sm font-medium text-indigo-800 dark:text-indigo-300 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800"
                    >
                        {"∴ "}<MathText inline>{conclusion}</MathText>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

function ExpertSummaryView({ key_ideas, common_pitfalls, advanced_connections, challenge_question }: any) {
    const [activeTab, setActiveTab] = useState<"ideas" | "pitfalls" | "connections">("ideas");
    const [challengeRevealed, setChallengeRevealed] = useState(false);

    const tabs = [
        { key: "ideas" as const, label: "Key Ideas", icon: "💡", items: key_ideas, color: "amber" },
        { key: "pitfalls" as const, label: "Pitfalls", icon: "⚠", items: common_pitfalls, color: "red" },
        { key: "connections" as const, label: "Connections", icon: "→", items: advanced_connections, color: "blue" },
    ].filter((t) => t.items?.length > 0);

    const activeItems = tabs.find((t) => t.key === activeTab)?.items ?? [];

    return (
        <motion.div
            className="rounded-lg border border-amber-200 dark:border-amber-800 overflow-hidden"
            {...scaleIn}
        >
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 px-4 py-3">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    🎓 Expert Summary
                </p>
            </div>

            {/* Tab navigation */}
            {tabs.length > 1 && (
                <div className="flex border-b border-amber-100 dark:border-amber-900">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors relative ${activeTab === tab.key
                                    ? "text-amber-700 dark:text-amber-300"
                                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                                }`}
                        >
                            {tab.icon} {tab.label}
                            {activeTab === tab.key && (
                                <motion.div
                                    layoutId="expert-tab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 dark:bg-amber-400"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Animated content area */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    <motion.ul
                        key={activeTab}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-gray-700 dark:text-gray-300 space-y-2"
                    >
                        {activeItems.map((item: string, i: number) => (
                            <motion.li
                                key={`${activeTab}-${i}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex gap-2 p-1.5 rounded-md hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors"
                            >
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
                                    {i + 1}
                                </span>
                                <MathText inline>{item}</MathText>
                            </motion.li>
                        ))}
                    </motion.ul>
                </AnimatePresence>
            </div>

            {/* Challenge question */}
            {challenge_question && (
                <div className="border-t border-amber-100 dark:border-amber-900 p-4">
                    {!challengeRevealed ? (
                        <button
                            onClick={() => setChallengeRevealed(true)}
                            className="w-full text-center text-sm px-3 py-2 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors font-medium"
                        >
                            🏆 Ready for a challenge?
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-800 text-sm"
                        >
                            <p className="font-medium text-amber-800 dark:text-amber-300">
                                {"🏆 "}<MathText inline>{challenge_question}</MathText>
                            </p>
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
