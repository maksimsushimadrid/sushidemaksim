import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, CheckCircle2, AlertCircle, Minus, Plus, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { BUSINESS_HOURS } from '../../utils/storeStatus';
import CustomDatePicker from '../ui/CustomDatePicker';
import CustomTimePicker from '../ui/CustomTimePicker';

import { useSettings } from '../../hooks/queries/useSettings';

interface ReservationFormProps {
    onSuccess?: () => void;
    className?: string;
    showTitle?: boolean;
}

export default function ReservationForm({
    onSuccess,
    className = '',
    showTitle = false,
}: ReservationFormProps) {
    const { user, isAuthenticated } = useAuth();
    const { data: settings } = useSettings();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [dbFailed, setDbFailed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isReservationsTodayClosed = settings?.isReservationsTodayClosed === true;

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        date: '',
        time: '',
        guests: 2,
        notes: '',
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name,
                email: user.email,
            }));
        }
    }, [user]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        if (name === 'date') {
            const today = new Date().toLocaleDateString('en-CA');
            if (value < today) return;
            setFormData(prev => ({ ...prev, date: value, time: '' }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getTimeSlots = () => {
        if (!formData.date) return [];
        const [yr, mo, dy] = formData.date.split('-').map(Number);
        const dateObj = new Date(yr, mo - 1, dy);
        const day = dateObj.getDay();
        const intervals =
            formData.date === '2026-06-15'
                ? [{ start: '20:30', end: '23:30' }]
                : BUSINESS_HOURS[day] || [];

        const now = new Date();
        const isToday = formData.date === now.toLocaleDateString('en-CA');
        const currentH = now.getHours();
        const currentM = now.getMinutes();

        const slots: string[] = [];
        intervals.forEach(interval => {
            const [startH] = interval.start.split(':').map(Number);
            const [endH] = interval.end.split(':').map(Number);

            for (let h = startH; h < endH; h++) {
                ['00', '30'].forEach(m => {
                    const slotM = Number(m);

                    // If today, filter out passed or too close slots
                    if (isToday) {
                        if (h < currentH || (h === currentH && slotM <= currentM + 15)) {
                            return;
                        }
                    }

                    slots.push(`${h.toString().padStart(2, '0')}:${m}`);
                });
            }
        });
        return slots;
    };

    const availableSlots = getTimeSlots();
    const isDayClosed = Boolean(formData.date && availableSlots.length === 0);

    const getWhatsAppUrl = () => {
        const formattedDate = new Date(formData.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const message =
            `*Nueva Reserva de Mesa a nombre de: ${formData.name}*\r\n\r\n` +
            `*Nombre:* ${formData.name}\r\n` +
            `*Teléfono:* +34 ${formData.phone.replace(/\s/g, '')}\r\n` +
            `*Fecha:* ${formattedDate}\r\n` +
            `*Hora:* ${formData.time}\r\n` +
            `*Personas:* ${formData.guests}`;

        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/34631920312?text=${encodedMessage}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setDbFailed(false);

        let dbSaved = true;
        try {
            // 1. Try to save to DB
            await api.post('/reservations', {
                name: formData.name,
                email: formData.email,
                phone: `+34${formData.phone.replace(/\D/g, '')}`,
                date: formData.date,
                time: formData.time,
                guests: formData.guests,
                notes: formData.notes,
                user_id: user?.id && user.id.length > 5 && !user.id.includes('!') ? user.id : null,
            });
        } catch (dbErr) {
            console.error('Warning: Could not save reservation to DB:', dbErr);
            dbSaved = false;
        }

        if (!dbSaved) {
            setDbFailed(true);
            setIsSubmitting(false);
            return;
        }

        try {
            // 2. Prepare and trigger WhatsApp redirect
            const whatsappUrl = getWhatsAppUrl();
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                window.location.href = whatsappUrl;
            } else {
                window.open(whatsappUrl, '_blank');
            }

            // 3. Set success state
            setIsSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error('Error initiating reservation redirect:', err);
            setError(
                err.message || 'Hubo un error al procesar tu reserva. Por favor intenta de nuevo.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const today = new Date().toLocaleDateString('en-CA');

    return (
        <div className={className}>
            {showTitle && (
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                        Reservar Mesa
                    </h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Sushi de Maksim
                    </p>
                </div>
            )}

            {dbFailed ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                >
                    <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-[26px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-orange-100">
                        <AlertCircle size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight">
                        Reserva casi lista
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed max-w-sm mx-auto">
                        No hemos podido guardar tu reserva automáticamente en el sistema de la web.
                        <br />
                        <span className="text-orange-600 font-bold block mt-2">
                            Por favor, haz clic abajo para finalizar tu reserva enviando los datos
                            por WhatsApp. Nuestro equipo la registrará manualmente.
                        </span>
                    </p>
                    <a
                        href={getWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            setIsSuccess(true);
                            setDbFailed(false);
                        }}
                        className="inline-flex w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xs items-center justify-center gap-3 active:scale-[0.98] border-none cursor-pointer h-12 no-underline tracking-[0.15em] shadow-xl shadow-green-100"
                    >
                        FINALIZAR POR WHATSAPP
                    </a>
                </motion.div>
            ) : isSuccess ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                >
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[26px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
                        <CheckCircle2 size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">
                        ¡Mesa Reservada!
                    </h3>
                    <p className="text-base text-gray-500 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                        Hemos recibido tu solicitud para el{' '}
                        <span className="text-gray-900 font-bold">
                            {(() => {
                                const d = new Date(formData.date);
                                return `${d.getDate()} de ${d.toLocaleString('es-ES', { month: 'long' })}`;
                            })()}
                        </span>{' '}
                        a las <span className="text-gray-900 font-bold">{formData.time}</span>. Te
                        esperamos.
                    </p>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {error && (
                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-600 text-xs font-bold">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {isReservationsTodayClosed && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col gap-2 text-orange-800 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={18} className="text-orange-600" />
                                <span className="text-sm font-black uppercase tracking-tight">
                                    Hoy está completo
                                </span>
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed opacity-80">
                                Lo sentimos, para hoy todas las mesas están reservadas. Pero puedes
                                reservar para cualquier otro día disponible en el calendario.
                            </p>
                        </div>
                    )}

                    {/* 1. Nombre Completo — full width */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Nombre Completo
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                <User size={20} strokeWidth={1.5} />
                            </div>
                            <input
                                required
                                type="text"
                                name="name"
                                data-testid="reservation-name"
                                placeholder="Tu nombre y apellidos"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-bold text-sm text-gray-900 shadow-sm placeholder:text-gray-400 placeholder:font-medium"
                            />
                        </div>
                    </div>

                    {/* 2. Fecha — 2 cols on all screens */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Fecha
                            </label>
                            <CustomDatePicker
                                value={formData.date}
                                onChange={date => {
                                    const todayStr = new Date().toLocaleDateString('en-CA');
                                    if (date < todayStr && date !== '') return;
                                    if (isReservationsTodayClosed && date === todayStr) return;
                                    setFormData(prev => ({
                                        ...prev,
                                        date,
                                        time: '',
                                    }));
                                }}
                                min={today}
                                disabledDays={[1, 2]}
                                disabledDates={isReservationsTodayClosed ? [today] : []}
                                allowedDates={['2026-06-15']}
                                placeholder="Fecha"
                            />
                        </div>

                        {/* 3. Hora */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Hora
                            </label>
                            <CustomTimePicker
                                value={formData.time}
                                onChange={time => setFormData(prev => ({ ...prev, time }))}
                                slots={availableSlots}
                                placeholder={
                                    !formData.date
                                        ? 'Hora'
                                        : isDayClosed
                                          ? 'Cerrado este día'
                                          : 'Hora'
                                }
                                disabled={!formData.date || isDayClosed}
                            />
                        </div>
                    </div>

                    {/* 4. Personas — full width on mobile */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Número de personas
                        </label>
                        <div className="flex items-center gap-3 bg-gray-50/50 px-3 py-1.5 rounded-2xl border-2 border-transparent shadow-sm">
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData(prev => ({
                                        ...prev,
                                        guests: Math.max(1, prev.guests - 1),
                                    }))
                                }
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-orange-600 hover:bg-orange-50 active:scale-95 transition-all border border-gray-200 bg-white cursor-pointer shrink-0"
                            >
                                <Minus size={18} strokeWidth={2.5} />
                            </button>

                            <div className="flex-1 text-center">
                                <span
                                    className="text-xl font-black text-gray-900 leading-none"
                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                >
                                    {formData.guests}
                                </span>
                                <span className="text-xs font-bold text-gray-400 ml-2">
                                    {formData.guests === 1 ? 'persona' : 'personas'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setFormData(prev => ({
                                        ...prev,
                                        guests: Math.min(30, prev.guests + 1),
                                    }))
                                }
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-orange-600 hover:bg-orange-50 active:scale-95 transition-all border border-gray-200 bg-white cursor-pointer shrink-0"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* 5. Teléfono — full width */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Teléfono
                        </label>
                        <div className="flex items-center bg-gray-50/50 border-2 border-transparent rounded-2xl focus-within:bg-white focus-within:border-orange-600 transition-all overflow-hidden shadow-sm">
                            <div className="pl-4 pr-2 flex items-center gap-2 text-gray-400 shrink-0">
                                <Phone size={18} strokeWidth={1.5} />
                            </div>
                            <div className="pr-2 text-gray-500 font-bold text-sm select-none border-r border-gray-200/50 py-2">
                                +34
                            </div>
                            <input
                                required
                                type="tel"
                                name="phone"
                                data-testid="reservation-phone"
                                placeholder="600 000 000"
                                maxLength={9}
                                value={formData.phone}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 9) {
                                        handleChange({
                                            ...e,
                                            target: {
                                                ...e.target,
                                                value: val,
                                                name: 'phone',
                                            },
                                        } as any);
                                    }
                                }}
                                className="flex-1 min-w-0 bg-transparent border-none text-sm font-bold outline-none px-3 py-2.5 tracking-wider placeholder:text-gray-400/50 placeholder:font-medium placeholder:tracking-normal"
                            />
                        </div>
                    </div>

                    {/* 6. Email — only for unauthenticated users */}
                    {!isAuthenticated && (
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Mail size={20} strokeWidth={1.5} />
                                </div>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    data-testid="reservation-email"
                                    placeholder="tucorreo@ejemplo.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-bold text-base text-gray-900 shadow-sm placeholder:text-gray-400 placeholder:font-medium"
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        disabled={isSubmitting}
                        type="submit"
                        data-testid="reservation-submit"
                        className="w-full py-3 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-3 mt-1 active:scale-[0.98] border-none cursor-pointer h-12"
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="relative z-10 flex items-center gap-3 tracking-[0.15em]">
                                RESERVAR AHORA
                            </span>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
