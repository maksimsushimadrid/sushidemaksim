import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import SafeImage from '../common/SafeImage';
import { getOptimizedImageUrl } from '../../utils/images';

interface PromoBanner {
    id: string | number;
    title: string;
    subtitle?: string;
    description?: string;
    discount?: string;
    image_url?: string;
    cta_text?: string;
    cta_link?: string;
}

interface PromosSectionProps {
    activePromos: PromoBanner[];
}

export function PromosSection({ activePromos }: PromosSectionProps) {
    if (activePromos.length > 0) {
        return (
            <section className="px-4 py-6 md:py-12">
                <div className="max-w-7xl mx-auto space-y-6">
                    {activePromos.slice(0, 2).map((promo: any, idx: number) => (
                        <motion.div
                            key={promo.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15 }}
                            className="relative overflow-hidden rounded-[2.5rem] bg-orange-500 p-8 md:p-12 shadow-xl shadow-orange-500/20"
                        >
                            {promo.image_url && (
                                <div className="absolute inset-0 z-0">
                                    <SafeImage
                                        src={promo.image_url}
                                        alt={promo.title}
                                        className="w-full h-full object-cover opacity-10"
                                        loading="lazy"
                                        getOptimizedUrl={(url: string) =>
                                            getOptimizedImageUrl(url, 1080)
                                        }
                                    />
                                </div>
                            )}
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-600/10 to-transparent pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="text-center md:text-left">
                                    {promo.subtitle && (
                                        <span className="inline-block bg-white/20 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-4 tracking-widest border border-white/30 backdrop-blur-md">
                                            {promo.subtitle || promo.title}
                                        </span>
                                    )}
                                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">
                                        <span className="text-gray-900">{promo.discount}</span>{' '}
                                        {!promo.subtitle ? promo.title : ''}
                                    </h2>
                                    <p className="text-white/90 font-medium max-w-md opacity-90">
                                        {promo.description}
                                    </p>
                                </div>
                                <Link
                                    to={promo.cta_link || '/promos'}
                                    className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-orange-600 transition-all shadow-xl shrink-0"
                                >
                                    {promo.cta_text || 'VER OFERTA'}
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                    {activePromos.length > 2 && (
                        <div className="text-center">
                            <Link
                                to="/promos"
                                className="inline-flex items-center gap-2 text-orange-600 font-black text-sm uppercase tracking-widest hover:underline"
                            >
                                <Sparkles size={16} />
                                Todas las ofertas
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    // Fallback: static welcome promo
    return (
        <section className="px-4 py-6 md:py-12">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-orange-500 p-8 md:p-12 shadow-xl shadow-orange-500/20"
                >
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-600/10 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <span className="inline-block bg-white/20 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-4 tracking-widest border border-white/30 backdrop-blur-md">
                                Oferta de Bienvenida
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">
                                <span className="text-gray-900">10%</span> de Descuento
                            </h2>
                            <p className="text-white/90 font-medium max-w-md opacity-90">
                                Válido para todos los nuevos usuarios registrados que realicen su
                                primer pedido por un importe superior a 20€.
                            </p>
                        </div>
                        <Link
                            to="/menu"
                            className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-orange-600 transition-all shadow-xl"
                        >
                            ORDENAR AHORA
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
