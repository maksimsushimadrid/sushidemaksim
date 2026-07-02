import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';

interface AdminSettingsProps {
    language?: 'ru' | 'es';
}

const SETTINGS_TRANSLATIONS = {
    ru: {
        title: 'Настройки контактов',
        saveBtn: 'Сохранить изменения',
        savingBtn: 'Сохранение...',
        loading: 'Загрузка настроек...',
        generalInfo: 'Общая информация',
        phone: 'Телефон',
        email: 'Email',
        physicalAddress: 'Физический адрес',
        addressLine1: 'Адрес (Строка 1)',
        addressLine2: 'Адрес (Строка 2)',
        addressPlaceholder1: 'Улица Баррилеро, 20,',
        addressPlaceholder2: '28007 Мадрид',
        googleMapsLabel: 'URL Google Maps (при клике на "Карту")',
        generateFromAddress: 'Сгенерировать по адресу',
        socialNetworks: 'Социальные сети',
        addSocial: 'Добавить соцсеть',
        platform: 'Платформа',
        icon: 'Иконка',
        urlLink: 'Ссылка / URL',
        noSocials: 'Социальные сети не настроены.',
        scheduleTitle: 'Расписание (JSON)',
        scheduleDesc:
            'Продвинутый режим. Изменение этого JSON обновит отображаемое расписание (свойства: "days", "hours", "closed").',
        success: {
            title: 'Изменения сохранены!',
            desc: 'Настройки успешно обновлены.',
        },
        error: {
            title: 'Ошибка',
            desc: 'Проблема при сохранении изменений.',
        },
        removeSocial: {
            title: 'Удалить соцсеть?',
            desc: 'Вы собираетесь удалить "{name}" из списка.',
            yes: 'ДА, УДАЛИТЬ',
            no: 'ОТМЕНА',
        },
        newSocialName: 'Новая сеть',
        ratingsTitle: 'Внешние рейтинги',
        ratingTheFork: 'Рейтинг The Fork',
        ratingGoogle: 'Рейтинг Google',
        ratingReviewsCount: 'Количество отзывов (всего)',
        isTodayClosed: 'Закрыть заказы на сегодня',
        isTodayClosedDesc:
            'Если включено, клиенты смогут заказывать только на завтра или другие будущие даты.',
        isPickupOnly: 'Только самовывоз на сегодня',
        isPickupOnlyDesc:
            'Если включено, клиенты смогут сделать заказ на сегодня, но только с забором из ресторана. Доставка будет отключена.',
        isReservationsTodayClosed: 'Закрыть резервы на сегодня',
        isReservationsTodayClosedDesc:
            'Если включено, клиенты не смогут забронировать стол на сегодня (все столы заняты), но смогут на будущие даты.',
        vacationTitle: 'Даты отпуска / закрытия ресторана',
        vacationDesc:
            'Укажите период, в течение которого ресторан будет полностью закрыт для заказов.',
        vacationStart: 'Дата начала отпуска',
        vacationEnd: 'Дата окончания отпуска',
        clearVacation: 'Сбросить даты отпуска',
    },
    es: {
        title: 'Configuración de Contactos',
        saveBtn: 'Guardar Cambios',
        savingBtn: 'Guardando...',
        loading: 'Cargando ajustes...',
        generalInfo: 'Información General',
        phone: 'Teléfono',
        email: 'Email',
        physicalAddress: 'Dirección Físicia',
        addressLine1: 'Dirección (Línea 1)',
        addressLine2: 'Dirección (Línea 2)',
        addressPlaceholder1: 'Calle Barrilero, 20,',
        addressPlaceholder2: '28007 Madrid',
        googleMapsLabel: "URL Google Maps (al hacer clic en 'Ver Mapa')",
        generateFromAddress: 'Generar desde dirección',
        socialNetworks: 'Redes Sociales',
        addSocial: 'Añadir red social',
        platform: 'Plataforma',
        icon: 'Icono Lucide/SVG',
        urlLink: 'Enlace / URL',
        noSocials: 'No hay redes sociales configuradas.',
        scheduleTitle: 'Horarios (JSON)',
        scheduleDesc:
            'Modo avanzado. Modificar este JSON actualiza los horarios mostrados (propiedades: "days", "hours", "closed")',
        success: {
            title: '¡Cambios guardados!',
            desc: 'La configuración se actualizó correctamente.',
        },
        error: {
            title: 'Error',
            desc: 'Hubo un problema al guardar los cambios.',
        },
        removeSocial: {
            title: '¿Quitar red social?',
            desc: 'Estás a punto de quitar "{name}" de la lista.',
            yes: 'SÍ, QUITAR',
            no: 'CANCELAR',
        },
        newSocialName: 'Nueva Red',
        ratingsTitle: 'Valoraciones Externas',
        ratingTheFork: 'Puntuación The Fork',
        ratingGoogle: 'Puntuación Google',
        ratingReviewsCount: 'Total de reseñas',
        isTodayClosed: 'Cerrar pedidos para hoy',
        isTodayClosedDesc:
            'Si se activa, los clientes solo podrán pedir para mañana o días posteriores.',
        isPickupOnly: 'Sólo recogida hoy',
        isPickupOnlyDesc:
            'Si se activa, los clientes podrán pedir para hoy pero solo para recoger en el local. El reparto a domicilio quedará desactivado.',
        isReservationsTodayClosed: 'Cerrar reservas para hoy',
        isReservationsTodayClosedDesc:
            'Si se activa, los clientes no podrán reservar mesa para hoy, pero sí para fechas futuras.',
        vacationTitle: 'Fechas de Vacaciones (Cierre del Restaurante)',
        vacationDesc:
            'Especifica el período en el que el restaurante estará completamente cerrado.',
        vacationStart: 'Fecha de inicio',
        vacationEnd: 'Fecha de fin',
        clearVacation: 'Limpiar fechas de vacaciones',
    },
} as const;

export default function AdminSettings({ language = 'es' }: AdminSettingsProps) {
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<null | 'success' | 'error'>(null);
    const [socialToRemove, setSocialToRemove] = useState<number | null>(null);

    const t = SETTINGS_TRANSLATIONS[language];

    // Settings Query
    const { data: remoteSettings, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const data = await api.get('/admin/settings');
            return {
                contactPhone: data.contactPhone || '',
                contactEmail: data.contactEmail || '',
                contactAddressLine1: data.contactAddressLine1 || '',
                contactAddressLine2: data.contactAddressLine2 || '',
                contactGoogleMapsUrl: data.contactGoogleMapsUrl || '',
                contactSchedule: Array.isArray(data.contactSchedule) ? data.contactSchedule : [],
                socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
                estDeliveryTime: data.estDeliveryTime || '30-60 min',
                closedMessage:
                    data.closedMessage || 'Lo sentimos, la cocina está cerrada temporalmente.',
                ratingTheFork: data.ratingTheFork || 9.1,
                ratingGoogle: data.ratingGoogle || 4.8,
                ratingReviewsCount: data.ratingReviewsCount || 543,
                isTodayClosed: data.isTodayClosed === 'true',
                isPickupOnly: data.isPickupOnly === 'true',
                isReservationsTodayClosed: data.isReservationsTodayClosed === 'true',
                vacationStartDate: data.vacationStartDate || '',
                vacationEndDate: data.vacationEndDate || '',
            };
        },
        refetchOnWindowFocus: false,
    });

    const updateMutation = useMutation({
        mutationFn: (payload: any) => api.put('/admin/settings', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 4000);
        },
        onError: () => {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 4000);
        },
    });

    // Update local state ONLY when remote data is initially loaded or when it truly changes from server
    useEffect(() => {
        if (remoteSettings) {
            setLocalSettings(remoteSettings);
        }
    }, [remoteSettings]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (localSettings) {
            updateMutation.mutate(localSettings);
        }
    };

    const handleAddSocial = () => {
        if (!localSettings) return;
        setLocalSettings({
            ...localSettings,
            socialLinks: [
                ...localSettings.socialLinks,
                { platform: t.newSocialName, url: '#', icon: 'facebook' },
            ],
        });
    };

    const confirmRemoveSocial = () => {
        if (socialToRemove === null || !localSettings) return;
        const newLinks = [...localSettings.socialLinks];
        newLinks.splice(socialToRemove, 1);
        setLocalSettings({ ...localSettings, socialLinks: newLinks });
        setSocialToRemove(null);
    };

    const handleUpdateSocial = (index: number, key: string, value: string) => {
        if (!localSettings) return;
        const newLinks = [...localSettings.socialLinks];
        newLinks[index] = { ...newLinks[index], [key]: value };
        setLocalSettings({ ...localSettings, socialLinks: newLinks });
    };

    if (isLoading || !localSettings) {
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
        <form
            onSubmit={handleSave}
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20"
        >
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                    {t.title}
                </h2>
                <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-orange-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-orange-100 disabled:opacity-50 active:scale-95"
                >
                    {updateMutation.isPending ? (
                        <RefreshCw size={18} strokeWidth={3} className="animate-spin" />
                    ) : (
                        <Save size={18} strokeWidth={2.5} />
                    )}
                    {updateMutation.isPending ? t.savingBtn : t.saveBtn}
                </button>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 text-orange-600 border-l-4 border-orange-100 pl-4 mb-8">
                    <h3 className="font-black text-xs uppercase tracking-[0.15em]">
                        {t.generalInfo}
                    </h3>
                </div>
                <div className="flex flex-col md:flex-row gap-6 p-6 bg-orange-50/50 rounded-2xl border border-orange-100 mb-4">
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-orange-900 uppercase tracking-tight mb-1">
                            {t.isTodayClosed}
                        </h4>
                        <p className="text-[11px] text-orange-800/80 font-medium">
                            {t.isTodayClosedDesc}
                        </p>
                    </div>
                    <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSettings.isTodayClosed}
                                onChange={e =>
                                    setLocalSettings({
                                        ...localSettings,
                                        isTodayClosed: e.target.checked,
                                        // If orders are closed, pickup only loses its meaning
                                        isPickupOnly: e.target.checked
                                            ? false
                                            : localSettings.isPickupOnly,
                                    })
                                }
                                className="sr-only peer"
                            />
                            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 p-6 bg-orange-50/50 rounded-2xl border border-orange-100 mb-8">
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-orange-900 uppercase tracking-tight mb-1">
                            {t.isPickupOnly}
                        </h4>
                        <p className="text-[11px] text-orange-800/80 font-medium">
                            {t.isPickupOnlyDesc}
                        </p>
                    </div>
                    <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSettings.isPickupOnly}
                                onChange={e =>
                                    setLocalSettings({
                                        ...localSettings,
                                        isPickupOnly: e.target.checked,
                                        // If pickup only is enabled, we are definitely NOT closed
                                        isTodayClosed: e.target.checked
                                            ? false
                                            : localSettings.isTodayClosed,
                                    })
                                }
                                className="sr-only peer"
                            />
                            <div
                                className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer 
                                           peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                           peer-checked:after:border-white after:content-[''] after:absolute 
                                           after:top-1 after:start-[4px] after:bg-white after:border-gray-300 
                                           after:border after:rounded-full after:h-6 after:w-6 after:transition-all 
                                           peer-checked:bg-orange-600"
                            ></div>
                        </label>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6 p-6 bg-orange-50/50 rounded-2xl border border-orange-100 mb-8">
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-orange-900 uppercase tracking-tight mb-1">
                            {t.isReservationsTodayClosed}
                        </h4>
                        <p className="text-[11px] text-orange-800/80 font-medium">
                            {t.isReservationsTodayClosedDesc}
                        </p>
                    </div>
                    <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSettings.isReservationsTodayClosed}
                                onChange={e =>
                                    setLocalSettings({
                                        ...localSettings,
                                        isReservationsTodayClosed: e.target.checked,
                                    })
                                }
                                className="sr-only peer"
                            />
                            <div
                                className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer 
                                           peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                           peer-checked:after:border-white after:content-[''] after:absolute 
                                           after:top-1 after:start-[4px] after:bg-white after:border-gray-300 
                                           after:border after:rounded-full after:h-6 after:w-6 after:transition-all 
                                           peer-checked:bg-orange-600"
                            ></div>
                        </label>
                    </div>
                </div>

                {/* Vacation Dates Configuration */}
                <div className="p-6 bg-orange-50/30 rounded-2xl border border-orange-100/50 mb-8 space-y-4">
                    <div>
                        <h4 className="text-sm font-black text-orange-900 uppercase tracking-tight mb-1">
                            {t.vacationTitle}
                        </h4>
                        <p className="text-[11px] text-orange-800/80 font-medium">
                            {t.vacationDesc}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black text-orange-800/60 uppercase tracking-wider pl-1">
                                {t.vacationStart}
                            </label>
                            <input
                                type="date"
                                value={localSettings.vacationStartDate || ''}
                                onChange={e =>
                                    setLocalSettings({
                                        ...localSettings,
                                        vacationStartDate: e.target.value,
                                    })
                                }
                                className="w-full bg-white border border-orange-100 rounded-xl px-4 py-3 text-sm font-black text-gray-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all cursor-pointer"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black text-orange-800/60 uppercase tracking-wider pl-1">
                                {t.vacationEnd}
                            </label>
                            <input
                                type="date"
                                value={localSettings.vacationEndDate || ''}
                                onChange={e =>
                                    setLocalSettings({
                                        ...localSettings,
                                        vacationEndDate: e.target.value,
                                    })
                                }
                                className="w-full bg-white border border-orange-100 rounded-xl px-4 py-3 text-sm font-black text-gray-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all cursor-pointer"
                            />
                        </div>
                    </div>
                    {(localSettings.vacationStartDate || localSettings.vacationEndDate) && (
                        <button
                            type="button"
                            onClick={() =>
                                setLocalSettings({
                                    ...localSettings,
                                    vacationStartDate: '',
                                    vacationEndDate: '',
                                })
                            }
                            className="text-[9px] font-black text-orange-600 hover:text-black uppercase tracking-widest pl-1 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5"
                        >
                            <X size={12} strokeWidth={3} />
                            {t.clearVacation}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-pretty">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {t.phone}
                        </label>
                        <input
                            value={localSettings.contactPhone}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    contactPhone: e.target.value,
                                })
                            }
                            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all tabular-nums"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {t.email}
                        </label>
                        <input
                            value={localSettings.contactEmail}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    contactEmail: e.target.value,
                                })
                            }
                            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 text-orange-600 border-l-4 border-orange-100 pl-4 mb-8 mt-12">
                    <h3 className="font-black text-xs uppercase tracking-[0.15em]">
                        {t.physicalAddress}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {t.addressLine1}
                        </label>
                        <input
                            value={localSettings.contactAddressLine1}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    contactAddressLine1: e.target.value,
                                })
                            }
                            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                            placeholder={t.addressPlaceholder1}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {t.addressLine2}
                        </label>
                        <input
                            value={localSettings.contactAddressLine2}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    contactAddressLine2: e.target.value,
                                })
                            }
                            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                            placeholder={t.addressPlaceholder2}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <div className="flex justify-between items-center mb-1 pl-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {t.googleMapsLabel}
                            </label>
                            {(localSettings.contactAddressLine1 ||
                                localSettings.contactAddressLine2) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const fullAddress =
                                            `${localSettings.contactAddressLine1} ${localSettings.contactAddressLine2}`.trim();
                                        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                                        setLocalSettings({
                                            ...localSettings,
                                            contactGoogleMapsUrl: url,
                                        });
                                    }}
                                    className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:text-black transition-colors"
                                >
                                    {t.generateFromAddress}
                                </button>
                            )}
                        </div>
                        <input
                            value={localSettings.contactGoogleMapsUrl}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    contactGoogleMapsUrl: e.target.value,
                                })
                            }
                            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                            placeholder="https://www.google.com/maps/..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 text-orange-600 border-l-4 border-orange-100 pl-4 mb-8 mt-12">
                    <h3 className="font-black text-xs uppercase tracking-[0.15em]">
                        {t.ratingsTitle}
                    </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {t.ratingTheFork}
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={localSettings.ratingTheFork}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    ratingTheFork: parseFloat(e.target.value),
                                })
                            }
                            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all tabular-nums"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {t.ratingGoogle}
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={localSettings.ratingGoogle}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    ratingGoogle: parseFloat(e.target.value),
                                })
                            }
                            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all tabular-nums"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {t.ratingReviewsCount}
                        </label>
                        <input
                            type="number"
                            value={localSettings.ratingReviewsCount}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    ratingReviewsCount: parseInt(e.target.value),
                                })
                            }
                            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all tabular-nums"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3 text-orange-600 border-l-4 border-orange-100 pl-4">
                        <h3 className="font-black text-xs uppercase tracking-[0.15em]">
                            {t.socialNetworks}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddSocial}
                        className="text-[10px] flex items-center gap-2 font-black text-orange-600 uppercase tracking-widest hover:text-black transition-all bg-orange-50 px-4 py-2 rounded-xl"
                    >
                        <Plus size={16} strokeWidth={3} /> {t.addSocial}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.isArray(localSettings.socialLinks) &&
                        localSettings.socialLinks.map((link: any, idx: number) => (
                            <div
                                key={idx}
                                className="flex flex-col gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 relative group animate-in zoom-in-95 duration-200"
                            >
                                <button
                                    type="button"
                                    onClick={() => setSocialToRemove(idx)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-orange-600 p-2 transition-colors bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} strokeWidth={2} />
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                            {t.platform}
                                        </label>
                                        <input
                                            value={link.platform}
                                            onChange={e =>
                                                handleUpdateSocial(idx, 'platform', e.target.value)
                                            }
                                            className="w-full border border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-gray-900 outline-none focus:border-orange-400 bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                            {t.icon}
                                        </label>
                                        <select
                                            value={link.icon}
                                            onChange={e =>
                                                handleUpdateSocial(idx, 'icon', e.target.value)
                                            }
                                            className="w-full border border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-gray-900 outline-none focus:border-orange-400 bg-white transition-all shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="facebook">Facebook</option>
                                            <option value="tiktok">TikTok</option>
                                            <option value="twitter">Twitter</option>
                                            <option value="thefork">The Fork</option>
                                            <option value="threads">Threads</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                        {t.urlLink}
                                    </label>
                                    <input
                                        value={link.url}
                                        onChange={e =>
                                            handleUpdateSocial(idx, 'url', e.target.value)
                                        }
                                        className="w-full border border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-gray-900 outline-none focus:border-orange-400 bg-white transition-all shadow-sm"
                                        placeholder="https://"
                                    />
                                </div>
                            </div>
                        ))}
                    {(!Array.isArray(localSettings.socialLinks) ||
                        localSettings.socialLinks.length === 0) && (
                        <div className="md:col-span-2 py-10 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {t.noSocials}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 text-gray-400 border-l-4 border-gray-100 pl-4 mb-6">
                    <h3 className="font-black text-xs uppercase tracking-[0.15em]">
                        {t.scheduleTitle}
                    </h3>
                </div>
                <p className="text-[11px] font-bold text-gray-400 mb-6 uppercase tracking-widest leading-relaxed">
                    {t.scheduleDesc}
                </p>
                <textarea
                    value={JSON.stringify(localSettings.contactSchedule, null, 2)}
                    onChange={e => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            setLocalSettings({ ...localSettings, contactSchedule: parsed });
                        } catch {
                            // ignore parsing errors while typing
                        }
                    }}
                    className="w-full h-64 border border-gray-100 rounded-[24px] px-6 py-6 text-xs font-mono font-bold outline-none focus:border-orange-400 focus:bg-white bg-gray-50/50 shadow-inner custom-scrollbar"
                />
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="fixed bottom-8 right-8 z-50 pointer-events-auto"
                    >
                        <div
                            className={`flex items-center gap-4 px-8 py-5 rounded-[24px] shadow-2xl border-2 ${
                                saveStatus === 'success'
                                    ? 'bg-green-600 border-green-500 text-white'
                                    : 'bg-orange-600 border-orange-500 text-white'
                            }`}
                        >
                            <div className="bg-white/20 p-2 rounded-xl">
                                {saveStatus === 'success' ? (
                                    <CheckCircle2
                                        size={28}
                                        strokeWidth={2.5}
                                        className="animate-pulse"
                                    />
                                ) : (
                                    <AlertTriangle size={28} strokeWidth={2.5} />
                                )}
                            </div>
                            <div className="min-w-[200px]">
                                <p className="font-black text-sm uppercase tracking-widest">
                                    {saveStatus === 'success' ? t.success.title : t.error.title}
                                </p>
                                <p className="text-[10px] font-bold opacity-90 uppercase tracking-tight mt-0.5">
                                    {saveStatus === 'success' ? t.success.desc : t.error.desc}
                                </p>
                            </div>
                            <button
                                onClick={() => setSaveStatus(null)}
                                className="ml-4 p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Remove Social Confirmation Modal */}
            {socialToRemove !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setSocialToRemove(null)}
                    />
                    <div className="relative bg-white rounded-[32px] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-orange-50">
                                <Trash2 size={36} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight uppercase">
                                {t.removeSocial.title}
                            </h3>
                            <p className="text-[11px] text-gray-400 font-bold mb-10 leading-relaxed uppercase tracking-widest">
                                {t.removeSocial.desc.replace('{name}', '')}
                                <span className="text-orange-600 font-black block mt-2 text-base">
                                    "{localSettings.socialLinks[socialToRemove]?.platform}"
                                </span>
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmRemoveSocial}
                                    className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-orange-100 active:scale-95"
                                >
                                    {t.removeSocial.yes}
                                </button>
                                <button
                                    onClick={() => setSocialToRemove(null)}
                                    className="w-full py-5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all active:scale-95"
                                >
                                    {t.removeSocial.no}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
