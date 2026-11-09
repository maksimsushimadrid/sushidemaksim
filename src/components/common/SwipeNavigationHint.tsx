import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pointer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getCycleIndexForPath } from '../../constants/navigation';

export default function SwipeNavigationHint() {
    const location = useLocation();
    const isCyclePage = getCycleIndexForPath(location.pathname) !== -1;

    const [visible, setVisible] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !localStorage.getItem('sushi_swipe_hint_seen_v3');
    });

    useEffect(() => {
        if (!visible) return;

        // Auto-dismiss after 7 seconds
        const timer = setTimeout(() => {
            setVisible(false);
            localStorage.setItem('sushi_swipe_hint_seen_v3', 'true');
        }, 7000);

        // Also dismiss on user swipe or scroll
        const handleInteraction = () => {
            setVisible(false);
            localStorage.setItem('sushi_swipe_hint_seen_v3', 'true');
        };

        window.addEventListener('sushi:swiped', handleInteraction);
        window.addEventListener('scroll', handleInteraction, { passive: true, once: true });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('sushi:swiped', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
        };
    }, [visible]);

    if (!isCyclePage) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.92 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    onClick={() => {
                        setVisible(false);
                        localStorage.setItem('sushi_swipe_hint_seen_v3', 'true');
                    }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden pointer-events-auto cursor-pointer select-none"
                    role="status"
                    aria-label="Desliza para navegar"
                >
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414]/95 text-white border border-orange-500/40 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.7),0_0_15px_rgba(242,101,34,0.35)] backdrop-blur-xl">
                        {/* Left Arrow */}
                        <motion.div
                            animate={{ x: [-3, 1, -3] }}
                            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                            className="text-orange-400 shrink-0"
                        >
                            <ChevronLeft size={14} strokeWidth={2.8} />
                        </motion.div>

                        {/* Animated Finger / Hand */}
                        <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                            <motion.div
                                animate={{
                                    x: [-6, 6, -6],
                                    rotate: [-8, 8, -8],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.4,
                                    ease: 'easeInOut',
                                }}
                                className="text-orange-400 drop-shadow-[0_0_6px_rgba(242,101,34,0.7)]"
                            >
                                <Pointer size={16} strokeWidth={2.2} />
                            </motion.div>
                        </div>

                        {/* Text */}
                        <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap text-zinc-100">
                            Desliza para navegar
                        </span>

                        {/* Right Arrow */}
                        <motion.div
                            animate={{ x: [1, -3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                            className="text-orange-400 shrink-0"
                        >
                            <ChevronRight size={14} strokeWidth={2.8} />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
