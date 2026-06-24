import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Info, X, Calendar, Timer } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { isStoreOpen, getNextOpeningTime, formatTimeLeft } from '../utils/storeStatus';
import { useSettings } from '../hooks/queries/useSettings';

export default function StoreStatusBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [timeLeftDisplay, setTimeLeftDisplay] = useState<string | null>(null);

    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    const { data: settings } = useSettings();

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const open = isStoreOpen(now);

            // Even if store is open by schedule, if the admin closed it manually,
            // we still check for the next opening time to show a countdown if applicable.
            // But usually we just show it if it's currently scheduled to be closed.
            if (!open) {
                const nextOpening = getNextOpeningTime(now);
                if (nextOpening) {
                    const diff = nextOpening.getTime() - now.getTime();
                    if (diff > 0) {
                        setTimeLeftDisplay(formatTimeLeft(diff));
                    }
                }
            } else {
                setTimeLeftDisplay(null);
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, []);

    const isStoreClosed = !!settings?.isStoreClosed;
    const isTodayClosed = !!settings?.isTodayClosed;
    const isPickupOnly = !!settings?.isPickupOnly;

    if (isAdminRoute || (!isStoreClosed && !isTodayClosed && !isPickupOnly)) {
        return null;
    }

    const todayDay = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const rawSchedule = settings?.contactSchedule;
    const schedule = Array.isArray(rawSchedule) ? rawSchedule : [];
    const todaySchedule = schedule.find((s: any) => s?.days?.toLowerCase().includes(todayDay));

    const statusTitle = isStoreClosed
        ? settings?.isStoreClosed
            ? 'Restaurante Cerrado'
            : 'Fuera de Horario'
        : isPickupOnly && !isTodayClosed
          ? 'Solo Recogida'
          : 'Cerrado para hoy';

    const statusSubtitle =
        isTodayClosed && !isStoreClosed
            ? 'Solo aceptamos pedidos para mañana u otros días.'
            : isPickupOnly && !isTodayClosed && !isStoreClosed
              ? 'Aceptamos pedidos para hoy, pero no podemos realizar entregas a domicilio. Puedes recoger tu pedido en C. de Barrilero, 20.'
              : todaySchedule?.hours
                ? `Hoy: ${todaySchedule.hours}`
                : 'Cerrado hoy';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="store-closed-banner"
                    initial={false}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="bg-gray-950 border-b border-white/5 relative z-[101] overflow-hidden"
                >
                    <div className="max-w-7xl mx-auto px-4 py-2 md:py-2.5">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="w-8 h-8 rounded-xl bg-orange-600/10 flex items-center justify-center shrink-0 border border-orange-500/20 shadow-inner">
                                    <Clock size={16} className="text-orange-500" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-black text-[10px] md:text-sm uppercase tracking-tight">
                                            {statusTitle}
                                        </p>
                                        <span className="text-orange-500 text-[7px] md:text-[8px] font-black">
                                            PRE-ORDEN
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0">
                                        <span className="text-gray-400 text-[9px] md:text-xs font-bold leading-none flex items-center gap-1">
                                            <Calendar size={9} className="text-gray-500" />
                                            {statusSubtitle}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                {timeLeftDisplay && (
                                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 decoration-orange-500">
                                        <Timer size={14} className="text-orange-500" />
                                        <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                                            Abrimos en:
                                        </span>
                                        <span className="text-[12px] font-black text-white tabular-nums">
                                            {timeLeftDisplay}
                                        </span>
                                    </div>
                                )}

                                <div className="flex-1 md:flex-none flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-1.5 border border-white/10">
                                    <Info size={12} className="text-amber-400 shrink-0" />
                                    <div className="flex flex-col justify-center">
                                        <p className="text-[9px] md:text-[11px] text-gray-200 font-medium leading-tight">
                                            Realiza tu pedido y te contactaremos.
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[8px] md:text-[10px] text-gray-400 leading-none">
                                                Se procesarán al abrir.
                                            </p>
                                            {timeLeftDisplay && (
                                                <p className="lg:hidden text-[8px] text-orange-400 font-black leading-none">
                                                    ● {timeLeftDisplay}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="p-1.5 text-gray-500 hover:text-white transition-colors shrink-0"
                                    aria-label="Cerrar"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
