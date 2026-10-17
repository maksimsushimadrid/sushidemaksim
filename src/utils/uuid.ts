/**
 * Safe UUID v4 generator that works in all environments:
 * - Secure contexts (HTTPS, localhost) using crypto.randomUUID()
 * - Insecure contexts (HTTP via local IP on mobile devices) using RFC4122 Math.random fallback
 * - Older mobile browsers / iOS Safari versions
 */
export function safeRandomUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try {
            return crypto.randomUUID();
        } catch {
            // Insecure context or restricted sandbox fallback
        }
    }

    // RFC4122 v4 UUID fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
