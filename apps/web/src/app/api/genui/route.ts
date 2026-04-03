import { NextRequest, NextResponse } from "next/server";

const BKT_URL = process.env.BKT_SERVICE_URL || "http://localhost:8001";
const GENUI_URL = process.env.GENUI_SERVICE_URL || "http://localhost:8002";

export async function POST(req: NextRequest) {
    try {
        const { conceptId, subtopicId, lessonId, studentId, type, conceptContent } = await req.json();

        if (!conceptId || !studentId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get BKT state
        let bktState: any;
        try {
            const bktRes = await fetch(
                `${BKT_URL}/state?studentId=${studentId}&conceptId=${conceptId}`
            );
            if (!bktRes.ok) {
                return NextResponse.json({ error: "BKT service unavailable" }, { status: 502 });
            }
            bktState = await bktRes.json();
        } catch {
            return NextResponse.json({ error: "BKT service error" }, { status: 502 });
        }

        // 2. Get scaffold decision
        let scaffold: any;
        try {
            const scaffoldRes = await fetch(
                `${BKT_URL}/scaffold?p_mastery=${bktState.p_mastery || 0.2}`
            );
            if (!scaffoldRes.ok) {
                return NextResponse.json({ error: "Scaffold service unavailable" }, { status: 502 });
            }
            scaffold = await scaffoldRes.json();
        } catch {
            return NextResponse.json({ error: "Scaffold service error" }, { status: 502 });
        }

        // 3. Stream from GenUI service
        const genUIRes = await fetch(
            `${GENUI_URL}/stream/${type || "visualize"}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    concept: conceptId,
                    concept_content: conceptContent || `Concept: ${conceptId} from subtopic ${subtopicId}`,
                    bkt_state: bktState,
                    scaffold_decision: scaffold,
                    student_name: "Student",
                }),
            }
        );

        if (!genUIRes.ok || !genUIRes.body) {
            return NextResponse.json({ error: "GenUI service unavailable" }, { status: 502 });
        }

        return new Response(genUIRes.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal error" },
            { status: 500 }
        );
    }
}
