export { MASTERY_THRESHOLD, SCAFFOLD_LEVELS, LEVEL_NAMES, ALLOWED_COMPONENTS } from './scaffold-levels.generated';
import { SCAFFOLD_LEVELS } from './scaffold-levels.generated';

/** Derived from SCAFFOLD_LEVELS' own ranges — not a second hand-copy of the boundaries. */
export function getScaffoldLevel(pMastery: number): number {
    const last = SCAFFOLD_LEVELS[SCAFFOLD_LEVELS.length - 1];
    for (const { level, range } of SCAFFOLD_LEVELS) {
        if (pMastery < range[1]) return level;
    }
    return last.level;
}
