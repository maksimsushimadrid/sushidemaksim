import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase.js';
import { config } from '../config.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { formatMenuItem } from '../utils/helpers.js';
import { validateResource } from '../middleware/validateResource.js';
import { getMenuQuerySchema, menuIdParamSchema } from '../schemas/menu.schema.js';

const router = Router();

/** Clear menu cache — kept for API compatibility, CDN caching handles invalidation via TTL */
export function invalidateMenuCache(): void {
    // No-op since we rely on Vercel Edge caching headers now
}

// GET /api/menu/popular — returns top 6 items based on 90d ABC revenue analysis
router.get(
    '/popular',
    asyncHandler(async (_req: Request, res: Response) => {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Fetch completed orders from last 90 days
        const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('is_archived', false)
            .neq('status', 'cancelled')
            .gte('created_at', ninetyDaysAgo);

        const orderIds = (orders || []).map(o => o.id);

        let items90: any[] = [];
        if (orderIds.length > 0) {
            const { data: itemsData } = await supabase
                .from('order_items')
                .select('menu_item_id, quantity, price_at_time')
                .in('order_id', orderIds);
            items90 = itemsData || [];
        }

        // 2. Calculate revenue per menu_item_id (ABC Logic)
        const revenueMap: Record<number, number> = {};
        items90.forEach(item => {
            if (item.menu_item_id) {
                revenueMap[item.menu_item_id] =
                    (revenueMap[item.menu_item_id] || 0) + item.quantity * item.price_at_time;
            }
        });

        // 3. Get top 6 ids
        const topItemIds = Object.entries(revenueMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([id]) => Number(id));

        // 4. Fetch their active menu_items data
        let formatted: any[] = [];
        if (topItemIds.length > 0) {
            const { data: menuItems } = await supabase
                .from('menu_items')
                .select('*')
                .in('id', topItemIds);

            const itemsMap: Record<number, any> = {};
            (menuItems || []).forEach(item => {
                itemsMap[item.id] = formatMenuItem(item);
            });

            // Re-sort to match revenue map order
            formatted = topItemIds.map(id => itemsMap[id]).filter(Boolean);
        }

        // If we don't have enough popular items from history, fetch some is_popular fallbacks
        if (formatted.length < 6) {
            const excludeIds = formatted.map(i => i.id);
            let fallbackQuery = supabase
                .from('menu_items')
                .select('*')
                .eq('is_popular', true)
                .limit(6 - formatted.length);

            if (excludeIds.length > 0) {
                fallbackQuery = fallbackQuery.not('id', 'in', `(${excludeIds.join(',')})`);
            }

            const { data: fallbacks } = await fallbackQuery;
            if (fallbacks) {
                formatted = [...formatted, ...fallbacks.map(formatMenuItem)];
            }
        }

        const result = { items: formatted, total: formatted.length };

        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.json(result);
    })
);

// GET /api/menu — all items, optional ?category= and ?search= filter
router.get(
    '/',
    validateResource(getMenuQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { category, search, is_promo, is_popular, is_chef_choice, limit } = req.query as any;

        const hasSearch = search && search.trim().length > 0;

        let query = supabase.from('menu_items').select('*');

        if (category) {
            query = query.eq('category', category);
        }

        if (is_promo) query = query.eq('is_promo', true);
        if (is_popular) query = query.eq('is_popular', true);
        if (is_chef_choice) query = query.eq('is_chef_choice', true);

        if (limit) {
            query = query.limit(limit);
        }

        if (hasSearch) {
            const term = search.trim();
            query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
        }

        const { data: items, error } = await query.order('category').order('id');

        if (error) throw error;

        const formatted = (items || []).map(formatMenuItem);
        const result = { items: formatted, total: formatted.length };

        res.set(
            'Cache-Control',
            hasSearch ? 'private, no-cache' : 'public, max-age=300, s-maxage=600'
        );
        res.json(result);
    })
);

// GET /api/menu/info/categories — category list with counts and representative images
router.get(
    '/info/categories',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data, error } = await supabase
            .from('menu_items')
            .select('category, image')
            .order('id');

        if (error) throw error;

        const counts: Record<string, number> = {};
        const images: Record<string, string | null> = {};

        const STORAGE_BASE = `${config.supabase.url}/storage/v1/object/public/images/menu`;

        data?.forEach(item => {
            counts[item.category] = (counts[item.category] || 0) + 1;
            if (!images[item.category] && item.image) {
                // If it's just a filename, prepend the full Supabase storage URL
                if (!item.image.startsWith('http')) {
                    images[item.category] = `${STORAGE_BASE}/${item.image}`;
                } else {
                    images[item.category] = item.image;
                }
            }
        });

        const categoryMap: Record<string, { name: string; icon: string }> = {
            entrantes: { name: 'Entrantes', icon: '🥟' },
            'rollos-grandes': { name: 'Rollos Grandes', icon: '🍣' },
            'rollos-clasicos': { name: 'Rollos Clásicos', icon: '🥢' },
            'rollos-fritos': { name: 'Rollos Fritos/Horneados', icon: '🔥' },
            sopas: { name: 'Sopas', icon: '🍜' },
            menus: { name: 'Menús', icon: '🎁' },
            extras: { name: 'Extras', icon: '🧴' },
            postre: { name: 'Postre', icon: '🍰' },
        };

        const categories = Object.entries(counts).map(([cat, count]) => ({
            id: cat,
            ...(categoryMap[cat] || { name: cat, icon: '📋' }),
            count,
            image: images[cat] || null,
        }));

        const result = { categories };

        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.json(result);
    })
);

// GET /api/menu/:id — single item
router.get(
    '/:id',
    validateResource(menuIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any;

        const { data: item, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !item) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.json({ item: formatMenuItem(item) });
    })
);

// POST /api/menu/:id/share — track share events
router.post(
    '/:id/share',
    validateResource(menuIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any;

        // We use a generic analytics table. If it doesn't exist, we just log and continue
        // as the user might need to run the migration first.
        const { error } = await supabase.from('menu_item_analytics').insert({
            menu_item_id: id,
            event_type: 'share',
        });

        if (error) {
            console.error('📊 Analytics Error (Share):', error.message);
            // Don't fail the request if analytics fails
            return res.json({ success: false, note: 'Migration might be needed' });
        }

        res.json({ success: true });
    })
);

export default router;
