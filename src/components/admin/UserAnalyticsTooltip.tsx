import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Wallet, TrendingUp, Clock, Heart, Calendar } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface UserAnalyticsTooltipProps {
    stats: {
        orderCount: number;
        totalSpent: number;
        avgCheck: number;
        frequency: string;
        favoriteDish: string;
        registrationDate?: string;
    };
    language: 'ru' | 'es';
    isVisible: boolean;
    triggerRef: React.RefObject<HTMLElement>;
}

const TOOLTIP_TRANSLATIONS = {
    ru: {
        orders: 'ЗАКАЗОВ',
        invested: 'ВЛОЖЕНО',
        avgCheck: 'СР. ЧЕК',
        frequency: 'ЧАСТОТА',
        regDate: 'РЕГИСТРАЦИЯ',
        favoriteDish: 'ЛЮБИМОЕ БЛЮДО',
        frequencies: {
            'Varias veces al día': 'НЕСКОЛЬКО РАЗ В ДЕНЬ',
            Diariamente: 'ЕЖЕДНЕВНО',
            Semanalmente: 'ЕЖЕНЕДЕЛЬНО',
            'Primer pedido': 'ПЕРВЫЙ ЗАКАЗ',
        },
    },
    es: {
        orders: 'PEDIDOS',
        invested: 'INVERTIDO',
        avgCheck: 'TICKET MEDIO',
        frequency: 'FRECUENCIA',
        regDate: 'REGISTRO',
        favoriteDish: 'PLATO FAVORITO',
        frequencies: {
            'Varias veces al día': 'VARIAS VECES AL DÍA',
            Diariamente: 'DIARIAMENTE',
            Semanalmente: 'SEMANALMENTE',
            'Primer pedido': 'PRIMER PEDIDO',
        },
    },
};

export const UserAnalyticsTooltip = memo(
    ({ stats, language, isVisible, triggerRef }: UserAnalyticsTooltipProps) => {
        const t = TOOLTIP_TRANSLATIONS[language];
        const [coords, setCoords] = useState({ top: 0, left: 0 });

        useEffect(() => {
            if (isVisible && triggerRef.current) {
                const updatePosition = () => {
                    const rect = triggerRef.current?.getBoundingClientRect();
                    if (rect) {
                        setCoords({
                            top: rect.top + window.scrollY,
                            left: rect.left + rect.width / 2 + window.scrollX,
                        });
                    }
                };

                updatePosition();
                window.addEventListener('scroll', updatePosition, true);
                window.addEventListener('resize', updatePosition);

                return () => {
                    window.removeEventListener('scroll', updatePosition, true);
                    window.removeEventListener('resize', updatePosition);
                };
            }
        }, [isVisible, triggerRef]);

        // Format frequency string if it matches known patterns
        const formatFrequency = (freq: string) => {
            const keys = t.frequencies as Record<string, string>;
            if (keys[freq]) return keys[freq];
            // If it's "Cada X días"
            if (language === 'ru' && freq.startsWith('Cada ')) {
                return freq.replace('Cada ', 'КАЖДЫЕ ').replace(' días', ' ДН.').toUpperCase();
            }
            return freq.toUpperCase();
        };

        const content = (
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            top: coords.top - 20,
                            left: coords.left,
                            x: '-50%',
                            y: '-100%',
                        }}
                        className="w-72 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 p-6 z-popover pointer-events-none"
                    >
                        {/* Header with Registration Date */}
                        {stats.registrationDate && (
                            <div className="flex items-center justify-between mb-6 bg-orange-50/50 px-4 py-2 rounded-2xl border border-orange-100/50">
                                <div className="flex items-center gap-2 text-orange-600">
                                    <Calendar size={12} strokeWidth={3} />
                                    <span className="text-[9px] font-black tracking-widest uppercase">
                                        {t.regDate}
                                    </span>
                                </div>
                                <div className="text-orange-900 font-black text-[10px] tabular-nums">
                                    {new Date(stats.registrationDate).toLocaleDateString(
                                        language === 'ru' ? 'ru-RU' : 'es-ES'
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                            {/* Orders */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <ShoppingCart size={14} className="opacity-70" />
                                    <span className="text-[9px] font-black tracking-widest uppercase">
                                        {t.orders}
                                    </span>
                                </div>
                                <div className="text-gray-900 font-black text-base tabular-nums">
                                    {stats.orderCount}
                                </div>
                            </div>

                            {/* Invested */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Wallet size={14} className="opacity-70" />
                                    <span className="text-[9px] font-black tracking-widest uppercase">
                                        {t.invested}
                                    </span>
                                </div>
                                <div className="text-gray-900 font-black text-base tabular-nums">
                                    {stats.totalSpent.toFixed(2).replace('.', ',')} €
                                </div>
                            </div>

                            {/* Avg Check */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <TrendingUp size={14} className="opacity-70" />
                                    <span className="text-[9px] font-black tracking-widest uppercase">
                                        {t.avgCheck}
                                    </span>
                                </div>
                                <div className="text-gray-900 font-black text-base tabular-nums">
                                    {stats.avgCheck.toFixed(2).replace('.', ',')} €
                                </div>
                            </div>

                            {/* Frequency */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock size={14} className="opacity-70" />
                                    <span className="text-[9px] font-black tracking-widest uppercase">
                                        {t.frequency}
                                    </span>
                                </div>
                                <div className="text-gray-900 font-black text-[10px] leading-tight uppercase">
                                    {formatFrequency(stats.frequency)}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-100 w-full mb-5" />

                        {/* Favorite Dish */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-orange-500">
                                <Heart size={14} fill="currentColor" />
                                <span className="text-[9px] font-black tracking-widest uppercase">
                                    {t.favoriteDish}
                                </span>
                            </div>
                            <div className="text-gray-900 font-black text-[11px] uppercase tracking-tight line-clamp-1">
                                {stats.favoriteDish}
                            </div>
                        </div>

                        {/* Triangle Arrow */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        );

        return createPortal(content, document.body);
    }
);
