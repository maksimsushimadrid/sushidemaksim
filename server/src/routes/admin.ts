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
import {
    updateUserRoleSchema,
    verifyEmailSchema,
    verifyBirthdaySchema,
    getUsersQuerySchema,
    userIdParamSchema,
} from '../schemas/user.schema.js';
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
    createPromoSchema,
    updatePromoSchema,
    promoIdParamSchema,
} from '../schemas/promo.schema.js';
import {
    formatOrder,
    formatAdminMenuItem,
    formatUser,
    getMadridStartOfDay,
    getMadridYesterdayStartOfDay,
    formatDeliveryZone,
    calculateUserStats,
} from '../utils/helpers.js';
import { processImage } from '../utils/imageProcessor.js';
import { invalidateMenuCache } from './menu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage for Multer (Vercel has read-only filesystem)
const upload = multer({ storage: multer.memoryStorage() });

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

        let query = supabase
            .from('orders')
            .select('*, users(name, email, avatar), items:order_items(*)', { count: 'exact' })
            .eq('is_archived', false);

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
            const searchNum = parseInt(search);
            const isUUID = search.includes('-') && search.length > 20;

            if (!isNaN(searchNum) && searchNum.toString() === search) {
                query = query.or(
                    `id.eq.${searchNum},phone_number.ilike.%${search}%,delivery_address.ilike.%${search}%,promo_code.ilike.%${search}%`
                );
            } else if (isUUID) {
                query = query.or(
                    `user_id.eq.${search},phone_number.ilike.%${search}%,delivery_address.ilike.%${search}%,promo_code.ilike.%${search}%`
                );
            } else {
                query = query.or(
                    `phone_number.ilike.%${search}%,delivery_address.ilike.%${search}%,promo_code.ilike.%${search}%`
                );
            }
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
                    const referrerIdFragment = oldOrder.promo_code.split('-')[1];
                    // Look up the referrer
                    const { data: referrer } = await supabase
                        .from('users')
                        .select('id, coins_balance')
                        .ilike('id', `${referrerIdFragment}%`)
                        .single();

                    if (referrer) {
                        // Give 5 Maksim Coins to referrer
                        const newBalance = (referrer.coins_balance || 0) + 5;
                        await supabase
                            .from('users')
                            .update({ coins_balance: newBalance })
                            .eq('id', referrer.id);

                        console.log(
                            `[REFERRAL] Awarded 5 Maksim Coins to user ${referrer.id} because their referral code ${oldOrder.promo_code} was used by user ${oldOrder.user_id}`
                        );
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

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────

// GET /api/admin/users
router.get(
    '/users',
    validateResource(getUsersQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const sortBy = toStr(req.query.sortBy) || 'lastSeenAt';
        const order = toStr(req.query.order) || 'desc';
        const search = toStr(req.query.search);
        const ascending = order === 'asc';
        const filter = toStr(req.query.filter) || 'active';

        const sortMap: Record<string, string> = {
            id: 'id',
            name: 'name',
            email: 'email',
            createdAt: 'created_at',
            lastSeenAt: 'last_seen_at',
            role: 'role',
        };
        const dbSortBy = sortMap[sortBy] || 'last_seen_at';

        let usersWithStats: any[] = [];
        let totalCount = 0;

        // Base query for sorting & counts
        const getBaseQuery = (options = {}) => {
            let q = supabase
                .from('users')
                .select('*, orders(total, created_at, items:order_items(name, quantity))', options);

            if (filter === 'active') {
                q = q.is('deleted_at', null);
            } else if (filter === 'archived') {
                q = q.not('deleted_at', 'is', null);
            }

            return q;
        };

        if (sortBy === 'orderCount' || sortBy === 'totalSpent') {
            // Complex sort: Fetch all users and their order totals, then sort and paginate in memory
            let query = getBaseQuery();

            if (search) {
                const isUUID = search.includes('-') && search.length > 20;

                if (isUUID) {
                    query = query.eq('id', search);
                } else {
                    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
                }
            }

            const { data: allUsers, error: allUsersError } = await query;

            if (allUsersError) throw allUsersError;

            const allUsersWithStats = (allUsers || []).map((u: any) => ({
                ...u,
                orderCount: u.orders?.length || 0,
                totalSpent:
                    Math.round(
                        (u.orders?.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0) ||
                            0) * 100
                    ) / 100,
            }));

            // In-memory sort
            allUsersWithStats.sort((a, b) => {
                const valA = a[sortBy];
                const valB = b[sortBy];
                if (valA === valB) return 0;
                return ascending ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
            });

            totalCount = allUsersWithStats.length;
            usersWithStats = allUsersWithStats.slice(offset, offset + limit).map(u => {
                const stats = calculateUserStats(u.orders || []);
                return formatUser(
                    u,
                    stats.orderCount,
                    u.addresses,
                    stats.totalSpent,
                    stats.avgCheck,
                    stats.frequency,
                    stats.favoriteDish
                );
            });
        } else {
            // Direct sort via Supabase
            let query = getBaseQuery({ count: 'exact' });

            if (search) {
                const isUUID = search.includes('-') && search.length > 20;

                if (isUUID) {
                    query = query.eq('id', search);
                } else {
                    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
                }
            }

            if (sortBy === 'role') {
                // Roles sort: superadmin -> admin -> user
                query = query
                    .order('is_superadmin', { ascending: ascending })
                    .order('role', { ascending: !ascending });
            } else {
                query = query.order(dbSortBy, { ascending: ascending, nullsFirst: false });
            }

            const { data: users, count, error } = await query.range(offset, offset + limit - 1);
            if (error) throw error;

            totalCount = count || 0;
            usersWithStats = (users || []).map((u: any) => {
                const stats = calculateUserStats(u.orders || []);
                return formatUser(
                    u,
                    stats.orderCount,
                    u.addresses,
                    stats.totalSpent,
                    stats.avgCheck,
                    stats.frequency,
                    stats.favoriteDish
                );
            });
        }

        res.json({
            users: usersWithStats,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1,
            },
        });
    })
);

// PATCH /api/admin/users/:id/role
router.patch(
    '/users/:id/role',
    validateResource(updateUserRoleSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);

        const { data: currentUser } = await supabase
            .from('users')
            .select('is_superadmin')
            .eq('id', req.userId)
            .single();

        if (!currentUser || !currentUser.is_superadmin) {
            return res.status(403).json({ error: 'Solo el propietario can change roles' });
        }

        if (id === req.userId) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }

        const { role } = req.body;
        const { data: user, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', req.params.id)
            .select('id, name, email, role, is_superadmin')
            .single();

        if (error) throw error;
        res.json({ user });
    })
);

// PATCH /api/admin/users/:id/verify-email
router.patch(
    '/users/:id/verify-email',
    validateResource(verifyEmailSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { isVerified } = req.body;

        const { error } = await supabase
            .from('users')
            .update({ is_verified: isVerified })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    })
);

// DELETE /api/admin/users/:id — Permanent hard delete (Admin only)
router.delete(
    '/users/:id',
    validateResource(userIdParamSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);

        if (id === req.userId) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        // Check current status
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('deleted_at')
            .eq('id', id)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (user.deleted_at) {
            // Already archived -> Perform HARD DELETE
            console.log(`⚠️  [ADMIN] Hard deleting user #${id} and all related data...`);

            // 1. Get all order IDs to delete order items
            const { data: orders } = await supabase.from('orders').select('id').eq('user_id', id);
            const orderIds = (orders || []).map(o => o.id);

            // 2. Cascade deletion (in order of dependencies)
            const cascadePromises = [
                // Delete order items first
                orderIds.length > 0
                    ? supabase.from('order_items').delete().in('order_id', orderIds)
                    : Promise.resolve(),
                // Delete other direct dependencies
                supabase.from('orders').delete().eq('user_id', id),
                supabase.from('user_addresses').delete().eq('user_id', id),
                supabase.from('promo_codes').delete().eq('user_id', id),
                supabase.from('cart_items').delete().eq('user_id', id),
                supabase.from('user_favorites').delete().eq('user_id', id),
                supabase.from('password_resets').delete().eq('user_id', id),
            ];

            await Promise.all(cascadePromises);

            // 3. Delete the user itself from public schema
            const { error: finalError } = await supabase.from('users').delete().eq('id', id);
            if (finalError) throw finalError;

            // 4. Delete from auth.users (so they can register again)
            const { error: authError } = await supabase.auth.admin.deleteUser(id);
            if (authError) {
                console.warn(
                    `[ADMIN] Could not delete user #${id} from Auth (maybe already gone):`,
                    authError.message
                );
            } else {
                console.log(`✅ [ADMIN] User #${id} fully removed from Auth.`);
            }

            return res.json({
                success: true,
                message: `Usuario #${id} y todos los datos relacionados han sido eliminados permanentemente`,
            });
        }

        // Soft Delete (Archive)
        const { error } = await supabase
            .from('users')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: `Usuario #${id} archivado correctamente` });
    })
);

// PATCH /api/admin/users/:id/restore — Restore archived user
router.patch(
    '/users/:id/restore',
    validateResource(userIdParamSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);
        const { error } = await supabase.from('users').update({ deleted_at: null }).eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: `Usuario #${id} restaurado correctamente` });
    })
);

// PATCH /api/admin/users/:id/verify-birthday
router.patch(
    '/users/:id/verify-birthday',
    validateResource(verifyBirthdaySchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);
        const { verified } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .update({ birth_date_verified: verified })
            .eq('id', id)
            .select('id, name, email, birth_date, birth_date_verified')
            .single();

        if (error) throw error;
        res.json({ user });
    })
);

// ─── STATS ────────────────────────────────────────────────────────────────────

router.get(
    '/stats',
    asyncHandler(async (_req: Request, res: Response) => {
        // 1. Basic counts
        const [
            { count: totalUsers },
            { count: totalOrders },
            { data: revenueData },
            { count: menuItems },
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
            supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('is_archived', false),
            supabase
                .from('orders')
                .select('total')
                .neq('status', 'cancelled')
                .eq('is_archived', false),
            supabase.from('menu_items').select('*', { count: 'exact', head: true }),
        ]);

        const revenue =
            Math.round((revenueData?.reduce((sum, o) => sum + Number(o.total), 0) || 0) * 100) /
            100;

        // 2. Today metrics (Madrid reset at 0:00)
        const todayISO = getMadridStartOfDay().toISOString();

        const [
            { data: revTodayData },
            { count: ordersToday },
            { count: pendingOrders },
            { count: usersToday },
            { data: missedRevData },
            { data: visitsTodayData },
        ] = await Promise.all([
            supabase
                .from('orders')
                .select('total')
                .neq('status', 'cancelled')
                .eq('is_archived', false)
                .gte('created_at', todayISO),
            supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('is_archived', false)
                .gte('created_at', todayISO),
            supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('is_archived', false)
                .in('status', ['pending', 'received']), // Count both as pending attention
            supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayISO),
            supabase
                .from('missed_revenue_stats')
                .select('missed_revenue')
                .gte('day', todayISO)
                .single(),
            supabase
                .from('site_events')
                .select('session_id')
                .eq('event_name', 'page_view')
                .gte('created_at', todayISO),
        ]);

        const revenueToday =
            Math.round((revTodayData?.reduce((sum, o) => sum + Number(o.total), 0) || 0) * 100) /
            100;

        const missedRevenueToday =
            Math.round(Number(missedRevData?.missed_revenue || 0) * 100) / 100;

        const visitsToday = new Set(visitsTodayData?.map(v => v.session_id) || []).size;

        // 3. Status breakdown
        const { data: statusData } = await supabase
            .from('orders')
            .select('status')
            .eq('is_archived', false);
        const ordersByStatus: Record<string, number> = {};
        statusData?.forEach(o => {
            ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        });

        // 4. Recent orders (still 5 recent orders)
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('id, total, status, created_at, users(name, avatar)')
            .eq('is_archived', false)
            .order('created_at', { ascending: false })
            .limit(5);

        const formattedRecent = (recentOrders || []).map((o: any) => ({
            ...o,
            user_name: o.users?.name,
            user_avatar: o.users?.avatar,
        }));

        // 5. Unified Data Processing (Last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [{ data: orders90 }, { data: visits30Data }] = await Promise.all([
            supabase
                .from('orders')
                .select(
                    'id, total, status, created_at, user_id, device_type, os_name, browser_name, delivery_address, promo_code'
                )
                .eq('is_archived', false)
                .gte('created_at', thirtyDaysAgo),
            supabase
                .from('site_events')
                .select('session_id')
                .eq('event_name', 'page_view')
                .gte('created_at', thirtyDaysAgo),
        ]);

        const visits30 = new Set(visits30Data?.map(v => v.session_id) || []).size;

        const [{ data: allPromoCodes }, { data: activePromos }] = await Promise.all([
            supabase.from('promo_codes').select('code, is_used'),
            supabase.from('promos').select('*').order('sort_order', { ascending: true }),
        ]);

        const promoCodesStats: Record<string, { generated: number; used: number }> = {};
        allPromoCodes?.forEach(pc => {
            if (!pc.code) return;
            const uc = pc.code.toUpperCase();
            let key = 'custom';
            if (uc.startsWith('NUEVO10') || uc.startsWith('NUEVO5')) {
                key = 'welcome';
            } else if (uc.startsWith('LOYALTY')) {
                key = 'loyalty_bonus';
            } else if (uc.startsWith('DESSERT')) {
                key = 'loyalty_gift';
            } else if (uc.startsWith('SPECIAL')) {
                key = 'special';
            }
            if (!promoCodesStats[key]) {
                promoCodesStats[key] = { generated: 0, used: 0 };
            }
            promoCodesStats[key].generated++;
            if (pc.is_used) {
                promoCodesStats[key].used++;
            }
        });

        const orderIds90 = (orders90 || []).filter(o => o.status !== 'cancelled').map(o => o.id);

        let items90: any[] = [];
        if (orderIds90.length > 0) {
            const { data: itemsData } = await supabase
                .from('order_items')
                .select('order_id, name, quantity, price_at_time, menu_items(category, cost_price)')
                .in('order_id', orderIds90);
            items90 = itemsData || [];
        }

        // --- Accumulators ---
        const hourlyDistribution = Array(24).fill(0);
        const dailyDistribution = Array(7).fill(0);
        const heatmapMatrix = Array(7)
            .fill(0)
            .map(() => Array(24).fill(0));

        const dailyStats: Record<string, { date: string; revenue: number; orders: number }> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            dailyStats[d] = { date: d, revenue: 0, orders: 0 };
        }

        const analytics = {
            devices: {} as Record<string, number>,
            os: {} as Record<string, number>,
            browsers: {} as Record<string, number>,
        };

        const itemMap90: Record<string, { name: string; sold: number; revenue: number }> = {};
        const areaMap: Record<string, { count: number; revenue: number }> = {};
        const orderSubtotals: Record<string, number> = {};
        const categoryMap: Record<string, { total: number; count: number }> = {};
        let totalProfit = 0;

        // 1. Process Items
        items90.forEach(item => {
            const rev = item.quantity * item.price_at_time;
            orderSubtotals[item.order_id] = (orderSubtotals[item.order_id] || 0) + rev;

            // ABC Accumulation
            if (!itemMap90[item.name])
                itemMap90[item.name] = { name: item.name, sold: 0, revenue: 0 };
            itemMap90[item.name].sold += item.quantity;
            itemMap90[item.name].revenue += rev;

            // Profit Accumulation
            const cost = (item as any).menu_items?.cost_price || 0;
            totalProfit += rev - item.quantity * cost;

            // Category Accumulation
            const cat = item.menu_items?.category || 'Otros';
            if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
            categoryMap[cat].total = Math.round((categoryMap[cat].total + rev) * 100) / 100;
            categoryMap[cat].count += item.quantity;
        });

        // 2. Process Orders
        let newUsers30 = 0;
        let returningUsers30 = 0;
        const seenUsers = new Set();
        let promoCount = 0;
        let totalDiscount = 0;
        let promoRevenue = 0;
        let totalRevenue30 = 0;
        let totalOrders30 = 0;

        const campaignsMap: Record<
            string,
            {
                key: string;
                code: string;
                uses: number;
                totalDiscount: number;
                totalRevenue: number;
            }
        > = {};

        const individualCodesMap: Record<
            string,
            {
                code: string;
                uses: number;
                totalDiscount: number;
                totalRevenue: number;
            }
        > = {};

        orders90?.forEach(o => {
            const date = new Date(o.created_at);
            const isoDate = date.toISOString().split('T')[0];
            const isWithin30 = o.created_at >= thirtyDaysAgo;

            if (o.status !== 'cancelled') {
                totalOrders30++;
                totalRevenue30 += Number(o.total);

                // Heatmaps
                const hour = date.getHours();
                const day = date.getDay();
                hourlyDistribution[hour]++;
                dailyDistribution[day]++;
                heatmapMatrix[day][hour]++;

                // Areas
                const area =
                    o.delivery_address
                        ?.split(/[,\d]/)[0]
                        .replace(/^(calle|avenida|av|c\/|via|pza|plaza)\s+/i, '')
                        .trim() || 'Centro/Otros';
                if (!areaMap[area]) areaMap[area] = { count: 0, revenue: 0 };
                areaMap[area].count++;
                areaMap[area].revenue =
                    Math.round((areaMap[area].revenue + Number(o.total)) * 100) / 100;

                // Promo Detection & Accumulation
                const subtotal = orderSubtotals[o.id] || 0;
                const discount =
                    subtotal > 0 && Number(o.total) < subtotal - 0.5
                        ? subtotal - Number(o.total)
                        : 0;
                const hasPromo = !!o.promo_code || discount > 0;

                if (hasPromo) {
                    promoCount++;
                    totalDiscount += discount;
                    promoRevenue += Number(o.total);

                    let promoKey = 'manual';
                    let displayCode = o.promo_code || 'Manual';

                    if (o.promo_code) {
                        const uc = o.promo_code.toUpperCase();
                        if (uc.startsWith('NUEVO10') || uc.startsWith('NUEVO5')) {
                            promoKey = 'welcome';
                            displayCode = uc.split('-')[0];
                        } else if (uc.startsWith('LOYALTY')) {
                            promoKey = 'loyalty_bonus';
                            displayCode = uc.split('-')[0];
                        } else if (uc.startsWith('DESSERT')) {
                            promoKey = 'loyalty_gift';
                            displayCode = uc.split('-')[0];
                        } else if (uc.startsWith('REF-')) {
                            promoKey = 'referral';
                            displayCode = 'REFERRAL';
                        } else if (uc.startsWith('SPECIAL')) {
                            promoKey = 'special';
                            displayCode = uc.split('-')[0];
                        } else {
                            promoKey = 'custom';
                            displayCode = uc;
                        }
                    }

                    const mapKey = `${promoKey}_${displayCode}`;
                    if (!campaignsMap[mapKey]) {
                        campaignsMap[mapKey] = {
                            key: promoKey,
                            code: displayCode,
                            uses: 0,
                            totalDiscount: 0,
                            totalRevenue: 0,
                        };
                    }
                    campaignsMap[mapKey].uses++;
                    campaignsMap[mapKey].totalDiscount += discount;
                    campaignsMap[mapKey].totalRevenue += Number(o.total);

                    // Track individual codes breakdown
                    if (o.promo_code) {
                        const codeKey = o.promo_code.toUpperCase();
                        if (!individualCodesMap[codeKey]) {
                            individualCodesMap[codeKey] = {
                                code: codeKey,
                                uses: 0,
                                totalDiscount: 0,
                                totalRevenue: 0,
                            };
                        }
                        individualCodesMap[codeKey].uses++;
                        individualCodesMap[codeKey].totalDiscount += discount;
                        individualCodesMap[codeKey].totalRevenue += Number(o.total);
                    }
                }

                // Growth
                if (isWithin30 && dailyStats[isoDate]) {
                    dailyStats[isoDate].revenue =
                        Math.round((dailyStats[isoDate].revenue + Number(o.total)) * 100) / 100;
                    dailyStats[isoDate].orders += 1;
                }
            }

            // Retention (30d)
            if (isWithin30 && o.user_id) {
                if (seenUsers.has(o.user_id)) returningUsers30++;
                else {
                    newUsers30++;
                    seenUsers.add(o.user_id);
                }
            }

            // Analytics
            analytics.devices[o.device_type || 'Unknown'] =
                (analytics.devices[o.device_type || 'Unknown'] || 0) + 1;
            analytics.os[o.os_name || 'Unknown'] = (analytics.os[o.os_name || 'Unknown'] || 0) + 1;
            analytics.browsers[o.browser_name || 'Unknown'] =
                (analytics.browsers[o.browser_name || 'Unknown'] || 0) + 1;
        });

        // 3. Final Formats
        const totalRev90 = Object.values(itemMap90).reduce((s, i) => s + i.revenue, 0);
        let currentShareSum = 0;
        const abcAnalysis = Object.values(itemMap90)
            .sort((a, b) => b.revenue - a.revenue)
            .map(item => {
                currentShareSum += item.revenue;
                const cumulativeShare = currentShareSum / (totalRev90 || 1);
                let category = 'C';
                if (cumulativeShare <= 0.8) category = 'A';
                else if (cumulativeShare <= 0.95) category = 'B';
                return {
                    ...item,
                    revenue: Math.round(item.revenue * 100) / 100,
                    category,
                    revenueShare: Math.round((item.revenue / (totalRev90 || 1)) * 10000) / 100,
                };
            });

        const areaStats = Object.entries(areaMap)
            .map(([name, data]) => ({
                name,
                ...data,
                revenue: Math.round(data.revenue * 100) / 100,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8);

        const categoryStats = Object.entries(categoryMap).map(([name, data]) => ({
            name,
            avgPrice: Math.round((data.total / data.count) * 100) / 100,
            revenue: Math.round(data.total * 100) / 100,
        }));

        const growth = Object.values(dailyStats);

        // --- 4. ADVANCED ENGAGEMENT (Favorites & Shares) ---
        const [{ data: favoriteData, error: favError }, { data: shareData, error: shareError }] =
            await Promise.all([
                supabase.from('user_favorites').select('menu_item_id'),
                supabase
                    .from('menu_item_analytics')
                    .select('menu_item_id')
                    .eq('event_type', 'share'),
            ]);

        if (favError) console.error('📊 Error fetching favorites stats:', favError.message);
        if (shareError)
            console.error('📊 Error fetching analytics (share) stats:', shareError.message);

        const favoriteCounts: Record<number, number> = {};
        favoriteData?.forEach(f => {
            favoriteCounts[f.menu_item_id] = (favoriteCounts[f.menu_item_id] || 0) + 1;
        });

        const shareCounts: Record<number, number> = {};
        shareData?.forEach(s => {
            shareCounts[s.menu_item_id] = (shareCounts[s.menu_item_id] || 0) + 1;
        });

        const { data: menuInfo } = await supabase.from('menu_items').select('id, name');
        const menuNames = (menuInfo || []).reduce((acc: any, item: any) => {
            acc[item.id] = item.name;
            return acc;
        }, {});

        const topFavorited = Object.entries(favoriteCounts)
            .map(([id, count]) => ({ id: Number(id), name: menuNames[id] || `ID ${id}`, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const topShared = Object.entries(shareCounts)
            .map(([id, count]) => ({ id: Number(id), name: menuNames[id] || `ID ${id}`, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const campaignsList = Object.values(campaignsMap)
            .map(c => ({
                ...c,
                totalDiscount: Math.round(c.totalDiscount * 100) / 100,
                totalRevenue: Math.round(c.totalRevenue * 100) / 100,
                avgDiscount: c.uses > 0 ? Math.round((c.totalDiscount / c.uses) * 100) / 100 : 0,
                avgCheck: c.uses > 0 ? Math.round((c.totalRevenue / c.uses) * 100) / 100 : 0,
            }))
            .sort((a, b) => b.uses - a.uses);

        const individualCodesList = Object.values(individualCodesMap)
            .map(c => ({
                ...c,
                totalDiscount: Math.round(c.totalDiscount * 100) / 100,
                totalRevenue: Math.round(c.totalRevenue * 100) / 100,
                avgDiscount: c.uses > 0 ? Math.round((c.totalDiscount / c.uses) * 100) / 100 : 0,
                avgCheck: c.uses > 0 ? Math.round((c.totalRevenue / c.uses) * 100) / 100 : 0,
            }))
            .sort((a, b) => b.uses - a.uses);

        // Prune site events older than 90 days in the background to avoid database bloating
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        supabase
            .from('site_events')
            .delete()
            .lt('created_at', ninetyDaysAgo)
            .then(({ error }) => {
                if (error) console.error('📊 Error pruning old site events:', error.message);
            });

        res.json({
            revenueToday,
            ordersToday,
            pendingOrders,
            usersToday,
            missedRevenueToday,
            visitsToday,
            visits30,
            topFavorited,
            topShared,
            stats: {
                totalUsers,
                totalOrders,
                revenue,
                menuItems,
            },
            ordersByStatus,
            recentOrders: formattedRecent,
            topItems: abcAnalysis.slice(0, 10),
            analytics,
            heatmap: {
                hourly: hourlyDistribution,
                daily: dailyDistribution,
                matrix: heatmapMatrix,
            },
            growth,
            retention: {
                new: newUsers30,
                returning: returningUsers30,
            },
            ltv: (totalUsers || 0) > 0 ? Math.round((revenue / (totalUsers || 1)) * 100) / 100 : 0,
            categoryStats,
            abcAnalysis,
            areaStats,
            promoStats: {
                count: promoCount,
                totalDiscount: Math.round(totalDiscount * 100) / 100,
                avgDiscount:
                    promoCount > 0 ? Math.round((totalDiscount / promoCount) * 100) / 100 : 0,
                promoRevenue: Math.round(promoRevenue * 100) / 100,
                totalRevenue30: Math.round(totalRevenue30 * 100) / 100,
                totalOrders30,
                campaigns: campaignsList,
                individualCodes: individualCodesList,
                codesStats: promoCodesStats,
                banners: activePromos || [],
            },
            estimatedMargin: revenue > 0 ? Math.round((totalProfit / revenue) * 100) : 0,
            estimatedMarkup:
                revenue - totalProfit > 0
                    ? Math.round((totalProfit / (revenue - totalProfit)) * 100)
                    : 0,
        });
    })
);

// ─── PROMOS MANAGEMENT ────────────────────────────────────────────────────────
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
                // Generate it now!
                console.log(`📊 Auto-generating report for ${yesterdayDateStr}...`);

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
        res.json(reports || []);
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

// GET /api/admin/promo-codes
router.get(
    '/promo-codes',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data: promoCodes, error } = await supabase
            .from('promo_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching promo codes:', error);
            return res.status(500).json({ error: 'Failed to fetch promo codes' });
        }

        res.json({ promoCodes });
    })
);

// POST /api/admin/promo-codes/generate-special
router.post(
    '/promo-codes/generate-special',
    asyncHandler(async (req: AuthRequest, res: Response) => {
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
