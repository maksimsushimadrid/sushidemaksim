import { Router, Response } from 'express';
import webpush from 'web-push';
import { supabase } from '../db/supabase.js';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Setup web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// POST /api/notifications/subscribe
router.post(
    '/subscribe',
    optionalAuthMiddleware,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { subscription, deviceId } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Suscripción inválida' });
        }

        const userId = req.userId || null;

        // Check if subscription already exists
        const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('endpoint', subscription.endpoint)
            .single();

        if (existing) {
            // Update user_id or device_id if changed
            await supabase
                .from('push_subscriptions')
                .update({ user_id: userId, device_id: deviceId || null })
                .eq('id', existing.id);
            return res.status(200).json({ success: true, message: 'Suscripción actualizada' });
        }

        // Insert new subscription
        const { error } = await supabase.from('push_subscriptions').insert({
            user_id: userId,
            device_id: deviceId || null,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        });

        if (error) {
            console.error('Error guardando push_subscription:', error);
            return res.status(500).json({ error: 'Error al guardar la suscripción' });
        }

        res.status(201).json({ success: true, message: 'Suscrito a notificaciones' });
    })
);

export default router;
