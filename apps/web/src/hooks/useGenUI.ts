"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useGenUIStore } from "@/stores/genUIStore";
import { genUISchema } from "@/lib/genui-schema";
import { buildFallbackGenUI } from "@/lib/genui-fallback";
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
    /** Curated content shown because live generation failed */
    servedFallback: boolean;
}

const EMPTY_META: GenUIMeta = {
    modelUsed: null,
    scaffoldLevel: null,
    scaffoldLevelName: null,
    pMastery: null,
    durationMs: null,
    servedFromCache: false,
    servedFallback: false,
};

export function useGenUI(studentId: string) {
    const [cachedComponents, setCachedComponents] = useState<GenUIComponent[]>([]);
    const [servingFromCache, setServingFromCache] = useState(false);
    const [meta, setMeta] = useState<GenUIMeta>(EMPTY_META);
    const { setCache, getCache } = useGenUIStore();

    const lastRequestRef = useRef<{
        subtopicId: string;
        conceptId: string;
        skipCache: boolean;
        conceptName: string;
        forceScaffoldLevel?: number;
    } | null>(null);
    const studentIdRef = useRef(studentId);
    useEffect(() => { studentIdRef.current = studentId; }, [studentId]);

    // Captured from response headers by the custom fetch below, right before
    // the SDK starts consuming the body — cheaper than round-tripping this
    // data through the streamed schema itself.
    const pendingHeaderMetaRef = useRef<Partial<GenUIMeta>>({});
    const genStartRef = useRef<number | null>(null);

    const genuiFetch = useCallback<typeof fetch>(async (input, init) => {
        genStartRef.current = Date.now();
        // Bound the wait (server worst case is ~150s) so a hung request still
        // ends in curated content rather than an endless spinner
        const timeout = AbortSignal.timeout(160_000);
        const res = await fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
        pendingHeaderMetaRef.current = {
            modelUsed: res.headers.get("X-Genui-Model"),
            scaffoldLevel: res.headers.has("X-Scaffold-Level") ? Number(res.headers.get("X-Scaffold-Level")) : null,
            scaffoldLevelName: res.headers.get("X-Scaffold-Level-Name"),
            pMastery: res.headers.has("X-P-Mastery") ? Number(res.headers.get("X-P-Mastery")) : null,
            servedFallback: res.headers.get("X-Genui-Source") === "fallback",
        };
        return res;
    }, []);

    /**
     * Last line of defence: if the request fails client-side (network down,
     * HTTP error, unparseable body), show curated content for the same concept
     * and scaffold level instead of an error. The server already does this for
     * model failures; this covers everything between server and browser.
     */
    const showFallback = useCallback(() => {
        const req = lastRequestRef.current;
        if (!req) return;
        const level = pendingHeaderMetaRef.current.scaffoldLevel ?? req.forceScaffoldLevel ?? 0;
        setCachedComponents(buildFallbackGenUI({ conceptName: req.conceptName, scaffoldLevel: level }).components as GenUIComponent[]);
        setServingFromCache(true);
        setMeta((m) => ({ ...m, scaffoldLevel: level, servedFallback: true, servedFromCache: false }));
    }, []);

    const { object, submit, isLoading } = useObject({
        api: "/api/genui",
        schema: genUISchema,
        fetch: genuiFetch,
        onError() {
            showFallback();
        },
        onFinish({ object: result, error: finishError }) {
            const durationMs = genStartRef.current !== null ? Date.now() - genStartRef.current : null;
            const servedFallback = pendingHeaderMetaRef.current.servedFallback ?? false;
            setMeta({
                modelUsed: pendingHeaderMetaRef.current.modelUsed ?? null,
                scaffoldLevel: pendingHeaderMetaRef.current.scaffoldLevel ?? null,
                scaffoldLevelName: pendingHeaderMetaRef.current.scaffoldLevelName ?? null,
                pMastery: pendingHeaderMetaRef.current.pMastery ?? null,
                durationMs,
                servedFromCache: false,
                servedFallback,
            });

            if (finishError || !result?.components?.length) {
                showFallback();
                return;
            }

            // Curated fallback content is never cached — the next visit retries the AI
            if (lastRequestRef.current && !servedFallback) {
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
            misconceptionContext?: string,
        ) => {
            // Forced scaffold level (comparison view) or a misconception-targeted
            // remediation always generates fresh — caching is keyed by
            // subtopic+concept only, so either would otherwise collide with (or
            // permanently overwrite) the real cached view for that subtopic.
            const skipCache = typeof forceScaffoldLevel === "number" || Boolean(misconceptionContext);

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
            pendingHeaderMetaRef.current = {};
            lastRequestRef.current = {
                subtopicId,
                conceptId,
                skipCache,
                conceptName: subtopicTitle ? `${subtopicTitle} — ${conceptId}` : conceptId,
                forceScaffoldLevel,
            };

            submit({
                conceptId,
                subtopicId,
                lessonId,
                studentId: studentIdRef.current,
                subtopicTitle: subtopicTitle ?? conceptId,
                ...(typeof forceScaffoldLevel === "number" ? { forceScaffoldLevel } : {}),
                ...(misconceptionContext ? { misconceptionContext } : {}),
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
        // Fallback content replaces the spinner as soon as it's shown
        isStreaming: isLoading && !servingFromCache,
        generate,
        meta,
    };
}
