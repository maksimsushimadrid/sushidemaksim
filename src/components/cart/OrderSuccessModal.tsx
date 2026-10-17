import { useModalA11y } from '../../hooks/useModalA11y';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, Store, MapPin, Users, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface OrderSummary {
    total: number;
    deliveryCost: number;
    address: string;
    house: string;
    apartment: string;
    phone: string;
    tipAmount?: number;
    discountAmount?: number;
    finalTotal?: number;
}

interface OrderSuccessModalProps {
    isOpen: boolean;
    orderId: number;
    summary: OrderSummary | null;
    whatsappUrl: string | null;
    onClose: () => void;
}

export default function OrderSuccessModal({
    isOpen,
    orderId,
    summary,
    whatsappUrl,
    onClose,
}: OrderSuccessModalProps) {
    const { isAuthenticated, user } = useAuth();

    // Fallback if summary is null to prevent crashes
    const total = summary?.total || 0;
    const deliveryCost = summary?.deliveryCost || 0;
    const address = summary?.address || '';
    const house = summary?.house || '';
    const phone = summary?.phone || '';

    // We can't easily get deliveryType from summary alone without adding it,
    // but we can infer it or just display address correctly.
    const isPickup = address === 'RECOGIDA';
    const isReservation = address === 'RESERVA';

    const dialogRef = useModalA11y({ onClose, isOpen });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-modal overflow-y-auto bg-gray-900/40 backdrop-blur-md flex items-start md:items-center justify-center p-4 py-8 md:p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Pedido realizado"
                    className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl p-5 md:p-10 max-w-md w-full text-center relative overflow-hidden border border-white my-auto"
                >
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 z-20 border-none bg-transparent cursor-pointer"
                    >
                        <X size={18} />
                    </button>

                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full -ml-16 -mb-16 blur-3xl" />

                    <div className="w-14 h-14 md:w-16 md:h-16 bg-green-50 rounded-[18px] md:rounded-[20px] flex items-center justify-center mx-auto mb-3 md:mb-4 relative shadow-inner border-2 border-white">
                        <CheckCircle size={32} strokeWidth={1.5} className="text-green-600" />
                    </div>

                    <h1
                        data-testid="success-title"
                        className="text-lg md:text-xl font-black mb-1 text-gray-900 tracking-tight"
                    >
                        ¡Pedido exitoso!
                    </h1>
                    <p className="text-gray-500 text-[11px] md:text-[12px] font-medium mb-4 md:mb-6 leading-relaxed px-2 md:px-4">
                        Tu pedido{' '}
                        <span className="text-gray-900 font-black">
                            #{String(orderId).padStart(5, '0')}
                        </span>{' '}
                        ha sido recibido y ya estamos preparando tus sushis con amor.
                    </p>

                    <div className="flex flex-col gap-2.5 md:gap-3 relative z-10 text-left">
                        <div className="bg-gray-900 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 text-white shadow-2xl shadow-gray-900/20 mb-1 md:mb-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />

                            <h4 className="text-[8px] md:text-[9px] font-black uppercase text-white/30 tracking-widest mb-3 md:mb-4 border-b border-white/5 pb-2">
                                Resumen del Pedido
                            </h4>

                            <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 md:p-2 bg-white/10 rounded-lg md:rounded-xl text-orange-500 shrink-0">
                                        {isPickup ? (
                                            <Store size={14} />
                                        ) : isReservation ? (
                                            <Users size={14} />
                                        ) : (
                                            <MapPin size={14} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase text-white/40 tracking-widest leading-none mb-1">
                                            {isPickup
                                                ? 'Punto de Recogida'
                                                : isReservation
                                                  ? 'Reserva en'
                                                  : 'Entrega en'}
                                        </p>
                                        <p className="text-[12px] md:text-[13px] font-bold text-white leading-tight truncate">
                                            {isPickup || isReservation
                                                ? 'Calle Barrilero, 20'
                                                : `${address}${house ? `, ${house}` : ''}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2 border-t border-white/10 pt-3 md:pt-4">
                                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold text-white/50">
                                    <span className="uppercase tracking-wider">Productos</span>
                                    <span>{total.toFixed(2).replace('.', ',')} €</span>
                                </div>
                                {!isPickup && !isReservation && (
                                    <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold text-white/50">
                                        <span className="uppercase tracking-wider">Envío</span>
                                        <span
                                            className={
                                                Number(deliveryCost) <= 0 ? 'text-green-400' : ''
                                            }
                                        >
                                            {Number(deliveryCost) <= 0
                                                ? 'GRATIS'
                                                : `${Number(deliveryCost).toFixed(2).replace('.', ',')} €`}
                                        </span>
                                    </div>
                                )}
                                {Number(summary?.tipAmount) > 0 && (
                                    <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold text-white/50">
                                        <span className="uppercase tracking-wider">
                                            Propina equipo
                                        </span>
                                        <span>
                                            {Number(summary?.tipAmount)
                                                .toFixed(2)
                                                .replace('.', ',')}{' '}
                                            €
                                        </span>
                                    </div>
                                )}
                                {Number(summary?.discountAmount) > 0 && (
                                    <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold text-green-400">
                                        <span className="uppercase tracking-wider">Descuentos</span>
                                        <span>
                                            -
                                            {Number(summary?.discountAmount)
                                                .toFixed(2)
                                                .replace('.', ',')}{' '}
                                            €
                                        </span>
                                    </div>
                                )}
                                <div className="pt-2 md:pt-3 flex justify-between items-end">
                                    <span className="text-[9px] md:text-[10px] uppercase font-black text-white/40 tracking-widest">
                                        Total Pagado
                                    </span>
                                    <div className="text-xl md:text-2xl font-black text-white tracking-tighter leading-none">
                                        {(summary?.finalTotal !== undefined
                                            ? Number(summary.finalTotal)
                                            : Number(total) +
                                              (Number(deliveryCost) > 0 ? Number(deliveryCost) : 0)
                                        )
                                            .toFixed(2)
                                            .replace('.', ',')}
                                        <span className="text-xs text-orange-500 ml-1">€</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link
                            to={`/track/${orderId}?phone=${encodeURIComponent(phone || user?.phone || '')}`}
                            className="bg-orange-600 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[13px] md:text-[14px] no-underline text-center hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            Seguir mi pedido 🛵
                        </Link>

                        {whatsappUrl && (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[12px] md:text-[13px] hover:bg-[#1ebd59] transition-all transform active:scale-95 flex items-center justify-center gap-2 no-underline"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Confirmar WhatsApp
                            </a>
                        )}

                        {!isAuthenticated && (
                            <div className="bg-amber-50 border border-amber-200 p-3.5 md:p-4 rounded-xl md:rounded-2xl flex flex-col items-center">
                                <p className="text-[10px] md:text-[11px] text-amber-800 font-bold mb-2 md:mb-3 text-center leading-tight px-1">
                                    🎁 ¡Regístrate ahora y guarda tus direcciones para el próximo
                                    pedido!
                                </p>
                                <button
                                    onClick={() =>
                                        document.dispatchEvent(
                                            new CustomEvent('custom:openLogin', {
                                                detail: { mode: 'register' },
                                            })
                                        )
                                    }
                                    className="bg-gray-900 text-white w-full py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-[11px] md:text-[12px] hover:bg-black transition active:scale-95 uppercase tracking-wider border-none cursor-pointer"
                                >
                                    Crear cuenta
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
