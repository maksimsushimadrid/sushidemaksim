import { Router, Request, Response } from 'express';
import { supabase } from '../../db/supabase.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validateResource } from '../../middleware/validateResource.js';
import { getOrdersSchema, updateOrderStatusSchema } from '../../schemas/order.schema.js';
import { toStr } from '../../utils/queryHelpers.js';
import { formatOrder, calculateUserStats } from '../../utils/helpers.js';

const router = Router();

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
                            const { sendLoyaltyGiftEmail } = await import('../../utils/email.js');
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
                            const { sendDessertGiftEmail } = await import('../../utils/email.js');
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
                userChannel.subscribe(channelStatus => {
                    if (channelStatus === 'SUBSCRIBED') {
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
            orderChannel.subscribe(channelStatus => {
                if (channelStatus === 'SUBSCRIBED') {
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

            import('../../utils/push.js')
                .then(({ sendPushNotification }) => {
                    sendPushNotification(order.user_id, pushTitle, pushBody, `/profile`);
                })
                .catch(e => console.error('Error importing push:', e));
        }

        res.json({ order: orderWithItems });
    })
);

export default router;
