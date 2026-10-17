import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Delay showing to not overwhelm the user immediately
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookieConsent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-4 left-4 right-4 z-toast max-w-3xl mx-auto"
                >
                    <div className="relative overflow-hidden bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
                        {/* Logo Background */}
                        <img
                            src="/logo.svg"
                            alt=""
                            className="absolute -right-6 top-1/2 -translate-y-1/2 h-[120%] opacity-[0.04] pointer-events-none z-0 grayscale rotate-12"
                        />

                        <div className="flex-1 text-left relative z-10">
                            <h3 className="text-base font-black text-gray-900 mb-1.5 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-orange-600" />
                                Tu privacidad es importante
                            </h3>
                            <p className="text-gray-500 text-xs md:text-[13px] leading-relaxed max-w-xl">
                                Utilizamos cookies propias y de terceros para mejorar tu experiencia
                                y personalizar el contenido de{' '}
                                <span className="font-black text-orange-600 whitespace-nowrap">
                                    Sushi de Maksim
                                </span>
                                .
                            </p>
                        </div>

                        <div className="flex items-center justify-start gap-2 w-full md:w-auto relative z-10">
                            <button
                                onClick={handleDecline}
                                className="flex-1 md:flex-none px-4 py-2.5 text-xs md:text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-xl whitespace-nowrap"
                            >
                                Solo necesarias
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-[13px] font-bold rounded-xl shadow-lg shadow-orange-600/30 transition-all active:scale-95"
                            >
                                Aceptar
                            </button>
                        </div>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 transition-colors p-1 bg-white/50 backdrop-blur-sm rounded-full z-20"
                        >
                            <X size={16} strokeWidth={2} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
