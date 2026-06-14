/**
 * Business schedule (Shared with frontend)
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export const BUSINESS_HOURS: Record<number, { start: string; end: string }[]> = {
    1: [], // Lunes: Cerrado
    2: [], // Martes: Cerrado
    3: [{ start: '19:00', end: '23:00' }], // Miércoles
    4: [{ start: '19:00', end: '23:00' }], // Jueves
    5: [{ start: '14:00', end: '23:00' }], // Viernes
    6: [{ start: '14:00', end: '23:00' }], // Sábado
    0: [{ start: '14:00', end: '23:00' }], // Domingo
};

/**
 * Returns the day of the week (0-6) from a YYYY-MM-DD string.
 */
export function getDayOfWeekFromDateString(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    // Use UTC for server-side if normalized, but let's stay consistent with frontend's "local" intent (which is Madrid time)
    // Actually, on server, we should probably use a safer way.
    return new Date(y, m - 1, d).getDay();
}

export function isStoreOpen(date: Date = new Date()): boolean {
    // Get current time in Madrid
    const madridTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'short',
    }).formatToParts(date);

    const h = madridTime.find(p => p.type === 'hour')?.value || '00';
    const m = madridTime.find(p => p.type === 'minute')?.value || '00';
    const timeStr = `${h}:${m}`;

    // JS getDay() is 0 (Sun) to 6 (Sat)
    // Intl weekday is 'Sun', 'Mon', etc.
    const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };
    const weekdayName = madridTime.find(p => p.type === 'weekday')?.value || 'Sun';
    const day = dayMap[weekdayName] ?? date.getDay();

    const todayIntervals = BUSINESS_HOURS[day] || [];
    return todayIntervals.some(interval => timeStr >= interval.start && timeStr < interval.end);
}

/**
 * Checks if a specific date string (YYYY-MM-DD) and time string (HH:MM) is within business hours.
 */
export function isTimeWithinBusinessHours(dateStr: string, timeStr: string): boolean {
    if (dateStr === '2026-06-15') {
        return timeStr >= '17:30' && timeStr <= '22:00';
    }
    const day = getDayOfWeekFromDateString(dateStr);
    const todayIntervals = BUSINESS_HOURS[day] || [];
    return todayIntervals.some(interval => timeStr >= interval.start && timeStr < interval.end);
}
