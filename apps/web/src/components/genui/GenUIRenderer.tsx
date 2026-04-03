"use client";

interface GenUIComponent {
    component: string;
    props: Record<string, unknown>;
}

export function GenUIRenderer({ components }: { components: GenUIComponent[] }) {
    if (components.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <p>Generating visualization...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {components.map((comp, idx) => (
                <div key={idx}>
                    <ComponentWrapper component={comp} />
                </div>
            ))}
        </div>
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
    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">{concept}</h4>
            <ol className="space-y-3">
                {steps?.map((step: any) => (
                    <li key={step.number} className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">
                            {step.number}
                        </span>
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{step.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.explanation}</p>
                            {step.example && (
                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 italic">Example: {step.example}</p>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
            {summary && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                    <strong>Summary:</strong> {summary}
                </div>
            )}
        </div>
    );
}

function HintCardView({ hint_level, hint_text, follow_up_question }: any) {
    const colors = {
        gentle: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
        moderate: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300",
        direct: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300",
    };
    return (
        <div className={`p-4 rounded-lg border ${colors[hint_level as keyof typeof colors] || colors.moderate}`}>
            <p className="text-xs font-medium uppercase tracking-wide mb-1">
                {hint_level} hint
            </p>
            <p className="text-sm">{hint_text}</p>
            {follow_up_question && (
                <p className="text-sm font-medium mt-3 italic">{follow_up_question}</p>
            )}
        </div>
    );
}

function FormulaCardView({ formula, variables, example }: any) {
    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-lg font-mono text-center py-2 text-gray-900 dark:text-white">{formula}</div>
            {variables && (
                <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Variables</p>
                    {variables.map((v: any) => (
                        <div key={v.symbol} className="flex gap-2 text-sm">
                            <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{v.symbol}</span>
                            <span className="text-gray-500 dark:text-gray-400">= {v.name}</span>
                            {v.unit && <span className="text-gray-400 dark:text-gray-500">({v.unit})</span>}
                        </div>
                    ))}
                </div>
            )}
            {example && (
                <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 text-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Example:</p>
                    {example.values &&
                        Object.entries(example.values).map(([k, v]) => (
                            <span key={k} className="mr-2 text-gray-700 dark:text-gray-300">
                                {k} = {String(v)}
                            </span>
                        ))}
                    {example.result && (
                        <p className="font-medium text-gray-900 dark:text-white mt-1">→ {example.result}</p>
                    )}
                </div>
            )}
        </div>
    );
}

function ConceptDiagramView({ title, diagram_type, elements, annotations }: any) {
    return (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Type: {diagram_type}</p>
            <div className="flex flex-wrap gap-3">
                {elements?.map((el: any) => (
                    <div
                        key={el.id}
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm"
                    >
                        <p className="font-medium text-blue-800 dark:text-blue-300">{el.label}</p>
                        {el.description && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{el.description}</p>}
                        {el.connects_to?.length > 0 && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">→ {el.connects_to.join(", ")}</p>
                        )}
                    </div>
                ))}
            </div>
            {annotations?.length > 0 && (
                <div className="mt-3 space-y-1">
                    {annotations.map((a: string, i: number) => (
                        <p key={i} className="text-sm text-gray-600 dark:text-gray-400">• {a}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

function AnalogyCardView({ abstract_concept, real_world_analogy, how_they_match, limitation }: any) {
    return (
        <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Analogy</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <strong>{abstract_concept}</strong> is like...
            </p>
            <p className="text-base font-medium text-purple-800 dark:text-purple-300 mb-3">{real_world_analogy}</p>
            {how_they_match?.map((m: any, i: number) => (
                <div key={i} className="flex gap-2 text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{m.concept_aspect}</span>
                    <span className="text-gray-400 dark:text-gray-500">↔</span>
                    <span className="text-purple-700 dark:text-purple-400">{m.analogy_aspect}</span>
                </div>
            ))}
            {limitation && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">Note: {limitation}</p>
            )}
        </div>
    );
}

function PracticeExerciseView({ problem, hints, worked_solution, key_insight }: any) {
    return (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">Practice</p>
            <p className="text-sm text-gray-900 dark:text-white font-medium mb-3">{problem}</p>
            {hints?.length > 0 && (
                <details className="mb-3">
                    <summary className="text-sm text-emerald-700 dark:text-emerald-400 cursor-pointer">Show hints</summary>
                    <ol className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
                        {hints.map((h: string, i: number) => (
                            <li key={i}>{h}</li>
                        ))}
                    </ol>
                </details>
            )}
            <details>
                <summary className="text-sm text-emerald-700 dark:text-emerald-400 cursor-pointer">Show solution</summary>
                <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-emerald-100 dark:border-emerald-900 text-sm text-gray-700 dark:text-gray-300">
                    {worked_solution}
                </div>
            </details>
            {key_insight && (
                <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-300 font-medium">Key insight: {key_insight}</p>
            )}
        </div>
    );
}

function ProofWalkthroughView({ theorem, proof_steps, conclusion }: any) {
    return (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Proof</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">{theorem}</p>
            <ol className="space-y-2">
                {proof_steps?.map((step: any) => (
                    <li key={step.step} className="text-sm">
                        <span className="font-medium text-indigo-800 dark:text-indigo-300">Step {step.step}:</span>{" "}
                        <span className="text-gray-700 dark:text-gray-300">{step.statement}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-4 italic">{step.justification}</p>
                    </li>
                ))}
            </ol>
            {conclusion && (
                <p className="mt-3 text-sm font-medium text-indigo-800 dark:text-indigo-300">∴ {conclusion}</p>
            )}
        </div>
    );
}

function ExpertSummaryView({ key_ideas, common_pitfalls, advanced_connections, challenge_question }: any) {
    return (
        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">Expert Summary</p>
            {key_ideas?.length > 0 && (
                <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Key Ideas</p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {key_ideas.map((idea: string, i: number) => (
                            <li key={i}>• {idea}</li>
                        ))}
                    </ul>
                </div>
            )}
            {common_pitfalls?.length > 0 && (
                <div className="mb-3">
                    <p className="text-xs font-medium text-red-500 dark:text-red-400 mb-1">Common Pitfalls</p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {common_pitfalls.map((p: string, i: number) => (
                            <li key={i}>⚠ {p}</li>
                        ))}
                    </ul>
                </div>
            )}
            {advanced_connections?.length > 0 && (
                <div className="mb-3">
                    <p className="text-xs font-medium text-blue-500 dark:text-blue-400 mb-1">Advanced Connections</p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {advanced_connections.map((c: string, i: number) => (
                            <li key={i}>→ {c}</li>
                        ))}
                    </ul>
                </div>
            )}
            {challenge_question && (
                <div className="p-3 bg-white dark:bg-gray-900 rounded border border-amber-200 dark:border-amber-800 text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">Challenge: {challenge_question}</p>
                </div>
            )}
        </div>
    );
}
