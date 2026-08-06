"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LessonMasterySummary {
    lessonId: string;
    avgMastery: number;
    conceptCount: number;
    masteredCount: number;
}

interface OverallMastery {
    perLesson: Record<string, LessonMasterySummary>;
    overallAvgMastery: number;
    totalConcepts: number;
    totalMastered: number;
}

const EMPTY: OverallMastery = {
    perLesson: {},
    overallAvgMastery: 0,
    totalConcepts: 0,
    totalMastered: 0,
};

/**
 * Aggregates a student's BKT state across *every* lesson they're enrolled
 * in (unlike useBKTState, which is scoped to one lesson) — powers the
 * cross-lesson mastery summary on the student's "My Lessons" page.
 */
export function useOverallMastery(studentId: string) {
    const [data, setData] = useState<OverallMastery>(EMPTY);

    useEffect(() => {
        if (!studentId) return;

        const q = query(collection(db, "bkt_states", studentId, "concepts"));
        const unsub = onSnapshot(q, (snap) => {
            const perLesson: Record<string, { sum: number; count: number; mastered: number }> = {};
            let totalSum = 0;
            let totalCount = 0;
            let totalMastered = 0;

            snap.docs.forEach((doc) => {
                const d = doc.data();
                const lessonId = d.lessonId as string | undefined;
                const pMastery = typeof d.pMastery === "number" ? d.pMastery : 0.2;
                const mastered = Boolean(d.mastered);
                if (!lessonId) return;

                if (!perLesson[lessonId]) perLesson[lessonId] = { sum: 0, count: 0, mastered: 0 };
                perLesson[lessonId].sum += pMastery;
                perLesson[lessonId].count += 1;
                if (mastered) perLesson[lessonId].mastered += 1;

                totalSum += pMastery;
                totalCount += 1;
                if (mastered) totalMastered += 1;
            });

            const perLessonSummary: Record<string, LessonMasterySummary> = {};
            for (const [lessonId, agg] of Object.entries(perLesson)) {
                perLessonSummary[lessonId] = {
                    lessonId,
                    avgMastery: agg.sum / agg.count,
                    conceptCount: agg.count,
                    masteredCount: agg.mastered,
                };
            }

            setData({
                perLesson: perLessonSummary,
                overallAvgMastery: totalCount > 0 ? totalSum / totalCount : 0,
                totalConcepts: totalCount,
                totalMastered: totalMastered,
            });
        });

        return unsub;
    }, [studentId]);

    return data;
}
