import { Router, Request, Response } from 'express';
import { supabase } from '../../db/supabase.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { formatOrder, getMadridStartOfDay, calculateUserStats } from '../../utils/helpers.js';

const router = Router();

// GET /api/admin/stats
router.get(
    '/stats',
    asyncHandler(async (_req: Request, res: Response) => {
        // 1. Basic counts
        const [
            { data: allUsersForStats },
            { count: totalOrders },
            { data: revenueData },
            { count: menuItems },
        ] = await Promise.all([
            supabase.from('users').select('id, orders(id)').eq('role', 'user'),
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

        const totalUsers = allUsersForStats?.length || 0;
        const usersWithOrders =
            allUsersForStats?.filter(u => u.orders && u.orders.length > 0).length || 0;
        const usersWithoutOrders = totalUsers - usersWithOrders;

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

        // 4. Recent orders (with full items and customer details)
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('*, users(name, email, avatar), items:order_items(*)')
            .eq('is_archived', false)
            .order('created_at', { ascending: false })
            .limit(8);

        const recentUserIds = [
            ...new Set((recentOrders || []).filter(o => o.user_id).map(o => o.user_id)),
        ];
        const recentUserStatsMap: Record<string, any> = {};
        if (recentUserIds.length > 0) {
            const { data: usersWithOrders } = await supabase
                .from('users')
                .select(
                    'id, created_at, orders(total, created_at, items:order_items(name, quantity))'
                )
                .in('id', recentUserIds);

            (usersWithOrders || []).forEach((u: any) => {
                const stats = calculateUserStats(u.orders || []);
                recentUserStatsMap[u.id] = {
                    ...stats,
                    name: u.name,
                    email: u.email,
                    avatar: u.avatar,
                    registrationDate: u.created_at,
                };
            });
        }

        const formattedRecent = (recentOrders || []).map((o: any) => {
            const uStats = o.user_id ? recentUserStatsMap[o.user_id] || null : null;
            const formatted = formatOrder(o, uStats);
            if (!formatted) return o;
            return {
                ...formatted,
                user_name: formatted.users?.name || o.customer_name || 'Invitado',
                user_avatar: formatted.users?.avatar || null,
            };
        });

        // 5. Unified Data Processing (Last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [{ data: orders90 }, { data: visits30Data }] = await Promise.all([
            supabase
                .from('orders')
                .select(
                    'id, total, status, created_at, user_id, device_type, os_name, browser_name, delivery_address, promo_code, notes'
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
        const pickupStats = { count: 0, revenue: 0 };
        const localStats = { count: 0, revenue: 0 };
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

                // Areas & Fulfillment type
                const rawAddr = (o.delivery_address || '').trim();
                const notes = o.notes || '';
                const isRecogida =
                    /^recogida/i.test(rawAddr) || /\[TIPO:\s*RECOGIDA\]/i.test(notes);
                const isLocal =
                    /^consume\s+en\s+local/i.test(rawAddr) ||
                    /^mesa/i.test(rawAddr) ||
                    /\[(PEDIDO EN EL LOCAL|TIPO:\s*LOCAL|TIPO:\s*MESA)\]/i.test(notes);

                if (isRecogida) {
                    pickupStats.count++;
                    pickupStats.revenue =
                        Math.round((pickupStats.revenue + Number(o.total)) * 100) / 100;
                } else if (isLocal) {
                    localStats.count++;
                    localStats.revenue =
                        Math.round((localStats.revenue + Number(o.total)) * 100) / 100;
                } else {
                    const area =
                        rawAddr
                            .split(/[,\d]/)[0]
                            .replace(/^(calle|avenida|av|c\/|via|pza|plaza)\s+/i, '')
                            .trim() || 'Centro/Otros';
                    if (!areaMap[area]) areaMap[area] = { count: 0, revenue: 0 };
                    areaMap[area].count++;
                    areaMap[area].revenue =
                        Math.round((areaMap[area].revenue + Number(o.total)) * 100) / 100;
                }

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
            userStats: {
                total: totalUsers,
                withOrders: usersWithOrders,
                withoutOrders: usersWithoutOrders,
            },
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
            pickupStats,
            localStats,
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

export default router;
