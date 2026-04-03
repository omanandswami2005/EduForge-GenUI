import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ConceptState {
    conceptId: string;
    pMastery: number;
    mastered: boolean;
    attempts: number;
    scaffoldLevel: number;
}

interface BKTStore {
    states: Record<string, ConceptState>;
    scaffoldLevel: number;
    allowedComponents: string[];
    updateConceptState: (conceptId: string, state: Partial<ConceptState>) => void;
    setScaffoldDecision: (level: number, components: string[]) => void;
    subscribeToLesson: (studentId: string, lessonId: string) => () => void;
}

export const useBKTStore = create<BKTStore>()(
    subscribeWithSelector((set) => ({
        states: {},
        scaffoldLevel: 0,
        allowedComponents: ["StepByStep", "HintCard", "FormulaCard", "AnalogyCard"],

        updateConceptState: (conceptId, state) =>
            set((s) => ({
                states: {
                    ...s.states,
                    [conceptId]: { ...s.states[conceptId], ...state } as ConceptState,
                },
            })),

        setScaffoldDecision: (level, components) =>
            set({ scaffoldLevel: level, allowedComponents: components }),

        subscribeToLesson: (studentId, lessonId) => {
            const q = query(collection(db, "bkt_states", studentId, "concepts"));

            return onSnapshot(q, (snap) => {
                const states: Record<string, ConceptState> = {};
                snap.docs.forEach((doc) => {
                    const data = doc.data();
                    if (data.lessonId === lessonId) {
                        states[doc.id] = {
                            conceptId: doc.id,
                            pMastery: data.pMastery,
                            mastered: data.mastered,
                            attempts: data.attempts,
                            scaffoldLevel: Math.min(4, Math.floor(data.pMastery * 5)),
                        };
                    }
                });
                set({ states });
            });
        },
    }))
);
