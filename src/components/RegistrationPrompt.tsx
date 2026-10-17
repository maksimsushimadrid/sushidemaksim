import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function RegistrationPrompt() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenShown, setHasBeenShown] = useState(false);

    useEffect(() => {
        // Check if already shown
        const shown = localStorage.getItem('registration_prompt_shown');
        if (shown) {
            setHasBeenShown(true);
            return;
        }

        // Wait 3 minutes (180000 ms)
        const timer = setTimeout(() => {
            const token = localStorage.getItem('sushi_token');
            if (!user && !token && !hasBeenShown) {
                setIsVisible(true);
                setHasBeenShown(true);
                localStorage.setItem('registration_prompt_shown', 'true');
            }
        }, 180000);

        return () => clearTimeout(timer);
    }, [user, hasBeenShown]);

    // Lock scroll when visible
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
            (window as any).lenis?.stop();
        } else {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        }
        return () => {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsVisible(false)}
                    className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 40 }}
                    className="relative bg-white w-full max-w-[340px] sm:max-w-md rounded-[32px] overflow-hidden shadow-2xl"
                >
                    {/* Top Accent */}
                    <div className="h-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700" />

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer z-10"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>

                    <div className="p-6 md:p-8 text-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-50 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                            <Gift size={32} className="text-orange-600 md:size-10" />
                        </div>

                        <h3 className="text-xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                            ¡Regístrate y recibe un{' '}
                            <span className="text-orange-600">10% de descuento</span>!
                        </h3>

                        <p className="text-gray-500 mb-6 md:mb-8 font-medium text-xs md:text-base">
                            Únete a la familia Maksim y obtén un 10% de descuento en tu primer
                            pedido superior a 20€. Recibirás un código promocional en tu email tras
                            registrarte.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    document.dispatchEvent(
                                        new CustomEvent('custom:openLogin', {
                                            detail: { mode: 'register' },
                                        })
                                    );
                                }}
                                className="w-full flex items-center justify-center gap-3 bg-orange-600 text-white py-3.5 md:py-4 rounded-2xl font-black shadow-lg shadow-orange-200 border-none cursor-pointer hover:bg-orange-700 transition-all no-underline"
                            >
                                <Mail size={18} className="md:size-5" />
                                REGISTRARME AHORA
                            </button>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="w-full py-2 md:py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer text-[12px] md:text-sm"
                            >
                                Quizás más tarde
                            </button>
                        </div>

                        <div className="mt-4 md:mt-8 pt-6 md:pt-8 border-t border-gray-50 flex items-center justify-center gap-2 text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            <ArrowRight size={10} className="text-orange-500 md:size-3" />
                            Válido por 7 días tras el registro
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
