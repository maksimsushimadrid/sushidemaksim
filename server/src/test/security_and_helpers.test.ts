import { describe, it, expect, vi, beforeEach } from 'vitest';
import { escapeHtml, formatMenuItem, formatAdminMenuItem, formatOrder } from '../utils/helpers.js';
import { getSecretPromoCodes, findActiveSecretPromo } from '../utils/secretPromos.js';
import { supabase } from '../db/supabase.js';

vi.mock('../db/supabase.js', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('Security & Formatting Helpers', () => {
    describe('escapeHtml (XSS protection)', () => {
        it('escapes HTML tags, quotes, and ampersands', () => {
            const payload = `<script>alert("xss" & '1')</script><img src=x onerror="steal()">`;
            const escaped = escapeHtml(payload);
            expect(escaped).not.toContain('<script>');
            expect(escaped).not.toContain('<img');
            expect(escaped).toBe(
                '&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;1&#39;)&lt;/script&gt;&lt;img src=x onerror=&quot;steal()&quot;&gt;'
            );
        });

        it('handles empty or non-special strings safely', () => {
            expect(escapeHtml('')).toBe('');
            expect(escapeHtml('Ivan Garcia #123')).toBe('Ivan Garcia #123');
        });
    });

    describe('formatMenuItem & formatAdminMenuItem', () => {
        it('maps database fields and likesCount properly for public and admin views', () => {
            const raw = {
                id: 115,
                name: 'Cerveza Artesana',
                description: 'Sabores diferentes para cada temporada',
                price: '6.00',
                cost_price: '2.50',
                image: '/images/announcements/craft-beer-033.webp',
                category: 'bebidas',
                likes_count: 14,
                is_promo: false,
            };

            const publicItem = formatMenuItem(raw);
            expect(publicItem?.id).toBe(115);
            expect(publicItem?.price).toBe(6);
            expect(publicItem?.likesCount).toBe(14);
            expect((publicItem as any)?.costPrice).toBeUndefined();

            const adminItem = formatAdminMenuItem(raw);
            expect(adminItem?.costPrice).toBe(2.5);
            expect(adminItem?.likesCount).toBe(14);
        });

        it('defaults likesCount to 0 when not provided', () => {
            const formatted = formatMenuItem({
                id: 1,
                name: 'Roll',
                description: '',
                price: 10,
                image: '',
                category: 'rolls',
            });
            expect(formatted?.likesCount).toBe(0);
        });
    });

    describe('formatOrder', () => {
        it('extracts order details, delivery fee, device info and notes', () => {
            const rawOrder = {
                id: 42,
                user_id: 'u-1',
                total: 34,
                delivery_address: 'Calle Mayor, 10',
                phone_number: '+34600000000',
                status: 'pending',
                payment_method: 'card',
                notes: 'Sin cebolla',
                promo_code: 'WELOVEYOU15',
                device_type: 'mobile',
                os_name: 'iOS',
                browser_name: 'Safari',
                created_at: '2026-11-08T12:00:00Z',
                items: [
                    { id: 1, name: 'Roll Salmon', price: 10, price_at_time: 10, quantity: 2, menu_item_id: 1 },
                    { id: 2, name: 'Gastos de Envío', price: 2.5, price_at_time: 2.5, quantity: 1, menu_item_id: -1 },
                ],
            };

            const formatted = formatOrder(rawOrder);
            expect(formatted?.total).toBe(34);
            expect(formatted?.deliveryFee).toBe(2.5);
            expect(formatted?.promoCode).toBe('WELOVEYOU15');
            expect(formatted?.deviceType).toBe('mobile');
            expect(formatted?.osName).toBe('iOS');
            expect(formatted?.browserName).toBe('Safari');
            expect(formatted?.notes).toBe('Sin cebolla');
            expect(formatted?.items).toHaveLength(1);
        });
    });
});

describe('Secret Promo Codes (secretPromos.ts)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('falls back to default WELOVEYOU15 (-15%) when site_settings is empty', async () => {
        (supabase.from as any).mockReturnValue({
            select: () => ({
                eq: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                }),
            }),
        });

        const codes = await getSecretPromoCodes();
        expect(codes).toHaveLength(1);
        expect(codes[0].code).toBe('WELOVEYOU15');
        expect(codes[0].discountPercentage).toBe(15);
        expect(codes[0].active).toBe(true);

        const match = await findActiveSecretPromo('weloveyou15');
        expect(match).not.toBeNull();
        expect(match?.discountPercentage).toBe(15);
    });

    it('returns custom active secret codes and ignores inactive ones', async () => {
        (supabase.from as any).mockReturnValue({
            select: () => ({
                eq: () => ({
                    maybeSingle: async () => ({
                        data: {
                            value: JSON.stringify([
                                { code: 'WELOVEYOU15', discountPercentage: 15, active: true },
                                { code: 'VIP25', discountPercentage: 25, active: true },
                                { code: 'EXPIRED20', discountPercentage: 20, active: false },
                            ]),
                        },
                        error: null,
                    }),
                }),
            }),
        });

        const vip = await findActiveSecretPromo('vip25');
        expect(vip?.discountPercentage).toBe(25);

        const inactive = await findActiveSecretPromo('EXPIRED20');
        expect(inactive).toBeNull();
    });
});

