import {
    Monitor,
    Users,
    Activity,
    ExternalLink,
    TrendingUp,
    Clock,
    Heart,
    Share2,
    RefreshCw,
    Archive,
    FileText,
    ChevronRight,
    X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
    AreaChart,
    Area,
} from 'recharts';

interface AdminAnalyticsProps {
    stats: any;
    loading: boolean;
    language?: 'ru' | 'es';
}

const ANALYTICS_TRANSLATIONS = {
    ru: {
        title: 'Продвинутая аналитика',
        period: 'Последние 30 дней',
        loading: 'Загрузка аналитики...',
        ltv: {
            label: 'Средний LTV',
            desc: 'Пожизненная ценность клиента',
        },
        avgTicket: {
            label: 'Средний чек',
            desc: 'В среднем за заказ',
        },
        retention: {
            label: 'Удержание',
            desc: 'Повторные клиенты (30д)',
        },
        margin: {
            label: 'Оц. Маржа',
            desc: 'Какая часть выручки — ваша прибыль',
        },
        markup: {
            label: 'Оц. Наценка',
            desc: '% прибыли сверх себестоимости',
        },
        devices: {
            title: 'Основные устройства (30д)',
            mobile: 'Мобильные',
            desktop: 'Компьютеры',
            tablet: 'Планшеты',
            insight:
                'Показывает, как клиенты делают заказы. Если 90% заказов с мобильных, сайт должен быть идеально удобен для телефона.',
        },
        newVsRecurring: {
            title: 'Новые vs Повторные',
            new: 'Новые',
            recur: 'Повторные',
            insight:
                'Отражает лояльность. Если много повторных заказов — кухня отличная. Если почти все новые — нужно работать над возвращаемостью.',
        },
        categoryPerformance: {
            title: 'Эффективность категорий (30д)',
            sales: 'Продажи',
            ticket: 'Чек',
            insight:
                'Помогает понять, какие разделы меню приносят основную прибыль, а какие — высокий средний чек.',
        },
        browsers: {
            title: 'Браузеры (30д)',
            insight:
                'Техническая статистика. Помогает убедиться, что сайт работает быстро во всех популярных браузерах.',
        },
        salesGrowth: {
            title: 'Рост продаж (30д)',
            insight:
                'Визуальный тренд вашего бизнеса. Позволяет увидеть влияние праздников или акций на реальную выручку в динамике.',
        },
        activityPeaks: {
            title: 'Пики активности (по часам)',
            orders: 'заказов',
            insight:
                'Определяет часы пиковой нагрузки на кухню. Помогает планировать заготовки и количество поваров.',
        },
        promoEffectiveness: {
            title: 'Эффективность акций (30д)',
            discountOrders: 'Заказы со скидкой',
            totalSavings: 'Общая экономия клиентов',
            avgDiscount: 'Средняя скидка',
            promoRevenue: 'Выручка по акциям',
            ordersShare: 'Доля от всех заказов',
            revenueShare: 'Доля в выручке',
            insight:
                'Оценивает, сколько выручки приносят акции. Помогает понять, не слишком ли много вы раздаёте скидок.',
        },
        promoCampaignsBreakdown: {
            title: 'Детализация по акциям и кампаниям',
            campaign: 'Кампания / Промокод',
            uses: 'Использовано',
            revenue: 'Выручка',
            discounts: 'Скидки',
            avgCheck: 'Ср. чек',
            conversion: 'Конверсия (Исп. / Создано)',
            noData: 'Акций не найдено за этот период',
            individualTitle: 'Использование конкретных промокодов (30д)',
            code: 'Код купона',
            bannersTitle: 'Конфигурация промо-баннеров',
            bannerName: 'Название акции',
            bannerStatus: 'Статус',
            bannerActive: 'Активен',
            bannerInactive: 'Неактивен',
            bannerDiscount: 'Скидка',
            types: {
                welcome: 'Приветственный купон (NUEVO)',
                loyalty_bonus: 'Бонус лояльности (LOYALTY)',
                loyalty_gift: 'Подарочный десерт (DESSERT)',
                referral: 'Пригласи друга (REF)',
                special: 'Специальный купон (SPECIAL)',
                manual: 'Ручная скидка (Direct)',
                custom: 'Индивидуальный промокод',
            },
        },
        deliveryZones: {
            title: 'Популярные районы доставки',
            insight:
                'Показывает основные районы. Помогает оптимизировать логистику и таргет рекламы.',
        },
        topFavorited: {
            title: 'Самые желанные (Избранное)',
            noData: 'Данных об избранном пока нет',
            label: 'Что это значит:',
            text: 'Это товары со скрытым спросом. Люди добавляют их в избранное, чтобы купить позже.',
            tip: 'Совет:',
            tipText: 'Запустите акцию на эти позиции, чтобы превратить ожидания в реальные заказы.',
        },
        topShared: {
            title: 'Виральные товары (Репосты)',
            noData: 'Данных о репостах пока нет',
            label: 'Что это значит:',
            text: 'Эти товары чаще всего пересылают друзьям. Они визуально привлекательны для соцсетей.',
            tip: 'Совет:',
            tipText: 'Используйте фото именно этих блюд в рекламе Facebook/Instagram.',
        },
        abcAnalysis: {
            title: 'ABC-анализ меню (Прибыльность 30д)',
            catA: 'Кат A (80%)',
            catB: 'Кат B (15%)',
            catC: 'Кат C (5%)',
            product: 'Товар',
            units: 'Шт',
            income: 'Доход',
            revShare: '% Выручки',
            abc: 'ABC',
            insight:
                'Золотой стандарт управления меню. А — хиты (не трогать), B — стабильные, C — кандидаты на замену.',
        },
        heatmap: {
            title: 'Тепловая карта недели (День vs Час)',
            low: 'Низкая',
            high: 'Пик',
            days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            insight:
                'Самый мощный инструмент планирования. Показывает точные окна перегрузок для графика курьеров.',
        },
        orders: {
            label: 'Заказы',
            desc: 'Всего заказов получено',
        },
        reports: {
            title: 'Месячные отчеты и Архивация',
            archiveBtn: 'Создать отчет и архивировать данные',
            archiveConfirm:
                'Вы уверены? Все текущие заказы (кроме №513) будут помечены как архивные. Это сбросит текущую статистику дашборда.',
            history: 'История отчетов',
            noReports: 'Отчетов пока нет',
            viewReport: 'Посмотреть отчет',
            summary: 'Сводка за месяц',
            revenue: 'Выручка',
            orders: 'Заказы',
            avgCheck: 'Ср. чек',
            discounts: 'Скидки',
            reservations: 'Резервы',
            registrations: 'Регистрации',
            topItems: 'Топ 10 товаров',
            topClients: 'Лучшие клиенты',
            qty: 'шт.',
            total: 'всего',
        },
    },

    es: {
        title: 'Analítica Avanzada',
        period: 'Últimos 30 días',
        loading: 'Cargando analítica...',
        ltv: {
            label: 'LTV Promedio',
            desc: 'Valor de vida del cliente',
        },
        avgTicket: {
            label: 'Ticket Medio',
            desc: 'Promedio por pedido',
        },
        retention: {
            label: 'Tasa de Retención',
            desc: 'Clientes recurrentes (30d)',
        },
        margin: {
            label: 'Margen Est.',
            desc: '% de la venta que es beneficio',
        },
        markup: {
            label: 'Markup Est.',
            desc: '% añadido sobre el coste',
        },
        orders: {
            label: 'Pedidos',
            desc: 'Total de pedidos captados',
        },
        devices: {
            title: 'Dispositivo Principal (30d)',
            mobile: 'Móvil',
            desktop: 'Escritorio',
            tablet: 'Tablet',
            insight:
                'Muestra cómo hacen pedidos tus clientes. Si el 90% viene de móviles, el sitio debe ser perfecto para teléfonos.',
        },
        newVsRecurring: {
            title: 'Nuevos vs Recur.',
            new: 'Nuevos',
            recur: 'Recur.',
            insight:
                'Refleja la fidelidad. Si hay muchos pedidos recurrentes, la cocina es excelente. Si casi todos son nuevos, hay que trabajar en retención.',
        },
        categoryPerformance: {
            title: 'Performance por Categoría (30d)',
            sales: 'Ventas',
            ticket: 'Ticket',
            insight:
                'Ayuda a entender qué secciones del menú generan más ingresos y cuáles tienen el ticket medio más alto.',
        },
        browsers: {
            title: 'Navegadores (30d)',
            insight:
                'Estadística técnica. Ayuda a asegurar que el sitio funcione rápido en todos los navegadores populares.',
        },
        salesGrowth: {
            title: 'Crecimiento de Ventas (30d)',
            insight:
                'Tendencia visual de tu negocio. Permite ver el impacto de festivos, fines de semana o promociones en los ingresos.',
        },
        activityPeaks: {
            title: 'Picos de Actividad (Horario)',
            orders: 'pedidos',
            insight:
                'Identifica las horas pico de la cocina. Si a las 19:00 siempre hay pico, los cocineros deben estar preparados.',
        },
        promoEffectiveness: {
            title: 'Efectividad de Promociones (30d)',
            discountOrders: 'Pedidos con Descuento',
            totalSavings: 'Ahorro Total Cliente',
            avgDiscount: 'Descuento Promedio',
            promoRevenue: 'Ingresos por Promociones',
            ordersShare: 'Cuota de Pedidos',
            revenueShare: 'Cuota de Ingresos',
            insight:
                'Evalúa cuántos ingresos generan las promociones. Ayuda a entender si estás dando demasiados descuentos.',
        },
        promoCampaignsBreakdown: {
            title: 'Desglose por Campañas y Cupones',
            campaign: 'Campaña / Promoción',
            uses: 'Usos',
            revenue: 'Ingresos',
            discounts: 'Descuentos',
            avgCheck: 'Ticket Medio',
            conversion: 'Conversión (Usado / Creado)',
            noData: 'No se encontraron promociones en este período',
            individualTitle: 'Uso de Códigos de Descuento (30d)',
            code: 'Código',
            bannersTitle: 'Configuración de Banners de Promoción',
            bannerName: 'Promoción',
            bannerStatus: 'Estado',
            bannerActive: 'Activo',
            bannerInactive: 'Inactivo',
            bannerDiscount: 'Descuento',
            types: {
                welcome: 'Cupón de Bienvenida (NUEVO)',
                loyalty_bonus: 'Bono de Fidelidad (LOYALTY)',
                loyalty_gift: 'Postre de Regalo (DESSERT)',
                referral: 'Invitar a un Amigo (REF)',
                special: 'Cupón Especial (SPECIAL)',
                manual: 'Descuento Manual / Directo',
                custom: 'Código Personalizado',
            },
        },
        deliveryZones: {
            title: 'Zonas de Entrega Populares',
            insight:
                'Muestra las zonas principales de entrega. Ayuda a optimizar la logística y enfocar la publicidad.',
        },
        topFavorited: {
            title: 'Productos deseados (Favoritos)',
            noData: 'No hay datos de favoritos aún',
            label: 'Qué significa:',
            text: 'Productos con alta demanda "oculta". Los clientes los guardan para recordarlos.',
            tip: 'Consejo:',
            tipText:
                'Inicia una promo temporal en estos platos para convertirlos en pedidos reales.',
        },
        topShared: {
            title: 'Productos virales (Compartidos)',
            noData: 'No hay datos de compartidos aún',
            label: 'Qué significa:',
            text: 'Platos que más se envían a amigos. Son visualmente atractivos o virales.',
            tip: 'Consejo:',
            tipText: 'Usa fotos de estos platos en tus anuncios de Instagram o Facebook.',
        },
        abcAnalysis: {
            title: 'Análisis ABC del Menú (Rentabilidad 30d)',
            catA: 'Cat A (80%)',
            catB: 'Cat B (15%)',
            catC: 'Cat C (5%)',
            product: 'Producto',
            units: 'Uds',
            income: 'Ingresos',
            revShare: '% Rev',
            abc: 'ABC',
            insight:
                'El estándar de oro en gestión de menú. A — éxitos (no tocar), B — estables, C — candidatos a reemplazo.',
        },
        heatmap: {
            title: 'Mapa de Calor Semanal (Día vs Hora)',
            low: 'Bajo',
            high: 'Pico',
            days: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            insight:
                'La herramienta más potente de planificación. Muestra las ventanas exactas de sobrecarga para repartidores.',
        },
        reports: {
            title: 'Informes Mensuales y Archivación',
            archiveBtn: 'Generar Informe y Archivar',
            archiveConfirm:
                '¿Estás seguro? Todos los pedidos actuales (excepto #513) se marcarán como archivados. Esto reiniciará las estadísticas actuales.',
            history: 'Historial de Informes',
            noReports: 'No hay informes todavía',
            viewReport: 'Ver Informe',
            summary: 'Resumen Mensual',
            revenue: 'Ingresos',
            orders: 'Pedidos',
            avgCheck: 'Ticket Medio',
            discounts: 'Descuentos',
            reservations: 'Reservas',
            registrations: 'Registros',
            topItems: 'Top 10 Productos',
            topClients: 'Mejores Clientes',
            qty: 'uds.',
            total: 'total',
        },
    },
} as const;

export default function AdminAnalytics({ stats, loading, language = 'es' }: AdminAnalyticsProps) {
    const t = ANALYTICS_TRANSLATIONS[language];
    const [reports, setReports] = useState<any[]>([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isChartMounted, setIsChartMounted] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                setIsChartMounted(true);
            }, 150);
            return () => clearTimeout(timer);
        } else {
            setIsChartMounted(false);
        }
    }, [loading]);

    const fetchReports = async () => {
        try {
            setReportsLoading(true);
            const { data } = await axios.get('/api/admin/monthly-reports', {
                withCredentials: true,
            });
            setReports(data || []);
        } catch (err: any) {
            if (err.response?.status === 401) {
                console.warn('[AdminAnalytics] Session expired. Please re-login.');
            } else {
                console.error('❌ Error fetching reports:', err);
            }
        } finally {
            setReportsLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!window.confirm(t.reports.archiveConfirm)) return;

        try {
            setIsGenerating(true);
            const { data } = await axios.post(
                '/api/admin/monthly-reports/generate',
                {},
                { withCredentials: true }
            );
            if (data.success) {
                await fetchReports();
                alert('Success! Archive created and dashboard reset.');
                window.location.reload(); // Reload to refresh the main stats
            }
        } catch (err) {
            console.error('❌ Error generating report:', err);
            alert('Error generating report');
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in">
                <RefreshCw
                    className="animate-spin text-orange-600 mb-6"
                    size={48}
                    strokeWidth={2}
                />
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    {t.loading}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                    {t.title}
                </h2>
                <div className="flex gap-2">
                    <span className="px-5 py-2.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black border border-orange-100 uppercase tracking-widest shadow-sm">
                        {t.period}
                    </span>
                </div>
            </div>

            {/* Top Insight Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {[
                    {
                        label: t.ltv.label,
                        value: `${stats?.ltv || 0}€`,
                        desc: t.ltv.desc,
                        color: 'text-gray-900',
                        trend: true,
                    },
                    {
                        label: t.avgTicket.label,
                        value: `${Math.round((stats?.stats?.revenue / stats?.stats?.totalOrders || 0) * 100) / 100}€`,
                        desc: t.avgTicket.desc,
                        color: 'text-gray-900',
                    },
                    {
                        label: t.retention.label,
                        value: `${Math.round((stats?.retention?.returning / (stats?.retention?.new + stats?.retention?.returning || 1)) * 100)}%`,
                        desc: t.retention.desc,
                        color: 'text-emerald-600',
                    },
                    {
                        label: t.margin.label,
                        value: `${stats?.estimatedMargin || 0}%`,
                        desc: t.margin.desc,
                        color: 'text-emerald-600',
                    },
                    {
                        label: t.markup.label,
                        value: `${stats?.estimatedMarkup || 0}%`,
                        desc: t.markup.desc,
                        color: 'text-blue-600',
                    },
                    {
                        label: t.orders.label,
                        value: `${stats?.stats?.totalOrders || 0}`,
                        desc: t.orders.desc,
                        color: 'text-indigo-600',
                    },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 group-hover:text-orange-500 transition-colors leading-tight">
                            {stat.label}
                        </p>
                        <div className="flex items-end gap-1.5 mb-1.5">
                            <span
                                className={`text-xl sm:text-2xl font-black ${stat.color} tracking-tight leading-none`}
                            >
                                {stat.value}
                            </span>
                            {stat.trend && (
                                <TrendingUp
                                    size={14}
                                    className="text-emerald-500 mb-0.5"
                                    strokeWidth={3}
                                />
                            )}
                        </div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight leading-tight line-clamp-2">
                            {stat.desc}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Device Distribution */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 flex flex-col">
                    <h3 className="font-black text-gray-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-widest text-pretty">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                            <Monitor size={18} strokeWidth={2.5} />
                        </div>
                        {t.devices.title}
                    </h3>
                    <div className="h-56">
                        {isChartMounted && (
                            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            {
                                                name: t.devices.mobile,
                                                value:
                                                    stats?.analytics?.devices?.mobile ||
                                                    stats?.analytics?.devices?.Mobile ||
                                                    0,
                                            },
                                            {
                                                name: t.devices.desktop,
                                                value:
                                                    stats?.analytics?.devices?.desktop ||
                                                    stats?.analytics?.devices?.Desktop ||
                                                    stats?.analytics?.devices?.Unknown ||
                                                    0,
                                            },
                                            {
                                                name: t.devices.tablet,
                                                value:
                                                    stats?.analytics?.devices?.tablet ||
                                                    stats?.analytics?.devices?.Tablet ||
                                                    0,
                                            },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        <Cell fill="#3B82F6" stroke="none" />
                                        <Cell fill="#10B981" stroke="none" />
                                        <Cell fill="#F59E0B" stroke="none" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: '9px',
                                            fontWeight: 'black',
                                            textTransform: 'uppercase',
                                            paddingTop: '10px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4 flex items-start gap-2.5">
                        <span className="text-sm mt-px">💡</span>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {t.devices.insight}
                        </p>
                    </div>
                </div>

                {/* Customer Retention */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 flex flex-col">
                    <h3 className="font-black text-gray-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-widest">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <Users size={18} strokeWidth={2.5} />
                        </div>
                        {t.newVsRecurring.title}
                    </h3>
                    <div className="h-56">
                        {isChartMounted && (
                            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            {
                                                name: t.newVsRecurring.new,
                                                value: stats?.retention?.new || 0,
                                            },
                                            {
                                                name: t.newVsRecurring.recur,
                                                value: stats?.retention?.returning || 0,
                                            },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        <Cell fill="#3B82F6" stroke="none" />
                                        <Cell fill="#8B5CF6" stroke="none" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: '9px',
                                            fontWeight: 'black',
                                            textTransform: 'uppercase',
                                            paddingTop: '10px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4 flex items-start gap-2.5">
                        <span className="text-sm mt-px">💡</span>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {t.newVsRecurring.insight}
                        </p>
                    </div>
                </div>

                {/* Category Performance */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 flex flex-col">
                    <h3 className="font-black text-gray-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-widest">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                            <Activity size={18} strokeWidth={2.5} />
                        </div>
                        {t.categoryPerformance.title}
                    </h3>
                    <div className="h-56">
                        {isChartMounted && (
                            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                                <BarChart data={stats?.categoryStats}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#f5f5f5"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        fontSize={8}
                                        fontWeight="bold"
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={str =>
                                            str.length > 10 ? str.substring(0, 8) + '..' : str
                                        }
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        fontSize={8}
                                        fontWeight="bold"
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={val => `${val}€`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        name={t.categoryPerformance.sales}
                                        dataKey="revenue"
                                        fill="#3B82F6"
                                        radius={[6, 6, 0, 0]}
                                        barSize={16}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        name={t.categoryPerformance.ticket}
                                        dataKey="avgPrice"
                                        fill="#F59E0B"
                                        radius={[6, 6, 0, 0]}
                                        barSize={16}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4 flex items-start gap-2.5">
                        <span className="text-sm mt-px">💡</span>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {t.categoryPerformance.insight}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Growth Area Chart */}
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 flex flex-col">
                    <h3 className="font-black text-gray-900 mb-10 flex items-center gap-4 text-sm uppercase tracking-widest">
                        <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                            <TrendingUp size={24} strokeWidth={2.5} />
                        </div>
                        {t.salesGrowth.title}
                    </h3>
                    <div className="h-80">
                        {isChartMounted && (
                            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                                <AreaChart data={stats?.growth}>
                                    <defs>
                                        <linearGradient
                                            id="colorRevenue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#ef4444"
                                                stopOpacity={0.15}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#ef4444"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#f5f5f5"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={10}
                                        fontWeight="black"
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={str =>
                                            str && typeof str === 'string' ? str.split('-')[2] : ''
                                        }
                                    />
                                    <YAxis
                                        fontSize={10}
                                        fontWeight="black"
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={val => `${val}€`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '24px',
                                            border: 'none',
                                            boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
                                            fontWeight: 'black',
                                            padding: '16px',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#ef4444"
                                        strokeWidth={5}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="mt-6 bg-gray-50 p-5 rounded-2xl border border-dashed border-gray-200 flex items-start gap-2.5">
                        <span className="text-sm mt-px">💡</span>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {t.salesGrowth.insight}
                        </p>
                    </div>
                </div>

                {/* Activity Heatmap (Hourly) */}
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 flex flex-col">
                    <h3 className="font-black text-gray-900 mb-10 flex items-center gap-4 text-sm uppercase tracking-widest">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                            <Clock size={24} strokeWidth={2.5} />
                        </div>
                        {t.activityPeaks.title}
                    </h3>
                    <div className="h-80">
                        {isChartMounted && (
                            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                                <BarChart
                                    data={(stats?.heatmap?.hourly || []).map(
                                        (v: number, i: number) => ({ hour: `${i}h`, pedidos: v })
                                    )}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#f5f5f5"
                                    />
                                    <XAxis
                                        dataKey="hour"
                                        fontSize={10}
                                        fontWeight="black"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        fontSize={10}
                                        fontWeight="black"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                        contentStyle={{
                                            borderRadius: '24px',
                                            border: 'none',
                                            boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
                                            fontWeight: 'black',
                                            padding: '16px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="pedidos"
                                        name={t.activityPeaks.orders}
                                        fill="#3B82F6"
                                        radius={[8, 8, 0, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="mt-6 bg-gray-50 p-5 rounded-2xl border border-dashed border-gray-200 flex items-start gap-2.5">
                        <span className="text-sm mt-px">💡</span>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {t.activityPeaks.insight}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Promo Performance */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10">
                    <h3 className="font-black text-gray-900 mb-10 flex items-center gap-3 text-xs uppercase tracking-widest">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <TrendingUp size={18} strokeWidth={2.5} />
                        </div>
                        {t.promoEffectiveness.title}
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-6 bg-purple-50 rounded-[28px] border border-purple-100 shadow-inner">
                            <span className="text-[11px] font-black text-purple-900 uppercase tracking-widest flex flex-col">
                                <span>{t.promoEffectiveness.discountOrders}</span>
                                <span className="text-[9px] text-purple-600 font-bold normal-case mt-0.5">
                                    {Math.round(
                                        ((stats?.promoStats?.count || 0) /
                                            (stats?.promoStats?.totalOrders30 || 1)) *
                                            100
                                    )}
                                    % {t.promoEffectiveness.ordersShare.toLowerCase()}
                                </span>
                            </span>
                            <span className="text-3xl font-black text-purple-700 tabular-nums">
                                {stats?.promoStats?.count || 0}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-5 bg-gray-50 rounded-[24px] border border-gray-100 group">
                                <p className="text-[9px] uppercase font-black text-gray-400 mb-2 group-hover:text-orange-500 transition-colors tracking-widest">
                                    {t.promoEffectiveness.totalSavings}
                                </p>
                                <p className="text-xl font-black text-gray-900 tabular-nums">
                                    {stats?.promoStats?.totalDiscount || 0}€
                                </p>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-[24px] border border-gray-100 group">
                                <p className="text-[9px] uppercase font-black text-gray-400 mb-2 group-hover:text-orange-500 transition-colors tracking-widest">
                                    {t.promoEffectiveness.avgDiscount}
                                </p>
                                <p className="text-xl font-black text-gray-900 tabular-nums">
                                    {stats?.promoStats?.avgDiscount || 0}€
                                </p>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-[24px] border border-gray-100 group">
                                <p className="text-[9px] uppercase font-black text-gray-400 mb-2 group-hover:text-orange-500 transition-colors tracking-widest">
                                    {t.promoEffectiveness.promoRevenue}
                                </p>
                                <p className="text-xl font-black text-gray-900 tabular-nums">
                                    {stats?.promoStats?.promoRevenue || 0}€
                                </p>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-[24px] border border-gray-100 group">
                                <p className="text-[9px] uppercase font-black text-gray-400 mb-2 group-hover:text-orange-500 transition-colors tracking-widest">
                                    {t.promoEffectiveness.revenueShare}
                                </p>
                                <p className="text-xl font-black text-gray-900 tabular-nums">
                                    {Math.round(
                                        ((stats?.promoStats?.promoRevenue || 0) /
                                            (stats?.promoStats?.totalRevenue30 || 1)) *
                                            100
                                    )}
                                    %
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4 flex items-start gap-2.5">
                        <span className="text-sm mt-px">💡</span>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {t.promoEffectiveness.insight}
                        </p>
                    </div>
                </div>

                {/* Area Distribution */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10">
                    <h3 className="font-black text-gray-900 mb-10 flex items-center gap-3 text-xs uppercase tracking-widest">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <ExternalLink size={18} strokeWidth={2.5} />
                        </div>
                        {t.deliveryZones.title}
                    </h3>
                    <div className="space-y-6">
                        {(stats?.areaStats || []).slice(0, 5).map((area: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-800">{area.name}</span>
                                    <span className="text-orange-600">
                                        {area.count} ped. / {area.revenue}€
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                                    <div
                                        className="bg-orange-600 h-full rounded-full transition-all duration-[1500ms] shadow-lg"
                                        style={{
                                            width: `${Math.min(100, (area.revenue / (stats?.areaStats?.[0]?.revenue || 1)) * 100)}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4 flex items-start gap-2.5">
                        <span className="text-sm mt-px">💡</span>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {t.deliveryZones.insight}
                        </p>
                    </div>
                </div>
            </div>

            {/* Promo Campaigns & Analytics Breakdown */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <h3 className="font-black text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <Activity size={20} strokeWidth={2.5} />
                        </div>
                        {t.promoCampaignsBreakdown.title}
                    </h3>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-50">
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {t.promoCampaignsBreakdown.campaign}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right px-2 md:px-4">
                                    {t.promoCampaignsBreakdown.uses}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right px-2 md:px-4">
                                    {t.promoCampaignsBreakdown.revenue}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right px-2 md:px-4">
                                    {t.promoCampaignsBreakdown.discounts}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right px-2 md:px-4">
                                    {t.promoCampaignsBreakdown.avgCheck}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-2 md:px-4">
                                    {t.promoCampaignsBreakdown.conversion}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50">
                            {stats?.promoStats?.campaigns &&
                            stats.promoStats.campaigns.length > 0 ? (
                                stats.promoStats.campaigns.map((item: any, idx: number) => {
                                    const convData = stats?.promoStats?.codesStats?.[item.key];
                                    const convText = convData
                                        ? `${convData.used} / ${convData.generated} (${Math.round((convData.used / convData.generated) * 100)}%)`
                                        : 'N/A';

                                    return (
                                        <tr
                                            key={idx}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="py-2.5 md:py-4 text-xs font-black text-gray-900 uppercase tracking-tight">
                                                <span className="block text-gray-900">
                                                    {(t.promoCampaignsBreakdown.types as any)[
                                                        item.key
                                                    ] || item.key}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                                                    Grupo: {item.code}
                                                </span>
                                            </td>
                                            <td className="py-2.5 md:py-4 text-xs font-black text-slate-700 text-right tabular-nums px-2 md:px-4">
                                                {item.uses}
                                            </td>
                                            <td className="py-2.5 md:py-4 text-xs font-black text-emerald-600 text-right tabular-nums px-2 md:px-4">
                                                {item.totalRevenue}€
                                            </td>
                                            <td className="py-2.5 md:py-4 text-xs font-black text-red-500 text-right tabular-nums px-2 md:px-4">
                                                {item.totalDiscount}€
                                            </td>
                                            <td className="py-2.5 md:py-4 text-xs font-bold text-gray-500 text-right tabular-nums px-2 md:px-4">
                                                {item.avgCheck}€
                                            </td>
                                            <td className="py-2.5 md:py-4 text-xs font-bold text-gray-600 text-center px-2 md:px-4">
                                                {convText}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-8 text-center text-gray-400 font-bold text-xs uppercase tracking-widest"
                                    >
                                        {t.promoCampaignsBreakdown.noData}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Individual promo codes & Active banners configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Individual Promo Codes Usage */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <h3 className="font-black text-gray-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-widest">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <TrendingUp size={18} strokeWidth={2.5} />
                        </div>
                        {t.promoCampaignsBreakdown.individualTitle}
                    </h3>
                    <div className="overflow-y-auto max-h-[350px] custom-scrollbar pr-2 space-y-4">
                        {stats?.promoStats?.individualCodes &&
                        stats.promoStats.individualCodes.length > 0 ? (
                            stats.promoStats.individualCodes
                                .slice(0, 15)
                                .map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between group p-3.5 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-purple-100">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <span className="text-xs font-black text-gray-900 uppercase tracking-tight">
                                                    {item.code}
                                                </span>
                                                <span className="text-[9px] text-gray-400 font-bold block mt-0.5">
                                                    Ahorro total: {item.totalDiscount}€
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-gray-900 tabular-nums">
                                                {item.uses} usos
                                            </p>
                                            <p className="text-[10px] font-bold text-emerald-600 tabular-nums">
                                                {item.totalRevenue}€ rev.
                                            </p>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <p className="text-[10px] text-gray-400 text-center py-12 font-black uppercase tracking-[0.2em]">
                                {t.promoCampaignsBreakdown.noData}
                            </p>
                        )}
                    </div>
                </div>

                {/* Banner Promotions Overview */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <h3 className="font-black text-gray-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-widest">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                            <Monitor size={18} strokeWidth={2.5} />
                        </div>
                        {t.promoCampaignsBreakdown.bannersTitle}
                    </h3>
                    <div className="overflow-y-auto max-h-[350px] custom-scrollbar pr-2 space-y-4">
                        {stats?.promoStats?.banners && stats.promoStats.banners.length > 0 ? (
                            stats.promoStats.banners.map((item: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between group p-3.5 bg-gray-50/50 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-orange-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{item.icon || '📢'}</span>
                                        <div>
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight block max-w-[200px] truncate">
                                                {item.title}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-bold block max-w-[200px] truncate mt-0.5">
                                                {item.description}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1.5">
                                        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                                            {item.discount || 'PROMO'}
                                        </span>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                item.is_active
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                                            }`}
                                        >
                                            {item.is_active
                                                ? t.promoCampaignsBreakdown.bannerActive
                                                : t.promoCampaignsBreakdown.bannerInactive}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-gray-400 text-center py-12 font-black uppercase tracking-[0.2em]">
                                {t.promoCampaignsBreakdown.noData}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Engagement Analytics (Favorites & Shares) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top Favorited */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <h3 className="font-black text-gray-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-widest">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                            <Heart size={18} strokeWidth={2.5} className="fill-orange-600" />
                        </div>
                        {t.topFavorited.title}
                    </h3>
                    <div className="space-y-4">
                        {(stats?.topFavorited || []).length > 0 ? (
                            stats.topFavorited.map((item: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between group p-3 hover:bg-orange-50 rounded-2xl transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-orange-100">
                                            {idx + 1}
                                        </div>
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-gray-900 tabular-nums">
                                            {item.count}
                                        </span>
                                        <Heart
                                            size={12}
                                            className="text-orange-400 fill-orange-400"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-gray-400 text-center py-6 font-black uppercase tracking-[0.2em]">
                                {t.topFavorited.noData}
                            </p>
                        )}
                    </div>
                    <div className="mt-8 p-6 bg-orange-50/50 rounded-[28px] border border-orange-100/50">
                        <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-2">
                            {t.topFavorited.label}
                        </p>
                        <p className="text-[11px] font-bold text-orange-600/80 leading-relaxed mb-4 uppercase tracking-tight">
                            {t.topFavorited.text}
                        </p>
                        <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />{' '}
                            {t.topFavorited.tip}
                        </p>
                        <p className="text-[11px] font-bold text-orange-900/80 leading-relaxed uppercase tracking-tight mt-1">
                            {t.topFavorited.tipText}
                        </p>
                    </div>
                </div>

                {/* Top Shared */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <h3 className="font-black text-gray-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-widest">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Share2 size={18} strokeWidth={2.5} />
                        </div>
                        {t.topShared.title}
                    </h3>
                    <div className="space-y-4">
                        {(stats?.topShared || []).length > 0 ? (
                            stats.topShared.map((item: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between group p-3 hover:bg-blue-50 rounded-2xl transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-blue-100">
                                            {idx + 1}
                                        </div>
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-gray-900 tabular-nums">
                                            {item.count}
                                        </span>
                                        <Share2 size={12} className="text-blue-400" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-gray-400 text-center py-6 font-black uppercase tracking-[0.2em]">
                                {t.topShared.noData}
                            </p>
                        )}
                    </div>
                    <div className="mt-8 p-6 bg-blue-50/50 rounded-[28px] border border-blue-100/50">
                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">
                            {t.topShared.label}
                        </p>
                        <p className="text-[11px] font-bold text-blue-600/80 leading-relaxed mb-4 uppercase tracking-tight">
                            {t.topShared.text}
                        </p>
                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />{' '}
                            {t.topShared.tip}
                        </p>
                        <p className="text-[11px] font-bold text-blue-900/80 leading-relaxed uppercase tracking-tight mt-1">
                            {t.topShared.tipText}
                        </p>
                    </div>
                </div>
            </div>

            {/* ABC Analysis Section */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <h3 className="font-black text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Activity size={20} strokeWidth={2.5} />
                        </div>
                        {t.abcAnalysis.title}
                    </h3>
                    <div className="flex gap-2">
                        <span className="px-4 py-2 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-xl uppercase tracking-widest shadow-sm">
                            {t.abcAnalysis.catA}
                        </span>
                        <span className="px-4 py-2 bg-blue-100 text-blue-700 text-[9px] font-black rounded-xl uppercase tracking-widest shadow-sm">
                            {t.abcAnalysis.catB}
                        </span>
                        <span className="px-4 py-2 bg-gray-100 text-gray-500 text-[9px] font-black rounded-xl uppercase tracking-widest shadow-sm">
                            {t.abcAnalysis.catC}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-50">
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {t.abcAnalysis.product}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right px-2 md:px-4">
                                    {t.abcAnalysis.units}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right px-2 md:px-4">
                                    {t.abcAnalysis.income}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right px-2 md:px-4">
                                    {t.abcAnalysis.revShare}
                                </th>
                                <th className="pb-3 md:pb-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-2 md:px-4">
                                    {t.abcAnalysis.abc}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50">
                            {(stats?.abcAnalysis || [])
                                .slice(0, 15)
                                .map((item: any, idx: number) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-gray-50/50 transition-colors group"
                                    >
                                        <td className="py-2.5 md:py-4 text-xs font-black text-gray-900 uppercase tracking-tight">
                                            {item.name}
                                        </td>
                                        <td className="py-2.5 md:py-4 text-xs font-bold text-gray-400 text-right tabular-nums px-2 md:px-4">
                                            {item.sold}
                                        </td>
                                        <td className="py-2.5 md:py-4 text-xs font-black text-gray-900 text-right tabular-nums px-2 md:px-4">
                                            {item.revenue}€
                                        </td>
                                        <td className="py-2.5 md:py-4 text-xs font-bold text-gray-400 text-right tabular-nums px-2 md:px-4">
                                            {Math.round(item.revenueShare * 10) / 10}%
                                        </td>
                                        <td className="py-2.5 md:py-4 px-2 md:px-4">
                                            <div className="flex justify-center">
                                                <span
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm group-hover:scale-110 transition-transform ${
                                                        item.category === 'A'
                                                            ? 'bg-emerald-600 text-white'
                                                            : item.category === 'B'
                                                              ? 'bg-blue-600 text-white'
                                                              : 'bg-gray-400 text-white'
                                                    }`}
                                                >
                                                    {item.category}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 flex items-start gap-2.5">
                    <span className="text-sm mt-px">💡</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                        {t.abcAnalysis.insight}
                    </p>
                </div>
            </div>

            {/* Weekly Heatmap Matrix */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <h3 className="font-black text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                            <Activity size={20} strokeWidth={2.5} />
                        </div>
                        {t.heatmap.title}
                    </h3>
                    <div className="flex items-center gap-4 bg-gray-50 px-6 py-2.5 rounded-full border border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-orange-100 shadow-sm border border-orange-200"></span>
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                {t.heatmap.low}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-orange-600 shadow-lg border border-orange-700"></span>
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                {t.heatmap.high}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[800px] pb-4">
                        {/* Matrix Header (Hours) */}
                        <div className="flex mb-4 ml-20">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 text-[9px] text-gray-400 font-black text-center uppercase tracking-tighter"
                                >
                                    {i === 0 || i === 12 || i === 23 ? (
                                        <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                                            {i}h
                                        </span>
                                    ) : i % 3 === 0 ? (
                                        i
                                    ) : (
                                        ''
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Matrix Rows */}
                        {t.heatmap.days.map((day, dayIdx) => (
                            <div key={day} className="flex items-center mb-2 group">
                                <div className="w-20 text-[10px] font-black text-gray-400 pr-6 text-right uppercase tracking-widest group-hover:text-orange-600 transition-colors">
                                    {day}
                                </div>
                                <div className="flex-1 flex gap-1 h-10">
                                    {Array.from({ length: 24 }).map((_, hourIdx) => {
                                        const value =
                                            stats?.heatmap?.matrix?.[dayIdx]?.[hourIdx] || 0;
                                        const intensity = Math.min(1, value / 8);
                                        return (
                                            <div
                                                key={hourIdx}
                                                title={`${day} ${hourIdx}h: ${value} ${t.activityPeaks.orders}`}
                                                className="flex-1 rounded-lg transition-all hover:ring-4 hover:ring-orange-400/20 cursor-help shadow-sm"
                                                style={{
                                                    backgroundColor: `rgba(234, 88, 12, ${Math.max(0.04, intensity)})`,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-6 bg-orange-50/50 p-5 rounded-2xl border border-orange-100 flex items-start gap-2.5">
                    <span className="text-sm mt-px">💡</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                        {t.heatmap.insight}
                    </p>
                </div>
            </div>
            {/* Reports Section */}
            <div className="mt-12 bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <h3 className="font-black text-gray-900 flex items-center gap-4 text-sm uppercase tracking-widest">
                        <div className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-600 rounded-2xl shadow-inner">
                            <Archive size={24} strokeWidth={2.5} />
                        </div>
                        {t.reports.title}
                    </h3>
                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : (
                            <Archive size={16} />
                        )}
                        {t.reports.archiveBtn}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportsLoading ? (
                        <div className="col-span-full py-12 flex justify-center">
                            <RefreshCw className="animate-spin text-orange-600" size={32} />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                            {t.reports.noReports}
                        </div>
                    ) : (
                        reports.map(report => (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReport(report)}
                                className="group flex items-center justify-between p-6 bg-gray-50 hover:bg-white rounded-3xl border border-transparent hover:border-orange-200 transition-all hover:shadow-xl hover:shadow-orange-100/50 text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-white group-hover:bg-orange-600 group-hover:text-white rounded-2xl shadow-sm transition-colors">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900 uppercase">
                                            {new Date(
                                                report.year,
                                                report.month - 1
                                            ).toLocaleDateString(language, {
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {report.report_data?.summary?.totalRevenue || 0}€ •{' '}
                                            {report.report_data?.summary?.totalOrders || 0}{' '}
                                            {t.reports.orders.toLowerCase()}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight
                                    size={20}
                                    className="text-gray-300 group-hover:text-orange-600 transition-transform group-hover:translate-x-1"
                                />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#fbf7f0] w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/50 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-200 flex justify-between items-center bg-white">
                            <div>
                                <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                    {new Date(
                                        selectedReport.year,
                                        selectedReport.month - 1
                                    ).toLocaleDateString(language, {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </h4>
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mt-1">
                                    {t.reports.summary}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: t.reports.revenue,
                                        value: `${selectedReport.report_data?.summary?.totalRevenue || 0}€`,
                                        color: 'text-gray-900',
                                    },
                                    {
                                        label: t.reports.orders,
                                        value:
                                            selectedReport.report_data?.summary?.totalOrders || 0,
                                        color: 'text-orange-600',
                                    },
                                    {
                                        label: t.reports.avgCheck,
                                        value: `${selectedReport.report_data?.summary?.avgTicket || 0}€`,
                                        color: 'text-gray-900',
                                    },
                                    {
                                        label: t.reports.discounts,
                                        value: `${selectedReport.report_data?.summary?.totalDiscounts || 0}€`,
                                        color: 'text-red-600',
                                    },
                                    {
                                        label: t.reports.reservations,
                                        value:
                                            selectedReport.report_data?.summary
                                                ?.totalReservations || 0,
                                        color: 'text-blue-600',
                                    },
                                    {
                                        label: t.reports.registrations,
                                        value:
                                            selectedReport.report_data?.summary?.registrations || 0,
                                        color: 'text-purple-600',
                                    },
                                ].map((s, i) => (
                                    <div
                                        key={i}
                                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                                    >
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            {s.label}
                                        </p>
                                        <p
                                            className={`text-2xl font-black ${s.color} tracking-tight`}
                                        >
                                            {s.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Top Items */}
                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <h5 className="text-xs font-black uppercase tracking-widest mb-6 text-gray-900 border-b border-gray-50 pb-4">
                                        {t.reports.topItems}
                                    </h5>
                                    <div className="space-y-4">
                                        {(selectedReport.report_data?.topItems || []).map(
                                            (item: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between items-center group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-700">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-orange-600">
                                                        {item.qty} {t.reports.qty}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Top Clients */}
                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <h5 className="text-xs font-black uppercase tracking-widest mb-6 text-gray-900 border-b border-gray-50 pb-4">
                                        {t.reports.topClients}
                                    </h5>
                                    <div className="space-y-4">
                                        {(selectedReport.report_data?.topClients || []).map(
                                            (client: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-700">
                                                            {client.name}
                                                        </p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                                            {client.orders}{' '}
                                                            {t.reports.orders.toLowerCase()}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-600">
                                                        {client.total}€ {t.reports.total}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
