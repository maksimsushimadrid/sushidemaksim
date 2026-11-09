// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { mockQuery, startTestServer } from './helpers/testUtils.js';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const USER_ID = '1a2b3c4d-1111-4222-8333-444455556666';

vi.mock('../config.js', () => ({
    config: {
        isProd: true,
        isDev: false,
        nodeEnv: 'production',
        jwtSecret: TEST_SECRET,
        jwtExpiresIn: '7d',
        bcryptRounds: 4, // Fast for tests
        frontendUrl: 'https://sushidemaksim.com',
    },
}));

vi.mock('../middleware/rateLimiters.js', () => ({
    authLimiter: (_req: any, _res: any, next: any) => next(),
    strictLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../utils/email.js', () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    sendGoogleWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendResetCodeEmail: vi.fn().mockResolvedValue(true),
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
    const { default: authRouter } = await import('../routes/auth.js');
    server = await startTestServer(authRouter, '/api/auth');
});

afterAll(async () => {
    await server.close();
});

beforeEach(() => {
    vi.clearAllMocks();
    mockTables({});
});

describe('POST /api/auth/login — Security & Auth', () => {
    it('rejects missing or malformed email / password', async () => {
        const res = await server.request('POST', '/api/auth/login', {
            body: { email: 'not-an-email', password: 'short' },
        });
        expect(res.status).toBe(400);
        expect(res.json.error).toBeDefined();
    });

    it('returns generic 401 when email is not registered (prevents user enumeration)', async () => {
        mockTables({
            users: { data: null, error: { message: 'Not found' } },
        });

        const res = await server.request('POST', '/api/auth/login', {
            body: { email: 'unknown@example.com', password: 'Password123!' },
        });

        expect(res.status).toBe(401);
        expect(res.json.error).toBe('Email o contraseña incorrectos');
    });

    it('returns 403 if account is not verified', async () => {
        mockTables({
            users: {
                data: {
                    id: USER_ID,
                    email: 'unverified@example.com',
                    is_verified: false,
                    password_hash: await bcrypt.hash('Password123!', 4),
                },
            },
        });

        const res = await server.request('POST', '/api/auth/login', {
            body: { email: 'unverified@example.com', password: 'Password123!' },
        });

        expect(res.status).toBe(403);
        expect(res.json.error).toContain('activa tu cuenta');
    });

    it('returns generic 401 on incorrect password (same error message as unknown email)', async () => {
        mockTables({
            users: {
                data: {
                    id: USER_ID,
                    email: 'user@example.com',
                    is_verified: true,
                    password_hash: await bcrypt.hash('CorrectPassword123!', 4),
                },
            },
        });

        const res = await server.request('POST', '/api/auth/login', {
            body: { email: 'user@example.com', password: 'WrongPassword123!' },
        });

        expect(res.status).toBe(401);
        expect(res.json.error).toBe('Email o contraseña incorrectos');
    });

    it('logs in successfully and never leaks password_hash in response', async () => {
        const passwordHash = await bcrypt.hash('ValidPass123!', 4);
        mockTables({
            users: {
                data: {
                    id: USER_ID,
                    email: 'valid@example.com',
                    name: 'Test User',
                    is_verified: true,
                    role: 'customer',
                    password_hash: passwordHash,
                },
            },
        });

        const res = await server.request('POST', '/api/auth/login', {
            body: { email: 'valid@example.com', password: 'ValidPass123!' },
        });

        expect(res.status).toBe(200);
        expect(res.json.token).toBeDefined();
        expect(res.json.user).toBeDefined();
        expect(res.json.user.email).toBe('valid@example.com');
        expect(res.text).not.toContain(passwordHash);
        expect(res.json.password_hash).toBeUndefined();
        expect(res.json.user.password_hash).toBeUndefined();
    });
});

describe('GET /api/auth/me', () => {
    it('returns 401 when no token is provided', async () => {
        const res = await server.request('GET', '/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('returns user profile, addresses and orders count when authenticated', async () => {
        const token = jwt.sign({ userId: USER_ID }, TEST_SECRET);
        mockTables({
            users: {
                data: {
                    id: USER_ID,
                    name: 'Me User',
                    email: 'me@example.com',
                    role: 'customer',
                    is_verified: true,
                },
            },
            user_addresses: {
                data: [{ id: 'addr-1', street: 'Calle Gran Via', house: '10' }],
            },
            orders: {
                count: 3,
            },
        });

        const res = await server.request('GET', '/api/auth/me', { token });
        expect(res.status).toBe(200);
        expect(res.json.user.email).toBe('me@example.com');
        expect(res.json.user.addresses).toHaveLength(1);
        expect(res.json.user.orderCount).toBe(3);
    });
});

describe('POST /api/auth/reset-password — Brute-force & Security', () => {
    it('locks out reset code after 5 failed attempts', async () => {
        mockTables({
            users: { data: { id: USER_ID } },
            password_resets: {
                data: {
                    id: 'reset-1',
                    user_id: USER_ID,
                    code: '123456',
                    attempts: 5,
                    used: false,
                    expires_at: new Date(Date.now() + 60000).toISOString(),
                },
            },
        });

        const res = await server.request('POST', '/api/auth/reset-password', {
            body: {
                email: 'user@example.com',
                code: '123456',
                newPassword: 'NewSecurePassword123!',
            },
        });

        expect(res.status).toBe(400);
        expect(res.json.error).toContain('Demasiados intentos fallidos');
    });
});
