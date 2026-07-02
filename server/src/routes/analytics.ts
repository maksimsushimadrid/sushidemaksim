import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateResource } from '../middleware/validateResource.js';
import {
    trackEventSchema,
    waiterOrderSchema,
    funnelEventSchema,
} from '../schemas/analytics.schema.js';
import { supabase } from '../db/supabase.js';

const router = Router();

/**
 * Endpoint to record generic site events for analytics.
 * Supports different types of events stored in 'site_events' table.
 */
router.post(
    '/track',
    validateResource(trackEventSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { eventName, sessionId, userId, path, metadata } = req.body;

        // Only save high-value events to keep the database size small and avoid Vercel limits.
        // We only save 'page_view' to count site visits, and 'order_placed' to track success.
        // High-frequency interactions like user_idle, clicks, and form focus are discarded.
        const allowedEvents = ['page_view', 'order_placed'];
        if (allowedEvents.includes(eventName)) {
            const payload: any = {
                event_name: eventName,
                session_id: sessionId,
                path: path || null,
                metadata: metadata || {},
                user_id: userId || null,
            };

            const { error: siteError } = await supabase.from('site_events').insert(payload);

            if (siteError) {
                console.error('❌ Supabase Generic Analytics Error:', (siteError as any).message);
            }
        }

        // 2. Compatibility: If it's a funnel event, also potentially write to legacy funnel_events table
        // 'cart_view' and 'checkout_start' are removed to stop gathering abandonment data per request
        const funnelSteps: string[] = ['order_placed'];
        if (funnelSteps.includes(eventName)) {
            const funnelPayload: any = {
                session_id: sessionId,
                step: eventName,
                total_value: Number(metadata?.totalValue) || 0,
                items_count: Number(metadata?.itemsCount) || 0,
                metadata: metadata || {},
                user_id: userId || null,
            };
            await supabase.from('funnel_events').insert(funnelPayload);
        }

        res.status(201).json({ success: true });
    })
);

// Record an order taken by a waiter in the restaurant
router.post(
    '/waiter-order',
    validateResource(waiterOrderSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { items, totalValue, itemsCount, waiterId, metadata = {} } = req.body;

        const waiterSessionId = `waiter-${waiterId || 'anonymous'}-${Date.now()}`;

        // 1. Create a REAL order in the orders table
        // 1. Create a REAL order in the orders table
        // We add [PEDIDO EN EL LOCAL] to the notes to make it visible in admin
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: null,
                total: totalValue,
                delivery_address: 'Consume en local',
                phone_number: 'Waiter Interface',
                status: 'pending',
                notes: `[PEDIDO EN EL LOCAL] Mesa: ${metadata.table || 'S/N'} | Atendido por: ${waiterId || 'Camarero'}${metadata.comment ? ` | Nota: ${metadata.comment}` : ''}`,
                estimated_delivery_time: 'En sala',
                device_type: 'mobile',
                os_name: 'WaiterApp',
            })
            .select()
            .single();

        if (orderError) {
            console.error('❌ Supabase Waiter Order Error:', orderError.message);
            return res.status(500).json({ error: orderError.message });
        }

        // 2. Create Order Items linkage
        if (order && items && Array.isArray(items)) {
            const orderItems = items.map(item => ({
                order_id: order.id,
                menu_item_id: item.id,
                name: item.name,
                quantity: item.quantity,
                price_at_time: item.price,
                image: item.image || '',
                selected_option: item.selected_option || '',
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

            if (itemsError) {
                console.error('❌ Supabase Waiter Order Items Error:', itemsError.message);
            }
        }

        // 3. Record in generic site_events table for analytics
        const sitePayload: any = {
            event_name: 'waiter_order_submitted',
            session_id: waiterSessionId,
            path: '/waiter',
            metadata: {
                ...metadata,
                order_id: order?.id,
                total_value: totalValue,
                items_count: itemsCount,
                items,
                source: 'waiter_interface',
                label: 'Pedido en el local',
            },
            user_id: waiterId || null,
        };

        await supabase.from('site_events').insert(sitePayload);

        // 4. Record in funnel_events
        const waiterFunnelPayload: any = {
            session_id: waiterSessionId,
            step: 'order_placed',
            total_value: Number(totalValue) || 0,
            items_count: Number(itemsCount) || 0,
            metadata: { ...metadata, source: 'waiter_interface', order_id: order?.id },
            user_id: waiterId || null,
        };

        await supabase.from('funnel_events').insert(waiterFunnelPayload);

        res.status(201).json({ success: true, orderId: order?.id });
    })
);

// Deprecated old endpoint for compatibility during migration
router.post(
    '/funnel',
    validateResource(funnelEventSchema),
    asyncHandler(async (req: Request, res: Response) => {
        // Analytics tracking is temporarily disabled by owner request
        return res.status(200).json({
            success: true,
            message: 'Tracking is temporarily disabled',
        });

        const { sessionId, step, totalValue, itemsCount, metadata, userId } = req.body;
        await supabase.from('funnel_events').insert({
            session_id: sessionId,
            step,
            total_value: totalValue,
            items_count: itemsCount,
            metadata: metadata || {},
            user_id: userId || null,
        });
        res.status(201).json({ success: true });
    })
);

export default router;
