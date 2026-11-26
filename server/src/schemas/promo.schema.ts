import { z } from 'zod';

/**
 * Schema for validating a promo code during checkout
 */
export const validatePromoSchema = z.object({
    body: z.object({
        code: z.string().min(1, 'El código es obligatorio').trim().toUpperCase(),
        subtotal: z.number().min(0).optional(),
        deliveryType: z.enum(['delivery', 'pickup', 'reservation', 'table']).optional(),
    }),
});

/**
 * Base schema for a promo/campaign (the banners on home/catalog)
 */
const promoBase = {
    title: z.string().min(1, 'El título es obligatorio'),
    description: z.string().min(1, 'La descripción es obligatoria'),
    discount: z.string().min(1, 'El texto del descuento es obligatorio'),
    valid_until: z.string().nullable().optional(),
    is_active: z.boolean().optional().default(true),
    icon: z.string().optional(),
    color: z.string().optional(),
    bg: z.string().optional(),
    image_url: z.string().url('URL de imagen inválida').nullable().optional(),
    type: z.enum(['card', 'banner']).optional().default('card'),
    subtitle: z.string().optional().nullable(),
    cta_text: z.string().optional().nullable(),
    cta_link: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
    sort_order: z.number().int().optional().default(0),
};

export const createPromoSchema = z.object({
    body: z.object(promoBase),
});

export const updatePromoSchema = z.object({
    params: z.object({
        id: z.string().transform(val => parseInt(val, 10)),
    }),
    body: z.object(promoBase).partial(),
});

export const promoIdParamSchema = z.object({
    params: z.object({
        id: z.string().transform(val => parseInt(val, 10)),
    }),
});
