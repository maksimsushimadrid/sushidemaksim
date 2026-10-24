import { useState, useEffect } from 'react';
import {
    Save,
    Plus,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    X,
    RefreshCw,
    Sparkles,
    ExternalLink,
} from 'lucide-react';
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
        vacationTitle: 'Специальные закрытия (Отпуск / Праздники / Раннее закрытие)',
        vacationDesc:
            'Настройте периоды времени, в течение которых ресторан будет закрыт для заказов (например, отпуск или закрытие раньше времени).',
        vacationStart: 'Дата начала',
        vacationEnd: 'Дата окончания',
        clearVacation: 'Удалить этот период',
        vacationReason: 'Причина / Название',
        addClosureBtn: 'Добавить период закрытия',
        noClosures: 'Специальные закрытия не настроены.',
        reasonPlaceholder: 'например: Отпуск, Санитарный день, Закрытие раньше времени',
        holidayThemeTitle: 'Праздничное оформление и сезонные темы',
        holidayThemeDesc:
            'Нажмите на карточку — тема сохраняется мгновенно! На сайте сразу появится выбранное оформление.',
        holidayThemeAuto: 'Автоматически по датам',
        holidayThemeAutoSub: 'Хэллоуин до 1 ноября, затем Новый Год в декабре',
        holidayThemeHalloweenWallpaper: 'Хэллоуин (Только обои)',
        holidayThemeHalloweenWallpaperSub: 'Паттерн Хэллоуин без летающих мышей и пауков',
        holidayThemeHalloween: 'Хэллоуин (Полный)',
        holidayThemeHalloweenSub: 'Обои + паутина с пауком + летучие мыши',
        holidayThemeNewYear: 'Новый Год',
        holidayThemeNewYearSub: 'Праздничная атмосфера + мягкий падающий снег',
        holidayThemeChristmas: 'Рождество',
        holidayThemeChristmasSub: 'Зимние мотивы + снежные хлопья',
        holidayThemeNone: 'Обычный режим',
        holidayThemeNoneSub: 'Стандартные суши-обои, как раньше, без эффектов',
        holidayAnimationsLabel: 'Анимации (мыши, паук, снег)',
        holidayAnimationsDesc: 'Выключите, чтобы убрать все движущиеся элементы',
        holidayDateNotice: 'Дата окончания осенней темы (до какого числа):',
        holidayLiveActive: 'Сейчас активно на сайте:',
        holidayAutoSavedNotice: 'Сохраняется автоматически при клике на карточку',
        holidayPreviewBtn: 'Открыть сайт и проверить',
        holidayAdminNotice:
            'Важно: В самой админке фоны и летающие эффекты отключены, чтобы не отвлекать от управления рестораном. Перейдите на сайт, чтобы увидеть результат!',
        holidayActiveBadge: 'АКТИВНО',
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
        vacationTitle: 'Cierres Especiales (Vacaciones / Festivos / Cierre Temprano)',
        vacationDesc:
            'Configura rangos de fechas y horas en los que el restaurante estará cerrado (por ejemplo, vacaciones o cierre anticipado).',
        vacationStart: 'Fecha de inicio',
        vacationEnd: 'Fecha de fin',
        clearVacation: 'Eliminar este cierre',
        vacationReason: 'Motivo / Descripción',
        addClosureBtn: 'Añadir período de cierre',
        noClosures: 'No hay cierres especiales configurados.',
        reasonPlaceholder: 'Ej: Vacaciones, Evento privado, Cierre anticipado',
        holidayThemeTitle: 'Decoración Temática y Festividades',
        holidayThemeDesc:
            'Haz clic en una tarjeta y se guardará al instante. La web mostrará el tema de inmediato.',
        holidayThemeAuto: 'Automático por fechas',
        holidayThemeAutoSub: 'Halloween hasta el 1 de nov, Año Nuevo en dic/ene',
        holidayThemeHalloweenWallpaper: 'Halloween (Solo fondo)',
        holidayThemeHalloweenWallpaperSub: 'Fondo de Halloween sin murciélagos ni araña',
        holidayThemeHalloween: 'Halloween Completo',
        holidayThemeHalloweenSub: 'Fondo temático + araña colgante + murciélagos',
        holidayThemeNewYear: 'Año Nuevo',
        holidayThemeNewYearSub: 'Ambiente festivo + copos de nieve flotando',
        holidayThemeChristmas: 'Navidad',
        holidayThemeChristmasSub: 'Estilo navideño + copos de nieve suaves',
        holidayThemeNone: 'Modo Clásico',
        holidayThemeNoneSub: 'Fondo de sushi original como antes, sin efectos',
        holidayAnimationsLabel: 'Animaciones (murciélagos, araña, nieve)',
        holidayAnimationsDesc: 'Desactiva para quitar elementos móviles de la pantalla',
        holidayDateNotice: 'Fecha límite del fondo otoñal (hasta qué fecha):',
        holidayLiveActive: 'Actualmente activo en la web:',
        holidayAutoSavedNotice: 'Se guarda automáticamente al pulsar una tarjeta',
        holidayPreviewBtn: 'Abrir web y comprobar',
        holidayAdminNotice:
            'Importante: En el panel de control los efectos están ocultos para mayor comodidad al gestionar pedidos. ¡Abre la web para ver el resultado en directo!',
        holidayActiveBadge: 'ACTIVO',
    },
} as const;

export default function AdminSettings({ language = 'es' }: AdminSettingsProps) {
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<null | 'success' | 'error'>(null);
    const [socialToRemove, setSocialToRemove] = useState<number | null>(null);
    const [newClosure, setNewClosure] = useState({
        reason: '',
        startDate: '',
        startTime: '19:00',
        endDate: '',
        endTime: '22:30',
    });

    const handleAddClosure = () => {
        if (!localSettings) return;
        if (
            !newClosure.startDate ||
            !newClosure.endDate ||
            !newClosure.startTime ||
            !newClosure.endTime
        ) {
            return;
        }

        const closureWithId = {
            ...newClosure,
            id: 'closure_' + Math.random().toString(36).substring(2, 9),
        };

        setLocalSettings({
            ...localSettings,
            customClosures: [...(localSettings.customClosures || []), closureWithId],
        });

        // Reset form to tomorrow's defaults
        setNewClosure({
            reason: '',
            startDate: '',
            startTime: '19:00',
            endDate: '',
            endTime: '22:30',
        });
    };

    const handleRemoveClosure = (id: string) => {
        if (!localSettings) return;
        setLocalSettings({
            ...localSettings,
            customClosures: (localSettings.customClosures || []).filter((c: any) => c.id !== id),
        });
    };

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
                customClosures: Array.isArray(data.customClosures) ? data.customClosures : [],
                holidayTheme: data.holidayTheme || 'auto',
                holidayAnimationsEnabled:
                    data.holidayAnimationsEnabled === 'true' ||
                    data.holidayAnimationsEnabled === true,
                holidayWallpaperUntil: data.holidayWallpaperUntil || '2026-11-01',
            };
        },
        refetchOnWindowFocus: false,
    });

    const updateMutation = useMutation({
        mutationFn: (payload: any) => api.put('/admin/settings', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            queryClient.invalidateQueries({ queryKey: ['settings'] });
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

    const handleSelectThemePreset = (presetId: string) => {
        if (!localSettings) return;
        let animations = localSettings.holidayAnimationsEnabled;
        if (presetId === 'halloween' || presetId === 'new_year' || presetId === 'christmas') {
            animations = true;
        } else if (presetId === 'halloween_wallpaper' || presetId === 'none') {
            animations = false;
        }

        const next = {
            ...localSettings,
            holidayTheme: presetId,
            holidayAnimationsEnabled: animations,
        };
        setLocalSettings(next);
        updateMutation.mutate(next);
    };

    const handleToggleAnimations = (enabled: boolean) => {
        if (!localSettings) return;
        const next = {
            ...localSettings,
            holidayAnimationsEnabled: enabled,
        };
        setLocalSettings(next);
        updateMutation.mutate(next);
    };

    const handleWallpaperDateChange = (date: string) => {
        if (!localSettings) return;
        const next = {
            ...localSettings,
            holidayWallpaperUntil: date,
        };
        setLocalSettings(next);
        updateMutation.mutate(next);
    };

    const getActiveThemeSummary = () => {
        if (!localSettings)
            return { selectedPresetName: '', effectiveName: '', wallpaper: '', animations: false };
        const mode = localSettings.holidayTheme || 'auto';
        const todayStr = new Date().toISOString().split('T')[0];
        const wallpaperUntil = localSettings.holidayWallpaperUntil || '2026-11-01';

        let effectiveMode = mode;
        if (mode === 'auto') {
            if (todayStr <= wallpaperUntil) {
                effectiveMode = localSettings.holidayAnimationsEnabled
                    ? 'halloween'
                    : 'halloween_wallpaper';
            } else if (todayStr >= '2026-12-01' || todayStr <= '2027-01-15') {
                effectiveMode = 'new_year';
            } else {
                effectiveMode = 'none';
            }
        }

        const names: Record<string, string> = {
            auto: t.holidayThemeAuto,
            halloween: t.holidayThemeHalloween,
            halloween_wallpaper: t.holidayThemeHalloweenWallpaper,
            new_year: t.holidayThemeNewYear,
            christmas: t.holidayThemeChristmas,
            none: t.holidayThemeNone,
        };

        const isHalloweenWallpaper =
            effectiveMode === 'halloween' || effectiveMode === 'halloween_wallpaper';
        const hasAnimations =
            effectiveMode === 'halloween'
                ? Boolean(localSettings.holidayAnimationsEnabled)
                : effectiveMode === 'new_year' || effectiveMode === 'christmas';

        return {
            selectedPresetName: names[mode] || mode,
            effectiveName: names[effectiveMode] || effectiveMode,
            wallpaper: isHalloweenWallpaper ? 'Halloween' : 'Classic',
            animations: hasAnimations,
        };
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
            className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20"
        >
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">
                    {t.title}
                </h2>
                <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 sm:gap-3 bg-orange-600 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-orange-100 disabled:opacity-50 active:scale-95"
                >
                    {updateMutation.isPending ? (
                        <RefreshCw size={16} strokeWidth={3} className="animate-spin" />
                    ) : (
                        <Save size={16} strokeWidth={2.5} />
                    )}
                    {updateMutation.isPending ? t.savingBtn : t.saveBtn}
                </button>
            </div>

            <div className="bg-white p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 text-orange-600 border-l-4 border-orange-100 pl-3 sm:pl-4 mb-4 sm:mb-8">
                    <h3 className="font-black text-xs uppercase tracking-[0.15em]">
                        {t.generalInfo}
                    </h3>
                </div>
                <div className="flex flex-row items-center justify-between gap-3 p-3 sm:p-5 md:p-6 bg-orange-50/50 rounded-xl sm:rounded-2xl border border-orange-100 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-xs sm:text-sm font-black text-orange-900 uppercase tracking-tight mb-0.5 sm:mb-1">
                            {t.isTodayClosed}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-orange-800/80 font-medium leading-snug">
                            {t.isTodayClosedDesc}
                        </p>
                    </div>
                    <div className="shrink-0 flex items-center">
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

                <div className="flex flex-row items-center justify-between gap-3 p-3 sm:p-5 md:p-6 bg-orange-50/50 rounded-xl sm:rounded-2xl border border-orange-100 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-xs sm:text-sm font-black text-orange-900 uppercase tracking-tight mb-0.5 sm:mb-1">
                            {t.isPickupOnly}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-orange-800/80 font-medium leading-snug">
                            {t.isPickupOnlyDesc}
                        </p>
                    </div>
                    <div className="shrink-0 flex items-center">
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
                <div className="flex flex-row items-center justify-between gap-3 p-3 sm:p-5 md:p-6 bg-orange-50/50 rounded-xl sm:rounded-2xl border border-orange-100 mb-4 sm:mb-8">
                    <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-xs sm:text-sm font-black text-orange-900 uppercase tracking-tight mb-0.5 sm:mb-1">
                            {t.isReservationsTodayClosed}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-orange-800/80 font-medium leading-snug">
                            {t.isReservationsTodayClosedDesc}
                        </p>
                    </div>
                    <div className="shrink-0 flex items-center">
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

                {/* Vacation & Special Closures Configuration */}
                <div className="p-3.5 sm:p-5 md:p-6 bg-orange-50/30 rounded-xl sm:rounded-2xl border border-orange-100/50 mb-4 sm:mb-8 space-y-4 sm:space-y-6">
                    <div>
                        <h4 className="text-sm font-black text-orange-900 uppercase tracking-tight mb-1">
                            {t.vacationTitle}
                        </h4>
                        <p className="text-[11px] text-orange-800/80 font-medium">
                            {t.vacationDesc}
                        </p>
                    </div>

                    {/* Active Closures List */}
                    <div className="space-y-3">
                        {!localSettings.customClosures ||
                        localSettings.customClosures.length === 0 ? (
                            <p className="text-xs text-orange-800/60 font-bold italic pl-1 animate-in fade-in">
                                {t.noClosures}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {localSettings.customClosures.map((closure: any) => (
                                    <div
                                        key={closure.id}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-xl border border-orange-100 shadow-sm gap-3 animate-in fade-in"
                                    >
                                        <div className="space-y-1 text-left">
                                            <span className="inline-block bg-orange-100 text-orange-800 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                                                {closure.reason || 'Cierre Especial'}
                                            </span>
                                            <div className="text-xs font-black text-gray-900">
                                                {language === 'ru' ? (
                                                    closure.startDate === closure.endDate ? (
                                                        <span>
                                                            {(() => {
                                                                const [y, m, d] =
                                                                    closure.startDate.split('-');
                                                                return `${d}/${m}/${y}`;
                                                            })()}{' '}
                                                            с {closure.startTime} до{' '}
                                                            {closure.endTime}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            с{' '}
                                                            {(() => {
                                                                const [y, m, d] =
                                                                    closure.startDate.split('-');
                                                                return `${d}/${m}/${y}`;
                                                            })()}{' '}
                                                            ({closure.startTime}) по{' '}
                                                            {(() => {
                                                                const [y, m, d] =
                                                                    closure.endDate.split('-');
                                                                return `${d}/${m}/${y}`;
                                                            })()}{' '}
                                                            ({closure.endTime})
                                                        </span>
                                                    )
                                                ) : closure.startDate === closure.endDate ? (
                                                    <span>
                                                        {(() => {
                                                            const [y, m, d] =
                                                                closure.startDate.split('-');
                                                            return `${d}/${m}/${y}`;
                                                        })()}{' '}
                                                        de {closure.startTime} a {closure.endTime}
                                                    </span>
                                                ) : (
                                                    <span>
                                                        del{' '}
                                                        {(() => {
                                                            const [y, m, d] =
                                                                closure.startDate.split('-');
                                                            return `${d}/${m}/${y}`;
                                                        })()}{' '}
                                                        ({closure.startTime}) al{' '}
                                                        {(() => {
                                                            const [y, m, d] =
                                                                closure.endDate.split('-');
                                                            return `${d}/${m}/${y}`;
                                                        })()}{' '}
                                                        ({closure.endTime})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveClosure(closure.id)}
                                            className="p-2 text-red-500 hover:text-red-750 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                                            title={t.clearVacation}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* New Closure Form */}
                    <div className="pt-4 border-t border-orange-200/50 space-y-4 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Motivo */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="block text-[9px] font-black text-orange-800/60 uppercase tracking-wider pl-1">
                                    {t.vacationReason}
                                </label>
                                <input
                                    type="text"
                                    value={newClosure.reason}
                                    onChange={e =>
                                        setNewClosure({
                                            ...newClosure,
                                            reason: e.target.value,
                                        })
                                    }
                                    placeholder={t.reasonPlaceholder}
                                    className="w-full bg-white border border-orange-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                                />
                            </div>

                            {/* Inicio */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-orange-800/60 uppercase tracking-wider pl-1">
                                    {t.vacationStart}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={newClosure.startDate}
                                        onChange={e =>
                                            setNewClosure({
                                                ...newClosure,
                                                startDate: e.target.value,
                                                endDate: newClosure.endDate
                                                    ? newClosure.endDate
                                                    : e.target.value, // Auto-populate end date
                                            })
                                        }
                                        className="flex-1 bg-white border border-orange-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-400 cursor-pointer"
                                    />
                                    <input
                                        type="time"
                                        value={newClosure.startTime}
                                        onChange={e =>
                                            setNewClosure({
                                                ...newClosure,
                                                startTime: e.target.value,
                                            })
                                        }
                                        className="w-24 bg-white border border-orange-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-400 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Fin */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-orange-800/60 uppercase tracking-wider pl-1">
                                    {t.vacationEnd}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={newClosure.endDate}
                                        onChange={e =>
                                            setNewClosure({
                                                ...newClosure,
                                                endDate: e.target.value,
                                            })
                                        }
                                        className="flex-1 bg-white border border-orange-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-400 cursor-pointer"
                                    />
                                    <input
                                        type="time"
                                        value={newClosure.endTime}
                                        onChange={e =>
                                            setNewClosure({
                                                ...newClosure,
                                                endTime: e.target.value,
                                            })
                                        }
                                        className="w-24 bg-white border border-orange-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-orange-400 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={
                                !newClosure.startDate ||
                                !newClosure.endDate ||
                                !newClosure.startTime ||
                                !newClosure.endTime
                            }
                            onClick={handleAddClosure}
                            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-black text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer border-none"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            {t.addClosureBtn}
                        </button>
                    </div>
                </div>

                {/* Holiday & Seasonal Themes Configuration */}
                <div className="p-3.5 sm:p-5 md:p-6 bg-purple-50/40 rounded-xl sm:rounded-2xl border border-purple-200/70 mb-4 sm:mb-8 space-y-4 sm:space-y-6 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h4 className="text-sm font-black text-purple-950 uppercase tracking-tight mb-1 flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-600" />
                                {t.holidayThemeTitle}
                            </h4>
                            <p className="text-[11px] text-purple-900/80 font-medium">
                                {t.holidayThemeDesc}
                            </p>
                        </div>
                        <span className="text-2xl select-none self-end sm:self-auto">🎃 / ❄️</span>
                    </div>

                    {/* LIVE STATUS BANNER */}
                    {(() => {
                        const summary = getActiveThemeSummary();
                        return (
                            <div className="bg-white/90 backdrop-blur-sm border border-purple-200/80 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-purple-950">
                                            {t.holidayLiveActive}{' '}
                                            <span className="text-purple-700 underline decoration-purple-300 underline-offset-2">
                                                {summary.effectiveName}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 font-medium pl-4">
                                        <span>
                                            Фон:{' '}
                                            <strong className="text-gray-700 font-bold">
                                                {summary.wallpaper === 'Halloween'
                                                    ? '🎃 Хэллоуин'
                                                    : '🍣 Стандартные суши'}
                                            </strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                            Анимации:{' '}
                                            <strong
                                                className={
                                                    summary.animations
                                                        ? 'text-emerald-600 font-bold'
                                                        : 'text-gray-500 font-bold'
                                                }
                                            >
                                                {summary.animations ? '✨ Включены' : 'Выключены'}
                                            </strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                    <a
                                        href="/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-[11px] font-black uppercase tracking-wider shadow-sm transition-all"
                                    >
                                        <ExternalLink size={13} />
                                        {t.holidayPreviewBtn}
                                    </a>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Explanatory Admin Note */}
                    <div className="text-[10px] text-purple-800/90 bg-purple-100/50 border border-purple-200/50 rounded-lg px-3 py-2 leading-relaxed">
                        💡 {t.holidayAdminNotice}
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {[
                            {
                                id: 'auto',
                                title: t.holidayThemeAuto,
                                subtitle: t.holidayThemeAutoSub,
                                icon: '🗓️',
                                badge: 'Auto',
                            },
                            {
                                id: 'halloween_wallpaper',
                                title: t.holidayThemeHalloweenWallpaper,
                                subtitle: t.holidayThemeHalloweenWallpaperSub,
                                icon: '🍂',
                                badge: 'Fondo',
                            },
                            {
                                id: 'halloween',
                                title: t.holidayThemeHalloween,
                                subtitle: t.holidayThemeHalloweenSub,
                                icon: '🎃',
                                badge: 'Completo',
                            },
                            {
                                id: 'new_year',
                                title: t.holidayThemeNewYear,
                                subtitle: t.holidayThemeNewYearSub,
                                icon: '❄️',
                                badge: 'Invierno',
                            },
                            {
                                id: 'christmas',
                                title: t.holidayThemeChristmas,
                                subtitle: t.holidayThemeChristmasSub,
                                icon: '🎄',
                                badge: 'Navidad',
                            },
                            {
                                id: 'none',
                                title: t.holidayThemeNone,
                                subtitle: t.holidayThemeNoneSub,
                                icon: '🍣',
                                badge: 'Original',
                            },
                        ].map(preset => {
                            const isSelected = (localSettings.holidayTheme || 'auto') === preset.id;
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleSelectThemePreset(preset.id)}
                                    className={`p-2.5 sm:p-3.5 md:p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between relative group ${
                                        isSelected
                                            ? 'bg-white border-purple-500 ring-2 ring-purple-500/25 shadow-md shadow-purple-100'
                                            : 'bg-white/70 border-purple-100 hover:bg-white hover:border-purple-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-start justify-between w-full mb-1 sm:mb-2">
                                        <span className="text-xl sm:text-2xl">{preset.icon}</span>
                                        <span
                                            className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                isSelected
                                                    ? 'bg-purple-600 text-white shadow-sm'
                                                    : 'bg-purple-100 text-purple-700'
                                            }`}
                                        >
                                            {isSelected
                                                ? `✓ ${t.holidayActiveBadge}`
                                                : preset.badge}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-[11px] sm:text-xs font-black text-gray-900 mb-0.5 leading-snug">
                                            {preset.title}
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] text-gray-500 font-medium leading-tight">
                                            {preset.subtitle}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Additional Options */}
                    <div className="pt-3 sm:pt-4 border-t border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4 items-center">
                        {/* Animation Toggle */}
                        <div className="flex items-center justify-between p-2.5 sm:p-3.5 bg-white rounded-xl border border-purple-100">
                            <div>
                                <div className="text-xs font-black text-gray-900">
                                    {t.holidayAnimationsLabel}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium">
                                    {t.holidayAnimationsDesc}
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                                <input
                                    type="checkbox"
                                    checked={Boolean(localSettings.holidayAnimationsEnabled)}
                                    onChange={e => handleToggleAnimations(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div
                                    className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer 
                                               peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                                               after:absolute after:top-0.5 after:start-[3px] after:bg-white after:border-gray-300 
                                               after:border after:rounded-full after:h-6 after:w-6 after:transition-all 
                                               peer-checked:bg-purple-600"
                                ></div>
                            </label>
                        </div>

                        {/* Date Picker: Wallpaper until date */}
                        <div className="p-2.5 sm:p-3.5 bg-white rounded-xl border border-purple-100 space-y-1">
                            <label className="block text-[9px] sm:text-[10px] font-black text-purple-900 uppercase tracking-wider">
                                {t.holidayDateNotice}
                            </label>
                            <input
                                type="date"
                                value={localSettings.holidayWallpaperUntil || '2026-11-01'}
                                onChange={e => handleWallpaperDateChange(e.target.value)}
                                className="w-full bg-purple-50/50 border border-purple-100 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-purple-400 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 md:gap-8 text-pretty">
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

                <div className="flex items-center gap-3 text-orange-600 border-l-4 border-orange-100 pl-3 sm:pl-4 mb-4 mt-6 sm:mb-8 sm:mt-12">
                    <h3 className="font-black text-xs uppercase tracking-[0.15em]">
                        {t.physicalAddress}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 md:gap-8">
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

            <div className="bg-white p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 sm:mb-8">
                    <div className="flex items-center gap-3 text-orange-600 border-l-4 border-orange-100 pl-3 sm:pl-4">
                        <h3 className="font-black text-xs uppercase tracking-[0.15em]">
                            {t.socialNetworks}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddSocial}
                        className="text-[10px] flex items-center gap-1.5 sm:gap-2 font-black text-orange-600 uppercase tracking-widest hover:text-black transition-all bg-orange-50 px-3 sm:px-4 py-2 rounded-xl"
                    >
                        <Plus size={14} strokeWidth={3} /> {t.addSocial}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                    {Array.isArray(localSettings.socialLinks) &&
                        localSettings.socialLinks.map((link: any, idx: number) => (
                            <div
                                key={idx}
                                className="flex flex-col gap-3 sm:gap-4 bg-gray-50/50 p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 relative group animate-in zoom-in-95 duration-200"
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

            <div className="bg-white p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-100">
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
                        className="fixed left-3 right-3 bottom-[max(12px,env(safe-area-inset-bottom))] md:left-auto md:right-8 md:bottom-8 md:max-w-[420px] z-toast pointer-events-auto"
                    >
                        <div
                            className={`flex items-center gap-3 md:gap-4 px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-[24px] shadow-2xl border-2 ${
                                saveStatus === 'success'
                                    ? 'bg-green-600 border-green-500 text-white'
                                    : 'bg-orange-600 border-orange-500 text-white'
                            }`}
                        >
                            <div className="bg-white/20 p-1.5 md:p-2 rounded-xl shrink-0">
                                {saveStatus === 'success' ? (
                                    <CheckCircle2
                                        size={22}
                                        strokeWidth={2.5}
                                        className="animate-pulse"
                                    />
                                ) : (
                                    <AlertTriangle size={22} strokeWidth={2.5} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-[13px] md:text-sm uppercase tracking-wider leading-tight m-0">
                                    {saveStatus === 'success' ? t.success.title : t.error.title}
                                </p>
                                <p className="text-[10px] font-bold opacity-90 uppercase tracking-tight mt-0.5 m-0">
                                    {saveStatus === 'success' ? t.success.desc : t.error.desc}
                                </p>
                            </div>
                            <button
                                onClick={() => setSaveStatus(null)}
                                className="shrink-0 p-1.5 hover:bg-white/20 rounded-xl transition-all active:scale-90 border-none bg-transparent text-white cursor-pointer"
                                aria-label="Cerrar"
                            >
                                <X size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Remove Social Confirmation Modal */}
            {socialToRemove !== null && (
                <div className="fixed inset-0 z-popover flex items-center justify-center p-4">
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
