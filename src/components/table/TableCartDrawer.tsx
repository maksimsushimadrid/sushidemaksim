import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Minus,
    Plus,
    Trash2,
    ShoppingCart,
    CreditCard,
    Banknote,
    CheckCircle2,
    Gift,
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';
import { useTableI18n } from '../../utils/tableI18n';
import { TABLE_IMAGE_OVERRIDES } from '../../constants/tableOverrides';
import SafeImage from '../common/SafeImage';
import { cn } from '../../utils/cn';

interface TableCartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TableCartDrawer: React.FC<TableCartDrawerProps> = ({ isOpen, onClose }) => {
    const {
        items,
        total,
        finalTotal,
        itemCount,
        updateQuantity,
        removeItem,
        tableNumber,
        isOrderConfirmed,
        lastOrderId,
        setOrderConfirmed,
        submitOrder,
        appliedPromo,
    } = useTableOrder();
    const { t } = useTableI18n();
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const isSubmittingRef = useRef(false);

    // Lock body scroll when drawer is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const getDisplayImage = (item: any) => {
        const override = TABLE_IMAGE_OVERRIDES[String(item.id)];
        return override || item.image;
    };

    const handlePlaceOrder = async () => {
        if (isSubmittingRef.current) return;

        setIsSubmitting(true);
        isSubmittingRef.current = true;

        try {
            await submitOrder(paymentMethod);
            setShowConfirmModal(false);
        } catch (error: any) {
            console.error('Failed to place order:', error);
            alert(error.message || 'Error al realizar el pedido. Por favor, avise al camarero.');
            setShowConfirmModal(false);
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const handleClose = () => {
        setOrderConfirmed(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0A0A0A] z-[101] shadow-2xl flex flex-col border-l border-white/5"
                    >
                        {isOrderConfirmed ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-orange-600/10 to-transparent">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-600/30"
                                >
                                    <CheckCircle2 size={48} strokeWidth={2.5} />
                                </motion.div>

                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                                    {t('order_received' as any)}
                                </h2>
                                <div className="mb-4">
                                    <span className="text-orange-500 font-black text-lg">
                                        #{String(lastOrderId).padStart(5, '0')}
                                    </span>
                                </div>
                                <p className="text-gray-400 font-bold mb-8">
                                    {t('order_confirmed_msg' as any)}
                                </p>

                                {/* Loyalty Club Offer Card */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-full bg-[#141414] border border-orange-600/30 rounded-[32px] p-6 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-600/20 transition-colors" />
                                    <div className="relative z-10">
                                        <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-md">
                                            <Gift size={24} />
                                        </div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">
                                            Club Sushi de Maksim
                                        </h3>
                                        <p className="text-sm text-gray-400 font-medium mb-6 leading-relaxed">
                                            ¡Regístrate ahora y obtén un{' '}
                                            <strong>10% de descuento</strong> en tu próximo pedido!
                                        </p>
                                        <a
                                            href="/profile?register=true"
                                            className="block w-full py-4 bg-white text-black rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors"
                                        >
                                            Unirme al Club
                                        </a>
                                    </div>
                                </motion.div>

                                <button
                                    onClick={handleClose}
                                    className="mt-8 text-gray-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Cerrar y ver la carta
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-6 flex items-center justify-between border-b border-white/5 bg-[#141414]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
                                            <ShoppingCart size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                                                Mesa {tableNumber || '?'}
                                            </h2>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                {itemCount}{' '}
                                                {itemCount === 1 ? 'producto' : 'productos'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2.5 bg-black text-white rounded-xl active:scale-90 transition-all border border-white/5"
                                    >
                                        <X size={20} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Items List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {items.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-gray-800 mb-4">
                                                <ShoppingCart size={40} />
                                            </div>
                                            <h3 className="text-lg font-black text-white uppercase italic">
                                                Tu cesta está vacía
                                            </h3>
                                            <button
                                                onClick={onClose}
                                                className="mt-6 px-8 py-3 bg-white text-black rounded-2xl font-black text-xs tracking-widest uppercase"
                                            >
                                                Volver a la carta
                                            </button>
                                        </div>
                                    ) : (
                                        items.map(item => (
                                            <motion.div
                                                key={`${item.id}-${item.selectedOption || 'default'}`}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="flex items-center gap-4 bg-[#141414] p-3 rounded-2xl border border-white/5 shadow-sm"
                                            >
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                                                    <SafeImage
                                                        src={getDisplayImage(item)}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-black text-white uppercase italic truncate">
                                                        {item.name}
                                                    </h4>
                                                    {item.selectedOption && (
                                                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mt-0.5">
                                                            {item.selectedOption}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="flex items-center bg-black rounded-lg p-0.5 border border-white/5">
                                                            <button
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.id,
                                                                        item.quantity - 1,
                                                                        item.selectedOption
                                                                    )
                                                                }
                                                                className="p-1 hover:text-orange-500 text-gray-400"
                                                            >
                                                                <Minus size={14} strokeWidth={3} />
                                                            </button>
                                                            <span className="w-6 text-center text-xs font-black text-white">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.id,
                                                                        item.quantity + 1,
                                                                        item.selectedOption
                                                                    )
                                                                }
                                                                className="p-1 hover:text-orange-500 text-gray-400"
                                                            >
                                                                <Plus size={14} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                removeItem(
                                                                    item.id,
                                                                    item.selectedOption
                                                                )
                                                            }
                                                            className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-black text-white">
                                                    {(item.price * item.quantity).toFixed(2)}€
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>

                                {/* Footer Summary */}
                                {items.length > 0 && (
                                    <div className="p-4 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                                        {/* Payment Method Selector */}
                                        <div className="mb-6">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                                Método de pago
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setPaymentMethod('EFECTIVO')}
                                                    className={cn(
                                                        'h-11 rounded-xl border flex items-center justify-center gap-2 transition-all',
                                                        paymentMethod === 'EFECTIVO'
                                                            ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20'
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                    )}
                                                >
                                                    <Banknote size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        Efectivo
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => setPaymentMethod('TARJETA')}
                                                    className={cn(
                                                        'h-11 rounded-xl border flex items-center justify-center gap-2 transition-all',
                                                        paymentMethod === 'TARJETA'
                                                            ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20'
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                    )}
                                                >
                                                    <CreditCard size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        Tarjeta
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-white/5 mb-3">
                                            {appliedPromo && (
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                                                        <Gift size={12} />
                                                        {appliedPromo.code} (-
                                                        {appliedPromo.discount}%)
                                                    </span>
                                                    <span className="text-xs text-green-400 font-bold">
                                                        -
                                                        {(
                                                            (total * appliedPromo.discount) /
                                                            100
                                                        ).toFixed(2)}
                                                        €
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-400 italic">
                                                    Total
                                                </span>
                                                <span className="text-2xl font-black text-white italic tracking-tighter">
                                                    {finalTotal.toFixed(2)}€
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={onClose}
                                                className="h-11 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center"
                                            >
                                                Carta
                                            </button>
                                            <button
                                                onClick={() => setShowConfirmModal(true)}
                                                disabled={isSubmitting || !tableNumber}
                                                className={cn(
                                                    'h-11 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 active:scale-95',
                                                    isSubmitting || !tableNumber
                                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                        : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20'
                                                )}
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>

                    {/* Confirmation Modal */}
                    <AnimatePresence>
                        {showConfirmModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="w-full max-w-sm bg-[#141414] rounded-[32px] border border-white/10 p-8 shadow-2xl"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-orange-600/20 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
                                            <ShoppingCart size={32} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
                                            ¿Confirmar pedido?
                                        </h3>
                                        <p className="text-gray-400 font-bold mb-6">
                                            Se enviará tu pedido de{' '}
                                            <span className="text-white italic">
                                                {total.toFixed(2)}€
                                            </span>{' '}
                                            a la cocina.
                                        </p>

                                        <div className="grid grid-cols-1 w-full gap-3">
                                            <button
                                                onClick={handlePlaceOrder}
                                                disabled={isSubmitting}
                                                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-600/20 flex items-center justify-center gap-3"
                                            >
                                                {isSubmitting ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{
                                                            repeat: Infinity,
                                                            duration: 1,
                                                            ease: 'linear',
                                                        }}
                                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                                    />
                                                ) : (
                                                    <>
                                                        Confirmar y Enviar
                                                        <CheckCircle2 size={16} />
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setShowConfirmModal(false)}
                                                disabled={isSubmitting}
                                                className="w-full py-4 bg-white/5 text-gray-400 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-white/10 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
};
