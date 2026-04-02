"""Chat router — SSE stream of AI tutor responses."""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from ..genui.streamer import GenUIStreamer

router = APIRouter()


class ChatRequest(BaseModel):
    student_message: str
    concept: str
    bkt_state: dict
    scaffold_decision: dict
    conversation_history: list = []


@router.post("/chat")
async def stream_chat(req: ChatRequest):
    streamer = GenUIStreamer()

    def generate():
        for chunk in streamer.stream_tutor_response(
            student_message=req.student_message,
            concept=req.concept,
            bkt_state=req.bkt_state,
            scaffold_decision=req.scaffold_decision,
            conversation_history=req.conversation_history,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
