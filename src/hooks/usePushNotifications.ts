import { useState, useEffect } from 'react';

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
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Check current subscription
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    if (sub) setIsSubscribed(true);
                });
            });
        }
    }, []);

    const subscribeToPush = async () => {
        if (!isSupported) return false;

        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                console.warn('Push permission denied.');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;

            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) {
                console.error('VITE_VAPID_PUBLIC_KEY is missing');
                return false;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
            });

            // Get or create anonymous device ID for guests
            let deviceId = localStorage.getItem('push_device_id');
            if (!deviceId) {
                deviceId = crypto.randomUUID();
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
                return true;
            } else {
                console.error('Failed to save subscription on server');
                return false;
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return false;
        }
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        subscribeToPush,
    };
}
