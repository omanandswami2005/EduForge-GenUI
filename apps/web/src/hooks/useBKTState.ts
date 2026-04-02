"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BKTState {
    conceptId: string;
    pMastery: number;
    mastered: boolean;
    attempts: number;
    correctStreak: number;
    consecutiveWrong: number;
}

export function useBKTState(studentId: string, lessonId: string) {
    const [states, setStates] = useState<Record<string, BKTState>>({});

    useEffect(() => {
        if (!studentId) return;

        const q = query(collection(db, "bkt_states", studentId, "concepts"));

        const unsub = onSnapshot(q, (snap) => {
            const newStates: Record<string, BKTState> = {};
            snap.docs.forEach((doc) => {
                const data = doc.data();
                if (data.lessonId === lessonId) {
                    newStates[doc.id] = {
                        conceptId: doc.id,
                        pMastery: data.pMastery ?? 0.2,
                        mastered: data.mastered ?? false,
                        attempts: data.attempts ?? 0,
                        correctStreak: data.correctStreak ?? 0,
                        consecutiveWrong: data.consecutiveWrong ?? 0,
                    };
                }
            });
            setStates(newStates);
        });

        return unsub;
    }, [studentId, lessonId]);

    return states;
}
