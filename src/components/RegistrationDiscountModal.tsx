import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';
import { triggerHaptic } from '../utils/haptics';

interface RegistrationDiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
}

export default function RegistrationDiscountModal({
    isOpen,
    onClose,
    onContinue,
}: RegistrationDiscountModalProps) {
    useScrollLock(isOpen);

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="discount-modal-title"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                        onClick={() => {
                            triggerHaptic(10);
                            onClose();
                        }}
                        className="absolute inset-0 bg-black/65 backdrop-blur-md"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{
                            type: 'spring',
                            damping: 26,
                            stiffness: 320,
                            mass: 0.8,
                        }}
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-[32px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(242,101,34,0.35),0_10px_30px_rgba(0,0,0,0.2)] border border-orange-100"
                    >
                        {/* Top decorative gradient bar */}
                        <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic(10);
                                onClose();
                            }}
                            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100/80 hover:bg-gray-200/90 text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center cursor-pointer border-none z-10 active:scale-95"
                            aria-label="Cerrar modal"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>

                        <div className="p-6 sm:p-8 text-center">
                            {/* Animated icon sphere */}
                            <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 opacity-20 blur-xl animate-pulse" />
                                <div className="relative w-18 h-18 rounded-2xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <Gift size={36} strokeWidth={2.2} />
                                </div>
                                <span className="absolute -top-1 -right-1 bg-amber-400 text-zinc-950 p-1 rounded-full shadow-md">
                                    <Sparkles size={14} strokeWidth={2.5} />
                                </span>
                            </div>

                            {/* Badge */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-orange-700 text-[11px] font-black uppercase tracking-wider mb-3">
                                <span>🎉 Descuento de bienvenida</span>
                            </div>

                            {/* Title */}
                            <h2
                                id="discount-modal-title"
                                className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight mb-3"
                            >
                                ¡Consigue un{' '}
                                <span className="text-orange-600 underline decoration-orange-300 underline-offset-4">
                                    10% de descuento
                                </span>
                                !
                            </h2>

                            {/* Explanatory text */}
                            <p className="text-gray-600 text-[13px] sm:text-sm leading-relaxed mb-5 font-medium">
                                Por registrarte en nuestro club obtienes un{' '}
                                <strong className="text-gray-900 font-bold">
                                    10% de descuento directo
                                </strong>{' '}
                                en tu primer pedido superior a 20€ y acceso a promociones
                                exclusivas.
                            </p>

                            {/* Benefits micro-list */}
                            <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3.5 mb-6 text-left space-y-2 text-xs text-gray-700 font-semibold">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={15}
                                        className="text-orange-600 shrink-0"
                                        strokeWidth={2.5}
                                    />
                                    <span>Código de bienvenida enviado a tu email</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={15}
                                        className="text-orange-600 shrink-0"
                                        strokeWidth={2.5}
                                    />
                                    <span>Puntos y platos gratis con cada compra</span>
                                </div>
                            </div>

                            {/* The Question */}
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-base sm:text-lg font-black text-gray-900 mb-3.5">
                                    ¿Quieres registrarte?
                                </p>

                                {/* Continue button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic(20);
                                        onContinue();
                                    }}
                                    className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white py-3.5 sm:py-4 px-6 rounded-2xl font-black text-[14px] sm:text-[15px] uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                                >
                                    <span>Continuar</span>
                                    <ArrowRight size={18} strokeWidth={2.5} />
                                </button>

                                {/* Dismiss button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic(10);
                                        onClose();
                                    }}
                                    className="mt-3 w-full py-2 text-gray-400 hover:text-gray-700 text-xs font-bold transition-colors bg-transparent border-none cursor-pointer"
                                >
                                    Quizás más tarde
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
