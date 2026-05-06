import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    isDanger = false,
}: ConfirmModalProps) {
    // Handle scroll lock (including Lenis)
    useEffect(() => {
        if (isOpen) {
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
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
                >
                    {/* Background Accent */}
                    <div
                        className={`absolute top-0 left-0 w-full h-1 ${isDanger ? 'bg-red-500' : 'bg-orange-500'}`}
                    />

                    {/* Close Button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>

                    {/* Content */}
                    <div className="flex flex-col items-center text-center mt-4">
                        <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}
                        >
                            <AlertTriangle size={32} strokeWidth={2.5} />
                        </div>

                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                            {title}
                        </h3>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8 px-2">
                            {message}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={onConfirm}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                                    isDanger
                                        ? 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-500'
                                        : 'bg-orange-600 text-white shadow-orange-600/20 hover:bg-orange-500'
                                }`}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onCancel}
                                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
