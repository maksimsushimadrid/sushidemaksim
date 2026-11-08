import { useState, useEffect } from 'react';
import { safeRandomUUID } from '../utils/uuid';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Check current subscription (register fallback SW if none exists yet)
            navigator.serviceWorker
                .getRegistration()
                .then(reg => reg || navigator.serviceWorker.register('/notifications-sw.js'))
                .then(registration => registration?.pushManager.getSubscription())
                .then(sub => {
                    if (sub) setIsSubscribed(true);
                })
                .catch(err => {
                    console.warn('SW registration check warning:', err);
                });
        }
    }, []);

    const subscribeToPush = async (): Promise<{
        ok: boolean;
        reason?: 'unsupported' | 'denied' | 'missing_key' | 'error';
    }> => {
        if (!isSupported) return { ok: false, reason: 'unsupported' };
        if (isSubscribing) return { ok: false };

        setIsSubscribing(true);
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                console.warn('Push permission denied.');
                return { ok: false, reason: 'denied' };
            }

            let registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                registration = await navigator.serviceWorker.register('/notifications-sw.js');
            }
            await navigator.serviceWorker.ready;

            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) {
                console.error('VITE_VAPID_PUBLIC_KEY is missing');
                return { ok: false, reason: 'missing_key' };
            }

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
                });
            }

            // Get or create anonymous device ID for guests
            let deviceId = localStorage.getItem('push_device_id');
            if (!deviceId) {
                deviceId = safeRandomUUID();
                localStorage.setItem('push_device_id', deviceId);
            }

            // Send subscription to backend
            const token = localStorage.getItem('sushi_token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    subscription,
                    deviceId,
                }),
            });

            if (response.ok) {
                setIsSubscribed(true);
                return { ok: true };
            } else {
                console.error('Failed to save subscription on server');
                return { ok: false, reason: 'error' };
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return { ok: false, reason: 'error' };
        } finally {
            setIsSubscribing(false);
        }
    };

    return {
        isSupported,
        isSubscribed,
        isSubscribing,
        permission,
        subscribeToPush,
    };
}
