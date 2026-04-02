export interface Lesson {
    id: string;
    title: string;
    subject: string;
    teacherId: string;
    status: 'draft' | 'processing' | 'published' | 'archived';
    gcsPath?: string;
    createdAt: Date;
    publishedAt?: Date;
    ingestion?: IngestionStatus;
}

export type IngestionStep =
    | 'queued'
    | 'extracting'
    | 'parsing_layout'
    | 'generating_topics'
    | 'generating_mcqs'
    | 'building_graph'
    | 'complete'
    | 'failed';

export interface IngestionStatus {
    step: IngestionStep;
    progress: number;
    message: string;
    subtopicsFound?: number;
    mcqsGenerated?: number;
    conceptsFound?: number;
    error?: string;
    completedAt?: Date;
}

export interface Subtopic {
    id: string;
    title: string;
    description: string;
    order: number;
    difficulty: 'foundational' | 'intermediate' | 'advanced';
    slideNumbers: number[];
    keyConcepts: string[];
    learningObjectives: string[];
    prerequisiteSubtopicIds: string[];
}

export interface MCQ {
    id: string;
    subtopicId: string;
    conceptId: string;
    tier: 1 | 2 | 3;
    question: string;
    options: Record<'A' | 'B' | 'C' | 'D', string>;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    misconceptions: Record<string, string>;
    concept: string;
}
