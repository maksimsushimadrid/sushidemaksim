import { Router, Request, Response } from 'express';
import { supabase } from '../../db/supabase.js';
import { AuthRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validateResource } from '../../middleware/validateResource.js';
import {
    createPromoSchema,
    updatePromoSchema,
    promoIdParamSchema,
} from '../../schemas/promo.schema.js';
import { getSecretPromoCodes, saveSecretPromoCodes } from '../../utils/secretPromos.js';

const router = Router();

// ─── PROMO BANNERS MANAGEMENT ─────────────────────────────────────────────────

router.get(
    '/promos',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data: promos, error } = await supabase
            .from('promos')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ promos });
    })
);

router.post(
    '/promos',
    validateResource(createPromoSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const {
            title,
            description,
            discount,
            valid_until,
            icon,
            color,
            bg,
            is_active,
            image_url,
            type,
            subtitle,
            cta_text,
            cta_link,
            metadata,
            sort_order,
        } = req.body;

        const { data: promo, error } = await supabase
            .from('promos')
            .insert({
                title,
                description,
                discount,
                valid_until,
                icon,
                color,
                bg,
                is_active,
                image_url,
                type,
                subtitle,
                cta_text,
                cta_link,
                metadata: metadata || {},
                sort_order: sort_order ?? 0,
            })
            .select()
            .single();
        if (error) throw error;
        res.json(promo);
    })
);

// PUT /admin/promos/reorder — bulk update sort_order for all promos (drag-and-drop)
router.put(
    '/promos/reorder',
    asyncHandler(async (req: Request, res: Response) => {
        const { items } = req.body; // [{ id: string, sort_order: number }]

        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'items must be an array of { id, sort_order }' });
        }

        for (const item of items) {
            await supabase.from('promos').update({ sort_order: item.sort_order }).eq('id', item.id);
        }

        // Return updated list
        const { data: promos, error } = await supabase
            .from('promos')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ promos });
    })
);

router.put(
    '/promos/:id',
    validateResource(updatePromoSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const {
            title,
            description,
            discount,
            valid_until,
            icon,
            color,
            bg,
            is_active,
            image_url,
            type,
            subtitle,
            cta_text,
            cta_link,
            metadata,
            sort_order,
        } = req.body;

        const updateData: Record<string, any> = {
            title,
            description,
            discount,
            valid_until,
            icon,
            color,
            bg,
            is_active,
            image_url,
            type,
            subtitle,
            cta_text,
            cta_link,
            metadata: metadata || {},
        };
        if (sort_order !== undefined) updateData.sort_order = sort_order;

        const { data: promo, error } = await supabase
            .from('promos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        res.json(promo);
    })
);

router.delete(
    '/promos/:id',
    validateResource(promoIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { error } = await supabase.from('promos').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    })
);

// ─── PROMO CODES MANAGEMENT ───────────────────────────────────────────────────

// GET /api/admin/promo-codes
router.get(
    '/promo-codes',
    asyncHandler(async (_req: Request, res: Response) => {
        const [{ data: promoCodes, error }, secretCodes, { data: promoOrders }] = await Promise.all(
            [
                supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
                getSecretPromoCodes(),
                supabase
                    .from('orders')
                    .select('notes')
                    .neq('status', 'cancelled')
                    .ilike('notes', '%[PROMO:%'),
            ]
        );

        if (error) {
            console.error('❌ Error fetching promo codes:', error);
            return res.status(500).json({ error: 'Failed to fetch promo codes' });
        }

        const orderNotes = (promoOrders || []).map((o: any) => String(o.notes || ''));
        const secretPromoCodes = secretCodes.map(sc => {
            const usageCount = orderNotes.filter(n => n.includes(`[PROMO: ${sc.code} (`)).length;
            return {
                ...sc,
                usageCount,
            };
        });

        res.json({ promoCodes, secretPromoCodes });
    })
);

// POST /api/admin/promo-codes/secret
router.post(
    '/promo-codes/secret',
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const rawCode = String(req.body?.code || '')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9_-]/g, '');
        const pct = Math.min(
            90,
            Math.max(1, Math.round(Number(req.body?.discountPercentage || 15)))
        );

        if (!rawCode || rawCode.length < 3 || rawCode.length > 32) {
            return res.status(400).json({ error: 'El código debe tener entre 3 y 32 caracteres' });
        }

        const codes = await getSecretPromoCodes();
        const existingIdx = codes.findIndex(c => c.code === rawCode);

        if (existingIdx >= 0) {
            codes[existingIdx] = {
                ...codes[existingIdx],
                discountPercentage: pct,
                active: true,
            };
        } else {
            codes.unshift({
                code: rawCode,
                discountPercentage: pct,
                active: true,
                createdAt: new Date().toISOString(),
            });
        }

        await saveSecretPromoCodes(codes);
        res.json({ secretPromoCodes: codes });
    })
);

// PATCH /api/admin/promo-codes/secret/:code
router.patch(
    '/promo-codes/secret/:code',
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const targetCode = String(req.params.code || '')
            .trim()
            .toUpperCase();
        const codes = await getSecretPromoCodes();
        const idx = codes.findIndex(c => c.code === targetCode);

        if (idx === -1) {
            return res.status(404).json({ error: 'Código no encontrado' });
        }

        codes[idx] = {
            ...codes[idx],
            active: typeof req.body?.active === 'boolean' ? req.body.active : !codes[idx].active,
        };

        await saveSecretPromoCodes(codes);
        res.json({ secretPromoCodes: codes });
    })
);

// DELETE /api/admin/promo-codes/secret/:code
router.delete(
    '/promo-codes/secret/:code',
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const targetCode = String(req.params.code || '')
            .trim()
            .toUpperCase();
        const codes = await getSecretPromoCodes();
        const filtered = codes.filter(c => c.code !== targetCode);

        await saveSecretPromoCodes(filtered);
        res.json({ secretPromoCodes: filtered });
    })
);

// POST /api/admin/promo-codes/generate-special
router.post(
    '/promo-codes/generate-special',
    asyncHandler(async (_req: AuthRequest, res: Response) => {
        const generateCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for clarity
            let result = '';
            for (let i = 0; i < 4; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return `SPECIAL10-${result}`;
        };

        const code = generateCode();

        const { data, error } = await supabase
            .from('promo_codes')
            .insert({
                code,
                discount_percentage: 10,
                is_used: false,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error generating promo code:', error);
            return res.status(500).json({ error: 'Error al generar el código' });
        }

        res.json({ code: data.code });
    })
);

export default router;
