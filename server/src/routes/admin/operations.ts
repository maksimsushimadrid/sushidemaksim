import { Router, Request, Response } from 'express';
import { supabase } from '../../db/supabase.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validateResource } from '../../middleware/validateResource.js';
import { toStr } from '../../utils/queryHelpers.js';
import {
    createDeliveryZoneSchema,
    updateDeliveryZoneSchema,
    deliveryZoneIdParamSchema,
} from '../../schemas/deliveryZone.schema.js';
import {
    getReservationsQuerySchema,
    updateReservationSchema,
    reservationIdParamSchema,
} from '../../schemas/reservation.schema.js';
import {
    getMadridStartOfDay,
    getMadridYesterdayStartOfDay,
    formatDeliveryZone,
} from '../../utils/helpers.js';
import { BUSINESS_HOURS } from '../../utils/storeStatus.js';

const router = Router();

// ─── DAILY REPORTS ────────────────────────────────────────────────────────────

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

// ─── DELIVERY ZONES MANAGEMENT ────────────────────────────────────────────────

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

// ─── RESERVATIONS MANAGEMENT ──────────────────────────────────────────────────

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

// ─── ABANDONED CARTS ANALYSIS ─────────────────────────────────────────────────

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
