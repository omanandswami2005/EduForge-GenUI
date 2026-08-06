"use client";

import { useMemo } from "react";
import ReactFlow, {
    Background,
    type Edge,
    type Node,
    Position,
    ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

export interface GraphSubtopic {
    id: string;
    title: string;
    order: number;
    prerequisiteSubtopicIds?: string[];
}

/** Mastery >= this unlocks subtopics that depend on it — "approaching" scaffold
 * boundary (see config/scaffold-levels.json), not full mastery: showing
 * adequate understanding of a prerequisite is enough to move forward. */
export const UNLOCK_THRESHOLD = 0.4;

function nodeColor(mastery: number, locked: boolean) {
    if (locked) return { bg: "#e5e7eb", border: "#9ca3af", text: "#4b5563" }; // gray — locked
    if (mastery >= 0.95) return { bg: "#dcfce7", border: "#22c55e", text: "#166534" }; // green — mastered
    if (mastery > UNLOCK_THRESHOLD) return { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" }; // blue — in progress
    return { bg: "#fef9c3", border: "#eab308", text: "#854d0e" }; // yellow — unlocked, just started
}

/**
 * Visualizes the subtopic prerequisite graph (subtopic.prerequisiteSubtopicIds)
 * with nodes colored by mastery/locked state — makes the curriculum's
 * dependency structure legible instead of it only existing implicitly in
 * numbered list order.
 */
export function ConceptDependencyGraph({
    subtopics,
    masteryBySubtopic,
}: {
    subtopics: GraphSubtopic[];
    masteryBySubtopic: Record<string, number>;
}) {
    const { nodes, edges } = useMemo(() => {
        // Layer each node by longest-path depth from a root (no prerequisites)
        // so the graph reads left-to-right in dependency order without
        // pulling in an external layout library for what's a small DAG.
        const depthCache = new Map<string, number>();
        const byId = new Map(subtopics.map((s) => [s.id, s]));

        function depthOf(id: string, seen: Set<string> = new Set()): number {
            if (depthCache.has(id)) return depthCache.get(id)!;
            if (seen.has(id)) return 0; // guard against a malformed cycle
            seen.add(id);
            const st = byId.get(id);
            const prereqs = st?.prerequisiteSubtopicIds?.filter((p) => byId.has(p)) ?? [];
            const depth = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map((p) => depthOf(p, seen)));
            depthCache.set(id, depth);
            return depth;
        }

        const countPerDepth = new Map<number, number>();
        const rfNodes: Node[] = [...subtopics]
            .sort((a, b) => a.order - b.order)
            .map((st) => {
                const depth = depthOf(st.id);
                const col = countPerDepth.get(depth) ?? 0;
                countPerDepth.set(depth, col + 1);

                const prereqIds = st.prerequisiteSubtopicIds ?? [];
                const locked = prereqIds.some((p) => (masteryBySubtopic[p] ?? 0) < UNLOCK_THRESHOLD);
                const mastery = masteryBySubtopic[st.id] ?? 0;
                const colors = nodeColor(mastery, locked);

                return {
                    id: st.id,
                    position: { x: depth * 240, y: col * 90 },
                    data: { label: `${st.order}. ${st.title}\n${Math.round(mastery * 100)}%${locked ? " · locked" : ""}` },
                    sourcePosition: Position.Right,
                    targetPosition: Position.Left,
                    style: {
                        background: colors.bg,
                        border: `2px solid ${colors.border}`,
                        color: colors.text,
                        borderRadius: 8,
                        padding: 8,
                        fontSize: 12,
                        width: 200,
                        whiteSpace: "pre-line" as const,
                    },
                };
            });

        const rfEdges: Edge[] = subtopics.flatMap((st) =>
            (st.prerequisiteSubtopicIds ?? [])
                .filter((p) => byId.has(p))
                .map((prereqId) => ({
                    id: `${prereqId}->${st.id}`,
                    source: prereqId,
                    target: st.id,
                    animated: (masteryBySubtopic[prereqId] ?? 0) < UNLOCK_THRESHOLD,
                    style: { stroke: "#9ca3af" },
                }))
        );

        return { nodes: rfNodes, edges: rfEdges };
    }, [subtopics, masteryBySubtopic]);

    const height = Math.max(180, (Math.max(1, ...nodes.map((n) => (n.position.y as number) / 90 + 1)) || 1) * 110);

    return (
        <div
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-6"
            style={{ height }}
        >
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background gap={16} size={1} />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
