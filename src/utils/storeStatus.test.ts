import { describe, it, expect } from 'vitest';
import {
    isStoreOpen,
    isTimeWithinBusinessHours,
    getNextOpeningTime,
    formatTimeLeft,
} from './storeStatus';

describe('storeStatus Utility', () => {
    describe('isStoreOpen', () => {
        it('returns false on closed days (Monday)', () => {
            // Monday = 1
            const monday = new Date('2026-03-30T21:00:00+02:00'); // 2026-03-30 is Monday
            expect(isStoreOpen(monday)).toBe(false);
        });

        it('returns true during business hours (Wednesday 20:00)', () => {
            // Wednesday = 3
            // 2026-04-01 is Wednesday
            const wednesday = new Date('2026-04-01T20:00:00+02:00');
            expect(isStoreOpen(wednesday)).toBe(true);
        });

        it('returns false outside business hours (Wednesday 15:00)', () => {
            // Wednesday afternoon is now closed (starts at 19:00)
            const wednesdayAfternoon = new Date('2026-04-01T15:00:00+02:00');
            expect(isStoreOpen(wednesdayAfternoon)).toBe(false);
        });

        it('handles boundary cases (exactly at start and end)', () => {
            const start = new Date('2026-04-01T19:00:00+02:00');
            const end = new Date('2026-04-01T22:30:00+02:00');
            const afterEnd = new Date('2026-04-01T22:31:00+02:00');
            expect(isStoreOpen(start)).toBe(true);
            expect(isStoreOpen(end)).toBe(true); // Should be true because of inclusive comparison (<=)
            expect(isStoreOpen(afterEnd)).toBe(false);
        });

        it('handles weekend business hours (Sunday 15:00 - open, 17:00 - closed, 20:00 - open, 22:45 - closed)', () => {
            // Sunday = 0, target intervals: 14:00-16:00 and 19:00-22:30
            const sunday1500 = new Date('2026-04-05T15:00:00+02:00');
            expect(isStoreOpen(sunday1500)).toBe(true);

            const sunday1700 = new Date('2026-04-05T17:00:00+02:00');
            expect(isStoreOpen(sunday1700)).toBe(false);

            const sunday2000 = new Date('2026-04-05T20:00:00+02:00');
            expect(isStoreOpen(sunday2000)).toBe(true);

            const sunday2245 = new Date('2026-04-05T22:45:00+02:00');
            expect(isStoreOpen(sunday2245)).toBe(false);
        });
    });

    describe('isTimeWithinBusinessHours', () => {
        it('validates a time string for a given date', () => {
            const dateStr = '2026-04-01'; // Wednesday
            expect(isTimeWithinBusinessHours(dateStr, '20:00')).toBe(true);
            expect(isTimeWithinBusinessHours(dateStr, '15:00')).toBe(false);
        });
    });

    describe('getNextOpeningTime', () => {
        it('finds the next opening time today', () => {
            const wednesdayReady = new Date('2026-04-01T10:00:00'); // Wed 10:00
            const next = getNextOpeningTime(wednesdayReady);
            expect(next?.getHours()).toBe(19);
            expect(next?.getMinutes()).toBe(0);
            expect(next?.getDay()).toBe(3);
        });

        it('finds the next opening time tomorrow or later', () => {
            const monday = new Date('2026-03-30T10:00:00'); // Monday
            const next = getNextOpeningTime(monday);
            // Next is Wednesday at 19:00
            expect(next?.getDay()).toBe(3);
            expect(next?.getHours()).toBe(19);
        });
    });

    describe('formatTimeLeft', () => {
        it('formats hours and minutes', () => {
            const diff = 1000 * 60 * 60 * 2 + 1000 * 60 * 5 + 1000; // 2h 5m 1s
            expect(formatTimeLeft(diff)).toBe('2h 5m 1s');
        });

        it('formats only minutes and seconds when hours is 0', () => {
            const diff = 1000 * 60 * 45 + 1000 * 30; // 45m 30s
            expect(formatTimeLeft(diff)).toBe('45m 30s');
        });
    });
});
