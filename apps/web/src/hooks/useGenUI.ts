"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useGenUIStore } from "@/stores/genUIStore";
import { genUISchema } from "@/lib/genui-schema";

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
                setCache(subtopicId, conceptId, result.components as GenUIComponent[]);
            }
        },
    });

    const generate = useCallback(
        (conceptId: string, subtopicId: string, lessonId: string, forceRefresh = false) => {
            // Serve from cache if available and not a forced refresh
            if (!forceRefresh) {
                const cached = getCache(subtopicId, conceptId);
                if (cached) {
                    setCachedComponents(cached);
                    setServingFromCache(true);
                    return;
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
