/**
 * Business schedule from the user's screenshot.
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
 * This is timezone-safe because it doesn't create a Date object.
 */
export function getDayOfWeekFromDateString(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    // JS Date(y, m-1, d) creates a date in LOCAL time, which is what we want for day of week.
    return new Date(y, m - 1, d).getDay();
}

export function isStoreOpen(date: Date = new Date()): boolean {
    // Force evaluation in Europe/Madrid timezone
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
        return timeStr >= '17:00' && timeStr <= '22:00';
    }
    const day = getDayOfWeekFromDateString(dateStr);
    const todayIntervals = BUSINESS_HOURS[day] || [];
    return todayIntervals.some(interval => timeStr >= interval.start && timeStr < interval.end);
}

export function getNextOpeningTime(now: Date = new Date()): Date | null {
    const day = now.getDay();
    const timeStr =
        now.getHours().toString().padStart(2, '0') +
        ':' +
        now.getMinutes().toString().padStart(2, '0');

    const todayIntervals = BUSINESS_HOURS[day] || [];

    // Check remaining intervals today
    for (const interval of todayIntervals) {
        if (interval.start > timeStr) {
            const [h, m] = interval.start.split(':').map(Number);
            const d = new Date(now);
            d.setHours(h, m, 0, 0);
            return d;
        }
    }

    // Check next days
    for (let i = 1; i <= 7; i++) {
        const nextDay = (day + i) % 7;
        const intervals = BUSINESS_HOURS[nextDay];
        if (intervals && intervals.length > 0) {
            const [h, m] = intervals[0].start.split(':').map(Number);
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            d.setHours(h, m, 0, 0);
            return d;
        }
    }

    return null;
}

export function getClosedDays(): number[] {
    return Object.entries(BUSINESS_HOURS)
        .filter(([_, intervals]) => intervals.length === 0)
        .map(([day, _]) => Number(day));
}

export function formatTimeLeft(diff: number): string {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let format = '';
    if (hours > 0) format += `${hours}h `;
    format += `${minutes}m ${seconds}s`;
    return format;
}
