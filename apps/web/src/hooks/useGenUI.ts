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

export interface GenUIMeta {
    modelUsed: string | null;
    scaffoldLevel: number | null;
    scaffoldLevelName: string | null;
    pMastery: number | null;
    durationMs: number | null;
    servedFromCache: boolean;
}

const EMPTY_META: GenUIMeta = {
    modelUsed: null,
    scaffoldLevel: null,
    scaffoldLevelName: null,
    pMastery: null,
    durationMs: null,
    servedFromCache: false,
};

export function useGenUI(studentId: string) {
    const [cachedComponents, setCachedComponents] = useState<GenUIComponent[]>([]);
    const [servingFromCache, setServingFromCache] = useState(false);
    const [meta, setMeta] = useState<GenUIMeta>(EMPTY_META);
    const [validationError, setValidationError] = useState<string | null>(null);
    const { setCache, getCache } = useGenUIStore();

    const lastRequestRef = useRef<{ subtopicId: string; conceptId: string; skipCache: boolean } | null>(null);
    const studentIdRef = useRef(studentId);
    useEffect(() => { studentIdRef.current = studentId; }, [studentId]);

    // Captured from response headers by the custom fetch below, right before
    // the SDK starts consuming the body — cheaper than round-tripping this
    // data through the streamed schema itself.
    const pendingHeaderMetaRef = useRef<Partial<GenUIMeta>>({});
    const genStartRef = useRef<number | null>(null);

    const genuiFetch = useCallback<typeof fetch>(async (input, init) => {
        genStartRef.current = Date.now();
        const res = await fetch(input, init);
        pendingHeaderMetaRef.current = {
            modelUsed: res.headers.get("X-Genui-Model"),
            scaffoldLevel: res.headers.has("X-Scaffold-Level") ? Number(res.headers.get("X-Scaffold-Level")) : null,
            scaffoldLevelName: res.headers.get("X-Scaffold-Level-Name"),
            pMastery: res.headers.has("X-P-Mastery") ? Number(res.headers.get("X-P-Mastery")) : null,
        };
        return res;
    }, []);

    const { object, submit, isLoading, error } = useObject({
        api: "/api/genui",
        schema: genUISchema,
        fetch: genuiFetch,
        onFinish({ object: result, error: finishError }) {
            const durationMs = genStartRef.current !== null ? Date.now() - genStartRef.current : null;
            setMeta({
                modelUsed: pendingHeaderMetaRef.current.modelUsed ?? null,
                scaffoldLevel: pendingHeaderMetaRef.current.scaffoldLevel ?? null,
                scaffoldLevelName: pendingHeaderMetaRef.current.scaffoldLevelName ?? null,
                pMastery: pendingHeaderMetaRef.current.pMastery ?? null,
                durationMs,
                servedFromCache: false,
            });

            // The stream can complete cleanly (no network/HTTP error) while the
            // final object still fails schema validation — onFinish is the only
            // place that surfaces that. Without this, the UI just sits on
            // "Generating..." forever with no indication anything went wrong.
            if (finishError || !result?.components) {
                setValidationError(
                    finishError instanceof Error
                        ? finishError.message
                        : "The model's output didn't match the expected format. Try regenerating."
                );
            } else {
                setValidationError(null);
            }

            if (result?.components && lastRequestRef.current) {
                const { subtopicId, conceptId, skipCache } = lastRequestRef.current;
                const components = result.components as GenUIComponent[];
                if (!skipCache) {
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
            forceScaffoldLevel?: number,
        ) => {
            // Forced scaffold level (comparison view) always generates fresh —
            // caching is keyed by subtopic+concept only, not by scaffold level,
            // so it would otherwise collide with (or pollute) the real cached view.
            const skipCache = typeof forceScaffoldLevel === "number";

            if (!skipCache) {
                // 1. Try Zustand in-memory cache first
                if (!forceRefresh) {
                    const cached = getCache(subtopicId, conceptId);
                    if (cached) {
                        setCachedComponents(cached);
                        setServingFromCache(true);
                        setMeta({ ...EMPTY_META, servedFromCache: true });
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
                                setMeta({ ...EMPTY_META, servedFromCache: true });
                                return;
                            }
                        }
                    } catch {
                        // Firestore unavailable — fall through to generation
                    }
                }
            }

            setServingFromCache(false);
            setCachedComponents([]);
            setValidationError(null);
            lastRequestRef.current = { subtopicId, conceptId, skipCache };

            submit({
                conceptId,
                subtopicId,
                lessonId,
                studentId: studentIdRef.current,
                subtopicTitle: subtopicTitle ?? conceptId,
                ...(typeof forceScaffoldLevel === "number" ? { forceScaffoldLevel } : {}),
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
        error: error?.message ?? validationError,
        generate,
        meta,
    };
}
