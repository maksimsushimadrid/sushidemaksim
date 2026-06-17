self.addEventListener('push', function (event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        
        const title = data.title || 'Sushi de Maksim';
        const options = {
            body: data.body || 'Tienes una actualización sobre tu pedido.',
            icon: data.icon || '/pwa-192.png',
            badge: data.badge || '/maskable-icon.png',
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
        console.error('Error in push event', e);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(function (windowClients) {
                // Check if there is already a window/tab open with the target URL
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    // If so, just focus it.
                    if (client.url.includes(event.notification.data.url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, then open the target URL in a new window/tab.
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
        );
    }
});
