import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, RefreshCcw, Shield } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useOrdersQuery } from '../../hooks/queries/useOrders';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import { Order } from '../../types';

function getStatusBadge(status: string, deliveryType?: string) {
    const isPickup = deliveryType === 'pickup';
    const styles: Record<string, { bg: string; color: string; label: string; icon?: string }> = {
        pending: {
            bg: 'bg-green-600',
            color: 'text-white',
            label: 'Pedido Realizado',
            icon: isPickup ? undefined : '📨',
        },
        received: {
            bg: 'bg-green-600',
            color: 'text-white',
            label: 'Pedido Realizado',
            icon: isPickup ? undefined : '👀',
        },
        confirmed: {
            bg: 'bg-green-700',
            color: 'text-white',
            label: 'Pedido Confirmado',
            icon: isPickup ? undefined : '✅',
        },
        preparing: {
            bg: 'bg-green-500',
            color: 'text-white',
            label: isPickup ? 'En preparación' : 'Entrega',
            icon: isPickup ? undefined : '👨‍🍳',
        },
        on_the_way: {
            bg: 'bg-green-500',
            color: 'text-white',
            label: isPickup ? 'Listo para Recoger' : 'Entrega',
            icon: isPickup ? undefined : '🛵',
        },
        delivered: {
            bg: 'bg-emerald-600',
            color: 'text-white',
            label: isPickup ? 'Pedido Entregado' : 'Pedido Entregado',
            icon: isPickup ? undefined : '🍱',
        },
        cancelled: {
            bg: 'bg-gray-400',
            color: 'text-white',
            label: 'Cancelado',
            icon: isPickup ? undefined : '❌',
        },
    };
    const s = styles[status] || styles.pending;
    return (
        <span
            className={`px-3 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-black/5 ${s.bg} ${s.color}`}
        >
            {s.icon && <span>{s.icon}</span>}
            {s.label}
        </span>
    );
}

export default function OrdersTab() {
    const navigate = useNavigate();
    const { addItem } = useCart();
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [isRepeating, setIsRepeating] = useState<string | null>(null);

    // Subscribe to real-time status updates via Supabase Broadcast
    useOrderRealtime({ userId: user?.id });

    const { data: ordersData, isLoading } = useOrdersQuery(page, 10);

    const orders = ordersData?.orders || [];
    const pagination = ordersData?.pagination || { page: 1, pages: 1, total: 0 };

    const handleRepeatOrder = async (order: Order) => {
        setIsRepeating(String(order.id));
        try {
            if (order.items) {
                // Filter out delivery fee before adding items to cart
                const itemsToRepeat = order.items.filter((item: any) => {
                    const isDeliveryFee =
                        item.name?.toLowerCase().includes('gastos') ||
                        item.name?.toLowerCase().includes('envío') ||
                        (item as any).menuItemId === -1 ||
                        (item as any).menu_item_id === -1 ||
                        (item as any).menuItemId === 0 ||
                        !(item as any).menuItemId;
                    return !isDeliveryFee;
                });

                for (const item of itemsToRepeat) {
                    await addItem(
                        {
                            id: String(item.menuItemId || item.id),
                            name: item.name,
                            description: item.description || '',
                            price: item.priceAtTime || item.price || 0,
                            image: item.image || '',
                            category: (item.category as any) || 'rollos-grandes',
                        },
                        item.quantity
                    );
                }
            }
            navigate('/cart');
        } catch (e) {
            alert('Error al repetir el pedido.');
        } finally {
            setIsRepeating(null);
        }
    };

    if (isLoading && page === 1) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 px-2 md:px-0 pb-10 text-center">
                <div className="px-4 md:px-1 border-b border-gray-100 pb-4 mb-2">
                    <div className="h-8 w-48 skeleton rounded-xl mb-2" />
                    <div className="h-4 w-64 skeleton rounded-lg opacity-40" />
                </div>
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="bg-white border border-gray-100 rounded-[30px] p-6 space-y-6"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="h-4 w-20 skeleton rounded" />
                                <div className="h-6 w-32 skeleton rounded-lg" />
                            </div>
                            <div className="h-10 w-24 skeleton rounded-2xl" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-full skeleton rounded opacity-50" />
                            <div className="h-4 w-2/3 skeleton rounded opacity-50" />
                        </div>
                        <div className="h-12 w-full skeleton rounded-2xl" />
                    </div>
                ))}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 px-2">
                <div className="text-4xl mb-4 grayscale opacity-30">📦</div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Sin pedidos aún</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-[200px] mx-auto leading-relaxed">
                    Tus pedidos aparecerán aquí una vez realices tu primera compra.
                </p>
                <button
                    onClick={() => navigate('/menu')}
                    className="bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100"
                >
                    Comenzar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-5 animate-in fade-in duration-500 pb-10 px-2 md:px-0">
            <div className="px-2 md:px-1 border-b border-gray-100 pb-4 mb-2">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight m-0">
                    Mis Pedidos
                </h2>
                <p className="text-gray-400 text-[10px] md:text-xs font-medium">
                    Historial y seguimiento en tiempo real
                </p>
            </div>

            <div className="space-y-3 md:space-y-4 px-2 md:px-0">
                {orders.map((order: Order) => (
                    <div
                        key={order.id}
                        onClick={() =>
                            navigate(
                                `/track/${order.id}?phone=${encodeURIComponent(order.phoneNumber)}`
                            )
                        }
                        className="bg-white border border-white md:border-gray-100 rounded-[28px] md:rounded-[30px] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer group/card"
                    >
                        {/* Header: More compact, no background */}
                        <div className="px-3 md:px-5 pt-4 md:pt-5 pb-2 md:pb-3 flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        #
                                        {typeof order.id === 'string' && order.id.includes('-')
                                            ? order.id.slice(0, 8).toUpperCase()
                                            : String(order.id).padStart(5, '0')}
                                    </span>
                                    {getStatusBadge(order.status, order.deliveryType)}
                                </div>
                                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-gray-400 opacity-80">
                                    <Clock size={10} strokeWidth={1.5} />
                                    {(() => {
                                        const d = new Date(order.createdAt);
                                        const validDate = isNaN(d.getTime())
                                            ? new Date(
                                                  order.createdAt.replace(' ', 'T') +
                                                      (order.createdAt.includes('Z') ||
                                                      order.createdAt.includes('+')
                                                          ? ''
                                                          : 'Z')
                                              )
                                            : d;
                                        return validDate.toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        });
                                    })()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    to={`/track/${order.id}?phone=${encodeURIComponent(order.phoneNumber)}`}
                                    onClick={e => e.stopPropagation()}
                                    className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-xl border border-gray-100 flex items-center gap-1.5 shadow-sm text-[9px] md:text-[10px] font-black hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all no-underline"
                                >
                                    <span>👁️</span>
                                    Detalles
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="px-3 md:px-5 pb-4 flex items-end justify-between border-b border-gray-50/50">
                            <div>
                                <div className="text-xl md:text-2xl font-black text-gray-900 flex items-baseline gap-0.5 tracking-tighter">
                                    {order.total.toFixed(2).replace('.', ',')}
                                    <span className="text-xs text-orange-600 font-black">€</span>
                                </div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                    {order.items?.reduce(
                                        (s: number, i: any) => s + i.quantity,
                                        0
                                    ) ?? 0}{' '}
                                    unidades
                                </span>
                            </div>
                        </div>

                        {/* Items List: Minimal, no extra background */}
                        <div className="px-3 md:px-5 py-4 md:py-5 space-y-3">
                            <div className="space-y-2">
                                {order.items?.map((item: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 shrink-0 w-4 text-center">
                                                {item.quantity}
                                            </span>
                                            <span className="text-[11px] md:text-xs font-bold text-gray-600 truncate opacity-80 group-hover:opacity-100">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-[11px] md:text-xs font-black text-gray-300 shrink-0 tabular-nums">
                                            {(item.priceAtTime * item.quantity)
                                                .toFixed(2)
                                                .replace('.', ',')}{' '}
                                            €
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {order.deliveryFee && order.deliveryFee > 0 ? (
                                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] md:text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                                        Gastos de Envío
                                    </span>
                                    <span className="font-black text-gray-500">
                                        {order.deliveryFee.toFixed(2).replace('.', ',')} €
                                    </span>
                                </div>
                            ) : null}

                            {order.notes && (
                                <div className="mt-2 py-2 px-3 bg-amber-50/50 rounded-xl border-l-2 border-amber-300 flex items-start gap-2">
                                    <Shield
                                        size={10}
                                        strokeWidth={1.5}
                                        className="text-amber-500 shrink-0 mt-0.5"
                                    />
                                    <p className="text-[9px] md:text-[10px] font-bold text-amber-700 m-0 leading-relaxed italic opacity-90">
                                        {order.notes}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    handleRepeatOrder(order);
                                }}
                                disabled={isRepeating === order.id}
                                className={`mt-3 w-full h-10 md:h-11 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all flex items-center justify-center gap-2
                                    ${
                                        isRepeating === order.id
                                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                                            : 'bg-gray-900 text-white hover:bg-orange-600 shadow-xl shadow-gray-100 hover:shadow-orange-200 active:scale-[0.98]'
                                    }`}
                            >
                                <RefreshCcw
                                    size={14}
                                    strokeWidth={1.5}
                                    className={isRepeating === order.id ? 'animate-spin' : ''}
                                />
                                {isRepeating === order.id ? 'Añadiendo...' : 'Repetir'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-xl font-black text-[11px] transition-all
                                ${
                                    p === pagination.page
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                                        : 'bg-white border border-gray-100 text-gray-400'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
