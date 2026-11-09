// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { mockQuery, startTestServer } from './helpers/testUtils.js';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const USER_ID = '1a2b3c4d-1111-4222-8333-444455556666';
const OTHER_USER_ID = '9f8e7d6c-1111-4222-8333-444455556666';

// Simulate PRODUCTION so dev-only shortcuts (TEST10) must be disabled
vi.mock('../config.js', () => ({
    config: { isProd: true, isDev: false, nodeEnv: 'production', jwtSecret: TEST_SECRET },
}));
vi.mock('../middleware/rateLimiters.js', () => ({
    promoLimiter: (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../db/supabase.js', () => ({
    supabase: { from: vi.fn() },
}));

type TableResults = Record<string, { data?: any; error?: any; count?: number }>;

function mockTables(results: TableResults) {
    (supabase.from as any).mockImplementation((table: string) => mockQuery(results[table] || {}));
}

const tokenFor = (userId: string) => jwt.sign({ userId }, TEST_SECRET, { expiresIn: '1h' });

let server: Awaited<ReturnType<typeof startTestServer>>;

beforeAll(async () => {
    const { default: promoRouter } = await import('../routes/promo.js');
    server = await startTestServer(promoRouter, '/api/promo');
});

afterAll(async () => {
    await server.close();
});

beforeEach(() => {
    vi.clearAllMocks();
    mockTables({});
});

const validate = (body: unknown, token?: string) =>
    server.request('POST', '/api/promo/validate', { body, token });

describe('POST /api/promo/validate — secret permanent codes', () => {
    it('applies WELOVEYOU15 (-15%) even for guests', async () => {
        const res = await validate({ code: 'WELOVEYOU15' });
        expect(res.status).toBe(200);
        expect(res.json).toEqual({ percentage: 15 });
    });

    it('normalizes whitespace and case', async () => {
        const res = await validate({ code: '  weloveyou15  ' });
        expect(res.status).toBe(200);
        expect(res.json.percentage).toBe(15);
    });

    it('rejects a secret code that the admin has disabled', async () => {
        mockTables({
            site_settings: {
                data: {
                    value: JSON.stringify([
                        { code: 'WELOVEYOU15', discountPercentage: 15, active: false },
                    ]),
                },
            },
        });
        const res = await validate({ code: 'WELOVEYOU15' });
        expect(res.status).toBe(400);
        expect(res.json.percentage).toBeUndefined();
    });

    it('clamps an absurd discount stored in settings to a safe maximum (90%)', async () => {
        mockTables({
            site_settings: {
                data: {
                    value: JSON.stringify([
                        { code: 'BROKEN999', discountPercentage: 999, active: true },
                    ]),
                },
            },
        });
        const res = await validate({ code: 'BROKEN999' });
        expect(res.status).toBe(200);
        expect(res.json.percentage).toBeLessThanOrEqual(90);
    });
});

describe('POST /api/promo/validate — input validation & abuse', () => {
    it('rejects an empty code', async () => {
        const res = await validate({ code: '' });
        expect(res.status).toBe(400);
    });

    it('rejects a missing body field', async () => {
        const res = await validate({});
        expect(res.status).toBe(400);
    });

    it('rejects oversized codes before hitting the database', async () => {
        const res = await validate({ code: 'A'.repeat(500) });
        expect(res.status).toBe(400);
        expect(supabase.from).not.toHaveBeenCalledWith('promo_codes');
    });

    it('rejects a negative subtotal', async () => {
        const res = await validate({ code: 'WELOVEYOU15', subtotal: -10 });
        expect(res.status).toBe(400);
    });

    it('does NOT accept the dev-only TEST10 code in production', async () => {
        const res = await validate({ code: 'TEST10' });
        expect(res.status).toBe(400);
        expect(res.json.percentage).toBeUndefined();
    });

    it('requires login for regular (non-secret) codes', async () => {
        const res = await validate({ code: 'NUEVO-ABCD' });
        expect(res.status).toBe(400);
        expect(res.json.error).toMatch(/Inicia sesión/i);
    });

    it('treats a forged token as a guest', async () => {
        const forged = jwt.sign({ userId: USER_ID }, 'attacker-secret');
        const res = await validate({ code: 'NUEVO-ABCD' }, forged);
        expect(res.status).toBe(400);
        expect(res.json.error).toMatch(/Inicia sesión/i);
    });
});

describe('POST /api/promo/validate — referral (REF-) codes', () => {
    it('blocks self-referral', async () => {
        mockTables({ users: { data: { id: USER_ID } } });
        const res = await validate({ code: 'REF-1A2B3C4D' }, tokenFor(USER_ID));
        expect(res.status).toBe(400);
        expect(res.json.error).toMatch(/propio/i);
    });

    it('rejects malformed referral fragments without querying users (injection guard)', async () => {
        const res = await validate({ code: "REF-' OR 1=1" }, tokenFor(USER_ID));
        expect(res.status).toBe(400);
        expect(supabase.from).not.toHaveBeenCalledWith('users');
    });

    it('rejects referral codes after the first order', async () => {
        mockTables({
            users: { data: { id: OTHER_USER_ID } },
            orders: { count: 2 },
        });
        const res = await validate({ code: 'REF-9F8E7D6C' }, tokenFor(USER_ID));
        expect(res.status).toBe(400);
        expect(res.json.error).toMatch(/primer pedido/i);
    });

    it('grants 15% on the first order from a valid friend code', async () => {
        mockTables({
            users: { data: { id: OTHER_USER_ID } },
            orders: { count: 0 },
        });
        const res = await validate({ code: 'REF-9F8E7D6C' }, tokenFor(USER_ID));
        expect(res.status).toBe(200);
        expect(res.json.percentage).toBe(15);
    });
});

describe('POST /api/promo/validate — personal & one-time codes', () => {
    it("refuses another customer's personal coupon", async () => {
        mockTables({
            promo_codes: {
                data: {
                    code: 'LOYALTY-XYZ',
                    user_id: OTHER_USER_ID,
                    is_used: false,
                    discount_percentage: 5,
                    created_at: new Date().toISOString(),
                },
            },
        });
        const res = await validate({ code: 'LOYALTY-XYZ' }, tokenFor(USER_ID));
        expect(res.status).toBe(400);
        expect(res.json.percentage).toBeUndefined();
    });

    it('refuses an already used code', async () => {
        mockTables({
            promo_codes: {
                data: {
                    code: 'SPECIAL10-ABCD',
                    user_id: null,
                    is_used: true,
                    discount_percentage: 10,
                    created_at: new Date().toISOString(),
                },
            },
        });
        const res = await validate({ code: 'SPECIAL10-ABCD' }, tokenFor(USER_ID));
        expect(res.status).toBe(400);
        expect(res.json.error).toMatch(/utilizado/i);
    });

    it('refuses an expired 14-day SPECIAL code', async () => {
        const old = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
        mockTables({
            promo_codes: {
                data: {
                    code: 'SPECIAL10-ABCD',
                    user_id: null,
                    is_used: false,
                    discount_percentage: 10,
                    created_at: old,
                },
            },
        });
        const res = await validate({ code: 'SPECIAL10-ABCD' }, tokenFor(USER_ID));
        expect(res.status).toBe(400);
        expect(res.json.error).toMatch(/expirado/i);
    });

    it('enforces the 20€ minimum for welcome codes', async () => {
        mockTables({
            promo_codes: {
                data: {
                    code: 'NUEVO-ABCD',
                    user_id: USER_ID,
                    is_used: false,
                    discount_percentage: 10,
                    created_at: new Date().toISOString(),
                },
            },
        });
        const res = await validate({ code: 'NUEVO-ABCD', subtotal: 12 }, tokenFor(USER_ID));
        expect(res.status).toBe(400);
        expect(res.json.minOrder).toBe(20);
    });

    it('does not leak internal DB errors to the client', async () => {
        mockTables({ promo_codes: { error: { message: 'relation "promo_codes" secret detail' } } });
        const res = await validate({ code: 'NUEVO-ABCD' }, tokenFor(USER_ID));
        expect(res.status).toBe(500);
        expect(res.text).not.toContain('secret detail');
    });
});
