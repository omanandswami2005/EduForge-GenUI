export const MASTERY_THRESHOLD = 0.95;

export const SCAFFOLD_LEVELS = [
    { level: 0, name: 'novice', range: [0.0, 0.2] as const, description: 'Complete beginner — full guided walkthrough' },
    { level: 1, name: 'developing', range: [0.2, 0.4] as const, description: 'Some awareness — structured scaffold with hints' },
    { level: 2, name: 'approaching', range: [0.4, 0.6] as const, description: 'Partial understanding — hints available on request' },
    { level: 3, name: 'proficient', range: [0.6, 0.8] as const, description: 'Good understanding — minimal scaffold, practice focus' },
    { level: 4, name: 'mastered', range: [0.8, 1.0] as const, description: 'Expert — challenge mode, Socratic only' },
] as const;

export function getScaffoldLevel(pMastery: number): number {
    if (pMastery < 0.2) return 0;
    if (pMastery < 0.4) return 1;
    if (pMastery < 0.6) return 2;
    if (pMastery < 0.8) return 3;
    return 4;
}
