"""
Scaffold Resolver: Maps P(mastery) to scaffold level and allowed GenUI components.

The mapping data (SCAFFOLD_LEVELS, COMPONENT_CATALOG) lives in scaffold_data.py,
generated from config/scaffold-levels.json by
scripts/codegen/generate_scaffold_levels.py — that JSON is the single source
of truth shared with the TS side (packages/shared). Only the resolution
logic below is hand-written.
"""
from dataclasses import dataclass

from .scaffold_data import SCAFFOLD_LEVELS, COMPONENT_CATALOG

__all__ = ["SCAFFOLD_LEVELS", "COMPONENT_CATALOG", "ScaffoldDecision", "ScaffoldResolver"]


@dataclass
class ScaffoldDecision:
    level: int
    level_name: str
    allowed_components: list[str]
    p_mastery: float
    description: str


class ScaffoldResolver:
    def resolve(self, p_mastery: float) -> ScaffoldDecision:
        """Maps P(mastery) to scaffold level and allowed components."""
        level_info = SCAFFOLD_LEVELS[0]
        for sl in SCAFFOLD_LEVELS:
            low, high = sl["range"]
            if low <= p_mastery < high:
                level_info = sl
                break
        else:
            if p_mastery >= SCAFFOLD_LEVELS[-1]["range"][0]:
                level_info = SCAFFOLD_LEVELS[-1]

        level = level_info["level"]
        components = COMPONENT_CATALOG[level]

        return ScaffoldDecision(
            level=level,
            level_name=level_info["name"],
            allowed_components=components,
            p_mastery=p_mastery,
            description=level_info["description"],
        )
