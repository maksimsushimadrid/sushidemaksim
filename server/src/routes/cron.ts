import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { config } from '../config.js';
import { getMadridStartOfDay, getMadridYesterdayStartOfDay } from '../utils/helpers.js';
import { sendBirthdayGiftEmail, sendUnconfirmedReminderEmail } from '../utils/email.js';

const router = Router();

// This route will be called by a CRON job (e.g. Vercel Cron or GitHub Action)
// It should be protected by an API key or a secret header

// CRON job to check birthdays and send 10% discount codes (1 week before and day of)
router.post('/check-birthdays', async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'];
    const authHeader = req.headers['authorization'];
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET && !isVercelCron) {
        return res.status(200).json({ success: false, error: 'Unauthorized (Silent)' });
    }

    try {
        // Fetch birthday settings
        const { data: settingsData } = await supabase
            .from('site_settings')
            .select('key, value')
            .in('key', ['loyalty_birthday_bonus_enabled', 'loyalty_birthday_bonus_percent']);

        const settings: Record<string, string> = {};
        settingsData?.forEach(s => (settings[s.key] = s.value));

        const bdayEnabled = settings['loyalty_birthday_bonus_enabled'] === 'true';
        const bdayPercent = parseInt(settings['loyalty_birthday_bonus_percent']) || 10;

        if (!bdayEnabled) {
            return res.json({ success: true, message: 'Birthday rewards are disabled' });
        }

        const { data: users } = await supabase
            .from('users')
            .select('id, email, name, birth_date')
            .not('birth_date', 'is', null);

        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();

        const weekMonth = nextWeek.getMonth() + 1;
        const weekDay = nextWeek.getDate();

        const results = [];

        for (const user of users || []) {
            const bDate = new Date(user.birth_date);
            const bMonth = bDate.getMonth() + 1;
            const bDay = bDate.getDate();

            let type = '';
            if (bMonth === todayMonth && bDay === todayDay) type = 'day-of';
            else if (bMonth === weekMonth && bDay === weekDay) type = 'week-before';

            if (type) {
                // Generate a one-time promo code
                const code = `BDAY${bdayPercent}-${user.id.substring(0, 4).toUpperCase()}-${type === 'day-of' ? 'HOY' : 'WEEK'}`;

                // Ensure duplicate code is not created accidentally (simple check)
                const { data: existing } = await supabase
                    .from('promo_codes')
                    .select('id')
                    .eq('code', code)
                    .maybeSingle();

                if (!existing) {
                    await supabase.from('promo_codes').insert({
                        code,
                        discount_percentage: bdayPercent,
                        user_id: user.id,
                        is_used: false,
                    });

                    results.push({
                        userId: user.id,
                        email: user.email,
                        code,
                        type,
                    });

                    try {
                        await sendBirthdayGiftEmail(user.email, user.name, code, bdayPercent);
                        console.log(
                            `📧 CRON (Birthday): Send email to ${user.email} -> Feliz Cumpleaños! Tu código es ${code} (${bdayPercent}%).`
                        );
                    } catch (emailErr) {
                        console.error(
                            `❌ CRON (Birthday): Failed to send email to ${user.email}:`,
                            emailErr
                        );
                    }
                }
            }
        }

        res.json({ success: true, processed: results.length, notifications: results });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Daily report generation (to be called at ~0:05 AM)
router.post('/generate-daily-report', async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'];
    const authHeader = req.headers['authorization'];
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET && !isVercelCron) {
        return res.status(200).json({ success: false, error: 'Unauthorized (Silent)' });
    }

    try {
        const startOfToday = getMadridStartOfDay();
        const startOfYesterday = getMadridYesterdayStartOfDay();

        const yesterdayISO = startOfYesterday.toISOString();
        const todayISO = startOfToday.toISOString();

        // 1. Fetch yesterday's metrics
        const [
            { data: revenueData },
            { count: totalOrders },
            { count: newUsers },
            { count: cancelledCount },
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
                .select('notes')
                .gte('created_at', yesterdayISO)
                .lt('created_at', todayISO),
        ]);

        const invitationsCount =
            invitationData?.filter(o => o.notes && o.notes.includes('[De parte de:')).length || 0;

        const revenue = revenueData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
        const avg = totalOrders ? revenue / (totalOrders || 1) : 0;

        // 2. Insert Report
        const reportDate = startOfYesterday.toLocaleDateString('en-CA', {
            timeZone: 'Europe/Madrid',
        });
        const { error: reportError } = await supabase.from('daily_reports').upsert(
            {
                date: reportDate,
                total_revenue: Math.round(revenue * 100) / 100,
                orders_count: totalOrders || 0,
                new_users_count: newUsers || 0,
                avg_ticket: Math.round(avg * 100) / 100,
                cancelled_count: cancelledCount || 0,
                invitations_count: invitationsCount || 0,
            },
            { onConflict: 'date' }
        );

        if (reportError) {
            // If table doesn't exist yet, we catch it but don't crash
            console.warn('⚠️ Could not save daily report - check if table "daily_reports" exists.');
        }

        res.json({ success: true, date: reportDate, revenue, orders: totalOrders });
    } catch (e: any) {
        console.error('❌ Daily report cron error:', e);
        res.status(500).json({ error: e.message });
    }
});

// CRON job to permanently delete accounts marked for deletion > 30 days ago
router.post('/cleanup-deleted-users', async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'];
    const authHeader = req.headers['authorization'];
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET && !isVercelCron) {
        return res.status(200).json({ success: false, error: 'Unauthorized (Silent)' });
    }

    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Find users to delete
        const { data: usersToDelete, error: findError } = await supabase
            .from('users')
            .select('id')
            .lt('deleted_at', thirtyDaysAgo);

        if (findError) throw findError;

        const results = [];
        if (usersToDelete && usersToDelete.length > 0) {
            for (const user of usersToDelete) {
                // Delete related
                const tables = ['user_addresses', 'user_favorites', 'orders', 'promo_codes'];
                for (const table of tables) {
                    await supabase.from(table).delete().eq('user_id', user.id);
                }

                // Delete user
                const { error: delError } = await supabase.from('users').delete().eq('id', user.id);

                if (!delError) results.push(user.id);
            }
        }

        res.json({ success: true, permanentlyDeleted: results.length, ids: results });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// CRON job to check for abandoned carts (> 24h) and send reminders (DISABLED)
router.post('/check-abandoned-carts', async (req, res) => {
    res.json({ success: true, message: 'Abandoned cart reminders are disabled.' });
});

// CRON job to check for unconfirmed registrations (> 12h) and send reminders
router.post('/check-unconfirmed-users', async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'];
    const authHeader = req.headers['authorization'];
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET && !isVercelCron) {
        return res.status(200).json({ success: false, error: 'Unauthorized (Silent)' });
    }

    try {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Get users who are not verified, registered between 12h and 7d ago, and haven't received a reminder
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, name, email, created_at, unconfirmed_reminder_sent_at')
            .eq('is_verified', false)
            .is('google_id', null)
            .is('unconfirmed_reminder_sent_at', null)
            .lt('created_at', twelveHoursAgo)
            .gt('created_at', sevenDaysAgo);

        if (fetchError) throw fetchError;

        const results = [];
        const now = new Date().toISOString();

        for (const user of users || []) {
            try {
                // Get active registration welcome promo code (if any)
                const { data: promo } = await supabase
                    .from('promo_codes')
                    .select('code, discount_percentage')
                    .eq('user_id', user.id)
                    .eq('is_used', false)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                // Generate a new 24h verification token
                const verificationToken = jwt.sign(
                    { userId: user.id, purpose: 'email_verification' },
                    config.jwtSecret,
                    { expiresIn: '24h' }
                );

                // Send reminder email
                await sendUnconfirmedReminderEmail(
                    user.email,
                    user.name,
                    verificationToken,
                    promo?.code || '',
                    promo?.discount_percentage || 10
                );

                // Update unconfirmed_reminder_sent_at timestamp
                await supabase
                    .from('users')
                    .update({ unconfirmed_reminder_sent_at: now })
                    .eq('id', user.id);

                results.push({ userId: user.id, email: user.email });
            } catch (err) {
                console.error(`❌ Failed to send registration reminder to ${user.email}:`, err);
            }
        }

        res.json({ success: true, remindersSent: results.length, processed: results });
    } catch (e: any) {
        console.error('❌ Unconfirmed users cron error:', e);
        res.status(500).json({ error: e.message });
    }
});

// CRON job to check for late orders (> 60m from creation and still not delivered)
router.post('/check-late-orders', async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'];
    const authHeader = req.headers['authorization'];
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET && !isVercelCron) {
        return res.status(200).json({ success: false, error: 'Unauthorized (Silent)' });
    }

    try {
        const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        // 1. Get orders that are still active but were created > 60m ago
        const { data: lateOrders, error: fetchError } = await supabase
            .from('orders')
            .select('id, status, created_at, phone_number, delivery_address')
            .in('status', ['pending', 'confirmed', 'preparing', 'on_the_way'])
            .lt('created_at', sixtyMinutesAgo);

        if (fetchError) throw fetchError;

        const results = (lateOrders || []).map(order => {
            const created = new Date(order.created_at);
            const diffMins = Math.round((Date.now() - created.getTime()) / 60000);
            return {
                id: order.id,
                status: order.status,
                minsLate: diffMins,
                phone: order.phone_number,
                address: order.delivery_address,
            };
        });

        if (results.length > 0) {
            console.warn(`🕒 CRON (Late Orders): Found ${results.length} orders that are LATE!`);
            // Here we could send a notification to Admin via Telegram/Email
        }

        res.json({ success: true, lateOrdersCount: results.length, detections: results });
    } catch (e: any) {
        console.error('❌ Late orders cron error:', e);
        res.status(500).json({ error: e.message });
    }
});
// Monthly archival (to be called on the 1st of each month at ~0:10 AM)
router.post('/monthly-archival', async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'];
    const authHeader = req.headers['authorization'];
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET && !isVercelCron) {
        return res.status(200).json({ success: false, error: 'Unauthorized (Silent)' });
    }

    try {
        const now = new Date();
        // Archive the PREVIOUS month
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = prevMonth.getFullYear();
        const month = prevMonth.getMonth() + 1;

        console.log(`📊 CRON (Archival): Starting monthly archival for ${month}/${year}...`);

        // 1. Archive Orders for that month
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 1).toISOString();

        const { error: archOrderErr } = await supabase
            .from('orders')
            .update({ is_archived: true })
            .neq('id', 513)
            .gte('created_at', startDate)
            .lt('created_at', endDate);

        if (archOrderErr) throw archOrderErr;

        // 2. Clear Daily Reports for that month
        const startDateStr = startDate.split('T')[0];
        const endDateStr = new Date(year, month, 0).toISOString().split('T')[0];

        const { error: archDailyErr } = await supabase
            .from('daily_reports')
            .delete()
            .gte('date', startDateStr)
            .lte('date', endDateStr);

        if (archDailyErr) throw archDailyErr;

        console.log(`✅ CRON (Archival): Finished archival for ${month}/${year}.`);
        res.json({ success: true, archived: `${month}/${year}` });
    } catch (e: any) {
        console.error('❌ Monthly archival cron error:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
