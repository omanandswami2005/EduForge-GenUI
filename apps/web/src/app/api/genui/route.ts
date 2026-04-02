import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const { conceptId, subtopicId, lessonId, studentId, type } = await req.json();

    // 1. Get BKT state
    const bktRes = await fetch(
        `${process.env.BKT_SERVICE_URL || "http://localhost:8001"}/state?studentId=${studentId}&conceptId=${conceptId}`
    );
    const bktState = await bktRes.json();

    // 2. Get scaffold decision
    const scaffoldRes = await fetch(
        `${process.env.BKT_SERVICE_URL || "http://localhost:8001"}/scaffold?p_mastery=${bktState.p_mastery || 0.2}`
    );
    const scaffold = await scaffoldRes.json();

    // 3. Stream from GenUI service
    const genUIRes = await fetch(
        `${process.env.GENUI_SERVICE_URL || "http://localhost:8002"}/stream/${type || "visualize"}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                concept: conceptId,
                concept_content: "",
                bkt_state: bktState,
                scaffold_decision: scaffold,
                student_name: "Student",
            }),
        }
    );

    return new Response(genUIRes.body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
