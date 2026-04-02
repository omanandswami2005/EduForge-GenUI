"""Visualize router — SSE stream of GenUI component JSON."""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from ..genui.streamer import GenUIStreamer

router = APIRouter()


class VisualizeRequest(BaseModel):
    concept: str
    concept_content: str
    bkt_state: dict
    scaffold_decision: dict
    student_name: Optional[str] = "Student"


@router.post("/visualize")
async def stream_visualize(req: VisualizeRequest):
    streamer = GenUIStreamer()

    def generate():
        for chunk in streamer.stream_visualization(
            concept=req.concept,
            concept_content=req.concept_content,
            bkt_state=req.bkt_state,
            scaffold_decision=req.scaffold_decision,
            student_name=req.student_name,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
