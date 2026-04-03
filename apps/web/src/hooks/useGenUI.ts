"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useGenUIStore } from "@/stores/genUIStore";
import { genUISchema } from "@/lib/genui-schema";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

interface GenUIComponent {
    component: string;
    props: Record<string, unknown>;
}

export function useGenUI(studentId: string) {
    const [cachedComponents, setCachedComponents] = useState<GenUIComponent[]>([]);
    const [servingFromCache, setServingFromCache] = useState(false);
    const { setCache, getCache } = useGenUIStore();

    const lastRequestRef = useRef<{ subtopicId: string; conceptId: string } | null>(null);
    const studentIdRef = useRef(studentId);
    useEffect(() => { studentIdRef.current = studentId; }, [studentId]);

    const { object, submit, isLoading, error } = useObject({
        api: "/api/genui",
        schema: genUISchema,
        onFinish({ object: result }) {
            if (result?.components && lastRequestRef.current) {
                const { subtopicId, conceptId } = lastRequestRef.current;
                const components = result.components as GenUIComponent[];
                // Save to in-memory Zustand cache
                setCache(subtopicId, conceptId, components);
                // Persist to Firestore for cross-session recall (fire-and-forget)
                const sid = studentIdRef.current;
                if (sid) {
                    const docRef = doc(db, "genui_cache", sid, "subtopics", subtopicId);
                    setDoc(docRef, {
                        components,
                        conceptId,
                        updatedAt: serverTimestamp(),
                    }).catch(() => {/* ignore persistence errors */});
                }
            }
        },
    });

    const generate = useCallback(
        async (
            conceptId: string,
            subtopicId: string,
            lessonId: string,
            forceRefresh = false,
            subtopicTitle?: string,
        ) => {
            // 1. Try Zustand in-memory cache first
            if (!forceRefresh) {
                const cached = getCache(subtopicId, conceptId);
                if (cached) {
                    setCachedComponents(cached);
                    setServingFromCache(true);
                    return;
                }
            }

            // 2. Try Firestore persistence cache (only for non-forced refreshes)
            if (!forceRefresh && studentIdRef.current) {
                try {
                    const docRef = doc(db, "genui_cache", studentIdRef.current, "subtopics", subtopicId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const data = snap.data();
                        if (
                            data?.components?.length > 0 &&
                            data.conceptId === conceptId
                        ) {
                            const components = data.components as GenUIComponent[];
                            setCache(subtopicId, conceptId, components);
                            setCachedComponents(components);
                            setServingFromCache(true);
                            return;
                        }
                    }
                } catch {
                    // Firestore unavailable — fall through to generation
                }
            }

            setServingFromCache(false);
            setCachedComponents([]);
            lastRequestRef.current = { subtopicId, conceptId };

            submit({
                conceptId,
                subtopicId,
                lessonId,
                studentId: studentIdRef.current,
                subtopicTitle: subtopicTitle ?? conceptId,
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [getCache, setCache, submit]
    );

    // Derive components: from cache or from streaming object
    const components: GenUIComponent[] = servingFromCache
        ? cachedComponents
        : (object?.components as GenUIComponent[] | undefined) ?? [];

    return {
        components,
        isStreaming: isLoading,
        error: error?.message ?? null,
        generate,
    };
}
