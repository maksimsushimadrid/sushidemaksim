import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, X } from 'lucide-react';

export default function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            console.log('[PWA] Service Worker registered');
            if (r) {
                setInterval(
                    () => {
                        r.update();
                    },
                    60 * 60 * 1000
                ); // Check SW update every hour
            }
        },
    });

    useEffect(() => {
        const checkVersion = async () => {
            // Skip check in development
            if (window.location.hostname === 'localhost') return;

            try {
                const response = await fetch('/version.json', {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                });
                const data = await response.json();

                // If version on server is different from bundled version
                if (data.version && data.version !== __APP_VERSION__) {
                    console.log(`[PWA] New version detected on server: ${data.version}`);
                    setNeedRefresh(true);
                }
            } catch (e) {
                console.error('[PWA] Version check failed', e);
            }
        };

        // Check on mount and when tab becomes active
        checkVersion();
        window.addEventListener('focus', checkVersion);

        // Also check every 15 minutes
        const interval = setInterval(checkVersion, 15 * 60 * 1000);

        return () => {
            window.removeEventListener('focus', checkVersion);
            clearInterval(interval);
        };
    }, [setNeedRefresh]);

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <AnimatePresence>
            {(offlineReady || needRefresh) && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-6 left-0 right-0 px-4 md:left-6 md:right-auto md:px-0 z-toast pointer-events-none"
                >
                    <div className="bg-white border border-orange-100 shadow-2xl shadow-orange-900/10 rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 max-w-sm mx-auto md:mx-0 pointer-events-auto">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                            <RefreshCcw className="w-6 h-6 text-orange-600 animate-spin-slow" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                {needRefresh ? 'Nueva versión' : 'Listo para usar offline'}
                            </h3>
                            <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
                                {needRefresh
                                    ? 'Hay una actualización disponible. Haz clic para refrescar.'
                                    : 'El sitio ya funciona sin conexión a internet.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-1">
                            {needRefresh && (
                                <button
                                    onClick={() => updateServiceWorker(true)}
                                    className="px-3 py-1.5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-700 transition-colors active:scale-95"
                                >
                                    Actualizar
                                </button>
                            )}
                            <button
                                onClick={() => close()}
                                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
