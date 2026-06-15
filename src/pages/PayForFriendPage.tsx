import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, ArrowRight, XCircle, CreditCard, Heart } from 'lucide-react';
import { api, ApiError } from '../utils/api';
import SEO from '../components/SEO';
import { getOptimizedImageUrl } from '../utils/images';
import { SITE_URL } from '../constants/config';

import { GenericSkeleton } from '../components/skeletons/GenericSkeleton';

interface OrderItem {
    id: number;
    name: string;
    quantity: number;
    priceAtTime: number;
    image: string;
}

interface Order {
    id: number;
    total: number;
    status: string;
    deliveryAddress: string;
    notes: string;
    items: OrderItem[];
    users?: {
        name: string;
        avatar: string | null;
    };
}

export default function PayForFriendPage() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Get current domain for OG tags
    const origin = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
    const invitationUrl = `${origin}/pay-for-friend/${id}`;
    const hungryPandaUrl = `${origin}/hungry-panda.webp`;

    useEffect(() => {
        loadOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadOrder = async () => {
        setIsLoading(true);
        try {
            const data = await api.get(`/orders/public/${id}`);
            setOrder(data.order);
        } catch (err: any) {
            setError(err instanceof ApiError ? err.message : 'No se pudo cargar la invitación.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!order) return;
        setIsProcessing(true);
        try {
            await api.post(`/orders/${order.id}/confirm-payment`);
            setShowSuccess(true);
            // Vibrate on success
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        } catch (err: any) {
            setError(err instanceof ApiError ? err.message : 'Error al confirmar el pago.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return <GenericSkeleton />;
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#FBF7F0]">
                <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl text-center border border-gray-100">
                    <XCircle size={64} strokeWidth={1.5} className="text-orange-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black mb-4 text-gray-900">
                        ¡Vaya! Algo salió mal
                    </h2>
                    <p className="text-gray-500 mb-8">
                        {error || 'Esta invitación no existe o ya ha sido pagada.'}
                    </p>
                    <Link
                        to="/menu"
                        className="inline-block bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold no-underline hover:bg-gray-800 transition animate-in fade-in"
                    >
                        Ir a la carta
                    </Link>
                </div>
            </div>
        );
    }

    // Extract sender name from notes if present [De parte de: Name]
    const senderMatch = order.notes?.match(/\[De parte de: (.*?)\]/);
    const senderName = senderMatch ? senderMatch[1] : 'Tu amigo(a)';

    return (
        <div className="min-h-screen bg-[#FBF7F0] py-8 md:py-16 px-2 md:px-4">
            <SEO
                title={`¡Invita a ${senderName}! 🎁`}
                description={`Te ha enviado esta propuesta de Sushi de Maksim. ¡Sorpréndele con su pedido favorito! 🍣✨`}
                image={hungryPandaUrl}
                url={invitationUrl}
            />

            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100"
                >
                    {/* Hero Section */}
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 md:p-12 text-center text-white relative">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="grid grid-cols-4 gap-4 p-4 opacity-50">
                                {[...Array(8)].map((_, i) => (
                                    <span key={i} className="text-4xl text-center">
                                        🍣
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: 'spring', delay: 0.1 }}
                                className="relative mb-6"
                            >
                                <div
                                    className={`w-32 h-32 mx-auto rounded-[32px] flex items-center justify-center text-white font-black text-3xl overflow-hidden shadow-2xl border-4 border-white
                                        ${order.users?.avatar?.startsWith('http') ? 'bg-gray-100' : order.users?.avatar ? 'bg-gray-100 dark:text-gray-900' : 'bg-orange-600'}`}
                                >
                                    {order.users?.avatar ? (
                                        order.users.avatar.startsWith('http') ? (
                                            <img
                                                src={getOptimizedImageUrl(order.users.avatar, 200)}
                                                alt={order.users.name}
                                                className="w-full h-full object-cover"
                                                onError={e => {
                                                    (
                                                        e.currentTarget as HTMLImageElement
                                                    ).style.display = 'none';
                                                    e.currentTarget.parentElement!.innerText = (
                                                        order.users!.name || '?'
                                                    )
                                                        .split(' ')
                                                        .filter(Boolean)
                                                        .map((n: string) => n[0])
                                                        .join('')
                                                        .toUpperCase()
                                                        .slice(0, 2);
                                                }}
                                            />
                                        ) : (
                                            <span className="select-none">
                                                {order.users.avatar}
                                            </span>
                                        )
                                    ) : (
                                        <span className="select-none uppercase">
                                            {(order.users?.name || senderName)
                                                .split(' ')
                                                .filter(Boolean)
                                                .map((n: string) => n[0])
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </span>
                                    )}
                                </div>
                                <motion.div
                                    initial={{ scale: 0, rotate: 10 }}
                                    animate={{ scale: 1, rotate: -5 }}
                                    transition={{ delay: 0.6, type: 'spring' }}
                                    className="absolute -top-4 right-1/2 translate-x-16 bg-orange-600 text-white text-[11px] font-black px-3 py-1.5 rounded-2xl shadow-xl border-2 border-white whitespace-nowrap"
                                >
                                    ¡TENGO HAMBRE! 🐼
                                </motion.div>
                            </motion.div>
                            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                                ¡Momento de invitar!
                            </h1>
                            <p className="text-white/90 font-medium text-lg">
                                <span className="underline decoration-white/40 decoration-2">
                                    {senderName}
                                </span>{' '}
                                ha seleccionado sus platos favoritos.
                            </p>
                        </div>
                    </div>

                    <div className="px-2 py-8 md:p-10">
                        {/* Summary */}
                        <div className="mb-10">
                            <h2 className="text-xs uppercase font-black text-gray-400 tracking-widest mb-6 flex items-center gap-2">
                                <div className="h-0.5 w-4 bg-gray-200" /> Los platos elegidos
                            </h2>
                            <div className="space-y-4">
                                {order.items.map(item => {
                                    // Ensure image URL is absolute for nested routes
                                    const itemImage =
                                        item.image && typeof item.image === 'string'
                                            ? item.image.startsWith('http')
                                                ? item.image
                                                : item.image.startsWith('/')
                                                  ? item.image
                                                  : `/${item.image}`
                                            : '/api/placeholder/100/100';

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 group"
                                        >
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                                                <img
                                                    src={getOptimizedImageUrl(itemImage, 200)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={e => {
                                                        (e.target as HTMLImageElement).src =
                                                            '/placeholder-sushi.webp';
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-gray-900 text-xs md:text-sm leading-tight mb-0.5">
                                                    {item.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {item.quantity} ud{item.quantity > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <p className="font-black text-gray-900 text-xs md:text-sm">
                                                {(item.priceAtTime * item.quantity)
                                                    .toFixed(2)
                                                    .replace('.', ',')}{' '}
                                                €
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                                <div className="flex justify-between items-center bg-gray-50 p-6 rounded-3xl">
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                            Total a pagar
                                        </p>
                                        <p className="text-2xl md:text-3xl font-black text-orange-600 tracking-tighter">
                                            {order.total.toFixed(2).replace('.', ',')} €
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
                                            <MapPin
                                                size={14}
                                                strokeWidth={1.5}
                                                className="text-orange-500"
                                            />{' '}
                                            Entrega en:
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium max-w-[150px] leading-tight">
                                            {order.deliveryAddress}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Button Simulation */}
                        <div className="relative">
                            <button
                                onClick={handleConfirmPayment}
                                disabled={isProcessing}
                                className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-gray-200 hover:bg-black transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    'Procesando...'
                                ) : (
                                    <>
                                        <CreditCard size={24} strokeWidth={1.5} />
                                        <span>Confirmar y Pagar</span>
                                        <ArrowRight
                                            size={20}
                                            strokeWidth={1.5}
                                            className="opacity-50"
                                        />
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[11px] text-gray-400 mt-4 font-medium italic">
                                * Este es un pedido especial. Al pagar, el restaurante recibirá el
                                pedido inmediatamente.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Secure Badge */}
                <div className="flex items-center justify-center gap-2 mt-8 text-gray-400 grayscale">
                    <CheckCircle size={16} strokeWidth={1.5} />
                    <span className="text-[10px] uppercase font-black tracking-widest">
                        Pago 100% Seguro
                    </span>
                </div>
            </div>

            {/* Success Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="w-32 h-32 bg-green-500 rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-200"
                        >
                            <Heart size={64} strokeWidth={1.5} />
                        </motion.div>

                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">
                            ¡Eres Genial! 🌟
                        </h2>
                        <p className="text-xl text-gray-500 max-w-sm mx-auto mb-10 leading-relaxed">
                            Has pagado el pedido de{' '}
                            <span className="text-gray-900 font-bold">{senderName}</span>. Seguro
                            que le has alegrado el día.
                        </p>

                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <Link
                                to="/menu"
                                className="bg-orange-600 text-white py-4 rounded-2xl font-black no-underline shadow-xl shadow-orange-100 hover:bg-orange-700 transition transform active:scale-90"
                            >
                                Pedir sushi para mí 🍣
                            </Link>
                            <p className="text-gray-400 text-sm">
                                Gracias por usar Sushi de Maksim
                            </p>
                        </div>

                        {/* Small confetti effect simulation */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        top: '100%',
                                        left: `${Math.random() * 100}%`,
                                        rotate: 0,
                                    }}
                                    animate={{
                                        top: '-10%',
                                        rotate: 360,
                                        left: `${Math.random() * 100}%`,
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 3,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        delay: Math.random() * 2,
                                    }}
                                    className="absolute text-2xl opacity-20"
                                >
                                    ✨
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
