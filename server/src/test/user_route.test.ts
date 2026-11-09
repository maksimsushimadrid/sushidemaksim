// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { mockQuery, startTestServer } from './helpers/testUtils.js';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const USER_A = '11111111-1111-4111-8111-111111111111';

vi.mock('../config.js', () => ({
    config: {
        isProd: true,
        isDev: false,
        nodeEnv: 'production',
        jwtSecret: TEST_SECRET,
    },
}));

vi.mock('../middleware/rateLimiters.js', () => ({
    strictLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../db/supabase.js', () => ({
    supabase: { from: vi.fn() },
}));

type TableResults = Record<string, { data?: any; error?: any; count?: number }>;

function mockTables(results: TableResults) {
    (supabase.from as any).mockImplementation((table: string) => mockQuery(results[table] || {}));
}

let server: Awaited<ReturnType<typeof startTestServer>>;

beforeAll(async () => {
    const { default: userRouter } = await import('../routes/user.js');
    server = await startTestServer(userRouter, '/api/user');
});

afterAll(async () => {
    await server.close();
});

beforeEach(() => {
    vi.clearAllMocks();
    mockTables({});
});

const tokenFor = (userId: string) => jwt.sign({ userId }, TEST_SECRET, { expiresIn: '1h' });

describe('GET /api/user/profile — Auth & Data Isolation', () => {
    it('returns 401 when unauthenticated', async () => {
        const res = await server.request('GET', '/api/user/profile');
        expect(res.status).toBe(401);
    });

    it('returns the authenticated user profile and addresses', async () => {
        mockTables({
            users: {
                data: {
                    id: USER_A,
                    name: 'User A',
                    email: 'usera@example.com',
                    role: 'customer',
                    is_verified: true,
                },
            },
            user_addresses: {
                data: [{ id: 'addr-a', street: 'Calle A' }],
            },
            orders: { count: 2 },
        });

        const res = await server.request('GET', '/api/user/profile', {
            token: tokenFor(USER_A),
        });

        expect(res.status).toBe(200);
        expect(res.json.user.email).toBe('usera@example.com');
        expect(res.json.user.addresses).toHaveLength(1);
    });
});

describe('PUT /api/user/profile — Validation & Integrity', () => {
    it('rejects birth dates earlier than 1945', async () => {
        mockTables({
            users: {
                data: {
                    id: USER_A,
                    name: 'User A',
                    email: 'usera@example.com',
                    birth_date: null,
                    profile_last_changed_at: null,
                },
            },
        });

        const res = await server.request('PUT', '/api/user/profile', {
            token: tokenFor(USER_A),
            body: { birthDate: '1930-01-01' },
        });

        expect(res.status).toBe(400);
        expect(res.json.error).toContain('1945');
    });

    it('rejects future birth dates', async () => {
        mockTables({
            users: {
                data: {
                    id: USER_A,
                    name: 'User A',
                    email: 'usera@example.com',
                    birth_date: null,
                    profile_last_changed_at: null,
                },
            },
        });

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);
        const res = await server.request('PUT', '/api/user/profile', {
            token: tokenFor(USER_A),
            body: { birthDate: futureDate.toISOString().split('T')[0] },
        });

        expect(res.status).toBe(400);
        expect(res.json.error).toContain('futuro');
    });
});

describe('POST /api/user/addresses — Resource Limit Enforced', () => {
    it('enforces maximum 5 addresses limit per user', async () => {
        mockTables({
            user_addresses: {
                data: [
                    { id: '1', street: 'Street 1' },
                    { id: '2', street: 'Street 2' },
                    { id: '3', street: 'Street 3' },
                    { id: '4', street: 'Street 4' },
                    { id: '5', street: 'Street 5' },
                ],
            },
        });

        const res = await server.request('POST', '/api/user/addresses', {
            token: tokenFor(USER_A),
            body: {
                street: 'Calle Nueva 12',
                city: 'Madrid',
                postalCode: '28001',
            },
        });

        expect(res.status).toBe(400);
        expect(res.json.error).toContain('límite máximo de 5 direcciones');
    });
});
