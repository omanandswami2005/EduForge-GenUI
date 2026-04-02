export interface GenUIComponent {
    component: string;
    props: Record<string, unknown>;
}

export const SCAFFOLD_COMPONENT_MAP: Record<number, string[]> = {
    0: ['StepByStep', 'HintCard', 'FormulaCard', 'AnalogyCard'],
    1: ['StepByStep', 'HintCard', 'FormulaCard', 'ConceptDiagram'],
    2: ['ConceptDiagram', 'FormulaCard', 'HintCard', 'PracticeExercise'],
    3: ['ConceptDiagram', 'PracticeExercise', 'ProofWalkthrough'],
    4: ['ConceptDiagram', 'ExpertSummary', 'ProofWalkthrough', 'PracticeExercise'],
};
