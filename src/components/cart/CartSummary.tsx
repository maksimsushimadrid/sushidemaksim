import { motion } from 'framer-motion';
import { Clock, ArrowRight, X } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { triggerHaptic, HAPTIC_PATTERNS } from '../../utils/haptics';

interface CartSummaryProps {
    total: number;
    deliveryCost: number;
    promoCode: string;
    promoDiscount: number | null;
    promoError: string | null;
    isStoreClosed: boolean;
    isScheduled: boolean;
    onOrder: () => void;
    onApplyPromo: (code: string) => void;
    onRemovePromo: () => void;
    isOrdering: boolean;
    isApplyingPromo: boolean;
    setPromoCode: (code: string) => void;
    minOrder?: number;
    freeDeliveryThreshold?: number;
    deliveryDetails?: {
        deliveryType: 'delivery' | 'pickup' | 'reservation';
        address?: string;
        house?: string;
        selectedZone?: any;
        paymentMethod?: 'cash' | 'card' | 'bizum';
    };
}

export default function CartSummary({
    total,
    deliveryCost,
    promoCode,
    promoDiscount,
    promoError,
    isStoreClosed,
    isScheduled,
    onOrder,
    onApplyPromo,
    onRemovePromo,
    isOrdering,
    isApplyingPromo,
    setPromoCode,
    minOrder = 0,
    freeDeliveryThreshold = 60,
    deliveryDetails: propDeliveryDetails,
}: CartSummaryProps) {
    const { items, deliveryDetails: contextDeliveryDetails } = useCart();
    const details = propDeliveryDetails || contextDeliveryDetails;
    const { deliveryType, address, house, selectedZone, paymentMethod } = details;
    const isMinOrderMet = total >= minOrder;
    const finalTotal = total - (promoDiscount ? (total * promoDiscount) / 100 : 0) + deliveryCost;

    const hasAddress = !!address;
    const hasHouse = !!house;
    const hasZone = !!selectedZone;

    const isAddressMissing = deliveryType === 'delivery' && (!hasAddress || !hasHouse || !hasZone);
    const isPaymentMissing = !paymentMethod;
    const isDisabled =
        isOrdering || items.length === 0 || !isMinOrderMet || isAddressMissing || isPaymentMissing;

    return (
        <div
            data-testid="cart-summary"
            className="bg-white md:rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.03)] md:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] p-5 md:p-6 sticky top-24 rounded-t-[32px] border-b md:border-none border-gray-50 h-fit"
        >
            <h2 className="text-lg font-black mb-4 uppercase tracking-tight">Resumen</h2>

            {deliveryType === 'delivery' && (
                <div className="mb-6 animate-in slide-in-from-top duration-500">
                    <div className="flex justify-between items-end mb-1.5">
                        <span
                            className={`text-[10px] font-black uppercase tracking-widest ${total >= freeDeliveryThreshold ? 'text-green-600' : 'text-orange-600'}`}
                        >
                            {total >= freeDeliveryThreshold
                                ? '¡Genial! Tienes ENVÍO GRATIS 🚚💨'
                                : `¡Te faltan ${(freeDeliveryThreshold - total).toFixed(2).replace('.', ',')}€ para el envío GRATIS! 🍣`}
                        </span>
                        <span className="text-[10px] font-black text-gray-400">
                            {freeDeliveryThreshold}€
                        </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.min((total / freeDeliveryThreshold) * 100, 100)}%`,
                            }}
                            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                            className={`h-full rounded-full ${total >= freeDeliveryThreshold ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]'}`}
                        />
                    </div>
                </div>
            )}

            {isStoreClosed && !isScheduled && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-amber-900"
                >
                    <Clock size={16} className="shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold leading-tight m-0">
                        Restaurante cerrado. Selecciona "Entrega programada" para realizar tu pedido
                        anticipado.
                    </p>
                </motion.div>
            )}

            <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between text-gray-500 text-sm">
                    <span>Productos ({items.reduce((s, i) => s + i.quantity, 0)} uds.)</span>
                    <span className="font-bold text-gray-900">
                        {total.toFixed(2).replace('.', ',')} €
                    </span>
                </div>
                {deliveryType === 'delivery' && (
                    <div className="flex justify-between text-gray-500 text-sm animate-in fade-in duration-300">
                        <div className="flex flex-col">
                            <span>Envío</span>
                            {hasZone && (
                                <span className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest leading-none mt-1">
                                    {selectedZone.name}
                                </span>
                            )}
                        </div>
                        {!hasZone ? (
                            <span className="text-[11px] font-bold text-gray-400 italic text-right mt-0.5">
                                A determinar
                            </span>
                        ) : (
                            <div className="text-right">
                                <span
                                    className={`font-bold block ${deliveryCost <= 0 ? 'text-green-600' : 'text-gray-900'}`}
                                >
                                    {deliveryCost <= 0
                                        ? 'ENVÍO GRATIS'
                                        : `${deliveryCost.toFixed(2).replace('.', ',')} €`}
                                </span>
                            </div>
                        )}
                    </div>
                )}
                {promoDiscount && (
                    <div className="flex justify-between text-green-600 text-sm animate-in zoom-in duration-300">
                        <span>Descuento ({promoDiscount}%)</span>
                        <span className="font-bold">
                            -{((total * promoDiscount) / 100).toFixed(2).replace('.', ',')} €
                        </span>
                    </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-1">
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <div className="text-right">
                            <span className="text-orange-600">
                                {finalTotal.toFixed(2).replace('.', ',')} €
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-4 bg-orange-600 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Cupón de descuento
                    </span>
                </div>
                {!promoDiscount ? (
                    <div className="relative group">
                        <div className="flex gap-1 p-1 pr-1.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl transition-all duration-300 focus-within:border-orange-500/30 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-orange-500/5">
                            <input
                                type="text"
                                value={promoCode}
                                onChange={e => {
                                    triggerHaptic(HAPTIC_PATTERNS.LIGHT);
                                    setPromoCode(e.target.value.toUpperCase());
                                }}
                                placeholder="Introduce tu código"
                                className="min-w-0 flex-1 px-3 py-2 bg-transparent border-none text-sm focus:outline-none uppercase font-black tracking-tight placeholder:text-gray-300 placeholder:font-bold"
                            />
                            <button
                                onClick={() => {
                                    triggerHaptic();
                                    onApplyPromo(promoCode);
                                }}
                                disabled={isApplyingPromo || !promoCode.trim()}
                                className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider md:tracking-widest transition-all duration-300 border-none cursor-pointer flex items-center gap-2 shadow-sm shrink-0
                                    ${
                                        isApplyingPromo || !promoCode.trim()
                                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                            : 'bg-orange-600 text-white hover:bg-black hover:scale-105 active:scale-95 shadow-orange-100'
                                    }`}
                            >
                                {isApplyingPromo ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Aplicar'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden p-4 bg-green-50 rounded-2xl border-2 border-green-200/50 shadow-lg shadow-green-500/5 group"
                    >
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-12 h-12 bg-green-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md border border-green-100 shrink-0">
                                    <span className="text-green-600 font-black text-xs">
                                        -{promoDiscount}%
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-green-700 font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-60">
                                        Código Aplicado
                                    </span>
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                        {promoCode}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    triggerHaptic(HAPTIC_PATTERNS.MEDIUM);
                                    onRemovePromo();
                                }}
                                className="w-8 h-8 rounded-full hover:bg-orange-50 text-gray-300 hover:text-orange-500 transition-all duration-300 bg-white shadow-sm border border-gray-100 flex items-center justify-center cursor-pointer group/close"
                            >
                                <X
                                    size={14}
                                    className="group-hover/close:rotate-90 transition-transform"
                                />
                            </button>
                        </div>
                    </motion.div>
                )}
                {promoError && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex items-center gap-2 px-2"
                    >
                        <div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-wider italic">
                            {promoError}
                        </p>
                    </motion.div>
                )}
            </div>

            <button
                onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
                    onOrder();
                }}
                disabled={isDisabled}
                className={`px-6 py-4 rounded-2xl font-black border-none cursor-pointer w-full mb-3 text-base transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-wide
                    ${isMinOrderMet ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200' : 'bg-gray-200 text-gray-400 shadow-none'}`}
                data-testid="order-button"
            >
                {isOrdering ? (
                    'Procesando...'
                ) : !isMinOrderMet ? (
                    `Mínimo ${minOrder.toFixed(2).replace('.', ',')}€`
                ) : (
                    <>
                        <span>
                            {deliveryType === 'delivery' && !hasZone
                                ? 'Zona no válida'
                                : 'Realizar pedido'}
                        </span>
                        <ArrowRight size={18} strokeWidth={2} />
                    </>
                )}
            </button>

            {(deliveryType === 'delivery' || !paymentMethod) &&
                !isOrdering &&
                isMinOrderMet &&
                items.length > 0 && (
                    <div className="mt-4 px-2 space-y-1.5 text-center">
                        {deliveryType === 'delivery' && !hasAddress && (
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                                📍 Selecciona una dirección de entrega
                            </p>
                        )}
                        {deliveryType === 'delivery' && hasAddress && !hasHouse && (
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest animate-bounce">
                                🏠 Indica el número o portal
                            </p>
                        )}
                        {deliveryType === 'delivery' && hasAddress && hasHouse && !hasZone && (
                            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">
                                ❌ Lo sentimos, no entregamos en esta zona
                            </p>
                        )}
                        {!paymentMethod && (
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest animate-pulse">
                                💳 Selecciona un método de pago
                            </p>
                        )}
                    </div>
                )}

            {items.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-4 text-center font-medium px-4">
                    Al pulsar "Realizar pedido" aceptas nuestras condiciones generales de venta y
                    política de privacidad.
                </p>
            )}
        </div>
    );
}
