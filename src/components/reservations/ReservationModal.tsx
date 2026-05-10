import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ReservationForm from './ReservationForm';

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReservationModal({ isOpen, onClose }: ReservationModalProps) {
    useBodyScrollLock(isOpen);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] flex items-start justify-center"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        className="relative w-[92%] max-w-sm bg-white rounded-[2.5rem] shadow-2xl flex flex-col border border-white/20 my-4 max-h-[calc(100dvh-2rem)]"
                    >
                        {/* Compact Header */}
                        <div className="px-6 pt-5 pb-1 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                                    Reservar Mesa
                                </h2>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                    Sushi de Maksim
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all border-none cursor-pointer"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="px-6 py-2 flex flex-col gap-4 overflow-visible pb-10">
                            <ReservationForm onSuccess={() => {}} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
