// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { mockQuery, startTestServer } from './helpers/testUtils.js';
import { idempotency } from '../middleware/idempotency.js';

vi.mock('../db/supabase.js', () => ({
    supabase: { from: vi.fn() },
}));

let server: Awaited<ReturnType<typeof startTestServer>>;
let handlerExecCount = 0;

beforeAll(async () => {
    const router = Router();
    router.post('/order', idempotency('orders'), (req: any, res: any) => {
        handlerExecCount++;
        if (req.body?.triggerError) {
            return res.status(400).json({ error: 'Bad order' });
        }
        return res.status(201).json({ orderId: 'ord-123', total: 45.5 });
    });
    server = await startTestServer(router, '/api');
});

afterAll(async () => {
    await server.close();
});

beforeEach(() => {
    vi.clearAllMocks();
    handlerExecCount = 0;
});

describe('idempotency() middleware', () => {
    it('passes through unchanged when no Idempotency-Key header is sent', async () => {
        (supabase.from as any).mockReturnValue(mockQuery({}));
        const res = await server.request('POST', '/api/order', {
            body: { items: [] },
        });

        expect(res.status).toBe(201);
        expect(res.json.orderId).toBe('ord-123');
        expect(handlerExecCount).toBe(1);
    });

    it('rejects malformed Idempotency-Key (< 16 chars or illegal characters)', async () => {
        const res = await server.request('POST', '/api/order', {
            body: { items: [] },
            headers: { 'Idempotency-Key': 'short' },
        });

        expect(res.status).toBe(400);
        expect(res.json.error).toBe('Idempotency-Key inválida');
        expect(handlerExecCount).toBe(0);
    });

    it('returns 409 Conflict if duplicate request arrives while first is still processing', async () => {
        // Mock unique violation code 23505 on insert, and existing status is 'processing'
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'idempotency_keys') {
                return {
                    insert: () => Promise.resolve({ error: { code: '23505' } }),
                    select: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({ data: { status: 'processing' } }),
                        }),
                    }),
                };
            }
            return mockQuery({});
        });

        const res = await server.request('POST', '/api/order', {
            body: { items: [] },
            headers: { 'Idempotency-Key': 'valid-idempotency-key-12345' },
        });

        expect(res.status).toBe(409);
        expect(res.json.error).toContain('ya se está procesando');
        expect(handlerExecCount).toBe(0);
    });

    it('replays cached response with Idempotent-Replayed header when already completed', async () => {
        // Mock existing completed key
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'idempotency_keys') {
                return {
                    insert: () => Promise.resolve({ error: { code: '23505' } }),
                    select: () => ({
                        eq: () => ({
                            single: () =>
                                Promise.resolve({
                                    data: {
                                        status: 'completed',
                                        response_status: 201,
                                        response_body: { orderId: 'ord-cached-999', total: 45.5 },
                                    },
                                }),
                        }),
                    }),
                };
            }
            return mockQuery({});
        });

        const res = await server.request('POST', '/api/order', {
            body: { items: [] },
            headers: { 'Idempotency-Key': 'valid-idempotency-key-12345' },
        });

        expect(res.status).toBe(201);
        expect(res.headers.get('idempotent-replayed')).toBe('true');
        expect(res.json.orderId).toBe('ord-cached-999');
        expect(handlerExecCount).toBe(0); // Handler was not executed!
    });
});
