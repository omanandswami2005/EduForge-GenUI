export interface BKTParams {
    conceptId: string;
    conceptLabel: string;
    subtopicId: string;
    pInitial: number;
    pLearn: number;
    pSlip: number;
    pGuess: number;
}

export interface StudentConceptState {
    studentId: string;
    lessonId: string;
    subtopicId: string;
    conceptId: string;
    pMastery: number;
    attempts: number;
    correctStreak: number;
    mastered: boolean;
    consecutiveWrong: number;
    lastUpdated: Date;
    responseHistory: ResponseHistoryEntry[];
}

export interface ResponseHistoryEntry {
    isCorrect: boolean;
    pMasteryBefore: number;
    pMasteryAfter: number;
}

export interface ScaffoldDecision {
    level: number;
    levelName: string;
    allowedComponents: string[];
    pMastery: number;
    description: string;
}

export interface BKTUpdateResponse {
    pMasteryBefore: number;
    pMasteryAfter: number;
    scaffoldLevel: number;
    allowedComponents: string[];
    mastered: boolean;
    misconception: { type: string; explanation: string } | null;
    nextAction: 'continue' | 'subtopic_complete' | 'misconception_remediation';
}
