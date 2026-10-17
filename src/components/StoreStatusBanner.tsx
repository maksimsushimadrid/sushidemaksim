import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Info, X, Timer, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { isStoreOpen, getNextOpeningTime, formatTimeLeft } from '../utils/storeStatus';
import { useSettings } from '../hooks/queries/useSettings';

export default function StoreStatusBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [timeLeftDisplay, setTimeLeftDisplay] = useState<string | null>(null);
    const lastOpenedScrollYRef = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);

    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    const { data: settings } = useSettings();

    // Automatically hide the curtain when the user starts scrolling
    useEffect(() => {
        if (!isVisible) return;

        const handleScroll = () => {
            const scrollDelta = Math.abs(window.scrollY - lastOpenedScrollYRef.current);
            if (scrollDelta > 25 || window.scrollY > 40) {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isVisible]);

    const handleOpen = () => {
        lastOpenedScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
        setIsVisible(true);
    };

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

    const todayStr = new Date().toLocaleDateString('sv-SE');
    const madridParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());
    const h = madridParts.find(p => p.type === 'hour')?.value || '00';
    const m = madridParts.find(p => p.type === 'minute')?.value || '00';
    const timeStr = `${h}:${m}`;

    // Find any custom closure active at this moment
    const activeClosure = (settings?.customClosures || []).find((c: any) => {
        const { startDate, endDate, startTime, endTime } = c;
        if (!startDate || !endDate || !startTime || !endTime) return false;
        if (todayStr < startDate || todayStr > endDate) return false;
        if (todayStr > startDate && todayStr < endDate) return true;
        if (startDate === endDate) return timeStr >= startTime && timeStr <= endTime;
        if (todayStr === startDate) return timeStr >= startTime;
        if (todayStr === endDate) return timeStr <= endTime;
        return false;
    });

    const isStoreClosed = !!settings?.isStoreClosed || !!activeClosure;
    const isTodayClosed = !!settings?.isTodayClosed;
    const isPickupOnly = !!settings?.isPickupOnly;

    if (isAdminRoute || (!isStoreClosed && !isTodayClosed && !isPickupOnly)) {
        return null;
    }

    const todayDay = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const rawSchedule = settings?.contactSchedule;
    const schedule = Array.isArray(rawSchedule) ? rawSchedule : [];
    const todaySchedule = schedule.find((s: any) => s?.days?.toLowerCase().includes(todayDay));

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const statusTitle = activeClosure
        ? activeClosure.reason || 'Cerrado Temporalmente'
        : isStoreClosed
          ? settings?.isStoreClosed
              ? 'Restaurante Cerrado'
              : 'Fuera de Horario'
          : isPickupOnly && !isTodayClosed
            ? 'Solo Recogida'
            : 'Cerrado para hoy';

    const statusSubtitle = activeClosure
        ? activeClosure.startDate === activeClosure.endDate
            ? `Cerrado hoy de ${activeClosure.startTime} a ${activeClosure.endTime}`
            : `Cerrado del ${formatDate(activeClosure.startDate)} al ${formatDate(activeClosure.endDate)}`
        : isTodayClosed && !isStoreClosed
          ? 'Solo aceptamos pedidos para mañana u otros días.'
          : isPickupOnly && !isTodayClosed && !isStoreClosed
            ? 'Aceptamos pedidos para hoy, pero no podemos realizar entregas a domicilio. Puedes recoger tu pedido en C. de Barrilero, 20.'
            : todaySchedule?.hours
              ? `Hoy: ${todaySchedule.hours}`
              : 'Cerrado hoy';

    return (
        <AnimatePresence initial={true} mode="wait">
            {isVisible ? (
                <motion.div
                    key="store-curtain-expanded"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                        duration: 0.42,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="overflow-hidden bg-gradient-to-b from-[#161514] via-[#100F10] to-[#0A0A0C] border-b border-white/10 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.2)] relative z-10"
                >
                    <motion.div
                        initial={{ y: -32, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -32, opacity: 0 }}
                        transition={{
                            duration: 0.35,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-2.5 pb-2"
                    >
                        {/* Header bar of the curtain */}
                        <div className="flex items-center justify-between gap-3">
                            {/* Status badge & title */}
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-inner">
                                    <Clock size={14} className="text-orange-400" />
                                </div>
                                <div className="flex items-center min-w-0">
                                    <span className="text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">
                                        {statusTitle}
                                    </span>
                                </div>
                            </div>

                            {/* Actions: Countdown + Bright Close Button */}
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                {timeLeftDisplay && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-300 text-[10px] sm:text-xs font-bold tabular-nums whitespace-nowrap">
                                        <Timer
                                            size={12}
                                            className="text-orange-400 shrink-0 animate-pulse"
                                        />
                                        <span className="hidden sm:inline text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                                            Abrimos en:
                                        </span>
                                        <span>{timeLeftDisplay}</span>
                                    </div>
                                )}

                                {/* Bright, vivid high-contrast close button */}
                                <button
                                    type="button"
                                    onClick={() => setIsVisible(false)}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 active:scale-90 text-white flex items-center justify-center border border-white/40 shadow-sm hover:shadow-white/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60 shrink-0"
                                    aria-label="Cerrar aviso"
                                    title="Cerrar aviso"
                                >
                                    <X
                                        size={16}
                                        strokeWidth={2.8}
                                        className="text-white drop-shadow"
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Notice body */}
                        <div className="mt-2 pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                            <div className="flex items-start sm:items-center gap-2 text-zinc-300 text-[11px] sm:text-xs leading-snug">
                                <span className="text-zinc-200 font-medium">{statusSubtitle}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] sm:text-[11px] leading-tight shrink-0 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                <Info size={11} className="text-amber-400 shrink-0" />
                                <span>
                                    Realiza tu pedido y te contactaremos. Se procesarán al abrir.
                                </span>
                            </div>
                        </div>

                        {/* Curtain bottom grab handle indicator */}
                        <div
                            onClick={() => setIsVisible(false)}
                            className="flex items-center justify-center pt-2 pb-0.5 cursor-pointer group"
                            title="Deslizar arriba para cerrar"
                        >
                            <div className="w-10 h-1 rounded-full bg-white/25 group-hover:bg-white/50 transition-colors" />
                        </div>
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div
                    key="store-curtain-collapsed"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex justify-center overflow-hidden relative z-10"
                >
                    <motion.button
                        type="button"
                        onClick={handleOpen}
                        initial={{ y: -16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -16, opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="group -mt-px inline-flex items-center gap-2 px-3.5 py-1 bg-gradient-to-b from-[#18181A]/95 to-[#0E0E10]/95 hover:from-zinc-900 hover:to-black text-amber-300 hover:text-amber-200 text-[10px] sm:text-[11px] font-bold rounded-b-xl border-b border-x border-white/10 hover:border-white/20 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                        aria-label="Mostrar aviso de horario"
                        title="Mostrar aviso"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="tracking-wide uppercase text-[9px] sm:text-[10px]">
                            {statusTitle}
                        </span>
                        {timeLeftDisplay && (
                            <span className="text-[9px] text-zinc-400 font-mono hidden xs:inline">
                                · {timeLeftDisplay}
                            </span>
                        )}
                        <ChevronDown
                            size={12}
                            className="text-amber-400 group-hover:translate-y-0.5 transition-transform"
                        />
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
