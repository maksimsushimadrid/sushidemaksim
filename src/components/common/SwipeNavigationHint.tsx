import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pointer, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getCycleIndexForPath } from '../../constants/navigation';

const STORAGE_KEY = 'sushi_swipe_intro_seen_v1';

export default function SwipeNavigationHint() {
    const location = useLocation();
    const isCyclePage = getCycleIndexForPath(location.pathname) !== -1;

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Never show swipe tutorial overlay if user navigated directly to an item
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('item') || window.location.hash.includes('item')) {
            return;
        }

        // Check if already seen or on non-cycle route
        const alreadySeen = localStorage.getItem(STORAGE_KEY);
        if (alreadySeen || !isCyclePage) return;

        // Soft delay before appearing so user sees initial page load
        const timer = setTimeout(() => {
            setVisible(true);
        }, 600);

        return () => clearTimeout(timer);
    }, [isCyclePage, location.search, location.hash]);

    const dismiss = () => {
        setVisible(false);
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (!visible) return;

        // Auto-dismiss after 7 seconds
        const autoDismissTimer = setTimeout(dismiss, 7000);

        // Dismiss on swipe event
        const handleSwipe = () => dismiss();
        window.addEventListener('sushi:swiped', handleSwipe);

        return () => {
            clearTimeout(autoDismissTimer);
            window.removeEventListener('sushi:swiped', handleSwipe);
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={dismiss}
                    className="fixed inset-0 z-[100] md:hidden bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none cursor-pointer"
                    role="dialog"
                    aria-label="Guía de navegación por swipe"
                >
                    {/* Close button top-right */}
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            dismiss();
                        }}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/80 hover:text-white border border-white/15"
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center max-w-xs text-center">
                        {/* Interactive Swipe Track with Animated Hand */}
                        <div className="relative flex items-center justify-between w-64 h-24 my-4">
                            {/* Horizontal guide track */}
                            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-orange-500/40" />

                            {/* Left Arrow */}
                            <motion.div
                                animate={{ x: [-4, 0, -4] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                                className="text-orange-400 shrink-0 relative z-10"
                            >
                                <ChevronLeft size={32} strokeWidth={2.8} />
                            </motion.div>

                            {/* Animated Pointing Finger */}
                            <motion.div
                                animate={{
                                    x: [-45, 45, -45],
                                    rotate: [-8, 8, -8],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.8,
                                    ease: 'easeInOut',
                                }}
                                className="relative z-20 flex items-center justify-center"
                            >
                                <div className="absolute w-12 h-12 rounded-full bg-orange-500/35 blur-md pointer-events-none" />
                                <Pointer
                                    size={52}
                                    strokeWidth={1.8}
                                    className="text-white fill-orange-500/30 drop-shadow-[0_4px_16px_rgba(242,101,34,0.95)]"
                                />
                            </motion.div>

                            {/* Right Arrow */}
                            <motion.div
                                animate={{ x: [4, 0, 4] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                                className="text-orange-400 shrink-0 relative z-10"
                            >
                                <ChevronRight size={32} strokeWidth={2.8} />
                            </motion.div>
                        </div>

                        {/* Title text */}
                        <h3 className="text-xl font-black text-white uppercase tracking-wide leading-snug drop-shadow-md">
                            Para moverte por el menú, usa el swipe
                        </h3>

                        {/* Subtitle pill */}
                        <div className="mt-4 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-xs font-semibold tracking-wide flex items-center gap-2">
                            <span>← Desliza a los lados →</span>
                        </div>

                        {/* Dismiss CTA */}
                        <p className="mt-6 text-xs text-zinc-400 font-medium">
                            Toca la pantalla para continuar
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
