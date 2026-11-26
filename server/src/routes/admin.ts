import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase } from '../db/supabase.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateResource } from '../middleware/validateResource.js';
import { toStr } from '../utils/queryHelpers.js';
import { getOrdersSchema, updateOrderStatusSchema } from '../schemas/order.schema.js';
import {
    createMenuItemSchema,
    updateMenuItemSchema,
    menuIdParamSchema,
} from '../schemas/menu.schema.js';
import { updateSettingsSchema } from '../schemas/settings.schema.js';
import {
    createDeliveryZoneSchema,
    updateDeliveryZoneSchema,
    deliveryZoneIdParamSchema,
} from '../schemas/deliveryZone.schema.js';
import {
    getReservationsQuerySchema,
    updateReservationSchema,
    reservationIdParamSchema,
} from '../schemas/reservation.schema.js';
import {
    formatOrder,
    formatAdminMenuItem,
    getMadridStartOfDay,
    getMadridYesterdayStartOfDay,
    formatDeliveryZone,
    calculateUserStats,
} from '../utils/helpers.js';
import { processImage } from '../utils/imageProcessor.js';
import { invalidateMenuCache } from './menu.js';
import { BUSINESS_HOURS } from '../utils/storeStatus.js';
import adminStatsRouter from './admin/stats.js';
import adminUsersRouter from './admin/users.js';
import adminPromosRouter from './admin/promos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage for Multer (Vercel has read-only filesystem)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|jpg|png|webp|gif|avif)$/i.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de imagen no válido'));
        }
    },
});

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/tablon-categories — List unapproved categories for moderation
router.get(
    '/tablon-categories',
    asyncHandler(async (req: Request, res: Response) => {
        const approved = req.query.approved === 'true';
        const { data: categories, error } = await supabase
            .from('tablon_categories')
            .select('id, name, emoji, created_by, is_approved, created_at')
            .eq('is_approved', approved)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ categories: categories || [] });
    })
);

// GET /api/admin/newsletter/subscribers
router.get(
    '/newsletter/subscribers',
    asyncHandler(async (req: Request, res: Response) => {
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ subscribers: data || [] });
    })
);

// POST /api/admin/menu/upload-image (to Supabase Storage)
router.post(
    '/menu/upload-image',
    upload.single('image'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        try {
            const file = req.file;
            // Standardize image: Convert to WebP and Resize
            const optimizedBuffer = await processImage(file.buffer, { type: 'menu' });

            const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
            const filePath = `menu/${fileName}`;

            // Upload to Supabase Storage 'images' bucket
            const { error } = await supabase.storage
                .from('images')
                .upload(filePath, optimizedBuffer, {
                    contentType: 'image/webp',
                    upsert: true,
                });

            if (error) {
                console.error('❌ Supabase storage error:', error);
                return res.status(500).json({
                    error: 'Error al subir la imagen a Supabase Storage',
                    details: error.message || JSON.stringify(error),
                });
            }

            // Get Public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from('images').getPublicUrl(filePath);

            res.json({ url: publicUrl });
        } catch (procError: any) {
            console.error('❌ Image processing error:', procError);
            res.status(500).json({
                error: 'Error al procesar la imagen',
                details: procError.message,
            });
        }
    })
);

// POST /api/admin/promos/upload-image (to Supabase Storage)
router.post(
    '/promos/upload-image',
    upload.single('image'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        try {
            const file = req.file;
            // Optimized for Promos (WebP conversion)
            const optimizedBuffer = await processImage(file.buffer, { type: 'promo' });

            const fileName = `promo-${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
            const filePath = `menu/${fileName}`;

            const { error } = await supabase.storage
                .from('images')
                .upload(filePath, optimizedBuffer, {
                    contentType: 'image/webp',
                    upsert: true,
                });

            if (error) {
                console.error('❌ Supabase storage error:', error);
                return res.status(500).json({
                    error: 'Error al subir la imagen a Supabase Storage',
                    details: error.message || JSON.stringify(error),
                });
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from('images').getPublicUrl(filePath);

            res.json({ imageUrl: publicUrl });
        } catch (err: any) {
            console.error('❌ Promo upload error:', err);
            res.status(500).json({ error: 'Error procesando la imagen', details: err.message });
        }
    })
);

// GET /api/admin/settings
router.get(
    '/settings',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data, error } = await supabase.from('site_settings').select('key, value');
        if (error) throw error;

        const settings = (data || []).reduce((acc: any, item) => {
            // Try to parse JSON values (arrays/objects)
            try {
                const val = item.value;
                acc[item.key] =
                    typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))
                        ? JSON.parse(val)
                        : val;
            } catch {
                acc[item.key] = item.value;
            }
            return acc;
        }, {});

        res.json(settings);
    })
);

// PUT /api/admin/settings
router.put(
    '/settings',
    validateResource(updateSettingsSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const settings = req.body;

        const entries = Object.entries(settings).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        }));

        const { error } = await supabase
            .from('site_settings')
            .upsert(entries, { onConflict: 'key' });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: 'Settings updated successfully' });
    })
);

// ─── MENU MANAGEMENT ──────────────────────────────────────────────────────────

// GET /api/admin/menu
router.get(
    '/menu',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data: items, error } = await supabase
            .from('menu_items')
            .select('*')
            .order('category')
            .order('id');

        if (error) throw error;
        const formatted = (items || []).map(formatAdminMenuItem);
        res.json({ items: formatted, total: formatted.length });
    })
);

// POST /api/admin/menu
router.post(
    '/menu',
    validateResource(createMenuItemSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const {
            name,
            description,
            price,
            image,
            category,
            weight,
            pieces,
            spicy,
            vegetarian,
            isPromo,
            isPopular,
            isChefChoice,
            isNew,
            allergens,
            costPrice,
        } = req.body;

        const { data: item, error } = await supabase
            .from('menu_items')
            .insert({
                name: name.trim(),
                description: description?.trim() || '',
                price,
                image: image?.trim() || '',
                category,
                weight: weight?.trim() || null,
                pieces: pieces || null,
                spicy: !!spicy,
                vegetarian: !!vegetarian,
                is_promo: !!isPromo,
                is_popular: !!isPopular,
                is_chef_choice: !!isChefChoice,
                is_new: !!isNew,
                allergens: allergens || [],
                cost_price: costPrice || 0,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase error inserting item:', error);
            throw error;
        }
        res.status(201).json({ item: formatAdminMenuItem(item) });
        invalidateMenuCache();
    })
);

// PUT /api/admin/menu/:id
router.put(
    '/menu/:id',
    validateResource(updateMenuItemSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const {
            name,
            description,
            price,
            image,
            category,
            weight,
            pieces,
            spicy,
            vegetarian,
            isPromo,
            isPopular,
            isChefChoice,
            isNew,
            allergens,
            costPrice,
        } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (price !== undefined) updateData.price = price;
        if (image !== undefined) updateData.image = image.trim();
        if (category !== undefined) updateData.category = category;
        if (weight !== undefined) updateData.weight = weight?.trim() || null;
        if (pieces !== undefined) updateData.pieces = pieces || null;

        // Ensure boolean values for Supabase
        if (spicy !== undefined) updateData.spicy = Boolean(spicy);
        if (vegetarian !== undefined) updateData.vegetarian = Boolean(vegetarian);
        if (isPromo !== undefined) updateData.is_promo = Boolean(isPromo);
        if (isPopular !== undefined) updateData.is_popular = Boolean(isPopular);
        if (isChefChoice !== undefined) updateData.is_chef_choice = Boolean(isChefChoice);
        if (isNew !== undefined) updateData.is_new = Boolean(isNew);
        if (allergens !== undefined) updateData.allergens = allergens;
        if (costPrice !== undefined) updateData.cost_price = Number(costPrice);

        const { data: item, error } = await supabase
            .from('menu_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase error updating item:', error);
            if (error.code === 'PGRST116')
                return res.status(404).json({ error: 'Producto no encontrado' });
            throw error;
        }

        res.json({ item: formatAdminMenuItem(item) });
        invalidateMenuCache();
    })
);

// DELETE /api/admin/menu/:id
router.delete(
    '/menu/:id',
    validateResource(menuIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // 1. Handle dependencies before deletion to avoid FK constraint errors (23503)
        // Order history is preserved because order_items stores name/price/image strings
        await Promise.all([
            // Clear from carts and favorites
            supabase.from('cart_items').delete().eq('menu_item_id', id),
            supabase.from('user_favorites').delete().eq('menu_item_id', id),
            // Nullify reference in orders but keep the data records
            supabase.from('order_items').update({ menu_item_id: null }).eq('menu_item_id', id),
        ]);

        const { error } = await supabase.from('menu_items').delete().eq('id', id);

        if (error) {
            console.error('❌ Error deleting menu item:', error);
            throw error;
        }
        res.json({ success: true, message: `Producto ${id} eliminado` });
        invalidateMenuCache();
    })
);

// ─── ORDER MANAGEMENT ─────────────────────────────────────────────────────────

// GET /api/admin/orders
router.get(
    '/orders',
    validateResource(getOrdersSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const status = toStr(req.query.status);
        const userId = toStr(req.query.userId);
        const search = toStr(req.query.search);
        const offset = (page - 1) * limit;

        const archived = req.query.archived === 'true';

        let query = supabase
            .from('orders')
            .select('*, users(name, email, avatar), items:order_items(*)', { count: 'exact' })
            .eq('is_archived', archived);

        if (status) {
            if (status.includes(',')) {
                query = query.in('status', status.split(','));
            } else {
                query = query.eq('status', status);
            }
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (search) {
            const sanitizedSearch = search.replace(/[,()]/g, ' ').trim();

            // Find matching users by email or name
            const { data: matchedUsers } = await supabase
                .from('users')
                .select('id')
                .or(`email.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%`)
                .limit(50);
            const matchedUserIds = (matchedUsers || []).map((u: any) => u.id);

            const orConditions: string[] = [
                `phone_number.ilike.%${sanitizedSearch}%`,
                `delivery_address.ilike.%${sanitizedSearch}%`,
                `promo_code.ilike.%${sanitizedSearch}%`,
                `customer_name.ilike.%${sanitizedSearch}%`,
                `notes.ilike.%${sanitizedSearch}%`,
            ];

            if (matchedUserIds.length > 0) {
                orConditions.push(`user_id.in.(${matchedUserIds.join(',')})`);
            }

            const searchNum = parseInt(sanitizedSearch);
            const isUUID = sanitizedSearch.includes('-') && sanitizedSearch.length > 20;

            if (!isNaN(searchNum) && searchNum.toString() === sanitizedSearch) {
                orConditions.unshift(`id.eq.${searchNum}`);
            } else if (isUUID) {
                orConditions.unshift(`user_id.eq.${sanitizedSearch}`);
            }

            query = query.or(orConditions.join(','));
        }

        const {
            data: orders,
            count,
            error,
        } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        if (error) {
            console.error('❌ Error fetching orders:', error);
            throw error;
        }

        // Fetch stats for all users in these orders at once
        const userIds = [...new Set((orders || []).filter(o => o.user_id).map(o => o.user_id))];
        const userStatsMap: Record<string, any> = {};

        if (userIds.length > 0) {
            const statsQuery = supabase
                .from('users')
                .select(
                    'id, created_at, orders(total, created_at, items:order_items(name, quantity))'
                );

            const { data: usersWithAllOrders } = await statsQuery.in('id', userIds);

            (usersWithAllOrders || []).forEach((u: any) => {
                const stats = calculateUserStats(u.orders || []);
                userStatsMap[u.id] = {
                    ...stats,
                    name: u.name,
                    email: u.email,
                    avatar: u.avatar,
                    registrationDate: u.created_at,
                };
            });
        }

        const formattedOrders = (orders || []).map((o: any) => {
            const stats = o.user_id ? userStatsMap[o.user_id] || null : null;
            return formatOrder(o, stats);
        });

        res.json({
            orders: formattedOrders,
            pagination: {
                total: count || 0,
                page,
                limit,
                pages: Math.ceil((count || 0) / limit),
                hasNext: page * limit < (count || 0),
                hasPrev: page > 1,
            },
        });
    })
);

// GET /api/admin/orders/:id — single order with full details & items
router.get(
    '/orders/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.id;
        const { data: order, error } = await supabase
            .from('orders')
            .select('*, users(name, email, avatar), items:order_items(*)')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        let userStats = null;
        if (order.user_id) {
            const { data: userOrders } = await supabase
                .from('orders')
                .select('total, created_at, items:order_items(name, quantity)')
                .eq('user_id', order.user_id);
            userStats = calculateUserStats(userOrders || []);
        }

        res.json({ order: formatOrder(order, userStats) });
    })
);

// DELETE /api/admin/orders/:id — Soft-delete an order (mark as archived)
router.delete(
    '/orders/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.id;

        // 1. Verify the order exists
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('id, is_archived')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        if (order.is_archived) {
            return res.status(400).json({ error: 'El pedido ya está archivado' });
        }

        // 2. Soft-delete: mark as archived
        const { error: updateError } = await supabase
            .from('orders')
            .update({ is_archived: true })
            .eq('id', orderId);

        if (updateError) {
            console.error('❌ Error archiving order:', updateError);
            return res.status(500).json({ error: 'Error al archivar el pedido' });
        }

        console.log(`🗑️  [ADMIN] Order #${orderId} archived (soft-deleted)`);
        res.json({ success: true, message: `Pedido #${orderId} archivado` });
    })
);

// PATCH /api/admin/orders/:id/restore — Restore an archived order
router.patch(
    '/orders/:id/restore',
    asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.id;

        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('id, is_archived')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        if (!order.is_archived) {
            return res.status(400).json({ error: 'El pedido no está archivado' });
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({ is_archived: false })
            .eq('id', orderId);

        if (updateError) {
            console.error('❌ Error restoring order:', updateError);
            return res.status(500).json({ error: 'Error al restaurar el pedido' });
        }

        console.log(`♻️  [ADMIN] Order #${orderId} restored`);
        res.json({ success: true, message: `Pedido #${orderId} restaurado` });
    })
);

// PATCH /api/admin/orders/:id/status
router.patch(
    '/orders/:id/status',
    validateResource(updateOrderStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { status } = req.body;

        // 1. Fetch old state to check transitions and get user info
        const { data: oldOrder } = await supabase
            .from('orders')
            .select('status, user_id, promo_code, users(email, name)')
            .eq('id', req.params.id)
            .single();

        const { data: order } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', req.params.id)
            .select('*, order_items(*)')
            .single();

        const orderWithItems = { ...order, items: order?.order_items || [] };

        // 2. Loyalty Check: If transitioned to 'delivered' and has a user_id
        if (
            order &&
            status === 'delivered' &&
            oldOrder &&
            oldOrder.status !== 'delivered' &&
            oldOrder.user_id
        ) {
            try {
                // Get total delivered orders for this user (including this one, because order was just updated)
                const { count: deliveredCount, error: countErr } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', oldOrder.user_id)
                    .eq('status', 'delivered');

                if (countErr) {
                    console.error('[LOYALTY] Error counting delivered orders:', countErr);
                } else if (deliveredCount && deliveredCount > 0) {
                    const userEmail = (oldOrder as any).users?.email;
                    const userName = (oldOrder as any).users?.name || 'Cliente';

                    // Fetch loyalty settings from DB
                    // Keys must match the Admin UI (AdminPromos.tsx) — primary keys first, old keys as fallback
                    const { data: settingsData } = await supabase
                        .from('site_settings')
                        .select('key, value')
                        .in('key', [
                            'loyalty_every_5th_bonus_enabled',
                            'loyalty_every_5th_bonus_percent',
                            'loyalty_every_10th_gift_enabled',
                            // Legacy fallback keys (from before UI key unification)
                            'loyalty_order5_bonus_enabled',
                            'loyalty_order5_bonus_percent',
                            'loyalty_order10_gift_enabled',
                        ]);

                    const settings: Record<string, string> = {};
                    settingsData?.forEach(s => (settings[s.key] = s.value));

                    // Primary keys from Admin UI, fallback to legacy keys
                    const order5Enabled =
                        (settings['loyalty_every_5th_bonus_enabled'] ??
                            settings['loyalty_order5_bonus_enabled']) === 'true';
                    const order5Percent =
                        parseInt(
                            settings['loyalty_every_5th_bonus_percent'] ??
                                settings['loyalty_order5_bonus_percent']
                        ) || 5;
                    const order10Enabled =
                        (settings['loyalty_every_10th_gift_enabled'] ??
                            settings['loyalty_order10_gift_enabled']) === 'true';

                    // ───── X% DISCOUNT (Triggered after 4th, 9th, 14th... to be used in 5th, 10th, 15th...) ─────
                    if (order5Enabled && deliveredCount % 5 === 4) {
                        const code = `LOYALTY${order5Percent}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                        await supabase.from('promo_codes').insert({
                            code,
                            discount_percentage: order5Percent,
                            user_id: oldOrder.user_id,
                            is_used: false,
                        });

                        if (userEmail) {
                            const { sendLoyaltyGiftEmail } = await import('../utils/email.js');
                            await sendLoyaltyGiftEmail(userEmail, userName, code, order5Percent);
                            console.log(
                                `[LOYALTY] Sent ${order5Percent}% promo ${code} to ${userEmail} after their ${deliveredCount}th order.`
                            );
                        }
                    }

                    // ───── FREE DESSERT (Triggered after 9th, 19th... to be used in 10th, 20th...) ─────
                    if (order10Enabled && deliveredCount % 10 === 9) {
                        const dessertCode = `DESSERT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

                        // Store dessert code with 0% discount (it's a marker)
                        await supabase.from('promo_codes').insert({
                            code: dessertCode,
                            discount_percentage: 0,
                            user_id: oldOrder.user_id,
                            is_used: false,
                        });

                        if (userEmail) {
                            const { sendDessertGiftEmail } = await import('../utils/email.js');
                            await sendDessertGiftEmail(userEmail, userName, dessertCode);
                            console.log(
                                `[LOYALTY] Sent Dessert promo ${dessertCode} to ${userEmail} after their ${deliveredCount}th order.`
                            );
                        }
                    }
                }
            } catch (err) {
                console.error('[LOYALTY] Failed to process loyalty reward:', err);
            }

            // ───── REFERRAL REWARD: If the user used a REF- code on this order ─────
            if (oldOrder.promo_code && oldOrder.promo_code.startsWith('REF-')) {
                try {
                    const referrerIdFragment = oldOrder.promo_code.split('-')[1]?.trim() || '';
                    if (/^[0-9a-f]{8}$/i.test(referrerIdFragment)) {
                        const prefix = referrerIdFragment.toLowerCase();
                        // Look up the referrer via UUID range scan
                        const { data: referrer } = await supabase
                            .from('users')
                            .select('id, coins_balance')
                            .gte('id', `${prefix}-0000-0000-0000-000000000000`)
                            .lte('id', `${prefix}-ffff-ffff-ffff-ffffffffffff`)
                            .limit(1)
                            .maybeSingle();

                        if (referrer) {
                            // Give 5 Maksim Coins to referrer
                            const newBalance = Number(referrer.coins_balance || 0) + 5;
                            await supabase
                                .from('users')
                                .update({ coins_balance: newBalance })
                                .eq('id', referrer.id);

                            console.log(
                                `[REFERRAL] Awarded 5 Maksim Coins to user ${referrer.id} because their referral code ${oldOrder.promo_code} was used by user ${oldOrder.user_id}`
                            );
                        }
                    }
                } catch (err) {
                    console.error('[REFERRAL] Failed to process referral reward:', err);
                }
            }
        }

        // Realtime Broadcast
        if (order) {
            // User-specific channel
            if (order.user_id) {
                const userChannel = supabase.channel(`user_orders:${order.user_id}`);
                userChannel.subscribe(status => {
                    if (status === 'SUBSCRIBED') {
                        userChannel.send({
                            type: 'broadcast',
                            event: 'order_status_updated',
                            payload: { orderId: order.id, status: order.status },
                        });
                    }
                });
            }

            // Public Tracking channel (Order-specific)
            const orderChannel = supabase.channel(`order_tracking:${order.id}`);
            orderChannel.subscribe(status => {
                if (status === 'SUBSCRIBED') {
                    orderChannel.send({
                        type: 'broadcast',
                        event: 'order_status_updated',
                        payload: { orderId: order.id, status: order.status },
                    });
                }
            });
        }

        // Send Web Push Notification
        if (order && oldOrder && order.status !== oldOrder.status) {
            let pushTitle = 'Pedido actualizado';
            let pushBody = `Tu pedido está ahora: ${order.status}`;

            const isMesa =
                order.delivery_address?.toUpperCase().includes('MESA') ||
                order.delivery_type === 'table';
            const isPickup =
                !isMesa &&
                (order.delivery_type === 'pickup' ||
                    order.delivery_address === 'RECOGIDA' ||
                    (order.notes && order.notes.includes('[TIPO: RECOGIDA EN LOCAL]')));

            if (isMesa) {
                const titleMap: Record<string, string> = {
                    received: 'Pedido recibido',
                    confirmed: 'Pedido confirmado',
                    preparing: 'En preparación',
                    on_the_way: 'Servicio en mesa',
                    delivered: 'Pedido servido',
                    cancelled: 'Pedido cancelado',
                };
                const bodyMap: Record<string, string> = {
                    received: 'Hemos recibido tu pedido para la mesa.',
                    confirmed: 'Tu pedido ha sido confirmado.',
                    preparing: 'Tu pedido ya se está preparando en la cocina.',
                    on_the_way: 'Tu pedido está listo y se está sirviendo.',
                    delivered: '¡Que aproveche!',
                    cancelled: 'Tu pedido de mesa ha sido cancelado.',
                };
                pushTitle = titleMap[order.status] || pushTitle;
                pushBody = bodyMap[order.status] || pushBody;
            } else if (isPickup) {
                const titleMap: Record<string, string> = {
                    received: 'Pedido recibido',
                    confirmed: 'Pedido confirmado',
                    preparing: 'En preparación',
                    on_the_way: '¡Pedido listo!',
                    delivered: 'Pedido entregado',
                    cancelled: 'Pedido cancelado',
                };
                const bodyMap: Record<string, string> = {
                    received: 'Hemos recibido tu pedido para recoger en el local.',
                    confirmed: 'Tu pedido ha sido confirmado.',
                    preparing: 'Tu pedido ya se está preparando en la cocina.',
                    on_the_way: 'Tu pedido está listo y te está esperando en el local.',
                    delivered: '¡Gracias por tu visita! Que aproveche.',
                    cancelled: 'Tu pedido de recogida ha sido cancelado.',
                };
                pushTitle = titleMap[order.status] || pushTitle;
                pushBody = bodyMap[order.status] || pushBody;
            } else {
                // Delivery
                const titleMap: Record<string, string> = {
                    received: 'Pedido recibido',
                    confirmed: 'Pedido confirmado',
                    preparing: 'En preparación',
                    on_the_way: 'Pedido en camino',
                    delivered: 'Pedido entregado',
                    cancelled: 'Pedido cancelado',
                };
                const bodyMap: Record<string, string> = {
                    received: 'Hemos recibido tu pedido a domicilio.',
                    confirmed: 'Tu pedido ha sido confirmado.',
                    preparing: 'Tu pedido ya está en la cocina.',
                    on_the_way: 'El repartidor ya va hacia tu dirección.',
                    delivered: '¡Gracias por tu compra! Que aproveche.',
                    cancelled: 'Tu pedido a domicilio ha sido cancelado.',
                };
                pushTitle = titleMap[order.status] || pushTitle;
                pushBody = bodyMap[order.status] || pushBody;
            }

            import('../utils/push.js')
                .then(({ sendPushNotification }) => {
                    sendPushNotification(order.user_id, pushTitle, pushBody, `/profile`);
                })
                .catch(e => console.error('Error importing push:', e));
        }

        res.json({ order: orderWithItems });
    })
);

// ─── MODULARIZED SUB-ROUTERS (users, stats, promos) ───────────────────────────
router.use(adminUsersRouter);
router.use(adminStatsRouter);
router.use(adminPromosRouter);

// GET /api/admin/reports
router.get(
    '/reports',
    asyncHandler(async (_req: Request, res: Response) => {
        try {
            // Check if we need to generate reports for the last 2 days (failsafe for cron)
            const todayISO = getMadridStartOfDay().toISOString();
            const startOfYesterday = getMadridYesterdayStartOfDay();
            const yesterdayISO = startOfYesterday.toISOString();

            const yesterdayDateStr = startOfYesterday.toLocaleDateString('en-CA', {
                timeZone: 'Europe/Madrid',
            });

            // Is yesterday's report already there?
            const { data: existing } = await supabase
                .from('daily_reports')
                .select('id')
                .eq('date', yesterdayDateStr)
                .maybeSingle();

            if (!existing) {
                // Determine if yesterday was closed
                const [y, m, d] = yesterdayDateStr.split('-').map(Number);
                const yesterdayDayOfWeek = new Date(y, m - 1, d).getDay();
                const isClosed =
                    !BUSINESS_HOURS[yesterdayDayOfWeek] ||
                    BUSINESS_HOURS[yesterdayDayOfWeek].length === 0;

                console.log(`📊 Auto-generating report check for ${yesterdayDateStr}...`);

                const [
                    { data: revenueData },
                    { count: totalOrders },
                    { count: newUsers },
                    { count: cancelledCount },
                    { count: lateCount },
                    { data: invitationData },
                ] = await Promise.all([
                    supabase
                        .from('orders')
                        .select('total')
                        .neq('status', 'cancelled')
                        .gte('created_at', yesterdayISO)
                        .lt('created_at', todayISO),
                    supabase
                        .from('orders')
                        .select('*', { count: 'exact', head: true })
                        .neq('status', 'cancelled')
                        .gte('created_at', yesterdayISO)
                        .lt('created_at', todayISO),
                    supabase
                        .from('users')
                        .select('*', { count: 'exact', head: true })
                        .gte('created_at', yesterdayISO)
                        .lt('created_at', todayISO),
                    supabase
                        .from('orders')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'cancelled')
                        .gte('created_at', yesterdayISO)
                        .lt('created_at', todayISO),
                    supabase
                        .from('orders')
                        .select('*', { count: 'exact', head: true })
                        .eq('discount_sent', true)
                        .gte('created_at', yesterdayISO)
                        .lt('created_at', todayISO),
                    supabase
                        .from('orders')
                        .select('notes')
                        .gte('created_at', yesterdayISO)
                        .lt('created_at', todayISO),
                ]);

                const invitationsCount =
                    invitationData?.filter(o => o.notes && o.notes.includes('[De parte de:'))
                        .length || 0;

                const revenue = revenueData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
                const avg = totalOrders ? revenue / (totalOrders || 1) : 0;

                if (isClosed && !totalOrders) {
                    console.log(
                        `📊 Skipping daily report generation for closed day with 0 orders: ${yesterdayDateStr}`
                    );
                } else {
                    await supabase.from('daily_reports').upsert(
                        {
                            date: yesterdayDateStr,
                            total_revenue: Math.round(revenue * 100) / 100,
                            orders_count: totalOrders || 0,
                            new_users_count: newUsers || 0,
                            avg_ticket: Math.round(avg * 100) / 100,
                            cancelled_count: cancelledCount || 0,
                            late_count: lateCount || 0,
                            invitations_count: invitationsCount || 0,
                        },
                        { onConflict: 'date' }
                    );
                }
            }
        } catch (e) {
            console.error('📊 Error in auto-report check:', e);
            // Non-blocking
        }

        const { data: reports, error } = await supabase
            .from('daily_reports')
            .select('*')
            .order('date', { ascending: false })
            .limit(100);

        if (error) {
            return res.json([]);
        }

        const filteredReports = (reports || []).filter(report => {
            const [y, m, d] = report.date.split('-').map(Number);
            const dayOfWeek = new Date(y, m - 1, d).getDay();
            const isClosed = !BUSINESS_HOURS[dayOfWeek] || BUSINESS_HOURS[dayOfWeek].length === 0;
            return !(isClosed && report.orders_count === 0);
        });

        res.json(filteredReports);
    })
);

// ─── DELIVERY ZONES MANAGEMENT ──────────────────────────────────────────

// GET /api/admin/delivery-zones
router.get(
    '/delivery-zones',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data: zones, error } = await supabase
            .from('delivery_zones')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ zones: (zones || []).map(formatDeliveryZone) });
    })
);

// POST /api/admin/delivery-zones
router.post(
    '/delivery-zones',
    validateResource(createDeliveryZoneSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const {
            name,
            cost,
            minOrder,
            color,
            opacity,
            coordinates,
            isActive,
            type,
            minRadius,
            maxRadius,
        } = req.body;

        const { data: zone, error } = await supabase
            .from('delivery_zones')
            .insert({
                name: name.trim(),
                cost,
                min_order: minOrder || 0,
                free_threshold: null,
                color: color || '#EF4444',
                opacity: opacity || 0.3,
                coordinates: coordinates || [],
                is_active: isActive !== undefined ? isActive : true,
                type: type || (coordinates ? 'polygon' : 'radius'),
                min_radius: minRadius || 0,
                max_radius: maxRadius || 0,
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ zone: formatDeliveryZone(zone) });
    })
);

// PUT /api/admin/delivery-zones/:id
router.put(
    '/delivery-zones/:id',
    validateResource(updateDeliveryZoneSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const {
            name,
            cost,
            minOrder,
            color,
            opacity,
            coordinates,
            isActive,
            type,
            minRadius,
            maxRadius,
        } = req.body;

        const { data: zone, error } = await supabase
            .from('delivery_zones')
            .update({
                name: name?.trim(),
                cost,
                min_order: minOrder,
                free_threshold: null,
                color,
                opacity,
                coordinates,
                is_active: isActive,
                type,
                min_radius: minRadius,
                max_radius: maxRadius,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ zone: formatDeliveryZone(zone) });
    })
);

// DELETE /api/admin/delivery-zones/:id
router.delete(
    '/delivery-zones/:id',
    validateResource(deliveryZoneIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    })
);

// ─── RESERVATIONS MANAGEMENT ───────────────────────────────────────────────

// GET /api/admin/reservations
router.get(
    '/reservations',
    validateResource(getReservationsQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const status = toStr(req.query.status);
        const date = toStr(req.query.date);
        let query = supabase
            .from('reservations')
            .select('*')
            .order('reservation_date', { ascending: false });

        if (status) query = query.eq('status', status);
        if (date) query = query.eq('reservation_date', date);

        const { data: reservations, error } = await query;
        if (error) throw error;
        res.json({ reservations, total: (reservations || []).length });
    })
);

// PATCH /api/admin/reservations/:id
router.patch(
    '/reservations/:id',
    validateResource(updateReservationSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status, notes } = req.body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        const { data: reservation, error } = await supabase
            .from('reservations')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(reservation);
    })
);

// DELETE /api/admin/reservations/:id
router.delete(
    '/reservations/:id',
    validateResource(reservationIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { error } = await supabase.from('reservations').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    })
);

// ─── ABANDONED CARTS ANALYSIS ──────────────────────────────────────────
router.get(
    '/abandoned-carts',
    asyncHandler(async (_req: Request, res: Response) => {
        // 1. Get events from the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: events, error } = await supabase
            .from('site_events')
            .select('*')
            .gte('created_at', sevenDaysAgo)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Map sessions to their state
        const sessions = new Map<string, any>();

        events?.forEach(e => {
            const sid = e.session_id;
            if (!sessions.has(sid)) {
                sessions.set(sid, {
                    sessionId: sid,
                    userId: e.user_id,
                    lastActivity: e.created_at,
                    hasOrdered: false,
                    items: [],
                    contact: { name: '', email: '', phone: '' },
                    events: [],
                });
            }

            const s = sessions.get(sid);
            s.events.push(e);

            // Update userId if found in any event (in case it wasn't in the newest one)
            if (e.user_id && !s.userId) s.userId = e.user_id;

            if (e.event_name === 'order_placed') {
                s.hasOrdered = true;
            }

            if (e.event_name === 'cart_view' && e.metadata?.items) {
                if (s.items.length === 0) s.items = e.metadata.items;
            }

            if (e.event_name === 'delivery_info_filled' && e.metadata) {
                if (!s.contact.email) s.contact.email = e.metadata.guestEmail || '';
                if (!s.contact.phone) s.contact.phone = e.metadata.phone || '';
                if (!s.contact.name) s.contact.name = e.metadata.customerName || '';
            }
        });

        // 2.5 Enrich with User Profile data if logged in
        const userIds = Array.from(sessions.values())
            .map(s => s.userId)
            .filter(Boolean);

        if (userIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, email, phone')
                .in('id', userIds);

            if (usersData) {
                const usersMap = new Map(usersData.map(u => [u.id, u]));
                for (const s of sessions.values()) {
                    if (s.userId) {
                        const profile = usersMap.get(s.userId);
                        if (profile) {
                            // Only overwrite if not already filled by the form
                            if (!s.contact.name) s.contact.name = profile.name || '';
                            if (!s.contact.email) s.contact.email = profile.email || '';
                            if (!s.contact.phone) s.contact.phone = profile.phone || '';
                        }
                    }
                }
            }
        }

        // 3. Filter for abandoned ones (has items/contact but no order)
        const abandoned = Array.from(sessions.values())
            .filter(s => {
                // Ignore test sessions
                if (s.events.some((e: any) => e.metadata?.is_test)) return false;

                return (
                    !s.hasOrdered &&
                    (s.items.length > 0 || (s.contact && (s.contact.phone || s.contact.email)))
                );
            })
            .map(s => {
                // Determine "Stage"
                let stage = 'Cart';
                if (s.contact?.phone || s.contact?.email) stage = 'Contact Info';
                if (s.events.some((e: any) => e.event_name === 'payment_method_selected'))
                    stage = 'Payment';
                if (s.events.some((e: any) => e.event_name === 'delivery_zone_error'))
                    stage = 'Zone Error';

                // Sort events for timeline
                const timeline = s.events
                    .sort(
                        (a: any, b: any) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                    .map((e: any) => ({
                        id: e.id,
                        name: e.event_name,
                        time: e.created_at,
                        metadata: e.metadata,
                    }));

                return {
                    sessionId: s.sessionId,
                    userId: s.userId,
                    lastActivity: s.lastActivity,
                    items: s.items,
                    contact: s.contact,
                    stage,
                    timeline,
                    totalValue: s.items.reduce(
                        (sum: number, i: any) => sum + i.price * i.quantity,
                        0
                    ),
                };
            })
            // Only show those with at least 30 mins of inactivity to be "abandoned"
            .filter(s => {
                const last = new Date(s.lastActivity).getTime();
                const now = Date.now();
                return now - last > 30 * 60 * 1000;
            })
            .sort(
                (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
            );

        res.json({ abandoned, total: abandoned.length });
    })
);

export default router;
