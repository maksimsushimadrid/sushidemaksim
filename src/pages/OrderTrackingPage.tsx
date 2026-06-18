import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Package, MapPin, Phone, Info, ChevronLeft, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import { TrackSkeleton } from '../components/skeletons/TrackSkeleton';
import OrderStepper from '../components/OrderStepper';
import { Order, OrderItem } from '../types';
import { useOrderRealtime } from '../hooks/useOrderRealtime';
import { getSharpAvatar } from '../utils/avatar';
import SafeImage from '../components/common/SafeImage';

export default function OrderTrackingPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const phone = searchParams.get('phone') || '';

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = useCallback(async () => {
        try {
            const data = await api.get(`/orders/track/${id}?phone=${encodeURIComponent(phone)}`);
            setOrder(data.order);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Error al obtener el pedido');
        } finally {
            setLoading(false);
        }
    }, [id, phone]);

    // Replace polling with Real-time listener
    useOrderRealtime({ orderId: id, onUpdate: fetchOrder });

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    if (loading || (!order && !error)) {
        return <TrackSkeleton />;
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center p-6">
                <SEO
                    title="404 - Página no encontrada | Sushi de Maksim"
                    description="La página que buscas no existe. Vuelve a la carta de Sushi de Maksim para disfrutar de la mejor gastronomía japonesa."
                    robots="noindex, nofollow"
                />
                <div className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl text-center border border-gray-100">
                    <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner border-2 border-white">
                        🔍
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                        {error ? 'Error en el seguimiento' : 'Pedido no encontrado'}
                    </h1>
                    <p className="text-gray-500 font-medium mb-10 leading-relaxed italic">
                        {error ||
                            'No hemos podido encontrar tu pedido. Comprueba el número y el teléfono.'}
                    </p>
                    <button
                        onClick={() => navigate('/menu')}
                        className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100"
                    >
                        Volver a la carta
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBF7F0] pb-20">
            <SEO
                title={`Seguimiento Pedido #${id}`}
                description="Sigue el estado de tu pedido de Sushi de Maksim en tiempo real."
                robots="noindex, nofollow"
            />

            <div className="max-w-4xl mx-auto px-2 md:px-4 pt-10">
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-gray-400 hover:text-orange-600 transition-colors mb-8 font-black text-xs uppercase tracking-widest"
                >
                    <ChevronLeft
                        size={18}
                        strokeWidth={1.5}
                        className="transition-transform group-hover:-translate-x-1"
                    />
                    Volver
                </button>

                <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-orange-100/30 border border-gray-100">
                    {/* Header with gradient */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-800 p-8 md:p-12 text-white">
                        {/* Abstract Background pattern */}
                        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="10" cy="10" r="30" fill="gray" />
                                <circle cx="90" cy="90" r="40" fill="gray" />
                            </svg>
                        </div>

                        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                                    <Package size={12} strokeWidth={2.5} />
                                    Enlace de seguimiento
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black m-0 tracking-tighter decoration-white/20 underline underline-offset-8">
                                    Pedido #
                                    {typeof order.id === 'string' && order.id.includes('-')
                                        ? order.id.slice(0, 8).toUpperCase()
                                        : String(order.id).padStart(5, '0')}
                                </h1>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 min-w-[140px] text-center md:text-right transition-all">
                                <span className="block text-[10px] uppercase font-black tracking-widest opacity-80 mb-1 whitespace-nowrap">
                                    {(order.estimatedDeliveryTime?.includes(':') &&
                                        !order.estimatedDeliveryTime?.includes('-')) ||
                                    order.notes?.includes('[PROGRAMADO:')
                                        ? 'Programado para'
                                        : 'Entrega Estimada'}
                                </span>
                                <span className="text-xl md:text-2xl font-black whitespace-nowrap">
                                    {(() => {
                                        const val = order.estimatedDeliveryTime || '30-45 min';
                                        if (
                                            val.includes('-') &&
                                            val.includes(' ') &&
                                            val.split(' ')[0].split('-').length === 3
                                        ) {
                                            const parts = val.split(' ');
                                            const [date, time] = parts;
                                            const [y, m, d] = date.split('-');
                                            if (y && y.length === 4) {
                                                return `${d}-${m}-${y} ${time}`;
                                            }
                                        }
                                        return val;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-1 py-8 md:p-12">
                        {/* Status Stepper Header */}
                        <div className="mb-8 px-4 text-center md:text-left">
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-2">
                                Estado del pedido
                            </h2>
                            <div className="text-xs text-gray-500 font-medium flex-col md:flex-row flex items-center justify-center md:justify-start gap-1.5 opacity-80">
                                <div className="flex items-center gap-1.5">
                                    <Info size={14} className="text-green-500" />
                                    <span>
                                        Consulta aquí el progreso de tu sushi en tiempo real.
                                    </span>
                                </div>
                                {(order.status === 'received' || order.status === 'pending') && (
                                    <span className="mt-1 font-bold text-green-600 underline md:mt-0 md:ml-1 underline-offset-4 decoration-green-200">
                                        Gracias por tu pedido. Un gestor se pondrá en contacto
                                        contigo en breve para confirmarlo.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Status Stepper */}
                        <div className="mb-10">
                            <OrderStepper
                                currentStatus={order.status}
                                estimatedTime={order.estimatedDeliveryTime}
                                deliveryType={order.deliveryType}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Order Info */}
                            <div className="space-y-8">
                                {order.users && (
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                                        <div
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg overflow-hidden shrink-0 shadow-sm border-2 border-white
                                                        ${order.users.avatar?.startsWith('http') ? 'bg-gray-100' : order.users.avatar ? 'bg-gray-100 text-2xl' : 'bg-orange-600'}`}
                                        >
                                            {order.users.avatar ? (
                                                order.users.avatar.startsWith('http') ? (
                                                    <SafeImage
                                                        src={order.users.avatar}
                                                        getOptimizedUrl={getSharpAvatar}
                                                        alt={order.users.name}
                                                        className="w-full h-full object-cover"
                                                        fallbackContent={
                                                            <span className="select-none text-xl text-gray-900">
                                                                {order.users.name.split(' ')[0][0] +
                                                                    (order.users.name.split(
                                                                        ' '
                                                                    )[1]?.[0] || '')}
                                                            </span>
                                                        }
                                                    />
                                                ) : (
                                                    <span className="select-none">
                                                        {order.users.avatar}
                                                    </span>
                                                )
                                            ) : (
                                                <span className="select-none text-xl">
                                                    {order.users.name.split(' ')[0][0] +
                                                        (order.users.name.split(' ')[1]?.[0] || '')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-0.5">
                                                Cliente
                                            </span>
                                            <h4 className="font-black text-gray-900 leading-tight">
                                                {order.users.name}
                                            </h4>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                {order.users.email}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
                                        <MapPin
                                            size={18}
                                            strokeWidth={1.5}
                                            className="text-orange-600"
                                        />
                                        {order.deliveryAddress === 'RECOGIDA' ||
                                        order.deliveryType === 'pickup'
                                            ? 'Punto de recogida'
                                            : 'Dirección de entrega'}
                                    </h3>
                                    <p className="text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        {order.deliveryAddress === 'RECOGIDA' ||
                                        order.deliveryType === 'pickup'
                                            ? 'Calle Barrilero, 20, 28007 Madrid'
                                            : order.deliveryAddress}
                                    </p>
                                </div>

                                {order.notes && (
                                    <div>
                                        <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
                                            <Info
                                                size={18}
                                                strokeWidth={1.5}
                                                className="text-amber-500"
                                            />
                                            Notas del pedido
                                        </h3>
                                        <p className="text-amber-700 font-medium text-sm leading-relaxed bg-amber-50 p-4 rounded-2xl border border-amber-100 italic">
                                            {(() => {
                                                if (!order.notes) return '';
                                                return order.notes.replace(
                                                    /\[PROGRAMADO: (\d{4})-(\d{2})-(\d{2}) (.*?)\]/g,
                                                    '[PROGRAMADO: $3-$2-$1 $4]'
                                                );
                                            })()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gray-50 rounded-[32px] px-2.5 py-6 md:p-8 border border-white shadow-inner self-start">
                                <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest mb-6">
                                    <Package
                                        size={18}
                                        strokeWidth={1.5}
                                        className="text-gray-400"
                                    />
                                    Resumen del pedido
                                </h3>

                                <div className="space-y-4 mb-8">
                                    {order.items?.map((item: OrderItem, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between items-center text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 bg-white rounded-md flex items-center justify-center font-black text-[10px] text-orange-600 shadow-sm shrink-0">
                                                    {item.quantity}
                                                </span>
                                                <span className="font-bold text-gray-700 text-xs md:text-sm">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span className="font-black text-gray-400">
                                                {(item.priceAtTime * item.quantity)
                                                    .toFixed(2)
                                                    .replace('.', ',')}{' '}
                                                €
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {order.deliveryFee && order.deliveryFee > 0 ? (
                                    <div className="pt-4 mb-2 flex justify-between items-center text-sm font-bold text-gray-500">
                                        <span className="uppercase tracking-widest text-[10px]">
                                            Gastos de Envío
                                        </span>
                                        <span>
                                            {order.deliveryFee.toFixed(2).replace('.', ',')} €
                                        </span>
                                    </div>
                                ) : null}

                                <div className="pt-6 border-t border-gray-200 flex justify-between items-end">
                                    <span className="text-xs uppercase font-black text-gray-400 tracking-widest">
                                        Total pagado
                                    </span>
                                    <div className="text-3xl font-black text-gray-900 tracking-tighter">
                                        {Number(order.total).toFixed(2).replace('.', ',')}
                                        <span className="text-sm text-orange-600 ml-1">€</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Help */}
                        <div className="mt-16 pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                    <Phone size={24} strokeWidth={1.5} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        ¿Dudas? Contáctanos
                                    </span>
                                    <span className="font-black text-gray-900">
                                        +34 631 920 312
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/menu')}
                                className="group flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-100"
                            >
                                Seguir comprando
                                <ArrowRight
                                    size={18}
                                    strokeWidth={1.5}
                                    className="transition-transform group-hover:translate-x-1"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
