export const MASTERY_THRESHOLD = 0.95;

export const SCAFFOLD_LEVELS = [
    { level: 0, name: 'novice', range: [0.0, 0.2] as const, description: 'Complete beginner — full guided walkthrough' },
    { level: 1, name: 'developing', range: [0.2, 0.4] as const, description: 'Some awareness — structured scaffold with hints' },
    { level: 2, name: 'approaching', range: [0.4, 0.6] as const, description: 'Partial understanding — hints available on request' },
    { level: 3, name: 'proficient', range: [0.6, 0.8] as const, description: 'Good understanding — minimal scaffold, practice focus' },
    { level: 4, name: 'mastered', range: [0.8, 1.0] as const, description: 'Expert — challenge mode, Socratic only' },
] as const;

export const LEVEL_NAMES = ['Novice', 'Developing', 'Approaching', 'Proficient', 'Mastered'] as const;

/**
 * Scaffold level → allowed GenUI component names.
 * SOURCE OF TRUTH for the TS side (apps/web imports this — see genui-schema.ts).
 * Mirrored by hand in apps/bkt-service/src/bkt/scaffold_resolver.py's
 * COMPONENT_CATALOG (Python can't import this file directly) — keep both in sync
 * when changing either one.
 */
export const ALLOWED_COMPONENTS: Record<number, string[]> = {
    0: ['StepByStep', 'HintCard', 'FormulaCard', 'AnalogyCard'],
    1: ['StepByStep', 'HintCard', 'FormulaCard', 'ConceptDiagram'],
    2: ['ConceptDiagram', 'FormulaCard', 'HintCard', 'PracticeExercise'],
    3: ['ConceptDiagram', 'PracticeExercise', 'ProofWalkthrough'],
    4: ['ConceptDiagram', 'ExpertSummary', 'ProofWalkthrough', 'PracticeExercise'],
};

export function getScaffoldLevel(pMastery: number): number {
    if (pMastery < 0.2) return 0;
    if (pMastery < 0.4) return 1;
    if (pMastery < 0.6) return 2;
    if (pMastery < 0.8) return 3;
    return 4;
}
