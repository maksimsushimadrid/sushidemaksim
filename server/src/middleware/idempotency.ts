import { Response, NextFunction } from 'express';
import { supabase } from '../db/supabase.js';
import { AuthRequest } from './auth.js';

const KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const TABLE = 'idempotency_keys';

/**
 * Idempotency middleware (Stripe-style) backed by Postgres so it works across
 * serverless instances.
 *
 * - Client sends `Idempotency-Key: <uuid>` header.
 * - First request reserves the key (status=processing) and executes the handler.
 * - 2xx responses are persisted and replayed for repeated requests with the same key.
 * - Non-2xx responses release the key so the client can safely retry.
 * - A concurrent duplicate while the first is still processing gets 409.
 *
 * Requests without the header pass through unchanged (backward compatible).
 * If the table does not exist yet, the middleware degrades to a no-op.
 */
export function idempotency(scope: string) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const rawKey = req.header('Idempotency-Key');
        if (!rawKey) return next();

        if (!KEY_PATTERN.test(rawKey)) {
            return res.status(400).json({ error: 'Idempotency-Key inválida' });
        }

        // Scope keys per endpoint and per user (or guest) to avoid cross-user collisions.
        const key = `${scope}:${req.userId || 'guest'}:${rawKey}`;

        const { error: insertError } = await supabase
            .from(TABLE)
            .insert({ key, status: 'processing' });

        if (insertError) {
            // 23505 = unique_violation → key already used
            if (insertError.code === '23505') {
                const { data: existing } = await supabase
                    .from(TABLE)
                    .select('status, response_status, response_body')
                    .eq('key', key)
                    .single();

                if (existing?.status === 'completed') {
                    res.setHeader('Idempotent-Replayed', 'true');
                    return res.status(existing.response_status || 200).json(existing.response_body);
                }
                return res.status(409).json({
                    error: 'Tu pedido ya se está procesando. Por favor, espera unos segundos.',
                });
            }

            // Table missing or other DB issue: don't block orders, just log.
            console.warn('[idempotency] disabled for this request:', insertError.message);
            return next();
        }

        const originalJson = res.json.bind(res);
        res.json = (body: unknown) => {
            const status = res.statusCode;
            const persist =
                status >= 200 && status < 300
                    ? supabase
                          .from(TABLE)
                          .update({
                              status: 'completed',
                              response_status: status,
                              response_body: body,
                          })
                          .eq('key', key)
                    : supabase.from(TABLE).delete().eq('key', key);

            Promise.resolve(persist).then(({ error }) => {
                if (error) console.warn('[idempotency] persist failed:', error.message);
            });
            return originalJson(body);
        };

        // Handler threw before responding (error middleware path) → release key.
        res.on('close', () => {
            if (!res.headersSent) {
                void supabase.from(TABLE).delete().eq('key', key);
            }
        });

        next();
    };
}
