// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { mockQuery, startTestServer } from './helpers/testUtils.js';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const ADMIN_ID = '99999999-9999-4999-8999-999999999999';
const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';

vi.mock('../config.js', () => ({
    config: {
        isProd: true,
        isDev: false,
        nodeEnv: 'production',
        jwtSecret: TEST_SECRET,
    },
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
    const { default: adminRouter } = await import('../routes/admin.js');
    server = await startTestServer(adminRouter, '/api/admin');
});

afterAll(async () => {
    await server.close();
});

beforeEach(() => {
    vi.clearAllMocks();
    mockTables({});
});

const tokenFor = (userId: string) => jwt.sign({ userId }, TEST_SECRET, { expiresIn: '1h' });

describe('Admin Router Access Control — RBAC Security', () => {
    const protectedEndpoints: { method: string; path: string }[] = [
        { method: 'GET', path: '/api/admin/stats' },
        { method: 'GET', path: '/api/admin/users' },
        { method: 'GET', path: '/api/admin/orders' },
        { method: 'GET', path: '/api/admin/promo-codes' },
        { method: 'POST', path: '/api/admin/promo-codes/secret' },
        { method: 'GET', path: '/api/admin/newsletter/subscribers' },
        { method: 'GET', path: '/api/admin/tablon-categories' },
    ];

    it.each(protectedEndpoints)(
        'denies unauthenticated requests with 401 on $method $path',
        async ({ method, path }) => {
            const res = await server.request(method, path);
            expect(res.status).toBe(401);
        }
    );

    it.each(protectedEndpoints)(
        'denies regular customers with 403 on $method $path',
        async ({ method, path }) => {
            // Customer in DB is NOT admin
            mockTables({
                users: {
                    data: {
                        id: CUSTOMER_ID,
                        role: 'customer',
                        is_superadmin: false,
                    },
                },
            });

            const res = await server.request(method, path, {
                token: tokenFor(CUSTOMER_ID),
            });

            expect(res.status).toBe(403);
        }
    );

    it('allows verified admin to view secret promo codes', async () => {
        // Admin user in DB
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'users') {
                return mockQuery({
                    data: {
                        id: ADMIN_ID,
                        role: 'admin',
                        is_superadmin: true,
                    },
                });
            }
            if (table === 'site_settings') {
                return mockQuery({
                    data: {
                        value: JSON.stringify([
                            { code: 'WELOVEYOU15', discountPercentage: 15, active: true },
                        ]),
                    },
                });
            }
            return mockQuery({ data: [] });
        });

        const res = await server.request('GET', '/api/admin/promo-codes', {
            token: tokenFor(ADMIN_ID),
        });

        expect(res.status).toBe(200);
        expect(res.json.secretPromoCodes).toBeDefined();
        expect(res.json.secretPromoCodes.some((c: any) => c.code === 'WELOVEYOU15')).toBe(true);
    });
});
