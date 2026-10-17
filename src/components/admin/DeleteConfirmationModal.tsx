import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Trash2, RefreshCw } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isLoading?: boolean;
    itemType?: string;
    itemName?: string;
    language?: 'ru' | 'es';
}

const TRANSLATIONS = {
    ru: {
        confirm: 'ДА, УДАЛИТЬ',
        cancel: 'ОТМЕНА',
    },
    es: {
        confirm: 'SÍ, ELIMINAR',
        cancel: 'CANCELAR',
    },
};

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isLoading = false,
    itemType = 'elemento',
    itemName,
    language = 'es',
}: DeleteConfirmationModalProps) {
    const t = TRANSLATIONS[language];

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

    const modal = (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-popover bg-gray-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain py-10 px-4 flex justify-center items-center"
                    onClick={e => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-[32px] p-8 max-sm:p-6 max-w-sm w-full shadow-2xl overflow-hidden"
                    >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-50" />

                        <div className="text-center relative z-10">
                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-500">
                                <Trash2 size={32} strokeWidth={1.5} />
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                                {title}
                            </h3>

                            <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed px-2">
                                {description}
                                {itemName && (
                                    <span className="block mt-2 font-black text-orange-600 uppercase tracking-wider text-[11px] bg-orange-50 py-1.5 rounded-lg border border-orange-100/50">
                                        "{itemName}"
                                    </span>
                                )}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs md:text-sm hover:bg-black transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    {isLoading ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            {t.confirm} {(itemType || '').toUpperCase()}
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs md:text-sm hover:bg-gray-200 transition-colors active:scale-95"
                                >
                                    {t.cancel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modal, document.body);
}
