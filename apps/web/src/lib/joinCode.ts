/**
 * Client-side mirror of apps/api/src/services/join_codes.py — used only for
 * input formatting and early feedback; the API is the source of truth.
 */
export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0 O 1 I L
export const JOIN_CODE_LENGTH = 6;

/** Uppercase, drop separators — "k7m-q2p " → "K7MQ2P" (may still contain invalid chars). */
export function cleanJoinCode(raw: string): string {
    return raw.toUpperCase().replace(/[\s\-_]/g, "");
}

/** Characters the student typed that can never appear in a code. */
export function invalidJoinCodeChars(cleaned: string): string[] {
    return Array.from(new Set(cleaned.split("").filter((c) => !JOIN_CODE_ALPHABET.includes(c))));
}

export function isCompleteJoinCode(cleaned: string): boolean {
    return cleaned.length === JOIN_CODE_LENGTH && invalidJoinCodeChars(cleaned).length === 0;
}

/** "K7MQ2P" → "K7M-Q2P"; partial input formats progressively ("K7MQ" → "K7M-Q"). */
export function formatJoinCode(cleaned: string): string {
    return cleaned.length > 3 ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}` : cleaned;
}
