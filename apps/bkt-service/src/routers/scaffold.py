"""Scaffold Router — Resolve scaffold level from P(mastery)."""
from fastapi import APIRouter, Query
from ..bkt.scaffold_resolver import ScaffoldResolver

router = APIRouter()


@router.get("/scaffold")
async def get_scaffold(p_mastery: float = Query(..., ge=0, le=1)):
    """Resolve scaffold level from P(mastery)."""
    resolver = ScaffoldResolver()
    decision = resolver.resolve(p_mastery)

    return {
        "level": decision.level,
        "level_name": decision.level_name,
        "allowed_components": decision.allowed_components,
        "p_mastery": decision.p_mastery,
        "description": decision.description,
    }
