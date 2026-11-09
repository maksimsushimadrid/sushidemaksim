// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { supabase } from '../db/supabase.js';
import { mockQuery } from './helpers/testUtils.js';

vi.mock('../db/supabase.js', () => ({
    supabase: { from: vi.fn() },
}));

const USER_ID = '1a2b3c4d-1111-4222-8333-444455556666';

function mockRes() {
    const res: any = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
}

function run(middleware: any, req: any) {
    const res = mockRes();
    const next = vi.fn();
    return Promise.resolve(middleware(req, res, next)).then(() => ({ res, next, req }));
}

const b64url = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');

describe('authMiddleware (JWT verification)', () => {
    it('rejects requests without a token (401)', async () => {
        const { res, next } = await run(authMiddleware, { headers: {} });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('accepts a valid Bearer token and sets req.userId', async () => {
        const token = jwt.sign({ userId: USER_ID }, config.jwtSecret, { expiresIn: '1h' });
        const { next, req } = await run(authMiddleware, {
            headers: { authorization: `Bearer ${token}` },
        });
        expect(next).toHaveBeenCalledOnce();
        expect(req.userId).toBe(USER_ID);
    });

    it('accepts a valid token from the sushi_token cookie', async () => {
        const token = jwt.sign({ userId: USER_ID }, config.jwtSecret, { expiresIn: '1h' });
        const { next, req } = await run(authMiddleware, {
            headers: { cookie: `theme=dark; sushi_token=${token}` },
        });
        expect(next).toHaveBeenCalledOnce();
        expect(req.userId).toBe(USER_ID);
    });

    it('rejects a token signed with a different secret (forged token)', async () => {
        const forged = jwt.sign({ userId: USER_ID }, 'attacker-controlled-secret');
        const { res, next } = await run(authMiddleware, {
            headers: { authorization: `Bearer ${forged}` },
        });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an unsigned "alg: none" token', async () => {
        const noneToken = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ userId: USER_ID })}.`;
        const { res, next } = await run(authMiddleware, {
            headers: { authorization: `Bearer ${noneToken}` },
        });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
        const expired = jwt.sign(
            { userId: USER_ID, exp: Math.floor(Date.now() / 1000) - 60 },
            config.jwtSecret
        );
        const { res, next } = await run(authMiddleware, {
            headers: { authorization: `Bearer ${expired}` },
        });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a validly signed token whose userId is not a UUID (injection guard)', async () => {
        for (const badId of ['556', "' OR 1=1 --", 'admin', '']) {
            const token = jwt.sign({ userId: badId }, config.jwtSecret);
            const { res, next } = await run(authMiddleware, {
                headers: { authorization: `Bearer ${token}` },
            });
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        }
    });

    it('does not treat a non-Bearer Authorization scheme as a token', async () => {
        const token = jwt.sign({ userId: USER_ID }, config.jwtSecret);
        const { res, next } = await run(authMiddleware, {
            headers: { authorization: `Basic ${token}` },
        });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('optionalAuthMiddleware', () => {
    it('continues as guest (no userId) when the token is forged', async () => {
        const forged = jwt.sign({ userId: USER_ID }, 'attacker-controlled-secret');
        const { next, req, res } = await run(optionalAuthMiddleware, {
            headers: { authorization: `Bearer ${forged}` },
        });
        expect(next).toHaveBeenCalledOnce();
        expect(req.userId).toBeUndefined();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('continues as guest when the userId is not a UUID', async () => {
        const token = jwt.sign({ userId: '123' }, config.jwtSecret);
        const { next, req } = await run(optionalAuthMiddleware, {
            headers: { authorization: `Bearer ${token}` },
        });
        expect(next).toHaveBeenCalledOnce();
        expect(req.userId).toBeUndefined();
    });

    it('sets userId for a valid token', async () => {
        const token = jwt.sign({ userId: USER_ID }, config.jwtSecret);
        const { req } = await run(optionalAuthMiddleware, {
            headers: { authorization: `Bearer ${token}` },
        });
        expect(req.userId).toBe(USER_ID);
    });
});

describe('adminMiddleware (role-based access control)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 when no authenticated user is present', async () => {
        const { res, next } = await run(adminMiddleware, {});
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('returns 403 for a regular customer', async () => {
        (supabase.from as any).mockReturnValue(
            mockQuery({ data: { role: 'user', is_superadmin: false } })
        );
        const { res, next } = await run(adminMiddleware, { userId: USER_ID });
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 (fails closed) when the DB lookup errors', async () => {
        (supabase.from as any).mockReturnValue(mockQuery({ error: { message: 'boom' } }));
        const { res, next } = await run(adminMiddleware, { userId: USER_ID });
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when the user record does not exist', async () => {
        (supabase.from as any).mockReturnValue(mockQuery({ data: null }));
        const { res, next } = await run(adminMiddleware, { userId: USER_ID });
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows admins', async () => {
        (supabase.from as any).mockReturnValue(
            mockQuery({ data: { role: 'admin', is_superadmin: false } })
        );
        const { next } = await run(adminMiddleware, { userId: USER_ID });
        expect(next).toHaveBeenCalledOnce();
    });

    it('allows superadmins', async () => {
        (supabase.from as any).mockReturnValue(
            mockQuery({ data: { role: 'user', is_superadmin: true } })
        );
        const { next } = await run(adminMiddleware, { userId: USER_ID });
        expect(next).toHaveBeenCalledOnce();
    });
});
