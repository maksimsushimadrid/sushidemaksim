import webpush from 'web-push';
import { supabase } from '../db/supabase.js';

export async function sendPushNotification(
    userId: string | null,
    title: string,
    body: string,
    url: string = '/'
) {
    if (!userId) return;

    try {
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (!subscriptions || subscriptions.length === 0) return;

        const payload = JSON.stringify({
            title,
            body,
            url,
            icon: '/pwa-192.png',
            badge: '/maskable-icon.png',
        });

        const promises = subscriptions.map(async sub => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    payload
                );
            } catch (error: any) {
                // If subscription is invalid/expired, remove it
                if (error.statusCode === 410 || error.statusCode === 404) {
                    console.log(`Removing invalid push subscription: ${sub.id}`);
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                } else {
                    console.error('Error sending push notification:', error);
                }
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Error in sendPushNotification utility:', error);
    }
}
