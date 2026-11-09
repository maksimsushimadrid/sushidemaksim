import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Printer,
    ExternalLink,
    Phone,
    MessageCircle,
    MapPin,
    Calendar,
    Clock,
    CreditCard,
    User,
    ShoppingBag,
    Copy,
    Check,
    Smartphone,
    Monitor,
    Globe,
    FileText,
    TrendingUp,
    RefreshCw,
    UtensilsCrossed,
} from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useToast } from '../../context/ToastContext';
import { triggerHaptic } from '../../utils/haptics';
import { api } from '../../utils/api';

interface OrderDetailsModalProps {
    order: any | null;
    isOpen: boolean;
    onClose: () => void;
    onPrintOrder?: (order: any) => void;
    onViewInOrders?: (orderId: string | number) => void;
    language?: 'ru' | 'es';
}

const TRANSLATIONS = {
    ru: {
        title: 'Чек и данные заказа',
        orderId: 'Заказ',
        copied: 'ID скопирован в буфер',
        printReceipt: 'Печать чека',
        viewInOrders: 'Открыть в заказах',
        receiptTitle: 'Детализированный чек',
        itemsCount: 'Позиций',
        subtotal: 'Подытог блюд',
        discount: 'Скидка',
        deliveryFee: 'Доставка',
        freeDelivery: 'Бесплатно',
        tip: 'Чаевые курьеру/команде',
        total: 'ИТОГО К ОПЛАТЕ',
        paymentMethod: 'Способ оплаты',
        cash: 'Наличные',
        card: 'Банковская карта',
        bizum: 'Bizum',
        clientInfo: 'Клиент и доставка',
        guest: 'Гость (без регистрации)',
        registeredClient: 'Зарегистрированный клиент',
        call: 'Позвонить',
        whatsapp: 'WhatsApp',
        email: 'Email',
        deliveryAddress: 'Адрес доставки',
        openMap: 'Открыть на карте',
        pickup: 'Самовывоз из ресторана',
        table: 'За столиком',
        customerNotes: 'Комментарий к заказу',
        clientStats: 'История клиента',
        totalOrders: 'Всего заказов',
        totalSpent: 'Сумма заказов',
        avgCheck: 'Средний чек',
        registeredSince: 'Регистрация',
        telemetry: 'Технические данные',
        device: 'Устройство',
        browser: 'Браузер',
        os: 'ОС',
        close: 'Закрыть',
        loadingOrder: 'Загрузка данных заказа...',
        status: {
            pending: 'В обработке',
            confirmed: 'Подтверждён',
            preparing: 'Готовится',
            delivering: 'В пути',
            delivered: 'Доставлен',
            cancelled: 'Отменён',
            waiting_payment: 'Ожидает оплаты',
        },
    },
    es: {
        title: 'Ticket e Historial del Pedido',
        orderId: 'Pedido',
        copied: 'ID copiado al portapapeles',
        printReceipt: 'Imprimir Ticket',
        viewInOrders: 'Ver en Pedidos',
        receiptTitle: 'Ticket Desglosado',
        itemsCount: 'Productos',
        subtotal: 'Subtotal productos',
        discount: 'Descuento',
        deliveryFee: 'Gastos de envío',
        freeDelivery: 'Gratis',
        tip: 'Propina equipo',
        total: 'TOTAL A PAGAR',
        paymentMethod: 'Método de pago',
        cash: 'Efectivo',
        card: 'Tarjeta',
        bizum: 'Bizum',
        clientInfo: 'Cliente y Entrega',
        guest: 'Invitado',
        registeredClient: 'Cliente registrado',
        call: 'Llamar',
        whatsapp: 'WhatsApp',
        email: 'Email',
        deliveryAddress: 'Dirección de entrega',
        openMap: 'Ver en mapa',
        pickup: 'Recogida en restaurante',
        table: 'En mesa',
        customerNotes: 'Comentarios del cliente',
        clientStats: 'Historial del cliente',
        totalOrders: 'Pedidos totales',
        totalSpent: 'Gasto acumulado',
        avgCheck: 'Ticket medio',
        registeredSince: 'Registro',
        telemetry: 'Datos técnicos',
        device: 'Dispositivo',
        browser: 'Navegador',
        os: 'Sistema',
        close: 'Cerrar',
        loadingOrder: 'Cargando datos del pedido...',
        status: {
            pending: 'En proceso',
            confirmed: 'Confirmado',
            preparing: 'En cocina',
            delivering: 'En reparto',
            delivered: 'Entregado',
            cancelled: 'Cancelado',
            waiting_payment: 'Esperando pago',
        },
    },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
    },
    confirmed: {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
    },
    preparing: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
    },
    delivering: {
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
    },
    delivered: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
    },
    cancelled: {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
    },
    waiting_payment: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        dot: 'bg-yellow-500',
    },
};

export default function OrderDetailsModal({
    order: initialOrder,
    isOpen,
    onClose,
    onPrintOrder,
    onViewInOrders,
    language = 'ru',
}: OrderDetailsModalProps) {
    useScrollLock(isOpen);
    const { success } = useToast();
    const t = TRANSLATIONS[language] || TRANSLATIONS.ru;

    const [fullOrder, setFullOrder] = useState<any>(initialOrder);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    // Sync order or fetch full details if items are missing
    useEffect(() => {
        if (!initialOrder || !isOpen) return;

        setFullOrder(initialOrder);

        const hasItems = Array.isArray(initialOrder.items) && initialOrder.items.length > 0;
        if (!hasItems && initialOrder.id) {
            setIsLoadingDetails(true);
            api.get(`/admin/orders/${initialOrder.id}`)
                .then(res => {
                    if (res?.order) {
                        setFullOrder(res.order);
                    }
                })
                .catch(err => {
                    console.error('Failed to load full order details:', err);
                })
                .finally(() => {
                    setIsLoadingDetails(false);
                });
        }
    }, [initialOrder, isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !fullOrder) return null;

    const orderIdStr = String(fullOrder.id || '');
    const displayId =
        orderIdStr.length > 8 ? orderIdStr.slice(0, 8).toUpperCase() : orderIdStr.toUpperCase();

    // Formatting date
    let formattedDate = fullOrder.createdAt || '';
    let formattedTime = '';
    try {
        const d = new Date(fullOrder.createdAt);
        if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
            formattedTime = d.toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'es-ES', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    } catch {
        // fallback
    }

    // Calculations
    const items = Array.isArray(fullOrder.items) ? fullOrder.items : [];
    const regularItems = items.filter((item: any) => {
        const name = (item.name || '').toLowerCase();
        return (
            !name.includes('gastos') &&
            !name.includes('envío') &&
            !name.includes('propina') &&
            item.menuItemId !== -1 &&
            item.menuItemId !== 0
        );
    });

    const itemsSubtotal = regularItems.reduce((acc: number, item: any) => {
        const price = Number(item.priceAtTime || item.price || 0);
        const qty = Number(item.quantity || 1);
        return acc + price * qty;
    }, 0);

    const deliveryFee = Number(fullOrder.deliveryFee || 0);
    const tipAmount = Number(fullOrder.tipAmount || 0);
    const totalAmount = Number(fullOrder.total || 0);
    const discountAmount = Math.max(0, itemsSubtotal - (totalAmount - deliveryFee - tipAmount));

    const statusKey = String(fullOrder.status || 'pending').toLowerCase();
    const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.pending;
    const statusLabel =
        (t.status as any)[statusKey] || fullOrder.status || TRANSLATIONS.ru.status.pending;

    // Delivery destination analysis
    const rawAddress = String(fullOrder.deliveryAddress || '');
    const isPickup = rawAddress.toUpperCase() === 'RECOGIDA' || fullOrder.deliveryType === 'pickup';
    const isTable =
        rawAddress.toUpperCase().startsWith('MESA') || fullOrder.deliveryType === 'table';
    const isDelivery = !isPickup && !isTable && rawAddress.length > 0;

    // Phone & WhatsApp formatting
    const rawPhone = String(fullOrder.phoneNumber || fullOrder.phone || '');
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`}?text=${encodeURIComponent(
              language === 'ru'
                  ? `Здравствуйте! Пишем по поводу вашего заказа #${displayId} в ресторане Sushi de Maksim.`
                  : `¡Hola! Le escribimos sobre su pedido #${displayId} en Sushi de Maksim.`
          )}`
        : null;

    // Maps query
    const mapsUrl = isDelivery
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              rawAddress.includes('Madrid') ? rawAddress : `${rawAddress}, Madrid, Spain`
          )}`
        : null;

    const copyOrderId = () => {
        triggerHaptic(10);
        navigator.clipboard.writeText(String(fullOrder.id));
        setCopiedId(true);
        success(t.copied);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handlePrint = () => {
        triggerHaptic(15);
        if (onPrintOrder) {
            onPrintOrder(fullOrder);
        } else {
            window.print();
        }
    };

    const handleViewInOrders = () => {
        triggerHaptic(15);
        if (onViewInOrders) {
            onViewInOrders(fullOrder.id);
        }
    };

    const clientStats = fullOrder.userStats;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 14 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto z-10 flex flex-col max-h-[92vh]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-white flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                            <button
                                onClick={copyOrderId}
                                className="group flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl transition-all shadow-sm active:scale-95"
                                title="Копировать ID"
                            >
                                <span className="font-black text-gray-900 text-sm tracking-tight">
                                    #{displayId}
                                </span>
                                {copiedId ? (
                                    <Check size={14} className="text-emerald-600" />
                                ) : (
                                    <Copy
                                        size={14}
                                        className="text-gray-400 group-hover:text-orange-600 transition-colors"
                                    />
                                )}
                            </button>

                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${statusStyle.dot} animate-pulse`}
                                />
                                {statusLabel}
                            </span>

                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar size={13} className="text-gray-400" />
                                    {formattedDate}
                                </span>
                                {formattedTime && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={13} className="text-gray-400" />
                                        {formattedTime}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center active:scale-90 shrink-0"
                            aria-label={t.close}
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Quick Action Ribbon */}
                    <div className="px-4 sm:px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap shrink-0">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-500 hover:text-white border border-gray-200 hover:border-orange-500 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                                <Printer size={15} strokeWidth={2.5} />
                                <span>{t.printReceipt}</span>
                            </button>

                            {onViewInOrders && (
                                <button
                                    onClick={handleViewInOrders}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-900 hover:text-white border border-gray-200 hover:border-slate-900 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                                >
                                    <ExternalLink size={14} strokeWidth={2.5} />
                                    <span>{t.viewInOrders}</span>
                                </button>
                            )}
                        </div>

                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-400 mr-2">{t.total}:</span>
                            <span className="text-base sm:text-lg font-black text-gray-900">
                                {totalAmount.toFixed(2).replace('.', ',')} €
                            </span>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                        {isLoadingDetails && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-amber-800">
                                <RefreshCw size={14} className="animate-spin" />
                                <span>{t.loadingOrder}</span>
                            </div>
                        )}

                        {/* Customer & Delivery Card */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm space-y-3">
                            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <User size={15} className="text-orange-500" />
                                    {t.clientInfo}
                                </h4>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    {fullOrder.user_id ? t.registeredClient : t.guest}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden shrink-0">
                                        {fullOrder.user_avatar ? (
                                            fullOrder.user_avatar.startsWith('http') ? (
                                                <img
                                                    src={fullOrder.user_avatar}
                                                    alt={fullOrder.user_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xl">
                                                    {fullOrder.user_avatar}
                                                </span>
                                            )
                                        ) : (
                                            <span>
                                                {(fullOrder.user_name || 'Invitado')
                                                    .split(' ')
                                                    .filter(Boolean)
                                                    .map((n: string) => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 text-sm sm:text-base leading-tight">
                                            {fullOrder.user_name ||
                                                fullOrder.users?.name ||
                                                fullOrder.customer_name ||
                                                t.guest}
                                        </p>
                                        {(fullOrder.users?.email || fullOrder.email) && (
                                            <p className="text-xs text-gray-400 font-medium">
                                                {fullOrder.users?.email || fullOrder.email}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact actions */}
                                {cleanPhone && (
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`tel:${cleanPhone}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors active:scale-95 no-underline"
                                            title="Позвонить клиенту"
                                        >
                                            <Phone size={13} className="text-emerald-600" />
                                            <span>{rawPhone}</span>
                                        </a>

                                        {whatsappUrl && (
                                            <a
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-500/20 active:scale-95 no-underline"
                                                title="Написать в WhatsApp"
                                            >
                                                <MessageCircle size={14} />
                                                <span>WhatsApp</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Destination / Address */}
                            <div className="pt-2 border-t border-gray-100">
                                <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5 shrink-0">
                                        <MapPin
                                            size={16}
                                            className={
                                                isTable
                                                    ? 'text-red-500'
                                                    : isPickup
                                                      ? 'text-amber-500'
                                                      : 'text-orange-500'
                                            }
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                {isTable
                                                    ? t.table
                                                    : isPickup
                                                      ? t.pickup
                                                      : t.deliveryAddress}
                                            </span>
                                            {isTable && (
                                                <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-[10px] font-black uppercase">
                                                    {rawAddress}
                                                </span>
                                            )}
                                        </div>

                                        {isDelivery && (
                                            <div className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                                <p className="text-xs sm:text-sm font-bold text-gray-800 break-words leading-relaxed">
                                                    {rawAddress}
                                                </p>
                                                {mapsUrl && (
                                                    <a
                                                        href={mapsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors shrink-0 no-underline"
                                                    >
                                                        <span>{t.openMap}</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {fullOrder.notes && (
                                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                                    <p className="font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                                        <FileText size={13} className="text-amber-600" />
                                        {t.customerNotes}:
                                    </p>
                                    <p className="text-amber-950 font-medium whitespace-pre-wrap leading-relaxed">
                                        {fullOrder.notes}
                                    </p>
                                </div>
                            )}

                            {/* Lifetime Client Stats (if registered user) */}
                            {clientStats && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                                        <TrendingUp size={13} className="text-orange-500" />
                                        {t.clientStats}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">
                                                {t.totalOrders}
                                            </p>
                                            <p className="text-sm font-black text-gray-900">
                                                {clientStats.orderCount || 0}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">
                                                {t.totalSpent}
                                            </p>
                                            <p className="text-sm font-black text-emerald-600">
                                                {Number(clientStats.totalSpent || 0)
                                                    .toFixed(2)
                                                    .replace('.', ',')}{' '}
                                                €
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">
                                                {t.avgCheck}
                                            </p>
                                            <p className="text-sm font-black text-gray-900">
                                                {Number(clientStats.averageOrderValue || 0)
                                                    .toFixed(2)
                                                    .replace('.', ',')}{' '}
                                                €
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detailed Receipt & Items Card */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <ShoppingBag size={15} className="text-orange-500" />
                                    {t.receiptTitle}
                                </h4>
                                <span className="text-xs font-bold text-gray-500">
                                    {regularItems.length} {t.itemsCount}
                                </span>
                            </div>

                            {/* Items List */}
                            <div className="divide-y divide-gray-100">
                                {regularItems.length === 0 ? (
                                    <div className="py-6 text-center text-gray-400 font-bold text-xs uppercase tracking-wider">
                                        Нет данных о блюдах
                                    </div>
                                ) : (
                                    regularItems.map((item: any, idx: number) => {
                                        const unitPrice = Number(
                                            item.priceAtTime || item.price || 0
                                        );
                                        const qty = Number(item.quantity || 1);
                                        const itemTotal = unitPrice * qty;

                                        return (
                                            <div
                                                key={item.id || idx}
                                                className="py-2.5 flex items-center justify-between gap-3 text-left"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0 font-black text-xs overflow-hidden">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <UtensilsCrossed size={16} />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-black text-gray-900 text-xs sm:text-sm truncate">
                                                            {item.name}
                                                        </p>
                                                        {item.selectedOption && (
                                                            <p className="text-[11px] text-orange-600 font-bold">
                                                                {item.selectedOption}
                                                            </p>
                                                        )}
                                                        <p className="text-[11px] text-gray-400 font-medium">
                                                            {unitPrice.toFixed(2).replace('.', ',')}{' '}
                                                            € × {qty}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="font-black text-gray-900 text-xs sm:text-sm">
                                                        {itemTotal.toFixed(2).replace('.', ',')} €
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Financial Receipt Summary */}
                            <div className="pt-3 border-t-2 border-dashed border-gray-200 space-y-1.5 text-xs">
                                <div className="flex justify-between text-gray-600 font-medium">
                                    <span>{t.subtotal}</span>
                                    <span>{itemsSubtotal.toFixed(2).replace('.', ',')} €</span>
                                </div>

                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>
                                            {t.discount}{' '}
                                            {fullOrder.promoCode ? `(${fullOrder.promoCode})` : ''}
                                        </span>
                                        <span>
                                            -{discountAmount.toFixed(2).replace('.', ',')} €
                                        </span>
                                    </div>
                                )}

                                {deliveryFee > 0 ? (
                                    <div className="flex justify-between text-gray-600 font-medium">
                                        <span>{t.deliveryFee}</span>
                                        <span>{deliveryFee.toFixed(2).replace('.', ',')} €</span>
                                    </div>
                                ) : isDelivery ? (
                                    <div className="flex justify-between text-gray-500 font-medium">
                                        <span>{t.deliveryFee}</span>
                                        <span className="text-emerald-600 font-bold">
                                            {t.freeDelivery}
                                        </span>
                                    </div>
                                ) : null}

                                {tipAmount > 0 && (
                                    <div className="flex justify-between text-amber-600 font-bold">
                                        <span>{t.tip}</span>
                                        <span>+{tipAmount.toFixed(2).replace('.', ',')} €</span>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                        {t.total}
                                    </span>
                                    <span className="text-lg sm:text-xl font-black text-orange-600">
                                        {totalAmount.toFixed(2).replace('.', ',')} €
                                    </span>
                                </div>

                                {fullOrder.paymentMethod && (
                                    <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <CreditCard size={13} />
                                            {t.paymentMethod}:
                                        </span>
                                        <span className="font-black uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md text-gray-800">
                                            {fullOrder.paymentMethod === 'cash'
                                                ? t.cash
                                                : fullOrder.paymentMethod === 'card'
                                                  ? t.card
                                                  : fullOrder.paymentMethod}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Telemetry info (if available) */}
                        {(fullOrder.deviceType || fullOrder.browserName || fullOrder.osName) && (
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-2 text-[11px] text-gray-500 flex-wrap">
                                <span className="font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Globe size={13} />
                                    {t.telemetry}:
                                </span>
                                <div className="flex items-center gap-3 font-semibold text-gray-700">
                                    {fullOrder.deviceType && (
                                        <span className="flex items-center gap-1">
                                            {fullOrder.deviceType === 'mobile' ? (
                                                <Smartphone size={12} />
                                            ) : (
                                                <Monitor size={12} />
                                            )}
                                            {fullOrder.deviceType}
                                        </span>
                                    )}
                                    {fullOrder.osName && <span>{fullOrder.osName}</span>}
                                    {fullOrder.browserName && <span>{fullOrder.browserName}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-600/20 active:scale-95 transition-all cursor-pointer border-none"
                        >
                            <Printer size={15} strokeWidth={2.5} />
                            <span>{t.printReceipt}</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                        >
                            {t.close}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
