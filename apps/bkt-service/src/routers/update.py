"""BKT Update Router — Called after every MCQ answer."""
from fastapi import APIRouter
from pydantic import BaseModel
from ..bkt.engine import BKTEngine, StudentConceptState
from ..bkt.scaffold_resolver import ScaffoldResolver
from ..bkt.misconception_detector import MisconceptionDetector
from ..services.firestore_service import FirestoreService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class MCQAnswerRequest(BaseModel):
    student_id: str
    lesson_id: str
    subtopic_id: str
    concept_id: str
    mcq_id: str
    selected_answer: str
    is_correct: bool
    time_taken_seconds: int = 0


class BKTUpdateResponse(BaseModel):
    p_mastery_before: float
    p_mastery_after: float
    scaffold_level: int
    allowed_components: list[str]
    mastered: bool
    misconception: dict | None = None
    next_action: str


@router.post("/update", response_model=BKTUpdateResponse)
async def update_bkt_state(request: MCQAnswerRequest):
    """
    Called after every MCQ answer. Updates BKT state, resolves scaffold level,
    detects misconceptions, and returns the new allowed GenUI components.
    """
    fs = FirestoreService()

    # Load current state and params from Firestore
    current_state = await fs.get_student_concept_state(
        request.student_id, request.concept_id
    )
    bkt_params = await fs.get_bkt_params(request.lesson_id, request.concept_id)

    if not current_state:
        current_state = StudentConceptState(
            student_id=request.student_id,
            concept_id=request.concept_id,
            subtopic_id=request.subtopic_id,
            lesson_id=request.lesson_id,
            p_mastery=bkt_params.p_initial,
        )

    p_mastery_before = current_state.p_mastery

    # Run BKT update
    engine = BKTEngine(bkt_params)
    new_state = engine.update(current_state, request.is_correct)
    new_state.lesson_id = request.lesson_id

    # Resolve scaffold level
    resolver = ScaffoldResolver()
    scaffold = resolver.resolve(new_state.p_mastery)

    # Misconception detection
    misconception = None
    if new_state.consecutive_wrong >= 3:
        detector = MisconceptionDetector()
        misconception = await detector.classify(
            request.concept_id, new_state.response_history
        )

    next_action = "continue"
    if new_state.mastered:
        next_action = "subtopic_complete"
    elif misconception:
        next_action = "misconception_remediation"

    # Persist
    await fs.save_student_concept_state(new_state)
    await fs.record_mcq_response({
        "studentId": request.student_id,
        "lessonId": request.lesson_id,
        "subtopicId": request.subtopic_id,
        "conceptId": request.concept_id,
        "mcqId": request.mcq_id,
        "selectedAnswer": request.selected_answer,
        "isCorrect": request.is_correct,
        "pMasteryBefore": p_mastery_before,
        "pMasteryAfter": new_state.p_mastery,
        "scaffoldLevel": scaffold.level,
        "timeTakenSeconds": request.time_taken_seconds,
    })

    logger.info(
        f"BKT update: student={request.student_id}, concept={request.concept_id}, "
        f"correct={request.is_correct}, P(mastery): {p_mastery_before:.3f} -> {new_state.p_mastery:.3f}"
    )

    return BKTUpdateResponse(
        p_mastery_before=p_mastery_before,
        p_mastery_after=new_state.p_mastery,
        scaffold_level=scaffold.level,
        allowed_components=scaffold.allowed_components,
        mastered=new_state.mastered,
        misconception=misconception,
        next_action=next_action,
    )
