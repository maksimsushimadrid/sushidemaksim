// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'net';

// Simulate PRODUCTION: error details must never leak and rate limiters must be active
vi.mock('../config.js', () => ({
    config: { isProd: true, isDev: false, nodeEnv: 'production', jwtSecret: 'x'.repeat(40) },
}));

import { validate, emailRule, passwordRule } from '../middleware/validate.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { authLimiter, promoLimiter } from '../middleware/rateLimiters.js';
import {
    isStoreOpen,
    isTimeWithinBusinessHours,
    getDayOfWeekFromDateString,
} from '../utils/storeStatus.js';

function mockRes() {
    const res: any = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
}

function runValidate(schema: any, body: any, source: 'body' | 'query' | 'params' = 'body') {
    const res = mockRes();
    const next = vi.fn();
    validate(schema, source)({ [source]: body } as any, res, next);
    return { res, next };
}

describe('validate() middleware', () => {
    it('passes valid input through', () => {
        const { res, next } = runValidate(
            { name: { required: true, minLength: 2 } },
            { name: 'Ana' }
        );
        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects missing, null and empty required fields', () => {
        for (const value of [undefined, null, '']) {
            const { res, next } = runValidate({ name: { required: true } }, { name: value });
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        }
    });

    it('skips optional empty fields', () => {
        const { next } = runValidate({ note: { type: 'string', maxLength: 5 } }, {});
        expect(next).toHaveBeenCalledOnce();
    });

    it('enforces types (prevents type confusion such as objects instead of strings)', () => {
        const { res, next } = runValidate(
            { email: { type: 'string' } },
            { email: { $ne: null } } // NoSQL-injection style payload
        );
        expect(next).not.toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].error).toContain('string');
    });

    it('enforces array type', () => {
        const { res } = runValidate({ items: { type: 'array' } }, { items: 'not-array' });
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('enforces numeric min/max', () => {
        const schema = { qty: { type: 'number' as const, min: 1, max: 50 } };
        expect(runValidate(schema, { qty: 0 }).res.status).toHaveBeenCalledWith(400);
        expect(runValidate(schema, { qty: 51 }).res.status).toHaveBeenCalledWith(400);
        expect(runValidate(schema, { qty: -5 }).res.status).toHaveBeenCalledWith(400);
        expect(runValidate(schema, { qty: 10 }).next).toHaveBeenCalled();
    });

    it('rejects NaN numbers', () => {
        const { res } = runValidate({ qty: { type: 'number', min: 1 } }, { qty: NaN });
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('enforces string length limits (protects against oversized payloads)', () => {
        const schema = { comment: { type: 'string' as const, maxLength: 10, minLength: 2 } };
        expect(runValidate(schema, { comment: 'a'.repeat(11) }).res.status).toHaveBeenCalledWith(
            400
        );
        expect(runValidate(schema, { comment: 'a' }).res.status).toHaveBeenCalledWith(400);
    });

    it('enforces regex and enum rules', () => {
        expect(
            runValidate({ status: { enum: ['pending', 'done'] } }, { status: 'hacked' }).res.status
        ).toHaveBeenCalledWith(400);
        expect(
            runValidate({ code: { match: /^[A-Z]+$/ } }, { code: 'abc' }).res.status
        ).toHaveBeenCalledWith(400);
    });

    it('validates query and params sources', () => {
        expect(
            runValidate({ id: { required: true } }, {}, 'params').res.status
        ).toHaveBeenCalledWith(400);
        expect(runValidate({ q: { required: true } }, { q: 'x' }, 'query').next).toHaveBeenCalled();
    });

    it('returns all errors but the first as the primary error message', () => {
        const { res } = runValidate({ a: { required: true }, b: { required: true } }, {});
        const payload = res.json.mock.calls[0][0];
        expect(payload.errors).toHaveLength(2);
        expect(payload.error).toBe(payload.errors[0]);
    });

    describe('emailRule', () => {
        it.each(['user@example.com', 'a.b+c@sub.domain.es'])('accepts %s', email => {
            expect(runValidate({ email: emailRule }, { email }).next).toHaveBeenCalled();
        });
        it.each(['plain', 'a@b', 'a b@c.com', '@example.com', 'user@'])('rejects %s', email => {
            expect(runValidate({ email: emailRule }, { email }).res.status).toHaveBeenCalledWith(
                400
            );
        });
    });

    describe('passwordRule', () => {
        it('accepts a strong password', () => {
            expect(
                runValidate({ password: passwordRule }, { password: 'Sushi2024!' }).next
            ).toHaveBeenCalled();
        });
        it.each([
            ['too short', 'Ab1!'],
            ['no digit', 'Sushisushi!'],
            ['no symbol', 'Sushisushi1'],
            ['too long', `A1!${'a'.repeat(100)}`],
        ])('rejects password: %s', (_label, password) => {
            expect(
                runValidate({ password: passwordRule }, { password }).res.status
            ).toHaveBeenCalledWith(400);
        });
    });
});

describe('errorHandler (production mode)', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    const handle = (err: any) => {
        const res = mockRes();
        errorHandler(err, {} as any, res, vi.fn() as any);
        return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
    };

    it('never leaks internal error details or stack traces', () => {
        const err = new Error('relation "users" password_hash column secret');
        const { status, body } = handle(err);
        expect(status).toBe(500);
        expect(body).toEqual({ error: 'Error interno del servidor' });
        expect(JSON.stringify(body)).not.toContain('password_hash');
    });

    it('does not leak RLS policy details in production', () => {
        const { status, body } = handle({ code: '42501', message: 'policy users_select secret' });
        expect(status).toBe(403);
        expect(body.details).toBeUndefined();
    });

    it.each([
        [{ code: '23505', message: 'dup' }, 409],
        [{ code: '23503', message: 'fk' }, 400],
        [{ code: '23502', message: 'nn' }, 400],
        [{ code: 'PGRST116', message: 'none' }, 404],
        [{ type: 'entity.parse.failed', message: 'bad json' }, 400],
        [{ name: 'JsonWebTokenError', message: 'jwt malformed' }, 401],
        [{ name: 'TokenExpiredError', message: 'jwt expired' }, 401],
        [{ status: 404, message: 'Not here' }, 404],
    ])('maps %o to HTTP %i', (err, expected) => {
        expect(handle(err).status).toBe(expected);
    });

    it('does not echo 5xx error messages even when a status is set', () => {
        const { status, body } = handle({ status: 503, message: 'upstream db host 10.0.0.1' });
        expect(status).toBe(500);
        expect(JSON.stringify(body)).not.toContain('10.0.0.1');
    });

    it('handles errors without a message', () => {
        expect(handle({}).status).toBe(500);
    });
});

describe('rate limiters (production mode)', () => {
    let server: any;
    let baseUrl = '';

    beforeAll(async () => {
        const app = express();
        app.set('trust proxy', false);
        app.post('/login', authLimiter, (_req, res) => res.json({ ok: true }));
        app.post('/promo', promoLimiter, (_req, res) => res.json({ ok: true }));
        server = app.listen(0);
        await new Promise<void>(r => server.once('listening', () => r()));
        baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await new Promise<void>(r => server.close(() => r()));
    });

    it('blocks brute-force login attempts after 20 requests', async () => {
        const statuses: number[] = [];
        for (let i = 0; i < 21; i++) {
            const res = await fetch(`${baseUrl}/login`, { method: 'POST' });
            statuses.push(res.status);
            if (i === 20) {
                const body = await res.json();
                expect(body.error).toMatch(/Demasiados intentos/);
            } else {
                await res.text();
            }
        }
        expect(statuses.slice(0, 20).every(s => s === 200)).toBe(true);
        expect(statuses[20]).toBe(429);
    });

    it('blocks promo code brute-forcing after 15 checks', async () => {
        let last = 0;
        for (let i = 0; i < 16; i++) {
            const res = await fetch(`${baseUrl}/promo`, { method: 'POST' });
            await res.text();
            last = res.status;
        }
        expect(last).toBe(429);
    });

    it('exposes standard RateLimit headers', async () => {
        const res = await fetch(`${baseUrl}/promo`, { method: 'POST' });
        await res.text();
        expect(res.headers.get('ratelimit-limit') ?? res.headers.get('ratelimit')).toBeTruthy();
    });
});

describe('storeStatus utils', () => {
    it('maps date strings to weekdays without timezone drift', () => {
        expect(getDayOfWeekFromDateString('2026-11-09')).toBe(1); // Monday
        expect(getDayOfWeekFromDateString('2026-11-14')).toBe(6); // Saturday
        expect(getDayOfWeekFromDateString('2026-11-15')).toBe(0); // Sunday
    });

    it('closed on Monday and Tuesday', () => {
        expect(isTimeWithinBusinessHours('2026-11-09', '20:00')).toBe(false);
        expect(isTimeWithinBusinessHours('2026-11-10', '20:00')).toBe(false);
    });

    it('open on weekday evenings, inclusive boundaries', () => {
        expect(isTimeWithinBusinessHours('2026-11-11', '19:00')).toBe(true);
        expect(isTimeWithinBusinessHours('2026-11-11', '22:30')).toBe(true);
        expect(isTimeWithinBusinessHours('2026-11-11', '18:59')).toBe(false);
        expect(isTimeWithinBusinessHours('2026-11-11', '22:31')).toBe(false);
        expect(isTimeWithinBusinessHours('2026-11-11', '15:00')).toBe(false);
    });

    it('weekend has lunch and dinner slots but not the gap between', () => {
        expect(isTimeWithinBusinessHours('2026-11-14', '14:30')).toBe(true);
        expect(isTimeWithinBusinessHours('2026-11-14', '17:00')).toBe(false);
        expect(isTimeWithinBusinessHours('2026-11-15', '21:00')).toBe(true);
    });

    it('honours the special-event override date', () => {
        expect(isTimeWithinBusinessHours('2026-06-15', '18:00')).toBe(true);
        expect(isTimeWithinBusinessHours('2026-06-15', '22:15')).toBe(false);
    });

    it('isStoreOpen evaluates in Europe/Madrid time regardless of server timezone', () => {
        // Wed 2026-11-11 20:00 Madrid (CET = UTC+1) → 19:00Z
        expect(isStoreOpen(new Date('2026-11-11T19:00:00Z'))).toBe(true);
        // Wed 2026-11-11 23:30 Madrid → closed
        expect(isStoreOpen(new Date('2026-11-11T22:30:00Z'))).toBe(false);
        // Mon → closed
        expect(isStoreOpen(new Date('2026-11-09T19:00:00Z'))).toBe(false);
        // Summer time (CEST = UTC+2): Sat 2026-07-11 14:30 Madrid → 12:30Z
        expect(isStoreOpen(new Date('2026-07-11T12:30:00Z'))).toBe(true);
    });
});
