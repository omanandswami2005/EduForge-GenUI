"use client";

import Link from "next/link";
import { useState } from "react";
import { EduForgeLogo } from "@/components/shared/EduForgeLogo";
import { SiteNav } from "@/components/shared/SiteNav";
import {
    ArrowUpRight,
    Check,
    Copy,
    Activity,
    GitBranch,
    Shield,
    Database,
} from "lucide-react";

export default function HomePage() {
    const [sliderMastery, setSliderMastery] = useState(0.72);
    const [copied, setCopied] = useState(false);
    const [activeSnippetTab, setActiveSnippetTab] = useState<"python" | "genui" | "bkt">("python");

    const copyBash = () => {
        navigator.clipboard.writeText("bash scripts/dev/start-everything.sh");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Live mathematical scaffold mapping
    const getScaffold = (m: number) => {
        if (m < 0.25)
            return {
                level: 0,
                name: "Foundational",
                desc: "Full guidance: step breakdowns, intuition analogies & hints",
                components: ["StepByStep", "HintCard", "FormulaCard", "AnalogyCard"],
                code: "Gating: { StepByStep, HintCard, FormulaCard, AnalogyCard }",
            };
        if (m < 0.45)
            return {
                level: 1,
                name: "Developing",
                desc: "Structural scaffolds: guided steps, concept diagrams & formulas",
                components: ["StepByStep", "HintCard", "FormulaCard", "ConceptDiagram"],
                code: "Gating: { StepByStep, HintCard, FormulaCard, ConceptDiagram }",
            };
        if (m < 0.65)
            return {
                level: 2,
                name: "Approaching",
                desc: "Transition to practice: interactive exercises & diagrams",
                components: ["ConceptDiagram", "FormulaCard", "HintCard", "PracticeExercise"],
                code: "Gating: { ConceptDiagram, FormulaCard, HintCard, PracticeExercise }",
            };
        if (m < 0.85)
            return {
                level: 3,
                name: "Proficient",
                desc: "Minimal scaffolding: rigorous practice problems & proofs",
                components: ["ConceptDiagram", "PracticeExercise", "ProofWalkthrough"],
                code: "Gating: { ConceptDiagram, PracticeExercise, ProofWalkthrough }",
            };
        return {
            level: 4,
            name: "Mastered",
            desc: "Expert autonomy: synthesis summaries, challenge sets & derivations",
            components: ["ExpertSummary", "PracticeExercise", "ProofWalkthrough"],
            code: "Gating: { ExpertSummary, PracticeExercise, ProofWalkthrough }",
        };
    };

    const scaffold = getScaffold(sliderMastery);

    return (
        <div className="min-h-screen bg-canvas text-fg">
            {/* Modal-style subtle grid background */}
            <div className="fixed inset-0 bg-grid pointer-events-none opacity-40 -z-10" />

            {/* Pill Navbar */}
            <SiteNav
                links={[
                    { href: "#bkt-engine", label: "BKT Engine" },
                    { href: "#runtime", label: "Runtime" },
                    { href: "#pipeline", label: "Pipeline" },
                ]}
                right={
                    <>
                        <Link
                            href="/login"
                            className="text-xs font-mono text-fg-muted hover:text-fg px-2 sm:px-3 py-1.5 transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="group flex items-center gap-1.5 text-xs font-mono font-medium bg-accent/15 hover:bg-accent/20 text-accent border border-accent/30 px-3.5 py-1.5 rounded-full transition-all"
                        >
                            <span>Launch</span>
                            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </>
                }
            />

            {/* Hero Section */}
            <section className="pt-16 sm:pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-accent text-[11px] font-mono mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span>Neuro-Symbolic Tutoring Framework</span>
                    <span className="text-fg-faint">|</span>
                    <span className="text-fg-subtle">P(Mastery) Constrained</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-fg max-w-3xl mx-auto leading-[1.08]">
                    Adaptive learning where{" "}
                    <span className="text-accent underline decoration-accent/30 decoration-2 underline-offset-8">
                        statistical mastery
                    </span>{" "}
                    gates the generative interface.
                </h1>

                <p className="mt-6 text-base sm:text-lg text-fg-subtle max-w-2xl mx-auto font-normal leading-relaxed">
                    Most AI tutors stream unconstrained chat. EduForge runs a local <strong>Bayesian Knowledge Tracing</strong>{" "}
                    kernel that measures student latent understanding and mathematically restricts which of 8 GenUI components
                    the LLM is permitted to render.
                </p>

                {/* Primary Actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/register"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/10"
                    >
                        <span>Start Interactive Demo</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>

                    {/* Quick Copy Terminal Command */}
                    <button
                        onClick={copyBash}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-2 border border-line text-left flex items-center justify-between gap-3 text-xs font-mono text-fg-muted transition-colors"
                        title="Copy run command"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-accent">$</span>
                            <span>bash scripts/dev/start-everything.sh</span>
                        </div>
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-accent" />
                        ) : (
                            <Copy className="w-3.5 h-3.5 text-fg-faint" />
                        )}
                    </button>
                </div>

                {/* Proof bar metrics */}
                <div className="mt-14 pt-8 border-t border-line grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
                    <div>
                        <div className="text-[11px] font-mono text-fg-faint uppercase tracking-wider">Scaffold Engine</div>
                        <div className="text-xl font-bold font-mono text-fg mt-0.5">Levels 0–4</div>
                        <div className="text-xs text-fg-subtle">Deterministic component gating</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-mono text-fg-faint uppercase tracking-wider">Inference Target</div>
                        <div className="text-xl font-bold font-mono text-fg mt-0.5">Groq Cloud</div>
                        <div className="text-xs text-fg-subtle">GPT-OSS 120B & LLaMA 3.3</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-mono text-fg-faint uppercase tracking-wider">Local Auth & DB</div>
                        <div className="text-xl font-bold font-mono text-fg mt-0.5">Zero Cloud</div>
                        <div className="text-xs text-fg-subtle">Firebase Suite Emulators</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-mono text-fg-faint uppercase tracking-wider">Misconception Loop</div>
                        <div className="text-xl font-bold font-mono text-fg mt-0.5">&lt; 100ms</div>
                        <div className="text-xs text-fg-subtle">Immediate authored feedback</div>
                    </div>
                </div>
            </section>

            {/* Interactive Hardware-like Console: BKT Gating Simulator */}
            <section id="bkt-engine" className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
                <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-2xl">
                    {/* Console Header Bar */}
                    <div className="bg-surface-2 px-4 py-3 border-b border-line flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-surface-3 border border-line-strong" />
                            <span className="w-2.5 h-2.5 rounded-full bg-surface-3 border border-line-strong" />
                            <span className="w-2.5 h-2.5 rounded-full bg-surface-3 border border-line-strong" />
                            <span className="text-xs font-mono text-fg-subtle ml-2">
                                kernel :: bkt_scaffold_resolver.py
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-fg-faint">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            <span>EMULATOR RUNNING :9090</span>
                        </div>
                    </div>

                    {/* Console Body */}
                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Interactive Slider Input */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <div className="text-xs font-mono uppercase tracking-wider text-fg-faint">
                                        Latent Student Mastery P(L_t)
                                    </div>
                                    <div className="text-sm text-fg-muted mt-0.5">
                                        Drag to simulate real-time BKT state transitions
                                    </div>
                                </div>
                                <div className="text-2xl font-mono font-bold text-accent">
                                    {(sliderMastery * 100).toFixed(0)}%
                                </div>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={sliderMastery}
                                onChange={(e) => setSliderMastery(parseFloat(e.target.value))}
                                className="w-full h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer"
                            />

                            <div className="flex justify-between text-[10px] font-mono text-fg-faint mt-2">
                                <span>P=0.00 (L0)</span>
                                <span>P=0.25 (L1)</span>
                                <span>P=0.45 (L2)</span>
                                <span>P=0.65 (L3)</span>
                                <span>P=0.85 (L4 Mastered)</span>
                            </div>
                        </div>

                        {/* Symbolic State Inspector Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {/* Card 1: Resolved Level */}
                            <div className="bg-surface-2 p-4 rounded-lg border border-line">
                                <div className="text-[10px] font-mono text-fg-faint uppercase">Current Level</div>
                                <div className="text-xl font-mono font-bold text-fg mt-1 flex items-center gap-2">
                                    <span>Level {scaffold.level}</span>
                                    <span className="text-xs font-sans px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">
                                        {scaffold.name}
                                    </span>
                                </div>
                                <p className="text-xs text-fg-subtle mt-2 leading-relaxed">
                                    {scaffold.desc}
                                </p>
                            </div>

                            {/* Card 2: Permitted Components */}
                            <div className="md:col-span-2 bg-surface-2 p-4 rounded-lg border border-line">
                                <div className="flex justify-between items-center text-[10px] font-mono text-fg-faint uppercase mb-2">
                                    <span>GenUI Gated Whitelist ({scaffold.components.length} / 8 allowed)</span>
                                    <span className="text-accent">Strict JSON Output Schema</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        "StepByStep",
                                        "HintCard",
                                        "FormulaCard",
                                        "AnalogyCard",
                                        "ConceptDiagram",
                                        "PracticeExercise",
                                        "ProofWalkthrough",
                                        "ExpertSummary",
                                    ].map((c) => {
                                        const allowed = scaffold.components.includes(c);
                                        return (
                                            <div
                                                key={c}
                                                className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between border ${
                                                    allowed
                                                        ? "bg-accent/10 text-accent border-accent/30"
                                                        : "bg-surface text-fg-faint border-line opacity-50 line-through"
                                                }`}
                                            >
                                                <span>{c}</span>
                                                {allowed && <Check className="w-3 h-3 text-accent" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Live JSON Schema Enforcer */}
                        <div className="bg-canvas p-4 rounded-lg border border-line font-mono text-xs text-fg-subtle overflow-x-auto">
                            <span className="text-fg-faint"># Live Engine Response Payload</span>
                            <div className="text-info mt-1">
                                {`{ "p_mastery": ${sliderMastery.toFixed(2)}, "scaffold_level": ${scaffold.level}, "allowed_components": ${JSON.stringify(scaffold.components)} }`}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture: How It Works Code & Tabs Section */}
            <section id="runtime" className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
                <div className="mb-10 text-left">
                    <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1">
                        Architecture Breakdown
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
                        How EduForge runs end-to-end
                    </h2>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-line mb-6 gap-2">
                    <button
                        onClick={() => setActiveSnippetTab("python")}
                        className={`pb-3 px-3 text-xs font-mono transition-colors border-b-2 -mb-px ${
                            activeSnippetTab === "python"
                                ? "border-accent text-accent font-semibold"
                                : "border-transparent text-fg-subtle hover:text-fg-muted"
                        }`}
                    >
                        01. BKT Update (Python)
                    </button>
                    <button
                        onClick={() => setActiveSnippetTab("genui")}
                        className={`pb-3 px-3 text-xs font-mono transition-colors border-b-2 -mb-px ${
                            activeSnippetTab === "genui"
                                ? "border-accent text-accent font-semibold"
                                : "border-transparent text-fg-subtle hover:text-fg-muted"
                        }`}
                    >
                        02. GenUI Generation (Next.js)
                    </button>
                    <button
                        onClick={() => setActiveSnippetTab("bkt")}
                        className={`pb-3 px-3 text-xs font-mono transition-colors border-b-2 -mb-px ${
                            activeSnippetTab === "bkt"
                                ? "border-accent text-accent font-semibold"
                                : "border-transparent text-fg-subtle hover:text-fg-muted"
                        }`}
                    >
                        03. Misconception Feedback
                    </button>
                </div>

                {/* Code Window */}
                <div className="bg-canvas rounded-xl border border-line overflow-hidden shadow-xl text-left font-mono text-xs">
                    <div className="bg-surface px-4 py-2.5 border-b border-line flex items-center justify-between text-fg-faint">
                        <span>
                            {activeSnippetTab === "python" && "apps/bkt-service/src/bkt/engine.py"}
                            {activeSnippetTab === "genui" && "apps/web/src/app/api/genui/route.ts"}
                            {activeSnippetTab === "bkt" && "apps/web/src/components/student/AdaptiveMCQ.tsx"}
                        </span>
                        <span className="text-[11px] text-fg-faint">read-only</span>
                    </div>

                    <pre className="p-5 text-fg-subtle overflow-x-auto leading-relaxed">
                        {activeSnippetTab === "python" && (
`# Bayesian Knowledge Tracing Probability Update
def update_mastery(p_prev: float, correct: bool, params: BKTParams) -> float:
    if correct:
        # P(L | Correct) = [P(L) * (1 - P(S))] / [P(L)*(1 - P(S)) + (1 - P(L))*P(G)]
        num = p_prev * (1.0 - params.p_slip)
        denom = num + (1.0 - p_prev) * params.p_guess
    else:
        # P(L | Incorrect) = [P(L) * P(S)] / [P(L)*P(S) + (1 - P(L))*(1 - P(G))]
        num = p_prev * params.p_slip
        denom = num + (1.0 - p_prev) * (1.0 - params.p_guess)

    p_posterior = num / (denom + 1e-9)
    # Account for transition probability into knowledge
    return p_posterior + (1.0 - p_posterior) * params.p_transit`
                        )}

                        {activeSnippetTab === "genui" && (
`// Next.js Route: LLM Generation bounded by BKT Allowed Components
export async function POST(req: NextRequest) {
    const { studentId, conceptId, subtopicTitle } = await req.json();

    // 1. Fetch live BKT scaffold decision from Python service
    const scaffold = await fetch(\`\${BKT_URL}/scaffold?studentId=\${studentId}&conceptId=\${conceptId}\`);
    const { allowed_components, level } = await scaffold.json();

    // 2. Stream structured components using Vercel AI SDK + Groq
    return streamText({
        model: groq(process.env.GROQ_GENUI_MODEL),
        output: Output.object({ schema: genUISchema }),
        prompt: buildGenUIPrompt({ subtopicTitle, allowed_components, level }),
    });
}`
                        )}

                        {activeSnippetTab === "bkt" && (
`// Misconception Feedback Loop
// When an answer is wrong, the authored misconception for that option
// is forwarded to the next GenUI prompt to target and correct the false belief.
const handleAnswerSubmit = async (selectedOption: string) => {
    const isCorrect = selectedOption === currentMCQ.correct_answer;
    const misconceptionText = !isCorrect 
        ? currentMCQ.misconceptions?.[selectedOption] 
        : null;

    await bktApi.updateState({
        student_id: user.uid,
        concept_id: currentConceptId,
        is_correct: isCorrect,
        misconception_text: misconceptionText, // Injected into next lesson card
    });
};`
                        )}
                    </pre>
                </div>
            </section>

            {/* Feature Cards in Modal-style 2-Column Bento */}
            <section id="pipeline" className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="p-6 rounded-xl bg-surface border border-line hover:border-line-strong transition-colors">
                        <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center mb-4">
                            <Activity className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-fg mb-2">Classroom Heatmap & Analytics</h3>
                        <p className="text-xs text-fg-subtle leading-relaxed">
                            Educators access a live student × concept matrix. Color-coded cells identify exactly where
                            cohort understanding is breaking down before exam day.
                        </p>
                    </div>

                    <div className="p-6 rounded-xl bg-surface border border-line hover:border-line-strong transition-colors">
                        <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center mb-4">
                            <GitBranch className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-fg mb-2">Concept Dependency Trees</h3>
                        <p className="text-xs text-fg-subtle leading-relaxed">
                            Built with ReactFlow: subtopics enforce pedagogical prerequisites. Downstream concepts remain
                            locked until foundational mastery surpasses 40%.
                        </p>
                    </div>

                    <div className="p-6 rounded-xl bg-surface border border-line hover:border-line-strong transition-colors">
                        <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center mb-4">
                            <Database className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-fg mb-2">Automated PPTX Ingestion</h3>
                        <p className="text-xs text-fg-subtle leading-relaxed">
                            Upload raw lecture slides. Ingestion parses slide text, hierarchizes subtopics, authors
                            multi-tier MCQs, and initializes prior BKT parameters.
                        </p>
                    </div>

                    <div className="p-6 rounded-xl bg-surface border border-line hover:border-line-strong transition-colors">
                        <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center mb-4">
                            <Shield className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-fg mb-2">Local-First Sandbox Architecture</h3>
                        <p className="text-xs text-fg-subtle leading-relaxed">
                            Zero cloud credential hassles. Runs 100% locally with Firebase Auth and Firestore emulators,
                            making testing, grading, and presentation immediate.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-line py-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-fg-faint">
                    <div className="flex items-center gap-3">
                        <EduForgeLogo size={20} showWordmark={true} />
                        <span>— Neuro-Symbolic ITS</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/login" className="hover:text-fg transition-colors">
                            Sign In
                        </Link>
                        <Link href="/register" className="hover:text-fg transition-colors">
                            Register
                        </Link>
                        <a
                            href="https://console.groq.com"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-fg transition-colors"
                        >
                            Groq Cloud
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
