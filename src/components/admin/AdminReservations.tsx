import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Calendar,
    Clock,
    Phone,
    Mail,
    CheckCircle,
    XCircle,
    Trash2,
    Search,
    MessageSquare,
    RotateCcw,
    RefreshCw,
} from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { ru, es } from 'date-fns/locale';

interface Reservation {
    id: string;
    name: string;
    email: string;
    phone: string;
    reservation_date: string;
    reservation_time: string;
    guests: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    notes?: string;
    created_at: string;
}

interface AdminReservationsProps {
    language?: 'ru' | 'es';
}

const RESERVATIONS_TRANSLATIONS = {
    ru: {
        title: 'Бронирования',
        totalReservas: 'Всего броней',
        pendientes: 'Ожидают',
        confirmedToday: 'Подтверждены',
        searchPlaceholder: 'Поиск по имени, email или телефону...',
        filters: {
            all: 'Все',
            pending: 'Ожидают',
            confirmed: 'Подтверждены',
            cancelled: 'Отменены',
        },
        noReservations: 'Бронирования не найдены',
        status: {
            pending: 'Ожидает',
            confirmed: 'Подтверждена',
            cancelled: 'Отменена',
        },
        pers: 'чел.',
        revert: 'ВЕРНУТЬ',
        loading: 'Загрузка бронирований...',
        modals: {
            deleteTitle: 'Удалить бронирование?',
            deleteDesc:
                'Вы собираетесь удалить бронирование на имя "{name}". Это действие нельзя отменить.',
            yesDelete: 'ДА, УДАЛИТЬ',
            cancel: 'ОТМЕНА',
        },
        actions: {
            confirm: 'Подтвердить',
            cancel: 'Отменить',
            delete: 'Удалить',
            whatsapp: 'WhatsApp',
        },
        createdAt: 'Создано:',
    },
    es: {
        title: 'Reservas',
        totalReservas: 'Total Reservas',
        pendientes: 'Pendientes',
        confirmedToday: 'Confirmadas',
        searchPlaceholder: 'Buscar por nombre, email o teléfono...',
        filters: {
            all: 'Ver Todo',
            pending: 'Pendientes',
            confirmed: 'Confirmadas',
            cancelled: 'Canceladas',
        },
        noReservations: 'No se encontraron reservas',
        status: {
            pending: 'Pendiente',
            confirmed: 'Confirmada',
            cancelled: 'Cancelada',
        },
        pers: 'pers.',
        revert: 'REVERTIR',
        loading: 'Cargando reservas...',
        modals: {
            deleteTitle: '¿Eliminar Reserva?',
            deleteDesc:
                'Estás a punto de eliminar la reserva de "{name}". Esta acción no se puede deshacer.',
            yesDelete: 'SÍ, ELIMINAR',
            cancel: 'CANCELAR',
        },
        actions: {
            confirm: 'Confirmar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            whatsapp: 'WhatsApp',
        },
        createdAt: 'Creado:',
    },
} as const;

export default function AdminReservations({ language = 'es' }: AdminReservationsProps) {
    const queryClient = useQueryClient();
    const { success: showSuccess, error: showError } = useToast();
    const t = RESERVATIONS_TRANSLATIONS[language];
    const dateLocale = language === 'ru' ? ru : es;

    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (reservationToDelete) {
            document.body.style.overflow = 'hidden';
            (window as any).lenis?.stop();
        } else {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        }
        return () => {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        };
    }, [reservationToDelete]);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-reservations', filter],
        queryFn: () => api.get(`/admin/reservations${filter !== 'all' ? `?status=${filter}` : ''}`),
        refetchInterval: 30000,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, status, notes }: { id: string; status?: string; notes?: string }) =>
            api.patch(`/admin/reservations/${id}`, { status, notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
            showSuccess(language === 'ru' ? 'Обновлено успешно' : 'Actualizado con éxito');
        },
        onError: (err: any) => {
            console.error('Update error:', err);
            showError(
                err.response?.data?.error ||
                    (language === 'ru' ? 'Ошибка обновления' : 'Error al actualizar')
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/reservations/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
            setReservationToDelete(null);
            showSuccess(language === 'ru' ? 'Удалено успешно' : 'Eliminado con éxito');
        },
        onError: (err: any) => {
            console.error('Delete error:', err);
            showError(
                err.response?.data?.error ||
                    (language === 'ru' ? 'Ошибка удаления' : 'Error al eliminar')
            );
        },
    });

    const reservations = (data?.reservations || []) as Reservation[];

    const filteredReservations = reservations.filter(
        res =>
            res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            res.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            res.phone.includes(searchTerm)
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'text-green-600 bg-green-50 border-green-100';
            case 'cancelled':
                return 'text-orange-500 bg-orange-50 border-orange-100';
            default:
                return 'text-amber-600 bg-amber-50 border-amber-100';
        }
    };

    const stats = {
        total: reservations.length,
        pending: reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
    };

    if (isLoading) {
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
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-md transition-all">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-orange-600 transition-colors">
                        {t.totalReservas}
                    </p>
                    <p className="text-4xl font-black text-gray-900 tabular-nums">{stats.total}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-md transition-all">
                    <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-amber-700 transition-colors">
                        {t.pendientes}
                    </p>
                    <p className="text-4xl font-black text-amber-600 tabular-nums">
                        {stats.pending}
                    </p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-md transition-all">
                    <p className="text-green-600 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-green-700 transition-colors">
                        {t.confirmedToday}
                    </p>
                    <p className="text-4xl font-black text-green-600 tabular-nums">
                        {stats.confirmed}
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 w-full relative">
                    <Search
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors"
                        size={20}
                        strokeWidth={2.5}
                    />
                    <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none transition-all shadow-inner"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 shadow-sm ${
                                filter === s
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-white hover:text-gray-900'
                            }`}
                        >
                            {s === 'all' ? t.filters.all : t.filters[s as keyof typeof t.filters]}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {filteredReservations.length === 0 ? (
                <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-gray-100 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Users size={40} strokeWidth={1.5} />
                    </div>
                    <p className="font-black text-gray-400 uppercase tracking-widest text-xs">
                        {t.noReservations}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredReservations.map(res => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={res.id}
                                className="bg-white p-8 rounded-[36px] border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-8 items-start lg:items-center hover:shadow-md hover:border-orange-100 transition-all group"
                            >
                                <div className="flex-1 space-y-6">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(res.status)}`}
                                        >
                                            {t.status[res.status]}
                                        </span>
                                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                                            {res.name}
                                            <span className="text-orange-600 bg-orange-50 px-3 py-1 rounded-lg text-xs font-black tracking-tighter shadow-sm border border-orange-100">
                                                {res.guests}{' '}
                                                <span className="text-[10px] opacity-70 ml-0.5">
                                                    {t.pers}
                                                </span>
                                            </span>
                                        </h3>
                                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            {(t as any).createdAt}{' '}
                                            {format(new Date(res.created_at), 'dd.MM.yyyy HH:mm')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="flex items-center gap-4 text-xs font-black text-gray-900 uppercase tracking-tighter">
                                            <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-orange-500 transition-colors">
                                                <Calendar size={18} strokeWidth={2.5} />
                                            </div>
                                            {format(
                                                new Date(res.reservation_date),
                                                language === 'ru'
                                                    ? 'eeee, d MMMM'
                                                    : "eeee d 'de' MMMM",
                                                { locale: dateLocale }
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-black text-gray-900 uppercase tracking-tighter">
                                            <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-orange-500 transition-colors">
                                                <Clock size={18} strokeWidth={2.5} />
                                            </div>
                                            {res.reservation_time}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-black text-gray-900 uppercase tracking-tighter tabular-nums">
                                            <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-orange-500 transition-colors">
                                                <Phone size={18} strokeWidth={2.5} />
                                            </div>
                                            {res.phone}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-black text-gray-400 lowercase italic group-hover:text-gray-900 transition-colors">
                                            <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-orange-500 transition-colors">
                                                <Mail size={18} strokeWidth={2.5} />
                                            </div>
                                            {res.email}
                                        </div>
                                    </div>

                                    {res.notes && (
                                        <div className="p-5 bg-gray-50/50 rounded-[28px] flex gap-4 items-start border border-gray-100 shadow-inner group-hover:bg-orange-50/30 transition-colors">
                                            <MessageSquare
                                                size={18}
                                                className="text-orange-300 mt-0.5"
                                                strokeWidth={2.5}
                                            />
                                            <p className="text-xs font-bold text-gray-500 italic leading-relaxed">
                                                "{res.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3 lg:w-48 justify-end">
                                    <button
                                        onClick={() => {
                                            const cleanPhone = res.phone.replace(/\D/g, '');
                                            const dateStr = format(
                                                new Date(res.reservation_date),
                                                language === 'ru'
                                                    ? 'eeee, d MMMM'
                                                    : "eeee, d 'de' MMMM",
                                                { locale: dateLocale }
                                            );
                                            const capitalizedDate =
                                                dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

                                            const message =
                                                language === 'ru'
                                                    ? `Здравствуйте, ${res.name}! Ваше бронирование подтверждено на ${capitalizedDate} в ${res.reservation_time} (${res.guests} чел.). Ждем вас!`
                                                    : `Hola ${res.name}, tu reserva está confirmada para el ${capitalizedDate} a las ${res.reservation_time} (${res.guests} personas). ¡Te esperamos!`;

                                            window.open(
                                                `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
                                                '_blank'
                                            );
                                        }}
                                        className="h-14 w-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center hover:bg-black transition-all shadow-xl shadow-green-100 active:scale-90"
                                        title={(t as any).actions.whatsapp}
                                    >
                                        <MessageSquare size={24} strokeWidth={2.5} />
                                    </button>

                                    {res.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    updateMutation.mutate({
                                                        id: res.id,
                                                        status: 'confirmed',
                                                    })
                                                }
                                                className="h-14 w-14 rounded-2xl bg-green-600 text-white flex items-center justify-center hover:bg-black transition-all shadow-xl shadow-green-100 active:scale-90"
                                                title={t.actions.confirm}
                                            >
                                                <CheckCircle size={24} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    updateMutation.mutate({
                                                        id: res.id,
                                                        status: 'cancelled',
                                                    })
                                                }
                                                className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-all border border-orange-200 active:scale-90"
                                                title={t.actions.cancel}
                                            >
                                                <XCircle size={24} strokeWidth={2.5} />
                                            </button>
                                        </>
                                    )}
                                    {res.status !== 'pending' && (
                                        <button
                                            onClick={() =>
                                                updateMutation.mutate({
                                                    id: res.id,
                                                    status: 'pending',
                                                })
                                            }
                                            className="px-6 h-14 rounded-2xl bg-gray-900 text-white font-black text-[10px] tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center gap-2"
                                        >
                                            <RotateCcw size={16} strokeWidth={3} /> {t.revert}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setReservationToDelete(res)}
                                        className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all border border-gray-100 shadow-sm active:scale-90"
                                        title={t.actions.delete}
                                    >
                                        <Trash2 size={24} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {reservationToDelete &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] bg-gray-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain py-10 px-4 flex justify-center items-center"
                        onClick={e => {
                            if (e.target === e.currentTarget) setReservationToDelete(null);
                        }}
                    >
                        <div className="relative bg-white rounded-[32px] p-10 max-sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-orange-50">
                                    <Trash2 size={36} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight uppercase">
                                    {t.modals.deleteTitle}
                                </h3>
                                <p className="text-[11px] text-gray-400 font-bold mb-10 leading-relaxed uppercase tracking-widest">
                                    {t.modals.deleteDesc.replace('{name}', '')}
                                    <span className="text-orange-600 font-black block mt-2 text-base">
                                        "{reservationToDelete?.name}"
                                    </span>
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() =>
                                            deleteMutation.mutate(reservationToDelete.id)
                                        }
                                        disabled={deleteMutation.isPending}
                                        className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-orange-100 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {deleteMutation.isPending && (
                                            <RefreshCw size={16} className="animate-spin" />
                                        )}
                                        {t.modals.yesDelete}
                                    </button>
                                    <button
                                        onClick={() => setReservationToDelete(null)}
                                        className="w-full py-5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all active:scale-95"
                                    >
                                        {t.modals.cancel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
