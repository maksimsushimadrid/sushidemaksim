import { Router, Response } from 'express';
import { supabase } from '../db/supabase.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateResource } from '../middleware/validateResource.js';
import { validatePromoSchema } from '../schemas/promo.schema.js';
import { promoLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.use(authMiddleware);

router.post(
    '/validate',
    promoLimiter,
    validateResource(validatePromoSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { code, subtotal } = req.body;
        const normalizedCode = String(code || '')
            .trim()
            .toUpperCase();

        // ─── Hardcoded Test Promos ───
        if (normalizedCode === 'TEST10') {
            return res.json({ percentage: 10 });
        }

        // ─── DB Lookup for Promo Codes ───
        console.log(`[PROMO] Validating "${normalizedCode}" for user ${req.userId}...`);
        const { data: promo, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', normalizedCode)
            // Allow checking existing codes even if used, so we can give better errors
            .or(`user_id.is.null,user_id.eq.${req.userId}`)
            .maybeSingle();

        if (error) {
            console.error('[PROMO] DB Error:', error);
            return res.status(500).json({ error: 'Error del servidor al validar el código' });
        }

        // ─── Support Dynamic Referral Codes ───
        if (normalizedCode.startsWith('REF-') && normalizedCode.length > 5) {
            const referrerIdFragment = normalizedCode.split('-')[1];

            // Verify referrer exists
            const { data: referrer, error: refError } = await supabase
                .from('users')
                .select('id')
                .ilike('id', `${referrerIdFragment}%`)
                .single();

            if (refError || !referrer) {
                return res.status(400).json({ error: 'Código de referido no encontrado' });
            }

            // A user cannot refer themselves
            if (referrer.id === req.userId) {
                return res
                    .status(400)
                    .json({ error: 'No puedes usar tu propio código de referido' });
            }

            // Referrals are only valid for the VERY FIRST order of the user
            const { count: orderCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', req.userId);

            if (orderCount && orderCount > 0) {
                return res
                    .status(400)
                    .json({ error: 'El código de referido solo es válido para tu primer pedido' });
            }

            // Give 15% discount
            return res.json({ percentage: 15 });
        }

        if (!promo) {
            console.warn(`[PROMO] Code "${normalizedCode}" not found for user ${req.userId}`);
            return res.status(400).json({ error: 'Código inválido' });
        }

        if (promo.is_used) {
            return res.status(400).json({ error: 'Este código ya ha sido utilizado' });
        }

        // ─── Requirements Check for Registration Promos ───
        // Support both "NUEVO" (default) and "NEW" (old/fallback or from newsletter)
        if (promo.code.startsWith('NUEVO') || promo.code.startsWith('NEW')) {
            // 1. Expiry Check (7 days)
            const createdAt = new Date(promo.created_at);
            const expiredAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (new Date() > expiredAt) {
                return res
                    .status(400)
                    .json({ error: 'Este código de bienvenida ha expirado (válido por 7 días)' });
            }

            // 2. Min Order Check (20€)
            if (subtotal !== undefined && subtotal < 20) {
                return res.status(400).json({
                    error: 'El pedido mínimo para este código es de 20,00€',
                    minOrder: 20,
                });
            }
        }

        // ─── Requirements Check for Loyalty Promos ───
        if (promo.code.startsWith('LOYALTY')) {
            // Expiry Check (7 days)
            const createdAt = new Date(promo.created_at);
            const expiredAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
            if (new Date() > expiredAt) {
                return res
                    .status(400)
                    .json({ error: 'El código de fidelidad ha expirado (válido por 7 días)' });
            }
        }

        // ─── Requirements Check for Birthday Promos ───
        if (promo.code.startsWith('BDAY')) {
            // Expiry Check (30 days)
            const createdAt = new Date(promo.created_at);
            const expiredAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            if (new Date() > expiredAt) {
                return res
                    .status(400)
                    .json({ error: 'El código de cumpleaños ha expirado (válido por 30 días)' });
            }
        }

        // ─── Requirements Check for Dessert Gift Promos ───
        if (promo.code.startsWith('DESSERT')) {
            // Expiry Check (30 days)
            const createdAt = new Date(promo.created_at);
            const expiredAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            if (new Date() > expiredAt) {
                return res
                    .status(400)
                    .json({ error: 'El código de postre ha expirado (válido por 30 días)' });
            }

            // Return the gift info
            return res.json({
                percentage: promo.discount_percentage,
                gift: {
                    name: 'Roll dulce',
                    label: 'Regalo por tu 10º pedido',
                },
            });
        }

        // ─── Requirements Check for Special 14-day Promos ───
        if (promo.code.startsWith('SPECIAL')) {
            const createdAt = new Date(promo.created_at);
            const expiredAt = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
            if (new Date() > expiredAt) {
                return res
                    .status(400)
                    .json({ error: 'Este código ha expirado (válido por 14 días)' });
            }
        }

        res.json({ percentage: promo.discount_percentage });
    })
);

export default router;
