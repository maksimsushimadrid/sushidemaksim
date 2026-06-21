import { useState } from 'react';
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Instagram,
    Facebook,
    ArrowRight,
    Utensils,
    Send,
    Calendar,
    Loader2,
    HelpCircle,
    AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactInput } from '../schemas/contact.schema';
import { useSettings } from '../hooks/queries/useSettings';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getOptimizedImageUrl } from '../utils/images';
import { api } from '../utils/api';
import { SITE_URL } from '../constants/config';

const iconMap: Record<string, any> = {
    whatsapp: (props: any) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </svg>
    ),
    telegram: (props: any) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
    ),
    instagram: (props: any) => <Instagram {...props} />,
    facebook: (props: any) => <Facebook {...props} />,
    thefork: (props: any) => <Utensils {...props} />,
};

const MADRID_HOLIDAYS_2026 = [
    { name: 'Año Nuevo', date: '2026-01-01' },
    { name: 'Epifanía del Señor', date: '2026-01-06' },
    { name: 'San José', date: '2026-03-19' },
    { name: 'Jueves Santo', date: '2026-04-02' },
    { name: 'Viernes Santo', date: '2026-04-03' },
    { name: 'Fiesta del Trabajo', date: '2026-05-01' },
    { name: 'Fiesta de la Comunidad de Madrid', date: '2026-05-02' },
    { name: 'San Isidro', date: '2026-05-15' },
    { name: 'Asunción de la Virgen', date: '2026-08-15' },
    { name: 'Fiesta Nacional de España', date: '2026-10-12' },
    { name: 'Día de Todos los Santos', date: '2026-11-02' },
    { name: 'Nuestra Señora de la Almudena', date: '2026-11-09' },
    { name: 'Día de la Constitución', date: '2026-12-07' },
    { name: 'Inmaculada Concepción', date: '2026-12-08' },
    { name: 'Natividad del Señor', date: '2026-12-25' },
];

export default function ContactsPage() {
    const { success: showSuccess, error: showError } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [mountTime] = useState(Date.now());

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactInput>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            email: '',
            message: '',
        },
    });

    const { data: settings } = useSettings();

    const addressLine1 = settings?.contactAddressLine1 || 'C. de Barrilero, 20,';
    const addressLine2 = settings?.contactAddressLine2 || '28007 Madrid España';
    const currentPhone = settings?.contactPhone || '+34 631 920 312';
    const currentEmail = settings?.contactEmail || 'info@sushidemaksim.com';
    const contactSchedule =
        settings?.contactSchedule && settings.contactSchedule.length > 0
            ? settings.contactSchedule
            : [
                  { days: 'Miércoles - Viernes', hours: '19:00 - 22:30' },
                  { days: 'Sábado - Domingo', hours: '14:00 - 16:00, 19:00 - 22:30' },
                  { days: 'Lunes - Martes', hours: 'Cerrado', closed: true },
              ];

    const fullAddress = `${addressLine1} ${addressLine2}`.trim();
    const mapsUrl =
        settings?.contactGoogleMapsUrl ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

    const upcomingHolidays = MADRID_HOLIDAYS_2026.filter(h => {
        const hDate = new Date(h.date);
        const today = new Date();
        // Show holidays from current month and next month
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const isCurrentOrFutureMonth =
            (hDate.getMonth() >= currentMonth && hDate.getFullYear() === currentYear) ||
            hDate.getFullYear() > currentYear;

        // Only show if it hasn't passed today
        const hasNotPassed = hDate.getTime() >= today.setHours(0, 0, 0, 0);

        // Limit to current and next month for compact view
        const isWithinRange = hDate.getMonth() <= currentMonth + 1;

        return isCurrentOrFutureMonth && hasNotPassed && isWithinRange;
    }).slice(0, 3); // Max 3 for compactness

    const onSubmit = async (data: ContactInput) => {
        setSubmitting(true);

        // Timer check: Bots fill forms in milliseconds
        const now = Date.now();
        if (now - mountTime < 4000) {
            // Silently fail or pretend success for bots
            await new Promise(r => setTimeout(r, 1000));
            showSuccess('¡Mensaje enviado con éxito! Te responderemos pronto.');
            reset();
            setSubmitting(false);
            return;
        }

        try {
            await api.post('/contact', data);

            showSuccess('¡Mensaje enviado con éxito! Te responderemos pronto.');
            reset();
        } catch (err: any) {
            showError(err.message || 'Error al enviar el mensaje.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent pt-0">
            <SEO
                title="Contacto y Ubicación — Sushi de Maksim Madrid"
                description={`Visítanos en Madrid o haz tu pedido de sushi a domicilio. Dirección: ${fullAddress}. Teléfono: ${currentPhone}. ¡Te esperamos para ofrecerte el mejor sushi artesanal!`}
                keywords="contacto sushi madrid, direccion sushi de maksim, telefono sushi madrid, pedir sushi domicilio madrid"
                schema={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Restaurant',
                        name: 'Sushi de Maksim',
                        image: `${SITE_URL}/sushi-hero.webp`,
                        telephone: '+34 631 920 312',
                        email: currentEmail,
                        priceRange: '$$',
                        servesCuisine: ['Japanese', 'Sushi'],
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: addressLine1,
                            addressLocality: 'Madrid',
                            postalCode: '28007',
                            addressCountry: 'ES',
                        },
                        geo: {
                            '@type': 'GeoCoordinates',
                            latitude: 40.397042,
                            longitude: -3.672449,
                        },
                        url: `${SITE_URL}/contacts`,
                        openingHoursSpecification: [
                            {
                                '@type': 'OpeningHoursSpecification',
                                dayOfWeek: ['Wednesday', 'Thursday', 'Friday'],
                                opens: '19:00',
                                closes: '22:30',
                            },
                            {
                                '@type': 'OpeningHoursSpecification',
                                dayOfWeek: ['Saturday', 'Sunday'],
                                opens: '14:00',
                                closes: '16:00',
                            },
                            {
                                '@type': 'OpeningHoursSpecification',
                                dayOfWeek: ['Saturday', 'Sunday'],
                                opens: '19:00',
                                closes: '22:30',
                            },
                        ],
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            {
                                '@type': 'ListItem',
                                position: 1,
                                name: 'Inicio',
                                item: `${SITE_URL}/`,
                            },
                            {
                                '@type': 'ListItem',
                                position: 2,
                                name: 'Contacto',
                                item: `${SITE_URL}/contacts`,
                            },
                        ],
                    },
                ]}
                url={`${SITE_URL}/contacts`}
            />

            {/* Hero Section styled like BlogPage */}
            <section className="relative h-[40vh] overflow-hidden flex items-center justify-center bg-black">
                <div className="absolute inset-0 z-0">
                    <img
                        src={getOptimizedImageUrl('/images/promos/promo_hero_bg.webp', 1080)}
                        alt="Contacto Sushi de Maksim"
                        {...({ fetchpriority: 'high' } as any)}
                        decoding="async"
                        className="w-full h-full object-cover opacity-40 scale-105"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-4"
                >
                    <span className="inline-block px-3 py-1 bg-orange-600 text-white text-[11px] font-bold rounded-full mb-4 tracking-widest uppercase">
                        Estamos a tu disposición
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
                        Contacto & <span className="text-orange-500 italic">Soporte</span>
                    </h1>
                    <p className="text-gray-300 max-w-xl mx-auto text-sm md:text-base font-medium">
                        ¿Tienes dudas o quieres hacer un pedido especial? ¡Hablemos!
                    </p>
                </motion.div>
            </section>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 md:-mt-14 relative z-20">
                {/* Unified Master Contact Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="premium-card p-4 md:p-8 mb-8 md:mb-16 bg-white shadow-2xl shadow-gray-200/50"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center">
                        {/* Column 1: Info List */}
                        <div className="space-y-8 md:space-y-10">
                            <div>
                                <h3 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] mb-6">
                                    Información de Contacto
                                </h3>
                                <div className="space-y-6 md:space-y-8">
                                    {/* Phone Row */}
                                    <div className="flex items-center gap-4 md:gap-5 group">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100/50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <Phone size={20} className="text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">
                                                Llámanos
                                            </p>
                                            <a
                                                href={`tel:${currentPhone.replace(/\s/g, '')}`}
                                                className="text-lg md:text-2xl font-black text-gray-900 block hover:text-orange-600 transition-colors"
                                            >
                                                {currentPhone}
                                            </a>
                                        </div>
                                    </div>

                                    {/* Address Row */}
                                    <div className="flex items-center gap-4 md:gap-5 group">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100/50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <MapPin size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">
                                                Visítanos
                                            </p>
                                            <a
                                                href={mapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-base md:text-xl font-bold text-gray-900 block hover:text-orange-600 transition-colors leading-tight"
                                            >
                                                {fullAddress}
                                            </a>
                                        </div>
                                    </div>

                                    {/* Email Row */}
                                    <div className="flex items-center gap-4 md:gap-5 group">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100/50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <Mail size={20} className="text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">
                                                Escríbenos
                                            </p>
                                            <a
                                                href={`mailto:${currentEmail}`}
                                                className="text-base md:text-xl font-bold text-gray-900 block hover:text-orange-600 transition-colors"
                                            >
                                                {currentEmail}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Social Sidebar */}
                        <div className="bg-gray-50 rounded-xl md:rounded-[2.5rem] p-6 md:p-10 border border-gray-100/50 flex flex-col items-center justify-center text-center h-full">
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                                Conecta con nosotros
                            </h3>
                            <p className="text-gray-500 text-xs md:text-sm mb-8 leading-relaxed font-medium max-w-[240px]">
                                Respuesta rápida por WhatsApp y Telegram.
                            </p>

                            <div className="flex items-center justify-center gap-6 md:gap-8 mb-8">
                                <a
                                    href={`https://wa.me/${currentPhone.replace(/\s/g, '').replace('+', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:scale-110 hover:-rotate-6 transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95"
                                    title="WhatsApp"
                                >
                                    {iconMap.whatsapp({ size: 28, strokeWidth: 2.5 })}
                                </a>

                                <a
                                    href="https://t.me/sushidemaksim"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-14 h-14 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center text-white hover:scale-110 hover:rotate-6 transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-95"
                                    title="Telegram"
                                >
                                    {iconMap.telegram({ size: 28, strokeWidth: 2.5 })}
                                </a>

                                <a
                                    href="https://www.instagram.com/sushi_de_maksim/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 hover:-rotate-6 transition-all duration-300 shadow-lg shadow-pink-500/20 active:scale-95"
                                    title="Instagram"
                                >
                                    {iconMap.instagram({ size: 28, strokeWidth: 2.5 })}
                                </a>
                            </div>

                            <button
                                onClick={() => {
                                    const element = document.getElementById('contact-form-section');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full py-4 md:py-5 bg-gray-900 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-gray-200"
                            >
                                Contactar ahora
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
                    <motion.div
                        id="contact-form-section"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-12 xl:col-span-5 bg-gray-50 px-4 py-8 md:p-10 rounded-[2rem] border border-gray-100 relative overflow-hidden order-2 xl:order-1 scroll-mt-24"
                    >
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">
                                Envíanos un mensaje
                            </h2>
                            <p className="text-gray-500 mb-8 md:mb-10 font-medium text-sm md:text-base">
                                Te responderemos en menos de 24h.
                            </p>

                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                noValidate
                                className="space-y-4 md:space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                                            Tu nombre
                                        </label>
                                        <input
                                            type="text"
                                            {...register('name')}
                                            disabled={submitting}
                                            placeholder="Nombre completo"
                                            className={`w-full bg-white border ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'} px-5 py-3 md:py-4 rounded-xl md:rounded-2xl outline-none transition-all font-medium text-base disabled:opacity-50`}
                                        />
                                        <AnimatePresence>
                                            {errors.name && (
                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1 ml-1"
                                                >
                                                    <AlertCircle size={10} />
                                                    {errors.name.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                                            Tu email
                                        </label>
                                        <input
                                            type="email"
                                            {...register('email')}
                                            disabled={submitting}
                                            placeholder="tu@email.com"
                                            className={`w-full bg-white border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'} px-5 py-3 md:py-4 rounded-xl md:rounded-2xl outline-none transition-all font-medium text-base disabled:opacity-50`}
                                        />
                                        <AnimatePresence>
                                            {errors.email && (
                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1 ml-1"
                                                >
                                                    <AlertCircle size={10} />
                                                    {errors.email.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                                        Tu mensaje
                                    </label>
                                    <textarea
                                        rows={4}
                                        {...register('message')}
                                        disabled={submitting}
                                        placeholder="¿En qué podemos ayudarte?"
                                        className={`w-full bg-white border ${errors.message ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'} px-5 py-3 md:py-4 rounded-xl md:rounded-2xl outline-none transition-all font-medium resize-none text-base disabled:opacity-50`}
                                    ></textarea>
                                    <AnimatePresence>
                                        {errors.message && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1 ml-1"
                                            >
                                                <AlertCircle size={10} />
                                                {errors.message.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {/* Honeypot fields - hidden from humans but filled by bots */}
                                <div className="hidden" aria-hidden="true">
                                    <input
                                        type="text"
                                        {...register('website' as any)}
                                        tabIndex={-1}
                                        autoComplete="off"
                                    />
                                    <input
                                        type="text"
                                        {...register('phone' as any)}
                                        tabIndex={-1}
                                        autoComplete="off"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gray-900 text-white font-black py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            ENVIANDO...
                                        </>
                                    ) : (
                                        <>
                                            ENVIAR MENSAJE
                                            <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    <div className="lg:col-span-12 xl:col-span-7 space-y-6 md:space-y-8 order-1 xl:order-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 h-[300px] md:h-[450px] shadow-sm relative group"
                        >
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3038.563914856037!2d-3.674640123441!3d40.397042071442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd42272e4ed3b2e5%3A0xe719cdfe984d9b8!2sSushi%20de%20Maksim!5e0!3m2!1ses!2ses!4v1709700000000!5m2!1ses!2ses"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                title="Ubicación"
                                className="group-hover:scale-105 transition-transform duration-1000"
                            ></iframe>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-gray-50 p-5 md:p-8 rounded-[2rem] border border-gray-100"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Clock size={20} className="text-gray-900" />
                                <h3 className="font-black text-lg uppercase tracking-tight">
                                    Horario
                                </h3>
                            </div>
                            <div className="w-full">
                                <div className="space-y-4">
                                    {contactSchedule.length > 0 ? (
                                        contactSchedule.map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-start pb-2 border-b border-gray-100 last:border-0 last:pb-0"
                                            >
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {item.days}
                                                </span>
                                                <span
                                                    className={`text-sm font-black text-right ${item.closed ? 'text-orange-500' : 'text-gray-900'}`}
                                                >
                                                    {item.hours}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                            Cargando horario...
                                        </p>
                                    )}
                                </div>

                                {upcomingHolidays.length > 0 && (
                                    <div className="mt-10 pt-8 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Calendar
                                                size={16}
                                                className="text-orange-600"
                                                strokeWidth={2.5}
                                            />
                                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">
                                                Próximos Festivos
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {upcomingHolidays.map((h, i) => {
                                                const d = new Date(h.date);
                                                const formattedDate = d.toLocaleDateString(
                                                    'es-ES',
                                                    {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    }
                                                );

                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 group shadow-sm transition-all hover:border-orange-100 min-h-[64px]"
                                                    >
                                                        <span className="text-[11px] font-black text-gray-900 leading-tight max-w-[70%] uppercase tracking-tight">
                                                            {h.name}
                                                        </span>
                                                        <span className="shrink-0 px-3 py-1 bg-gray-900 text-white text-[10px] font-black rounded-lg uppercase tracking-tight whitespace-nowrap shadow-sm">
                                                            {formattedDate}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-100/50 rounded-2xl border border-gray-200 group transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-500 shrink-0 shadow-sm">
                                                    <HelpCircle size={16} strokeWidth={2.5} />
                                                </div>
                                                <p className="text-[11px] md:text-xs font-bold text-gray-600 leading-tight">
                                                    Consultar horario especial en días festivos
                                                </p>
                                            </div>
                                            <a
                                                href={`https://wa.me/${currentPhone.replace(/\s/g, '').replace('+', '')}?text=${encodeURIComponent('Hola, me gustaría consultar el horario especial para los próximos días festivos.')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#128C7E] transition-all shadow-md active:scale-95"
                                            >
                                                {iconMap.whatsapp({ size: 14, strokeWidth: 2.5 })}
                                                Consultar
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <section className="py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-7xl mx-auto px-4 md:px-6"
                >
                    <div className="bg-orange-600 rounded-[2rem] md:rounded-[3rem] px-5 py-10 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-200">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10"></div>
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-2xl md:text-6xl font-black mb-6 md:mb-8 leading-tight tracking-tighter">
                                ¿Listo para la experiencia?
                            </h2>
                            <p className="text-orange-100 text-base md:text-xl font-medium mb-10 md:mb-12 opacity-90 leading-relaxed">
                                Pide ahora y descubre por qué somos el sushi favorito del centro de
                                Madrid.
                            </p>
                            <Link
                                to="/menu"
                                className="inline-block w-full sm:w-auto bg-white text-orange-600 px-10 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl font-black tracking-tighter hover:scale-105 transition-transform shadow-xl"
                            >
                                HACER MI PEDIDO
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
