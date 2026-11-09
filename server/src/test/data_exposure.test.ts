// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { validateResource } from '../middleware/validateResource.js';
import { mockQuery, startTestServer } from './helpers/testUtils.js';

vi.mock('../db/supabase.js', () => ({
    supabase: { from: vi.fn() },
}));

describe('GET /api/settings — public configuration must not leak secrets', () => {
    let server: Awaited<ReturnType<typeof startTestServer>>;

    beforeAll(async () => {
        const { default: settingsRouter } = await import('../routes/settings.js');
        server = await startTestServer(settingsRouter, '/api/settings');
    });

    afterAll(async () => {
        await server.close();
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('never exposes secret promo codes', async () => {
        (supabase.from as any).mockReturnValue(
            mockQuery({
                data: [
                    { key: 'min_order', value: '20' },
                    { key: 'isPickupOnly', value: 'true' },
                    {
                        key: 'secret_promo_codes',
                        value: JSON.stringify([
                            { code: 'WELOVEYOU15', discountPercentage: 15, active: true },
                        ]),
                    },
                ],
            })
        );

        const res = await server.request('GET', '/api/settings');
        expect(res.status).toBe(200);
        expect(res.json.minOrder).toBe(20);
        expect(res.json.isPickupOnly).toBe(true);
        expect(res.json.secretPromoCodes).toBeUndefined();
        expect(res.text).not.toContain('WELOVEYOU15');
    });

    it('fails safe with an empty config when the DB errors', async () => {
        (supabase.from as any).mockReturnValue(mockQuery({ error: { message: 'db down' } }));
        const res = await server.request('GET', '/api/settings');
        expect(res.status).toBe(200);
        expect(res.json).toEqual({});
        expect(res.text).not.toContain('db down');
    });
});

describe('validateResource — must not write credentials to logs', () => {
    it('redacts passwords, tokens and codes when logging validation errors', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const schema = z.object({
            body: z.object({ email: z.string().email(), password: z.string().min(8) }),
        });

        const req: any = {
            originalUrl: '/api/auth/login',
            body: {
                email: 'not-an-email',
                password: 'SuperSecret123!',
                token: 'jwt-abc',
                currentPassword: 'OldSecret!',
            },
            query: {},
            params: {},
        };
        const res: any = { status: vi.fn(() => res), json: vi.fn(() => res) };
        const next = vi.fn();

        await validateResource(schema)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();

        const logged = JSON.stringify(warn.mock.calls);
        expect(logged).not.toContain('SuperSecret123!');
        expect(logged).not.toContain('OldSecret!');
        expect(logged).not.toContain('jwt-abc');
        warn.mockRestore();
    });
});
