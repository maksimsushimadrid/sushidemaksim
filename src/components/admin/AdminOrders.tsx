import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Package,
    Search,
    RefreshCw,
    Smartphone,
    Monitor,
    Globe,
    Volume2,
    VolumeX,
    Wallet,
    ShoppingCart,
    Clock,
    X,
    MessageSquare,
    Store,
    Truck,
    Activity,
    ChefHat,
    Printer,
    ExternalLink,
} from 'lucide-react';
import { api, ApiError } from '../../utils/api';
import { cn } from '../../utils/cn';
import { useToast } from '../../context/ToastContext';
import { Order, OrderItem } from '../../types';
import { AdminOrdersSkeleton } from '../skeletons/AdminOrdersSkeleton';
import { UserAnalyticsTooltip } from './UserAnalyticsTooltip';
import { memo, useRef } from 'react';

// Wrap the order item in a memo component to prevent unnecessary re-renders of the whole list when hovering a name
const OrderRowName = memo(
    ({ name, stats, language }: { name: string; stats: any; language: 'ru' | 'es' }) => {
        const [showTooltip, setShowTooltip] = useState(false);
        const triggerRef = useRef<HTMLDivElement>(null);
        return (
            <div
                ref={triggerRef}
                className="relative group/name cursor-help inline-block"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <p className="font-black text-gray-900 text-[16px] truncate leading-tight mb-1 group-hover/name:text-orange-600 transition-colors">
                    {name}
                </p>
                <UserAnalyticsTooltip
                    isVisible={showTooltip}
                    language={language}
                    triggerRef={triggerRef}
                    stats={{
                        orderCount: stats?.orderCount || 0,
                        totalSpent: stats?.totalSpent || 0,
                        avgCheck: stats?.avgCheck || 0,
                        frequency: stats?.frequency || 'N/A',
                        favoriteDish: stats?.favoriteDish || 'N/A',
                        registrationDate: stats?.registrationDate,
                    }}
                />
            </div>
        );
    }
);

interface AdminOrdersProps {
    isGlobalSoundEnabled: boolean;
    setIsGlobalSoundEnabled: (enabled: boolean) => void;
    onTestSound?: (type?: 'delivery' | 'mesa') => void;
    globalPendingCount: number;
    language?: 'ru' | 'es';
    onPrintOrder?: (order: Order) => void;
}

const ORDERS_TRANSLATIONS = {
    ru: {
        searchPlaceholder: 'Поиск ID, Тел, Промо...',
        soundOn: 'Выключить звук',
        soundOff: 'Включить звук',
        refresh: 'Обновить',
        testSound: 'Проверить звук (Зал)',
        filters: {
            active: 'ВСЕ АКТИВНЫЕ',
            unpaid: 'Ожидание оплаты',
            preparing: 'Кухня',
            on_the_way: 'В пути',
            delivered: 'Доставлены',
            cancelled: 'Отменены',
            all: 'Все',
        },
        errorLoading: 'Ошибка при загрузке заказов',
        noOrders: 'Заказы не найдены.',
        loadingOrders: 'Загрузка заказов...',
        printReceipt: 'Печать чека',
        orderId: 'Заказ #',
        total: 'Итого',
        clientContact: 'Клиент и контакт',
        regDate: 'РЕГ.',
        guest: 'Гость',
        whatsapp: 'WHATSAPP',
        userStats: {
            orders: 'Заказов',
            invested: 'Вложено',
            avgTicket: 'Ср. чек',
            frequency: 'Частота',
            favorite: 'Любимое блюдо',
            firstOrder: 'Первый заказ',
        },
        deliveryAddress: 'Адрес доставки',
        types: {
            recogida: 'САМОВЫВОЗ',
            domicilio: 'ДОСТАВКА',
            scheduled: 'ЗАКАЗ КО ВРЕМЕНИ',
            noCall: 'БЕЗ ЗВОНКА',
            noBuzzer: 'В ТЕЛЕФОН (НЕ ЗВОНОК)',
            mesa: 'СТОЛ',
        },
        clientMessage: 'Сообщение от клиента',
        products: 'Товары',
        deliveryFee: 'Доставка',
        orderStatus: 'Статус заказа',
        origin: 'Источник',
        webDirect: 'Веб-сайт',
        statusNames: {
            waiting_payment: 'Ожидание оплаты',
            pending: 'Оформлен (Система)',
            received: 'Заказ оформлен',
            confirmed: 'Заказ подтвержден',
            preparing: 'Доставка (Кухня)',
            on_the_way: 'Доставка (В пути)',
            delivered: 'Заказ доставлен',
            cancelled: 'Отменен',
        },
        statusNamesMesa: {
            waiting_payment: 'Ожидание оплаты',
            pending: 'Оформлен (Система)',
            received: 'Заказ оформлен',
            confirmed: 'Заказ подтвержден',
            preparing: 'Кухня (Зал)',
            on_the_way: 'Зал (Подача)',
            delivered: 'Заказ подан',
            cancelled: 'Отменен',
        },
        corruptOrder: 'ОШИБКА: ЗАКАЗ БЕЗ ТОВАРОВ',
        corruptOrderDesc: 'Этот заказ был прерван при создании. Пожалуйста, свяжитесь с клиентом.',
        discount: 'Скидка',
    },
    es: {
        searchPlaceholder: 'Buscar ID, Teléfono, Promo...',
        soundOn: 'Desactivar sonido',
        soundOff: 'Activar sonido',
        refresh: 'Actualizar',
        testSound: 'Probar sonido (Sala)',
        filters: {
            active: 'TODO ACTIVO',
            unpaid: 'Por Pagar',
            preparing: 'Cocina',
            on_the_way: 'En Camino',
            delivered: 'Entregados',
            cancelled: 'Cancelados',
            all: 'Todos',
        },
        errorLoading: 'Error al cargar los pedidos',
        noOrders: 'No se encontraron pedidos.',
        loadingOrders: 'Cargando pedidos...',
        printReceipt: 'Imprimir Ticket',
        orderId: 'Pedido #',
        total: 'Total',
        clientContact: 'Cliente y Contacto',
        regDate: 'REG.',
        guest: 'Invitado',
        whatsapp: 'WHATSAPP',
        userStats: {
            orders: 'Pedidos',
            invested: 'Invertido',
            avgTicket: 'Ticket Medio',
            frequency: 'Frecuencia',
            favorite: 'Plato Favorito',
            firstOrder: 'Primer pedido',
        },
        deliveryAddress: 'Dirección de Entrega',
        types: {
            recogida: 'RECOGIDA',
            domicilio: 'DOMICILIO',
            scheduled: 'ENTREGA PROGRAMADA',
            noCall: 'SIN LLAMADA',
            noBuzzer: 'MÓVIL (NO TIMBRE)',
            mesa: 'MESA',
        },
        clientMessage: 'Mensaje del Cliente',
        products: 'Productos',
        deliveryFee: 'Gastos de Envío',
        orderStatus: 'Estado del Pedido',
        origin: 'Origen',
        webDirect: 'Web Directa',
        statusNames: {
            waiting_payment: 'Esperando Pago',
            pending: 'Realizado (Sistema)',
            received: 'Pedido Realizado',
            confirmed: 'Pedido Confirmado',
            preparing: 'Entrega (Cocina)',
            on_the_way: 'Entrega (En camino)',
            delivered: 'Pedido Entregado',
            cancelled: 'Cancelado',
        },
        statusNamesMesa: {
            waiting_payment: 'Esperando Pago',
            pending: 'Realizado (Sistema)',
            received: 'Pedido Realizado',
            confirmed: 'Pedido Confirmado',
            preparing: 'Cocina (Sala)',
            on_the_way: 'Sala (Servir)',
            delivered: 'Pedido Servido',
            cancelled: 'Cancelado',
        },
        corruptOrder: 'ERROR: PEDIDO SIN PRODUCTOS',
        corruptOrderDesc:
            'Este pedido se interrumpió durante su creación. Por favor, contacte con el cliente.',
        discount: 'Descuento',
    },
} as const;

export default function AdminOrders({
    isGlobalSoundEnabled,
    setIsGlobalSoundEnabled,
    onTestSound,
    globalPendingCount,
    language = 'es',
    onPrintOrder,
}: AdminOrdersProps) {
    const queryClient = useQueryClient();
    const { success } = useToast();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('active');
    const [page, setPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const t = ORDERS_TRANSLATIONS[language];
    const dateLocale = language === 'ru' ? 'ru-RU' : 'es-ES';

    const LIMIT = 10;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Map frontend filters to backend status strings
    const filterMap: Record<string, string> = {
        active: 'pending,received,confirmed,preparing,on_the_way',
        unpaid: 'waiting_payment',
        preparing: 'confirmed,preparing',
        on_the_way: 'on_the_way',
        delivered: 'delivered',
        cancelled: 'cancelled',
        all: '',
    };

    // Orders Query
    const {
        data,
        isLoading,
        error: fetchError,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['admin-orders', page, filter, debouncedSearch],
        queryFn: async () => {
            let url = `/admin/orders?page=${page}&limit=${LIMIT}`;
            if (debouncedSearch) {
                url += `&search=${encodeURIComponent(debouncedSearch)}`;
            }
            const statusParam = filterMap[filter];
            if (statusParam) {
                url += `&status=${statusParam}`;
            }
            return await api.get(url);
        },
        refetchInterval: 30000, // Automagical polling every 30s
    });

    const orders = data?.orders || [];
    const pagination = data?.pagination || { page: 1, limit: LIMIT, total: 0, pages: 1 };

    // Update Status Mutation
    const statusMutation = useMutation({
        mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
            api.patch(`/admin/orders/${id}/status`, { status: newStatus }),
        onMutate: async () => {
            // Optimistic update
            await queryClient.cancelQueries({
                queryKey: ['admin-orders', page, filter, debouncedSearch],
            });
            const previousData = queryClient.getQueryData([
                'admin-orders',
                page,
                filter,
                debouncedSearch,
            ]);

            return { previousData };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
    });

    const handleUpdateStatus = (id: string, newStatus: string) => {
        statusMutation.mutate({ id, newStatus });
    };

    const statusOptions = [
        {
            value: 'waiting_payment',
            label: t.statusNames.waiting_payment,
            color: 'bg-gray-50 text-gray-500 border-gray-200',
        },
        {
            value: 'pending',
            label: t.statusNames.pending,
            color: 'bg-green-50 text-green-700 border-green-200',
        },
        {
            value: 'received',
            label: t.statusNames.received,
            color: 'bg-green-50 text-green-700 border-green-200',
        },
        {
            value: 'confirmed',
            label: t.statusNames.confirmed,
            color: 'bg-green-100 text-green-800 border-green-200',
        },
        {
            value: 'preparing',
            label: t.statusNames.preparing,
            color: 'bg-green-500 text-white border-green-600',
        },
        {
            value: 'on_the_way',
            label: t.statusNames.on_the_way,
            color: 'bg-green-600 text-white border-green-700',
        },
        {
            value: 'delivered',
            label: t.statusNames.delivered,
            color: 'bg-emerald-600 text-white border-emerald-700',
        },
        {
            value: 'cancelled',
            label: t.statusNames.cancelled,
            color: 'bg-gray-100 text-gray-400 border-gray-200',
        },
    ];

    const formatCurrency = (amount: number) => {
        return Number(amount).toFixed(2).replace('.', ',') + ' €';
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-96 flex-shrink-0">
                            <Search
                                size={18}
                                strokeWidth={2}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder={t.searchPlaceholder}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 focus:outline-none transition-all placeholder:text-gray-400"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors p-1"
                                >
                                    <X size={16} strokeWidth={2} />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => {
                                    const newVal = !isGlobalSoundEnabled;
                                    setIsGlobalSoundEnabled(newVal);
                                    if (newVal && onTestSound) {
                                        onTestSound();
                                    }
                                }}
                                className={`flex-1 sm:flex-none flex items-center justify-center p-3 rounded-xl transition-all border shadow-sm active:scale-95 ${
                                    isGlobalSoundEnabled
                                        ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white'
                                        : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                                title={isGlobalSoundEnabled ? t.soundOn : t.soundOff}
                            >
                                {isGlobalSoundEnabled ? (
                                    <Volume2 size={20} strokeWidth={2} />
                                ) : (
                                    <VolumeX size={20} strokeWidth={2} />
                                )}
                            </button>
                            <button
                                onClick={() => onTestSound?.('mesa')}
                                className="flex-[2] sm:flex-none flex items-center justify-center px-4 py-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                title="Test: Mesa (3 dings)"
                            >
                                {t.testSound}
                            </button>
                            <button
                                onClick={() => refetch()}
                                className="flex-1 sm:flex-none flex items-center justify-center p-3 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all shadow-sm active:scale-95"
                                title={t.refresh}
                            >
                                <RefreshCw
                                    size={20}
                                    strokeWidth={2}
                                    className={isFetching ? 'animate-spin' : ''}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-gray-50/50 p-1.5 rounded-2xl w-full overflow-x-auto no-scrollbar border border-gray-50 shadow-inner">
                    <div className="flex gap-1 min-w-max">
                        {[
                            {
                                id: 'active',
                                label: t.filters.active,
                                badge: globalPendingCount > 0,
                            },
                            { id: 'preparing', label: t.filters.preparing },
                            { id: 'delivered', label: t.filters.delivered },
                            { id: 'cancelled', label: t.filters.cancelled },
                            { id: 'all', label: t.filters.all },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setFilter(tab.id);
                                    setPage(1);
                                }}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative active:scale-95 ${
                                    filter === tab.id
                                        ? 'bg-white text-orange-600 shadow-sm border border-orange-100 font-black'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {tab.label}
                                {tab.badge && (
                                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-600 border-2 border-white shadow-sm"></span>
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {fetchError && (
                <div className="bg-orange-50 text-orange-600 p-5 rounded-2xl mb-6 border-2 border-orange-100 flex items-center gap-4 animate-in shake duration-500 shadow-xl shadow-orange-50">
                    <div className="bg-orange-600 p-2 rounded-lg">
                        <RefreshCw className="animate-spin text-white" size={20} strokeWidth={2} />
                    </div>
                    <p className="font-black uppercase tracking-tight text-sm">
                        {fetchError instanceof ApiError ? fetchError.message : t.errorLoading}
                    </p>
                </div>
            )}

            {!isLoading && orders.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 text-center shadow-inner">
                    <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Package size={40} strokeWidth={1} />
                    </div>
                    <h3 className="text-gray-400 font-black uppercase tracking-widest text-xs">
                        {t.noOrders}
                    </h3>
                </div>
            ) : (
                <div className="grid gap-6">
                    {isLoading && orders.length === 0 ? (
                        <AdminOrdersSkeleton count={3} />
                    ) : (
                        orders.map((order: Order) => (
                            <div
                                key={order.id}
                                className={cn(
                                    'bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group border-b-4',
                                    order.deliveryAddress?.toUpperCase().includes('MESA')
                                        ? 'border-b-red-600 ring-2 ring-red-600/5 shadow-red-100/50'
                                        : 'border-b-gray-100'
                                )}
                            >
                                {/* Header del pedido */}
                                <div className="p-5 sm:p-6 border-b border-gray-50 bg-gray-50/20 flex flex-wrap items-center justify-between gap-6 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                            <Package
                                                className="text-orange-500"
                                                size={24}
                                                strokeWidth={2}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4
                                                    className="font-black text-gray-900 text-lg tracking-tight cursor-pointer active:scale-95 transition-transform"
                                                    title={order.id}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(order.id);
                                                        success(
                                                            language === 'ru'
                                                                ? 'ID заказа скопирован'
                                                                : 'Pedido ID copiado'
                                                        );
                                                    }}
                                                >
                                                    {t.orderId}
                                                    {order.id.length > 8
                                                        ? order.id.slice(0, 8).toUpperCase()
                                                        : order.id}
                                                </h4>
                                                <span
                                                    className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${
                                                        statusOptions.find(
                                                            s => s.value === order.status
                                                        )?.color || ''
                                                    }`}
                                                >
                                                    {(() => {
                                                        const isMesaStatus = order.deliveryAddress
                                                            ?.toUpperCase()
                                                            .includes('MESA');
                                                        if (
                                                            isMesaStatus &&
                                                            (t as any).statusNamesMesa
                                                        ) {
                                                            return (
                                                                (t as any).statusNamesMesa[
                                                                    order.status
                                                                ] || order.status
                                                            );
                                                        }
                                                        return (
                                                            statusOptions.find(
                                                                s => s.value === order.status
                                                            )?.label || order.status
                                                        );
                                                    })()}
                                                </span>
                                                {order.notes && (
                                                    <div
                                                        className="bg-amber-50 text-amber-600 p-1.5 rounded-xl border border-amber-100 shadow-sm"
                                                        title="Contiene notas"
                                                    >
                                                        <MessageSquare
                                                            size={16}
                                                            strokeWidth={2.5}
                                                        />
                                                    </div>
                                                )}
                                                {order.deliveryAddress
                                                    ?.toUpperCase()
                                                    .includes('MESA') && (
                                                    <div
                                                        className="bg-red-600 text-white px-3 py-1.5 rounded-xl border border-red-700 shadow-lg flex items-center gap-2 animate-pulse"
                                                        title="Pedido en MESA"
                                                    >
                                                        <Activity size={16} strokeWidth={3} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            {order.deliveryAddress}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(order.createdAt).toLocaleString(
                                                    dateLocale,
                                                    {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 ml-auto sm:ml-0">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-none">
                                                {t.total}
                                            </p>
                                            <p className="text-2xl font-black text-gray-900 leading-none">
                                                {formatCurrency(order.total)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cuerpo del pedido */}
                                {(() => {
                                    const notes = order.notes || '';
                                    let paymentMethod = order.paymentMethod || '';
                                    let deliveryType = '';
                                    let scheduled = '';
                                    let noCall = false;
                                    let noBuzzer = false;
                                    let chopsticksCount = '';
                                    let personasCount = '';
                                    let actualNote = '';

                                    // NEW: Strongly prefer DB field for scheduled time
                                    if (
                                        order.estimatedDeliveryTime &&
                                        !order.estimatedDeliveryTime.includes('min') &&
                                        order.estimatedDeliveryTime.match(/\d{4}-\d{2}-\d{2}/)
                                    ) {
                                        const rawDate = order.estimatedDeliveryTime;
                                        const dateParts = rawDate.split(' ');
                                        if (dateParts.length === 2) {
                                            const [dPart, tPart] = dateParts;
                                            const components = dPart.split('-');
                                            if (
                                                components.length === 3 &&
                                                components[0].length === 4
                                            ) {
                                                scheduled = `${components[2]}-${components[1]}-${components[0]} ${tPart}`;
                                            } else {
                                                scheduled = rawDate;
                                            }
                                        } else {
                                            scheduled = rawDate;
                                        }
                                    }

                                    const parts = notes.split(' | ');
                                    parts.forEach((part: string) => {
                                        if (
                                            (part.includes('[MÉTODO DE PAGO:') ||
                                                part.includes('[PAGO:')) &&
                                            !paymentMethod
                                        ) {
                                            paymentMethod = part
                                                .replace('[MÉTODO DE PAGO: ', '')
                                                .replace('[MÉTODO DE PAGO:', '')
                                                .replace('[PAGO: ', '')
                                                .replace('[PAGO:', '')
                                                .replace(']', '')
                                                .trim();
                                        } else if (part.includes('[TIPO:')) {
                                            deliveryType = part
                                                .replace('[TIPO: ', '')
                                                .replace('[TIPO:', '')
                                                .replace(']', '');
                                        } else if (
                                            part.includes('[ENTREGA PROGRAMADA:') ||
                                            part.includes('[PROGRAMADO:')
                                        ) {
                                            if (!scheduled) {
                                                const rawDate = part
                                                    .replace('[ENTREGA PROGRAMADA: ', '')
                                                    .replace('[ENTREGA PROGRAMADA:', '')
                                                    .replace('[PROGRAMADO: ', '')
                                                    .replace('[PROGRAMADO:', '')
                                                    .replace(']', '');

                                                const dateParts = rawDate.split(' ');
                                                if (dateParts.length === 2) {
                                                    const [dPart, tPart] = dateParts;
                                                    const components = dPart.split('-');
                                                    if (components.length === 3) {
                                                        const [c1, c2, c3] = components;
                                                        if (c1.length === 4) {
                                                            scheduled = `${c3}-${c2}-${c1} ${tPart}`;
                                                        } else {
                                                            scheduled = rawDate;
                                                        }
                                                    } else {
                                                        scheduled = rawDate;
                                                    }
                                                } else {
                                                    scheduled = rawDate;
                                                }
                                            }
                                        } else if (
                                            part.includes('[NO LLAMAR PARA CONFIRMACIÓN]') ||
                                            part.includes('[SIN CONFIRMACIÓN LLAMADA]')
                                        ) {
                                            noCall = true;
                                        } else if (
                                            part.includes(
                                                '[NO LLAMAR AL TELEFONILLO - LLAMAR AL MÓVIL]'
                                            ) ||
                                            part.includes('[NO LLAMAR TIMBRE]')
                                        ) {
                                            noBuzzer = true;
                                        } else if (part.includes('[PALILLOS:')) {
                                            chopsticksCount = part
                                                .replace('[PALILLOS: ', '')
                                                .replace('[PALILLOS:', '')
                                                .replace(']', '')
                                                .trim();
                                        } else if (part.includes('[PERSONAS:')) {
                                            personasCount = part
                                                .replace('[PERSONAS: ', '')
                                                .replace('[PERSONAS:', '')
                                                .replace(']', '')
                                                .trim();
                                        } else {
                                            actualNote += (actualNote ? ' | ' : '') + part;
                                        }
                                    });

                                    const isMesa = order.deliveryAddress
                                        ?.toUpperCase()
                                        .includes('MESA');

                                    const isPickup =
                                        !isMesa &&
                                        (deliveryType === 'RECOGIDA EN LOCAL' ||
                                            order.deliveryAddress === 'RECOGIDA');

                                    return (
                                        <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-hidden">
                                            {/* Column 1: Client & Delivery */}
                                            <div className="space-y-8">
                                                <div>
                                                    <div className="flex items-center gap-3 text-gray-400 mb-4 border-l-4 border-orange-100 pl-3">
                                                        <Smartphone size={16} strokeWidth={2} />
                                                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                                                            {t.clientContact}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div
                                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xs overflow-hidden shrink-0 shadow-sm border-2 border-white
                                                                ${order.users?.avatar?.startsWith('http') ? 'bg-white' : order.users?.avatar ? 'bg-gray-100 text-[24px]' : 'bg-orange-600'}`}
                                                        >
                                                            {order.users?.avatar ? (
                                                                order.users.avatar.startsWith(
                                                                    'http'
                                                                ) ? (
                                                                    <img
                                                                        src={`${order.users.avatar}${order.users.avatar.includes('?') ? '&' : '?'}t=${Date.now()}`}
                                                                        alt={order.users.name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={e => {
                                                                            (
                                                                                e.currentTarget as HTMLImageElement
                                                                            ).style.display =
                                                                                'none';
                                                                            e.currentTarget.parentElement!.innerText =
                                                                                (
                                                                                    order.users
                                                                                        ?.name ||
                                                                                    '?'
                                                                                )
                                                                                    .split(' ')
                                                                                    .filter(Boolean)
                                                                                    .map(n => n[0])
                                                                                    .join('')
                                                                                    .toUpperCase()
                                                                                    .slice(0, 2);
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span className="select-none text-2xl">
                                                                        {order.users.avatar}
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="select-none text-xl">
                                                                    {(order.users?.name || t.guest)
                                                                        .split(' ')
                                                                        .filter(Boolean)
                                                                        .map(n => n[0])
                                                                        .join('')
                                                                        .toUpperCase()
                                                                        .slice(0, 2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <OrderRowName
                                                                name={order.users?.name || t.guest}
                                                                stats={order.userStats}
                                                                language={language}
                                                            />
                                                            {/* Registration date removed - now in tooltip */}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm text-gray-900 font-black tabular-nums">
                                                            {order.phoneNumber}
                                                        </p>
                                                        <a
                                                            href={`https://wa.me/${order.phoneNumber.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 px-3 bg-green-50 text-green-700 rounded-xl text-[10px] font-black border border-green-200 hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 shadow-sm active:scale-95 uppercase tracking-widest"
                                                        >
                                                            <MessageSquare
                                                                size={12}
                                                                strokeWidth={2.5}
                                                            />
                                                            {t.whatsapp}
                                                        </a>
                                                    </div>
                                                    {order.users?.email && (
                                                        <p className="text-[11px] font-bold text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded-lg w-fit border border-gray-100">
                                                            {order.users.email}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Customer Analytics Grid removed - now in tooltip */}

                                                {!isPickup && (
                                                    <div className="max-w-[300px]">
                                                        <div className="flex items-center gap-3 text-gray-400 mb-3 border-l-4 border-blue-100 pl-3">
                                                            <Monitor size={16} strokeWidth={2} />
                                                            <span className="text-[11px] font-black uppercase tracking-widest">
                                                                {t.deliveryAddress}
                                                                {!order.deliveryAddress
                                                                    ?.toUpperCase()
                                                                    .includes('MESA') && (
                                                                    <span className="ml-2 text-[9px] text-blue-500 font-bold lowercase tracking-normal bg-blue-50 px-1.5 py-0.5 rounded-lg border border-blue-100">
                                                                        clic para mapa
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        {order.deliveryAddress
                                                            ?.toUpperCase()
                                                            .includes('MESA') ? (
                                                            <p className="text-[14px] text-gray-700 leading-relaxed font-black break-words bg-gray-50/30 p-3 rounded-2xl border border-dashed border-gray-100">
                                                                {order.deliveryAddress}
                                                            </p>
                                                        ) : (
                                                            <a
                                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress + ', Madrid, Spain')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block group/address transition-all active:scale-95"
                                                                title="Abrir en Google Maps"
                                                            >
                                                                <div className="text-[14px] text-blue-700 leading-relaxed font-black break-words bg-blue-50/30 p-3 rounded-2xl border border-dashed border-blue-200 group-hover/address:bg-blue-50 group-hover/address:border-blue-400 transition-colors flex items-start gap-3">
                                                                    <span className="flex-1">
                                                                        {order.deliveryAddress}
                                                                    </span>
                                                                    <ExternalLink
                                                                        size={14}
                                                                        className="text-blue-400 shrink-0 mt-1 group-hover/address:text-blue-600 transition-colors"
                                                                    />
                                                                </div>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="space-y-4">
                                                    <div className="flex flex-wrap gap-2.5 mb-2">
                                                        <div
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border ${
                                                                isMesa
                                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                                    : isPickup
                                                                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                                            }`}
                                                        >
                                                            {isMesa ? (
                                                                <Activity size={14} />
                                                            ) : isPickup ? (
                                                                <Store size={14} />
                                                            ) : (
                                                                <Truck size={14} />
                                                            )}
                                                            {isMesa
                                                                ? t.types.mesa
                                                                : isPickup
                                                                  ? t.types.recogida
                                                                  : t.types.domicilio}
                                                        </div>
                                                        {isMesa && (
                                                            <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border bg-red-600 text-white border-red-700">
                                                                <Activity
                                                                    size={14}
                                                                    strokeWidth={2.5}
                                                                />
                                                                {order.deliveryAddress}
                                                            </div>
                                                        )}
                                                        {paymentMethod && (
                                                            <div
                                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border ${paymentMethod.includes('TARJETA') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                                                            >
                                                                <Wallet size={14} />
                                                                {paymentMethod.toUpperCase()}
                                                            </div>
                                                        )}
                                                        {scheduled && (
                                                            <div className="px-4 py-3 rounded-2xl bg-orange-600 text-white border-2 border-orange-700/50 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-md">
                                                                <Clock size={18} strokeWidth={3} />
                                                                <div className="flex flex-col leading-none">
                                                                    <span className="mb-1">
                                                                        {t.types.scheduled}
                                                                    </span>
                                                                    <span className="text-[10px] opacity-90 font-mono tracking-tight">
                                                                        {scheduled}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {chopsticksCount && (
                                                            <div className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                                                <span className="text-[14px]">
                                                                    🥢
                                                                </span>
                                                                {chopsticksCount}{' '}
                                                                {language === 'ru'
                                                                    ? 'палочек'
                                                                    : chopsticksCount === '1'
                                                                      ? 'palillo'
                                                                      : 'palillos'}
                                                            </div>
                                                        )}
                                                        {personasCount && (
                                                            <div className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                                                <span className="text-[14px]">
                                                                    👥
                                                                </span>
                                                                {personasCount}{' '}
                                                                {language === 'ru'
                                                                    ? 'чел.'
                                                                    : personasCount === '1'
                                                                      ? 'persona'
                                                                      : 'personas'}
                                                            </div>
                                                        )}
                                                        {noCall && (
                                                            <div className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-500 border border-gray-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                <VolumeX size={14} />
                                                                {t.types.noCall}
                                                            </div>
                                                        )}
                                                        {noBuzzer && (
                                                            <div className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-500 border border-gray-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                <Smartphone size={14} />
                                                                {t.types.noBuzzer}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {actualNote && (
                                                        <div className="bg-amber-50 border-2 border-amber-200/40 rounded-3xl p-5 shadow-inner">
                                                            <div className="flex items-center gap-3 text-amber-600 mb-3">
                                                                <MessageSquare
                                                                    size={16}
                                                                    strokeWidth={3}
                                                                />
                                                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                                                                    {t.clientMessage}
                                                                </span>
                                                            </div>
                                                            <p className="text-[15px] text-amber-900 font-black leading-relaxed relative z-10">
                                                                {actualNote}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Column 2: Products */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between gap-3 text-gray-400 mb-4 border-l-4 border-purple-100 pl-3">
                                                    <div className="flex items-center gap-3">
                                                        <ShoppingCart size={16} strokeWidth={2} />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">
                                                            {t.products} ({order.items?.length || 0}
                                                            )
                                                        </span>
                                                    </div>
                                                    {order.total > 0 &&
                                                        (!order.items ||
                                                            order.items.length === 0) && (
                                                            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-xl border border-red-100 animate-pulse">
                                                                <X size={14} strokeWidth={3} />
                                                                <span className="text-[9px] font-black uppercase tracking-tighter">
                                                                    {t.corruptOrder}
                                                                </span>
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="space-y-1 bg-gray-50/50 p-4 rounded-3xl border border-gray-100 shadow-inner">
                                                    {order.items
                                                        ?.filter((item: OrderItem) => {
                                                            const isDeliveryFee =
                                                                item.name
                                                                    ?.toLowerCase()
                                                                    .includes('gastos') ||
                                                                item.name
                                                                    ?.toLowerCase()
                                                                    .includes('envío') ||
                                                                (item as any).menuItemId === '-1' ||
                                                                (item as any).menu_item_id ===
                                                                    '-1' ||
                                                                (item as any).menuItemId === '0' ||
                                                                !(item as any).menuItemId;
                                                            return !isDeliveryFee;
                                                        })
                                                        .map((item: OrderItem) => (
                                                            <div
                                                                key={item.id || item.name}
                                                                className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0 px-4 rounded-2xl transition-all group/item shadow-sm hover:bg-white"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <span
                                                                        className={`text-[13px] font-black w-8 h-8 flex items-center justify-center rounded-xl shadow-sm transition-all ${item.isGift ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-orange-600 group-hover/item:bg-orange-600 group-hover/item:text-white'}`}
                                                                    >
                                                                        {item.quantity}
                                                                    </span>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[13px] font-black uppercase tracking-tight line-clamp-1 text-gray-800">
                                                                                {item.name}
                                                                            </span>
                                                                            {item.isGift && (
                                                                                <span className="bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-tighter shadow-sm animate-pulse">
                                                                                    🎁{' '}
                                                                                    {item.giftLabel ||
                                                                                        'Regalo'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {item.selectedOption && (
                                                                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-lg w-fit border border-orange-100 uppercase mt-0.5">
                                                                                {
                                                                                    item.selectedOption
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    {(item.price >
                                                                        item.priceAtTime ||
                                                                        (item.isGift &&
                                                                            item.price > 0)) && (
                                                                        <span className="text-[10px] text-gray-400 line-through tabular-nums opacity-60 leading-none">
                                                                            {formatCurrency(
                                                                                (item.price ||
                                                                                    item.priceAtTime) *
                                                                                    item.quantity
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    <span
                                                                        className={`text-[12px] font-black tabular-nums leading-none ${item.isGift ? 'text-green-600' : 'text-gray-900'}`}
                                                                    >
                                                                        {item.isGift
                                                                            ? 'GRATIS'
                                                                            : formatCurrency(
                                                                                  item.priceAtTime *
                                                                                      item.quantity
                                                                              )}
                                                                    </span>
                                                                    {item.price >
                                                                        item.priceAtTime &&
                                                                        !item.isGift && (
                                                                            <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-lg border border-green-100 uppercase tracking-tighter">
                                                                                -
                                                                                {formatCurrency(
                                                                                    (item.price -
                                                                                        item.priceAtTime) *
                                                                                        item.quantity
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                    {(() => {
                                                        const itemsSubtotal = (order.items || [])
                                                            .filter(item => {
                                                                const isDeliveryFee =
                                                                    item.name
                                                                        ?.toLowerCase()
                                                                        .includes('gastos') ||
                                                                    item.name
                                                                        ?.toLowerCase()
                                                                        .includes('envío') ||
                                                                    (item as any).menuItemId ===
                                                                        -1 ||
                                                                    (item as any).menu_item_id ===
                                                                        -1 ||
                                                                    (item as any).menuItemId ===
                                                                        0 ||
                                                                    !(item as any).menuItemId;
                                                                return !isDeliveryFee;
                                                            })
                                                            .reduce(
                                                                (sum, item) =>
                                                                    sum +
                                                                    (item.isGift
                                                                        ? 0
                                                                        : (item.priceAtTime || 0) *
                                                                          item.quantity),
                                                                0
                                                            );
                                                        const orderSubtotal =
                                                            order.total - (order.deliveryFee || 0);
                                                        const globalDiscount =
                                                            itemsSubtotal - orderSubtotal;

                                                        if (globalDiscount > 0.05) {
                                                            return (
                                                                <div className="flex items-center justify-between gap-3 py-3 border-t border-dashed border-gray-100 px-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[11px] font-black text-green-600 uppercase tracking-widest">
                                                                            {t.discount}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[12px] font-black text-green-600 tabular-nums">
                                                                        -
                                                                        {formatCurrency(
                                                                            globalDiscount
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    {order.deliveryFee && order.deliveryFee > 0 ? (
                                                        <div className="flex items-center justify-between gap-3 py-3 border-t-2 border-dashed border-gray-200 mt-2 px-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                                                                    {t.deliveryFee}
                                                                </span>
                                                            </div>
                                                            <span className="text-[12px] font-black text-gray-900 tabular-nums">
                                                                {formatCurrency(order.deliveryFee)}
                                                            </span>
                                                        </div>
                                                    ) : null}

                                                    {order.total > 0 &&
                                                        (!order.items ||
                                                            order.items.length === 0) && (
                                                            <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex flex-col items-center justify-center text-center gap-3 my-2 animate-in zoom-in duration-300">
                                                                <div className="bg-white p-2 rounded-full shadow-sm">
                                                                    <X
                                                                        size={24}
                                                                        strokeWidth={3}
                                                                        className="text-red-500"
                                                                    />
                                                                </div>
                                                                <p className="text-[11px] font-black text-red-900 uppercase tracking-tight leading-tight">
                                                                    {t.corruptOrderDesc}
                                                                </p>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>

                                            {/* Column 3: Actions */}
                                            <div className="lg:border-l-2 border-dashed border-gray-100 lg:pl-10 flex flex-col justify-start">
                                                <div className="flex items-center gap-3 text-gray-400 mb-5 border-l-4 border-green-100 pl-3">
                                                    <Activity size={16} strokeWidth={2} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">
                                                        {t.orderStatus}
                                                    </span>
                                                </div>

                                                {/* Quick Action: Pass to Kitchen */}
                                                {(order.status === 'pending' ||
                                                    order.status === 'received' ||
                                                    order.status === 'confirmed') && (
                                                    <motion.button
                                                        initial={{ scale: 0.95, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() =>
                                                            handleUpdateStatus(
                                                                order.id,
                                                                'preparing'
                                                            )
                                                        }
                                                        className={cn(
                                                            'w-full mb-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 border-2',
                                                            order.deliveryAddress
                                                                ?.toUpperCase()
                                                                .includes('MESA')
                                                                ? 'bg-orange-600 text-white border-orange-500 shadow-orange-600/30 animate-pulse'
                                                                : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/30'
                                                        )}
                                                    >
                                                        <ChefHat size={18} strokeWidth={2.5} />A LA
                                                        COCINA
                                                    </motion.button>
                                                )}

                                                <div className="relative group/status">
                                                    <select
                                                        data-testid="order-status-select"
                                                        value={order.status}
                                                        onChange={e =>
                                                            handleUpdateStatus(
                                                                order.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        disabled={statusMutation.isPending}
                                                        className={`w-full px-5 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest border-2 transition-all appearance-none cursor-pointer focus:outline-none focus:ring-8 focus:ring-gray-100 shadow-md ${
                                                            statusOptions.find(
                                                                s => s.value === order.status
                                                            )?.color ||
                                                            'bg-white border-gray-200 text-gray-700'
                                                        }`}
                                                    >
                                                        {statusOptions.map(opt => (
                                                            <option
                                                                key={opt.value}
                                                                value={opt.value}
                                                                className="bg-white text-gray-900 font-black uppercase tracking-widest"
                                                            >
                                                                {isMesa &&
                                                                (t as any).statusNamesMesa
                                                                    ? (t as any).statusNamesMesa[
                                                                          opt.value
                                                                      ] || opt.label
                                                                    : opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                        <RefreshCw
                                                            size={18}
                                                            strokeWidth={3}
                                                            className={
                                                                statusMutation.isPending
                                                                    ? 'animate-spin'
                                                                    : 'text-current opacity-40'
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                {/* Print Receipt Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => onPrintOrder?.(order)}
                                                    className="w-full mt-3 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:shadow-md hover:border-orange-200 hover:text-orange-600 transition-all flex items-center justify-center gap-3 text-gray-500 no-print"
                                                >
                                                    <Printer size={18} strokeWidth={2.5} />
                                                    {t.printReceipt}
                                                </motion.button>

                                                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Globe
                                                            size={18}
                                                            strokeWidth={2}
                                                            className="text-gray-300"
                                                        />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                            {t.origin}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 shadow-sm">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-100"></span>
                                                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                                                            {t.webDirect}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))
                    )}
                </div>
            )}

            {!isLoading && orders.length > 0 && pagination.pages > 1 && (
                <div className="mt-10 flex flex-wrap justify-center gap-2 pb-10">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(pageNum => (
                        <button
                            key={pageNum}
                            onClick={() => {
                                setPage(pageNum);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-sm transition-all shadow-sm active:scale-90 border ${
                                pageNum === pagination.page
                                    ? 'bg-orange-600 text-white border-orange-600 shadow-md font-black italic'
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-orange-400 hover:text-orange-500'
                            }`}
                        >
                            {pageNum}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
