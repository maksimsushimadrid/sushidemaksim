import {
    RefreshCw,
    ExternalLink,
    Activity,
    TrendingUp,
    ChevronRight,
    ChevronLeft,
    AlertTriangle,
    HelpCircle,
    Info,
    ShoppingBag,
    DollarSign,
    Users,
    Eye,
    Calendar,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { BUSINESS_HOURS } from '../../utils/storeStatus';

interface AdminDashboardProps {
    stats: any;
    reports: any[];
    loading: boolean;
    loadStats: (isPolling?: boolean) => Promise<void>;
    setActiveTab: (tab: any) => void;
    language?: 'ru' | 'es';
}

const DASHBOARD_TRANSLATIONS = {
    ru: {
        summary: 'Сводка показателей',
        viewStore: 'В ресторан',
        refresh: 'Обновить',
        storeParams: 'Параметры заведения',
        deliveryTime: 'Время доставки',
        edit: 'ИЗМЕНИТЬ',
        stats: {
            revenue: 'Выручка за сегодня',
            revenue30: 'Выручка за 30 дней',
            missed: 'Упущенная выручка',
            newOrders: 'Новые заказы',
            pending: 'Ожидающие',
            newUsers: 'Новые клиенты',
            totalUsers: 'Всего клиентов',
            visitsToday: 'Посещения сегодня',
            visits30: 'Посещения за 30 дней',
            revenueDesc: 'Всего получено (Мадрид)',
            revenue30Desc: 'За последние 30 дней',
            missedDesc: 'Заказы в корзинах',
            ordersDesc: 'Получено сегодня',
            pendingDesc: 'Требуют внимания',
            usersDesc: 'Зарегистрировано сегодня',
            totalUsersDesc: 'Зарегистрировано всего',
            visitsTodayDesc: 'Уникальные визиты сегодня',
            visits30Desc: 'Уникальные визиты за 30 дней',
            revenueHint:
                'Сумма всех заказов, которые не были отменены (статусы: получен, готовится, в пути, доставлен). Считается от 00:00 текущего дня.',
            revenue30Hint: 'Сумма всех заказов за последние 30 дней, за исключением отмененных.',
            missedHint:
                'Оценка выручки от товаров, которые пользователи добавили в корзину сегодня, но не завершили покупку. Данные из логов аналитики брошенных корзин.',
            ordersHint: 'Общее количество новых заказов за сегодня.',
            pendingHint:
                'Заказы со статусами "Ожидает" и "Получен", которые требуют подтверждения или начала приготовления.',
            usersHint: 'Количество уникальных клиентов, зарегистрировавшихся в системе за сегодня.',
            totalUsersHint: 'Общее количество клиентов, зарегистрированных в системе.',
            visitsTodayHint:
                'Количество уникальных посетителей (сессий), зафиксированных на сайте за сегодня.',
            visits30Hint:
                'Количество уникальных посетителей (сессий), зафиксированных на сайте за последние 30 дней.',
        },
        recentOrders: 'Последние заказы',
        viewAll: 'Смотреть все',
        noOrders: 'Нет недавних заказов',
        guest: 'Гость',
        topProducts: 'ТОП-10 товаров за месяц',
        noSales: 'Нет данных о продажах',
        sold: 'прод.',
        reportHistory: 'История еженедельных отчетов',
        last30Days: 'История за все время',
        noReports: 'Отчетов пока нет.',
        table: {
            day: 'Неделя',
            orders: 'Заказы',
            revenue: 'Доход',
            avgTicket: 'Средний чек',
            details: 'Детали',
            ordersLabel: 'зак.',
        },
        modal: {
            title: 'Детали недели',
            day: 'День',
            orders: 'Заказы',
            revenue: 'Выручка',
            avgTicket: 'Ср. чек',
            closed: 'Выходной',
            close: 'Закрыть',
            totalRevenue: 'Выручка за неделю',
            totalOrders: 'Заказы за неделю',
        },
        hints: {
            howCalculated: 'Как считается',
            hint: 'Подсказка',
        },
    },
    es: {
        summary: 'Resumen de Indicadores',
        viewStore: 'Ver Restaurante',
        refresh: 'Actualizar',
        storeParams: 'Parámetros del Restaurante',
        deliveryTime: 'Tiempo Entrega',
        edit: 'EDITAR',
        stats: {
            revenue: 'Ingresos de hoy',
            revenue30: 'Ingresos 30 días',
            missed: 'Ingresos Perdidos',
            newOrders: 'Nuevos Pedidos',
            pending: 'Pedidos Pendientes',
            newUsers: 'Nuevos Clientes',
            totalUsers: 'Total Clientes',
            visitsToday: 'Visitas de hoy',
            visits30: 'Visitas 30 días',
            revenueDesc: 'Total cobrado (Madrid)',
            revenue30Desc: 'Últimos 30 días',
            missedDesc: 'Pedidos abandonados en carrito',
            ordersDesc: 'Pedidos recibidos hoy',
            pendingDesc: 'Atención inmediata',
            usersDesc: 'Registrados hoy',
            totalUsersDesc: 'Registrados en total',
            visitsTodayDesc: 'Visitas únicas hoy',
            visits30Desc: 'Visitas únicas 30 días',
            revenueHint:
                'Suma de todos los pedidos no cancelados hoy (estados: recibido, preparando, en camino, entregado). Desde las 00:00.',
            revenue30Hint:
                'Suma de todos los pedidos (excluyendo cancelados) en los últimos 30 días.',
            missedHint:
                'Ingresos estimados de productos que los usuarios añadieron al carrito hoy pero no finalizaron la compra.',
            ordersHint: 'Número total de nuevos pedidos recibidos hoy.',
            pendingHint:
                'Pedidos en estado "Pendiente" o "Recibido" que requieren atención o confirmación inmediata.',
            usersHint:
                'Número de clientes nuevos registrados en la plataforma durante el día de hoy.',
            totalUsersHint: 'Número total de clientes registrados en el sistema.',
            visitsTodayHint: 'Número de visitantes únicos (sesiones) registrados en el sitio hoy.',
            visits30Hint:
                'Número de visitantes únicos (sesiones) registrados en el sitio en los últimos 30 días.',
        },
        recentOrders: 'Últimos Pedidos',
        viewAll: 'Ver todos',
        noOrders: 'No hay pedidos recientes',
        guest: 'Invitado',
        topProducts: 'TOP 10 Productos Mensuales',
        noSales: 'No hay datos de ventas disponibles',
        sold: 'vend.',
        reportHistory: 'Historial de Reportes Semanales',
        last30Days: 'Historial completo',
        noReports: 'No hay reportes disponibles todavía.',
        table: {
            day: 'Semana',
            orders: 'Pedidos',
            revenue: 'Ingresos',
            avgTicket: 'Ticket Medio',
            details: 'Detalles',
            ordersLabel: 'ped.',
        },
        modal: {
            title: 'Detalles de la Semana',
            day: 'Día',
            orders: 'Pedidos',
            revenue: 'Ingresos',
            avgTicket: 'T. Medio',
            closed: 'Cerrado',
            close: 'Cerrar',
            totalRevenue: 'Ingresos semanales',
            totalOrders: 'Pedidos semanales',
        },
        hints: {
            howCalculated: 'Cómo se calcula',
            hint: 'Sugerencia',
        },
    },
} as const;

interface StatCardProps {
    title: string;
    value: string | number;
    icon: any;
    colorClass: string;
    desc: string;
    hint?: string;
    t: any;
}

const StatCard = ({ title, value, icon: Icon, colorClass, desc, hint, t }: StatCardProps) => {
    const [showHint, setShowHint] = useState(false);
    const [alignRight, setAlignRight] = useState(false);
    const iconRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            if (rect.left > window.innerWidth / 2) {
                setAlignRight(true);
            } else {
                setAlignRight(false);
            }
        }
        setShowHint(true);
    };

    return (
        <div className="metallic-card p-5 flex flex-col justify-between group hover:border-white/50 hover:shadow-xl transition-all relative overflow-visible h-full min-h-[140px]">
            <div className="w-full">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">
                            {title}
                        </p>
                        {hint && (
                            <div className="relative" ref={iconRef}>
                                <div
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={() => setShowHint(false)}
                                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all border-none cursor-help shrink-0 z-20 ${
                                        showHint
                                            ? 'bg-orange-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-600'
                                    }`}
                                    aria-label={t.hints.hint}
                                >
                                    <HelpCircle size={10} strokeWidth={3} />
                                </div>

                                <AnimatePresence mode="wait">
                                    {showHint && hint && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            className={`absolute bottom-full mb-3 w-72 bg-slate-900 text-white rounded-2xl shadow-2xl z-[100] overflow-visible border border-white/20 backdrop-blur-sm ${alignRight ? 'right-0' : 'left-0'}`}
                                            style={{
                                                transformOrigin: alignRight
                                                    ? 'bottom right'
                                                    : 'bottom left',
                                            }}
                                        >
                                            <div className="bg-white/10 px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-lg bg-orange-600 flex items-center justify-center">
                                                        <Info size={11} className="text-white" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                        {t.hints.howCalculated}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-[12px] text-slate-200 leading-relaxed font-medium">
                                                    {hint}
                                                </p>
                                            </div>
                                            {/* Arrow Component */}
                                            <div
                                                className={`absolute -bottom-1.5 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-white/20 ${alignRight ? 'right-2' : 'left-2'}`}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                    <div
                        className={`p-2 rounded-xl ${colorClass} shadow-inner group-hover:scale-110 transition-transform shrink-0`}
                    >
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                </div>
                <h3 className="text-2xl metallic-text leading-tight mb-2 tracking-tight">
                    {value}
                </h3>
            </div>

            <div className="relative mt-2">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight line-clamp-1 bg-gray-50/80 px-2 py-1 rounded-lg border border-gray-100/50 w-fit max-w-full">
                    {desc}
                </p>
            </div>
        </div>
    );
};

export default function AdminDashboard({
    stats,
    reports,
    loading,
    loadStats,
    setActiveTab,
    language = 'es',
}: AdminDashboardProps) {
    const navigate = useNavigate();
    const { success } = useToast();

    const t = DASHBOARD_TRANSLATIONS[language];
    const dateLocale = language === 'ru' ? 'ru-RU' : 'es-ES';

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 30;
    const [selectedWeek, setSelectedWeek] = useState<any>(null);

    const weeklyReports = useMemo(() => {
        const getWeekKeyAndRange = (dateStr: string) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const day = date.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;

            const monday = new Date(date);
            monday.setDate(date.getDate() + diffToMonday);
            monday.setHours(0, 0, 0, 0);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);

            const mondayStr = monday.toLocaleDateString('en-CA');
            return {
                key: mondayStr,
                monday,
                sunday,
            };
        };

        const weeksMap: Record<string, any> = {};

        (reports || []).forEach((report: any) => {
            const { key, monday, sunday } = getWeekKeyAndRange(report.date);

            if (!weeksMap[key]) {
                weeksMap[key] = {
                    weekKey: key,
                    startDate: monday,
                    endDate: sunday,
                    orders_count: 0,
                    total_revenue: 0,
                    avg_ticket: 0,
                    new_users_count: 0,
                    cancelled_count: 0,
                    invitations_count: 0,
                    daily_reports: [],
                };
            }

            const week = weeksMap[key];
            week.orders_count += report.orders_count || 0;
            week.total_revenue += Number(report.total_revenue || report.total || 0);
            week.new_users_count += report.new_users_count || 0;
            week.cancelled_count += report.cancelled_count || 0;
            week.invitations_count += report.invitations_count || 0;
            week.daily_reports.push(report);
        });

        const result = Object.values(weeksMap).map(week => {
            week.avg_ticket = week.orders_count > 0 ? week.total_revenue / week.orders_count : 0;
            week.daily_reports.sort((a: any, b: any) => b.date.localeCompare(a.date));
            return week;
        });

        result.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
        return result;
    }, [reports]);

    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return (weeklyReports || []).slice(startIndex, startIndex + rowsPerPage);
    }, [weeklyReports, currentPage]);

    const totalPages = Math.ceil((weeklyReports?.length || 0) / rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [weeklyReports?.length]);

    const formatWeekRange = (startDate: Date, endDate: Date) => {
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const startMonth = startDate.toLocaleDateString(dateLocale, { month: 'short' });
        const endMonth = endDate.toLocaleDateString(dateLocale, { month: 'short' });

        if (startMonth === endMonth) {
            return `${startDay} - ${endDay} ${startMonth}`;
        }
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    };

    const getWeekNumber = (date: Date): number => {
        const tempDate = new Date(date.valueOf());
        tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
        const yearStart = new Date(tempDate.getFullYear(), 0, 1);
        const weekNo = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        return weekNo;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-lg font-black text-gray-900 border-l-4 border-orange-600 pl-3 uppercase tracking-tight">
                    {t.summary}
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => navigate('/menu')}
                        className="flex items-center gap-2 px-5 py-2.5 metallic-button rounded-xl text-xs active:scale-95 uppercase tracking-wider shadow-lg"
                    >
                        <ExternalLink size={16} strokeWidth={2} />
                        {t.viewStore}
                    </button>
                    <button
                        onClick={() => loadStats()}
                        className="flex items-center gap-2 text-xs metallic-button !bg-none !bg-white/50 px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-sm"
                    >
                        <RefreshCw
                            size={14}
                            strokeWidth={2.5}
                            className={loading ? 'animate-spin' : ''}
                        />
                        {t.refresh}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between h-[140px] animate-pulse"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-2/3 bg-gray-50 rounded" />
                                    <div className="h-2 w-1/3 bg-gray-50/50 rounded" />
                                </div>
                                <div className="w-10 h-10 bg-gray-50 rounded-xl" />
                            </div>
                            <div className="h-8 w-1/2 bg-gray-100 rounded-lg mt-auto" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <StatCard
                        title={t.stats.revenue}
                        value={`${Number(stats?.revenueToday || 0)
                            .toFixed(2)
                            .replace('.', ',')} €`}
                        icon={DollarSign}
                        colorClass="bg-green-50 text-green-600"
                        desc={t.stats.revenueDesc}
                        hint={t.stats.revenueHint}
                        t={t}
                    />
                    <StatCard
                        title={t.stats.revenue30}
                        value={`${Number(stats?.promoStats?.totalRevenue30 || 0)
                            .toFixed(2)
                            .replace('.', ',')} €`}
                        icon={TrendingUp}
                        colorClass="bg-emerald-50 text-emerald-600"
                        desc={t.stats.revenue30Desc}
                        hint={t.stats.revenue30Hint}
                        t={t}
                    />
                    <StatCard
                        title={t.stats.missed}
                        value={`${Number(stats?.missedRevenueToday || 0)
                            .toFixed(2)
                            .replace('.', ',')} €`}
                        icon={AlertTriangle}
                        colorClass="bg-orange-50 text-orange-600"
                        desc={t.stats.missedDesc}
                        hint={t.stats.missedHint}
                        t={t}
                    />
                    <StatCard
                        title={t.stats.newOrders}
                        value={Number(stats?.ordersToday || 0)}
                        icon={ShoppingBag}
                        colorClass="bg-blue-50 text-blue-600"
                        desc={t.stats.ordersDesc}
                        hint={t.stats.ordersHint}
                        t={t}
                    />
                    <StatCard
                        title={t.stats.pending}
                        value={stats?.pendingOrders ?? 0}
                        icon={Activity}
                        colorClass="bg-amber-50 text-amber-600"
                        desc={t.stats.pendingDesc}
                        hint={t.stats.pendingHint}
                        t={t}
                    />
                    <StatCard
                        title={t.stats.newUsers}
                        value={stats?.usersToday || 0}
                        icon={TrendingUp}
                        colorClass="bg-purple-50 text-purple-600"
                        desc={t.stats.usersDesc}
                        hint={t.stats.usersHint}
                        t={t}
                    />
                    <StatCard
                        title={t.stats.totalUsers}
                        value={stats?.stats?.totalUsers || 0}
                        icon={Users}
                        colorClass="bg-indigo-50 text-indigo-600"
                        desc={t.stats.totalUsersDesc}
                        hint={t.stats.totalUsersHint}
                        t={t}
                    />
                    <StatCard
                        title={t.stats.visitsToday}
                        value={stats?.visitsToday || 0}
                        icon={Eye}
                        colorClass="bg-sky-50 text-sky-600"
                        desc={t.stats.visitsTodayDesc}
                        hint={t.stats.visitsTodayHint}
                        t={t}
                    />
                    <StatCard
                        title={t.stats.visits30}
                        value={stats?.visits30 || 0}
                        icon={Eye}
                        colorClass="bg-teal-50 text-teal-600"
                        desc={t.stats.visits30Desc}
                        hint={t.stats.visits30Hint}
                        t={t}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="metallic-card p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/20">
                        <h3 className="metallic-text uppercase tracking-tight flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-6 bg-slate-800 rounded-full" />
                            {t.recentOrders}
                        </h3>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className="text-orange-600 text-[10px] font-black hover:text-black transition-colors uppercase tracking-widest border-b-2 border-orange-100"
                        >
                            {t.viewAll}
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="h-14 bg-gray-50/50 rounded-2xl animate-pulse flex items-center px-4 gap-3"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-gray-100 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-1/2 bg-gray-100 rounded" />
                                        <div className="h-2 w-1/4 bg-gray-100 rounded opacity-50" />
                                    </div>
                                    <div className="h-4 w-12 bg-gray-100 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : !stats?.recentOrders?.length ? (
                        <div className="text-center py-16 text-gray-400 font-bold uppercase text-[11px] tracking-widest">
                            {t.noOrders}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {stats.recentOrders.map((order: any) => (
                                <div
                                    key={order.id}
                                    className="p-3 bg-gray-50/50 rounded-2xl flex items-center justify-between text-left hover:bg-gray-100/80 transition-colors border border-transparent hover:border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-xs overflow-hidden shrink-0 shadow-sm border border-white
                                                ${order.user_avatar?.startsWith('http') ? 'bg-white' : order.user_avatar ? 'bg-gray-100 text-[18px]' : 'bg-orange-600'}`}
                                        >
                                            {order.user_avatar ? (
                                                order.user_avatar.startsWith('http') ? (
                                                    <img
                                                        src={`${order.user_avatar}${order.user_avatar.includes('?') ? '&' : '?'}t=${Date.now()}`}
                                                        alt={order.user_name}
                                                        className="w-full h-full object-cover"
                                                        onError={e => {
                                                            (
                                                                e.currentTarget as HTMLImageElement
                                                            ).style.display = 'none';
                                                            e.currentTarget.parentElement!.innerText =
                                                                (order.user_name || '?')
                                                                    .split(' ')
                                                                    .filter(Boolean)
                                                                    .map((n: string) => n[0])
                                                                    .join('')
                                                                    .toUpperCase()
                                                                    .slice(0, 2);
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="select-none text-xl">
                                                        {order.user_avatar}
                                                    </span>
                                                )
                                            ) : (
                                                <span className="select-none">
                                                    {(order.user_name || 'Invitado')
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
                                            <p className="font-black text-gray-900 text-[13px] leading-none mb-1">
                                                <span
                                                    className="cursor-pointer active:scale-95 transition-transform inline-block"
                                                    title={String(order.id)}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            String(order.id)
                                                        );
                                                        success(
                                                            language === 'ru'
                                                                ? 'ID заказа скопирован'
                                                                : 'Pedido ID copiado'
                                                        );
                                                    }}
                                                >
                                                    #
                                                    {typeof order.id === 'string' &&
                                                    order.id.includes('-')
                                                        ? order.id.slice(0, 8).toUpperCase()
                                                        : String(order.id).padStart(5, '0')}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight truncate max-w-[140px]">
                                                {order.user_name || t.guest}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900 text-sm">
                                            {Number(order.total).toFixed(2).replace('.', ',')} €
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <h3 className="metallic-text uppercase tracking-tight mb-6 pb-2 border-b border-white/20 flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-6 bg-slate-800 rounded-full" />
                        {t.topProducts}
                    </h3>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className="h-12 bg-gray-50/50 rounded-2xl animate-pulse flex items-center px-4 gap-4"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between">
                                            <div className="h-3 w-1/3 bg-gray-100 rounded" />
                                            <div className="h-3 w-12 bg-gray-100 rounded" />
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !stats?.topItems?.length ? (
                        <div className="text-center py-16 text-gray-400 font-bold uppercase text-[11px] tracking-widest">
                            {t.noSales}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.topItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-[14px] shadow-inner group-hover:scale-110 transition-transform">
                                        #{idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[13px] font-black text-gray-800 uppercase tracking-tight">
                                                {item.name}
                                            </span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-lg">
                                                {item.sold} {t.sold}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-50 h-2.5 rounded-full overflow-hidden border border-gray-100 shadow-inner p-0.5">
                                            <div
                                                className="bg-orange-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(242,101,34,0.3)]"
                                                style={{
                                                    width: `${Math.min(100, (item.sold / (stats.topItems[0].sold || 1)) * 100)}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Reports Section */}
            <div className="metallic-card p-6 mt-6 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-100">
                    <h3 className="font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
                        {t.reportHistory}
                    </h3>
                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 uppercase tracking-widest shadow-inner">
                        {t.last30Days}
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className="h-12 bg-gray-50 rounded-2xl animate-pulse"
                            ></div>
                        ))}
                    </div>
                ) : !reports?.length ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                            <RefreshCw className="text-gray-200" size={40} strokeWidth={1} />
                        </div>
                        <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">
                            {t.noReports}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                                        <th className="px-2.5 md:px-4 py-3 md:py-4">
                                            {t.table.day}
                                        </th>
                                        <th className="px-2.5 md:px-4 py-3 md:py-4">
                                            {t.table.orders}
                                        </th>
                                        <th className="px-2.5 md:px-4 py-3 md:py-4">
                                            {t.table.revenue}
                                        </th>
                                        <th className="px-2.5 md:px-4 py-3 md:py-4">
                                            {t.table.avgTicket}
                                        </th>
                                        <th className="px-2.5 md:px-4 py-3 md:py-4 text-right">
                                            {t.table.details}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedReports.map((report: any) => (
                                        <tr
                                            key={report.weekKey}
                                            onClick={() => setSelectedWeek(report)}
                                            className="hover:bg-gray-50/80 transition-all group active:scale-[0.99] cursor-pointer"
                                        >
                                            <td className="px-2.5 md:px-4 py-3 md:py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex flex-col items-center justify-center shadow-sm group-hover:bg-orange-600 group-hover:border-orange-600 transition-colors shrink-0 animate-in fade-in">
                                                        <Calendar
                                                            className="text-gray-400 group-hover:text-white"
                                                            size={18}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                                                            {formatWeekRange(
                                                                report.startDate,
                                                                report.endDate
                                                            )}
                                                        </span>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                            {language === 'ru'
                                                                ? 'Неделя'
                                                                : 'Semana'}{' '}
                                                            {getWeekNumber(report.startDate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2.5 md:px-4 py-3 md:py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[15px] font-black text-gray-900">
                                                        {report.orders_count}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                                        {t.table.ordersLabel}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-2.5 md:px-4 py-3 md:py-5">
                                                <span className="text-sm font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 shadow-sm whitespace-nowrap">
                                                    {Number(report.total_revenue)
                                                        .toFixed(2)
                                                        .replace('.', ',')}{' '}
                                                    €
                                                </span>
                                            </td>
                                            <td className="px-2.5 md:px-4 py-3 md:py-5">
                                                <span className="text-xs font-black text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 uppercase tracking-tight whitespace-nowrap">
                                                    {Number(report.avg_ticket)
                                                        .toFixed(2)
                                                        .replace('.', ',')}{' '}
                                                    €
                                                </span>
                                            </td>
                                            <td className="px-2.5 md:px-4 py-3 md:py-5 text-right">
                                                <ChevronRight
                                                    size={18}
                                                    strokeWidth={2.5}
                                                    className="text-gray-200 group-hover:text-orange-500 group-hover:translate-x-1.5 transition-all inline-block"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-150 pt-4 px-2 select-none">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {language === 'ru' ? 'Страница' : 'Página'} {currentPage}{' '}
                                    {language === 'ru' ? 'из' : 'de'} {totalPages}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            setCurrentPage(prev => Math.max(1, prev - 1));
                                        }}
                                        disabled={currentPage === 1}
                                        className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 transition shadow-sm flex items-center justify-center cursor-pointer"
                                    >
                                        <ChevronLeft size={16} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                        }}
                                        disabled={currentPage === totalPages}
                                        className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 transition shadow-sm flex items-center justify-center cursor-pointer"
                                    >
                                        <ChevronRight size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Weekly Details Modal */}
            <AnimatePresence>
                {selectedWeek && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl max-w-2xl w-full border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 animate-in fade-in duration-200">
                                <div>
                                    <h4 className="font-black text-gray-900 uppercase tracking-tight text-[15px] sm:text-[16px] flex items-center gap-2">
                                        <div className="w-1.5 h-5 bg-orange-600 rounded-full" />
                                        {t.modal.title}
                                    </h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {formatWeekRange(
                                            selectedWeek.startDate,
                                            selectedWeek.endDate
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedWeek(null)}
                                    className="p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-50 active:scale-95 transition cursor-pointer"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 no-scrollbar flex-1">
                                {/* Week Summary Stats */}
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-gray-50/80 border border-gray-100 p-3 sm:p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                            {t.modal.totalRevenue}
                                        </p>
                                        <p className="text-lg sm:text-xl font-black text-green-600">
                                            {Number(selectedWeek.total_revenue)
                                                .toFixed(2)
                                                .replace('.', ',')}{' '}
                                            €
                                        </p>
                                    </div>
                                    <div className="bg-gray-50/80 border border-gray-100 p-3 sm:p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                            {t.modal.totalOrders}
                                        </p>
                                        <p className="text-lg sm:text-xl font-black text-gray-900">
                                            {selectedWeek.orders_count} {t.table.ordersLabel}
                                        </p>
                                    </div>
                                </div>

                                {/* Daily Breakdown Title */}
                                <div>
                                    <h5 className="font-black text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-4">
                                        {language === 'ru'
                                            ? 'РАСПРЕДЕЛЕНИЕ ПО ДНЯМ'
                                            : 'DESGLOSE DIARIO'}
                                    </h5>

                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    <th className="py-2.5 pr-1">{t.modal.day}</th>
                                                    <th className="py-2.5 pr-1">
                                                        {t.modal.orders}
                                                    </th>
                                                    <th className="py-2.5 pr-1">
                                                        {t.modal.revenue}
                                                    </th>
                                                    <th className="py-2.5 text-right">
                                                        {t.modal.avgTicket}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {selectedWeek.daily_reports.map(
                                                    (dayReport: any) => {
                                                        const [y, m, d] = dayReport.date
                                                            .split('-')
                                                            .map(Number);
                                                        const dayOfWeek = new Date(
                                                            y,
                                                            m - 1,
                                                            d
                                                        ).getDay();
                                                        const isClosed =
                                                            !BUSINESS_HOURS[dayOfWeek] ||
                                                            BUSINESS_HOURS[dayOfWeek].length === 0;

                                                        return (
                                                            <tr
                                                                key={dayReport.date}
                                                                className="hover:bg-gray-50/30 transition-colors"
                                                            >
                                                                <td className="py-3 pr-1 md:pr-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight md:hidden">
                                                                            {new Date(
                                                                                dayReport.date
                                                                            ).toLocaleDateString(
                                                                                dateLocale,
                                                                                {
                                                                                    weekday:
                                                                                        'short',
                                                                                }
                                                                            )}
                                                                        </span>
                                                                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight hidden md:inline">
                                                                            {new Date(
                                                                                dayReport.date
                                                                            ).toLocaleDateString(
                                                                                dateLocale,
                                                                                {
                                                                                    weekday: 'long',
                                                                                }
                                                                            )}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-gray-400 mt-0.5 md:hidden">
                                                                            {new Date(
                                                                                dayReport.date
                                                                            ).toLocaleDateString(
                                                                                dateLocale,
                                                                                {
                                                                                    day: 'numeric',
                                                                                    month: 'short',
                                                                                }
                                                                            )}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-gray-400 mt-0.5 hidden md:block">
                                                                            {new Date(
                                                                                dayReport.date
                                                                            ).toLocaleDateString(
                                                                                dateLocale,
                                                                                {
                                                                                    day: 'numeric',
                                                                                    month: 'long',
                                                                                }
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 pr-1 md:pr-2">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-xs font-black text-gray-900">
                                                                            {dayReport.orders_count}
                                                                        </span>
                                                                        <span className="text-[9px] font-black text-gray-400 uppercase">
                                                                            {t.table.ordersLabel}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 pr-1 md:pr-2">
                                                                    {isClosed &&
                                                                    dayReport.orders_count === 0 ? (
                                                                        <span className="text-[9px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap">
                                                                            {t.modal.closed}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs font-black text-green-600 whitespace-nowrap">
                                                                            {Number(
                                                                                dayReport.total_revenue
                                                                            )
                                                                                .toFixed(2)
                                                                                .replace(
                                                                                    '.',
                                                                                    ','
                                                                                )}{' '}
                                                                            €
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-right font-black text-xs text-gray-600 whitespace-nowrap">
                                                                    {dayReport.orders_count > 0
                                                                        ? `${Number(dayReport.avg_ticket).toFixed(2).replace('.', ',')} €`
                                                                        : '—'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedWeek(null)}
                                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-800 active:scale-95 transition cursor-pointer"
                                >
                                    {t.modal.close}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
