"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GenUIEntry {
    components: { component: string; props: Record<string, unknown> }[];
    conceptId: string;
    timestamp: number;
}

interface GenUIStore {
    cache: Record<string, GenUIEntry>; // keyed by subtopicId
    setCache: (subtopicId: string, conceptId: string, components: GenUIEntry["components"]) => void;
    getCache: (subtopicId: string, conceptId: string) => GenUIEntry["components"] | null;
    clearSubtopic: (subtopicId: string) => void;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const useGenUIStore = create<GenUIStore>()(
    persist(
        (set, get) => ({
            cache: {},

            setCache: (subtopicId, conceptId, components) =>
                set((s) => ({
                    cache: {
                        ...s.cache,
                        [subtopicId]: { components, conceptId, timestamp: Date.now() },
                    },
                })),

            getCache: (subtopicId, conceptId) => {
                const entry = get().cache[subtopicId];
                if (!entry) return null;
                // Stale if TTL expired or concept changed (scaffold level change)
                if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
                if (entry.conceptId !== conceptId) return null;
                return entry.components.length > 0 ? entry.components : null;
            },

            clearSubtopic: (subtopicId) =>
                set((s) => {
                    const next = { ...s.cache };
                    delete next[subtopicId];
                    return { cache: next };
                }),
        }),
        { name: "genui-cache", version: 1 }
    )
);
