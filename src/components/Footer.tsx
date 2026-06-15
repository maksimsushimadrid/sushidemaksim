import { Link } from 'react-router-dom';
import { Phone, Heart, Menu, Megaphone, Star, Info, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../hooks/queries/useSettings';

export default function Footer() {
    const { data: settings } = useSettings();

    const phoneNumber = settings?.contactPhone || '+34 631 920 312';
    const cleanPhone = phoneNumber.replace(/\s/g, '');

    // Social Platforms Configuration
    const socialConfig = [
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: '/whatsapp.png',
            url: `https://wa.me/${cleanPhone.replace('+', '')}`,
            hover: 'hover:bg-green-500/20 hover:border-green-500/30',
        },

        {
            id: 'instagram',
            name: 'Instagram',
            icon: '/instagram.png',
            url: 'https://www.instagram.com/sushi_de_maksim/',
            hover: 'hover:bg-pink-500/20 hover:border-pink-500/30',
        },
        {
            id: 'telegram',
            name: 'Telegram',
            icon: '/telegram.png',
            url: 'https://t.me/sushidemaksim',
            hover: 'hover:bg-blue-500/20 hover:border-blue-500/30',
        },
        {
            id: 'thefork',
            name: 'The Fork',
            icon: '/fork.webp',
            url: 'https://www.thefork.es/restaurante/red-de-maksim-r753228',
            hover: 'hover:bg-emerald-600/20 hover:border-emerald-600/30',
        },
        {
            id: 'threads',
            name: 'Threads',
            icon: '/threads.png',
            url: 'https://www.threads.net/@sushi_de_maksim',
            hover: 'hover:bg-white/10 hover:border-white/20',
        },
    ];

    const iconsPath = '/images/icons';
    const socialConfigWithPaths = socialConfig.map(s => ({
        ...s,
        icon: `${iconsPath}${s.icon}`,
    }));

    // Priority: Settings URL > Static Config Default URL
    const getUrl = (platformId: string, defaultUrl: string) => {
        const socialLinksData = settings?.socialLinks;
        const found = Array.isArray(socialLinksData)
            ? socialLinksData.find((l: any) =>
                  l.platform.toLowerCase().includes(platformId.toLowerCase())
              )
            : null;
        return found?.url && found.url !== '#' ? found.url : defaultUrl;
    };

    return (
        <footer className="footer-premium bg-black text-gray-400 pt-10 pb-16 mt-auto border-t border-white/5 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                <div className="text-center md:text-left">
                    <Link
                        to="/"
                        onClick={() => {
                            if ((window as any).lenis) {
                                (window as any).lenis.scrollTo(0);
                            } else {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        className="flex items-center justify-center md:justify-start gap-0 mb-4 no-underline group cursor-pointer"
                    >
                        <div className="transform group-hover:rotate-12 transition-transform duration-500 shrink-0">
                            <img
                                src="/logo.svg"
                                alt="Sushi de Maksim"
                                width={120}
                                height={40}
                                className="h-12 md:h-16 w-auto brightness-0 invert object-contain"
                            />
                        </div>
                    </Link>
                    <p className="text-sm max-w-xs mx-auto md:mx-0 leading-relaxed text-orange-600">
                        Auténtica experiencia japonesa en el corazón de Madrid. Frescura, tradición
                        y calidad en cada pieza.
                    </p>
                </div>

                <div className="flex flex-col items-center md:items-end gap-10">
                    <div className="flex flex-wrap gap-x-10 gap-y-4 text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 justify-center md:justify-end">
                        <Link
                            to="/menu"
                            className="hover:text-white transition-colors flex items-center gap-2 no-underline"
                        >
                            <Menu size={14} strokeWidth={2.5} className="hidden md:block" />
                            Carta
                        </Link>
                        <Link
                            to="/tablon"
                            className="hover:text-white transition-colors flex items-center gap-2 no-underline"
                        >
                            <Megaphone size={14} strokeWidth={2.5} className="hidden md:block" />
                            Tablón
                        </Link>
                        <Link
                            to="/promo"
                            className="hover:text-white transition-colors flex items-center gap-2 no-underline"
                        >
                            <Star size={14} strokeWidth={2.5} className="hidden md:block" />
                            Promos
                        </Link>
                        <Link
                            to="/reservar"
                            className="hover:text-white transition-colors flex items-center gap-2 no-underline"
                        >
                            <Calendar size={14} strokeWidth={2.5} className="hidden md:block" />
                            Reservar
                        </Link>
                        <Link
                            to="/contacts"
                            className="hover:text-white transition-colors flex items-center gap-2 no-underline"
                        >
                            <Info size={14} strokeWidth={2.5} className="hidden md:block" />
                            Contacto
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                        {socialConfigWithPaths.map(social => {
                            const url = getUrl(social.id, social.url);

                            return (
                                <a
                                    key={social.id}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center transition-all duration-300 ${social.hover} hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-500/20 overflow-hidden group`}
                                    title={social.name}
                                >
                                    <img
                                        src={social.icon}
                                        alt={social.name}
                                        className="w-full h-full object-contain invert brightness-110 opacity-90 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
                                    />
                                </a>
                            );
                        })}

                        {/* Phone Button */}
                        <a
                            href={`tel:${cleanPhone}`}
                            className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center transition-all duration-300 hover:bg-orange-700 hover:scale-110 active:scale-95 shadow-xl shadow-orange-600/40 ml-2"
                            title={`Llamar: ${phoneNumber}`}
                        >
                            <Phone size={24} strokeWidth={2} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright Row - Moved here for mobile priority */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-[10px] text-gray-700 uppercase tracking-[0.25em] font-black">
                    <div className="flex items-center gap-1.5 order-2 md:order-1">
                        <span>
                            © 2026{' '}
                            <a
                                href="mailto:alekseevpo@gmail.com"
                                className="hover:text-orange-600 transition-colors"
                            >
                                DESARROLLADO POR SELENIT
                            </a>
                        </span>
                        <motion.div
                            animate={{
                                scale: [1, 1.25, 1],
                                opacity: [0.6, 1, 0.6],
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            <Heart size={10} className="text-orange-600 fill-orange-600" />
                        </motion.div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 order-1 md:order-2">
                        <Link
                            to="/refund-policy"
                            className="hover:text-orange-600 transition-colors"
                        >
                            Política de Devoluciones
                        </Link>
                        <span>TODOS LOS DERECHOS RESERVADOS</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
