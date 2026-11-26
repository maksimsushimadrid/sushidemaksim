import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, ShoppingBag, Check, ArrowRight } from 'lucide-react';
import SafeImage from '../common/SafeImage';
import { useCart } from '../../hooks/useCart';
import { useMenu } from '../../hooks/queries/useMenu';
import { SushiItem } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

export const SpecialAnnouncements = memo(function SpecialAnnouncements() {
    const { addItem } = useCart();
    const { data: menuItems = [] } = useMenu('all', '');
    const [justAdded, setJustAdded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const handleOrderCraftBeer = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isAdding) return;

        triggerHaptic();
        setIsAdding(true);

        const beerItem = menuItems.find(i => i.id === 115);
        const sushiItem: SushiItem = {
            id: '115',
            name: beerItem?.name || 'Cerveza Artesana (0.33L)',
            description:
                beerItem?.description ||
                'Cerveza artesana de elaboración propia (0.33L). Sabores diferentes para cada temporada.',
            price: beerItem?.price ?? 6,
            image: beerItem?.image || '/images/announcements/craft-beer-033.webp',
            category: 'bebidas',
        };

        try {
            await addItem(sushiItem, 1);
            setJustAdded(true);
            setTimeout(() => {
                setJustAdded(false);
                setIsAdding(false);
            }, 2000);
        } catch (error) {
            console.error('Error adding craft beer to cart:', error);
            setIsAdding(false);
        }
    };

    const cateringWhatsApp =
        'https://wa.me/34631920312?text=' +
        encodeURIComponent(
            '¡Hola! Me gustaría solicitar información y presupuesto sobre el servicio de Catering y Chef Privado para una fiesta / evento 🍣👨‍🍳'
        );

    return (
        <section
            id="seasonal-specials"
            className="w-full bg-black border-b border-white/10 scroll-mt-20"
            aria-label="Novedades y Especiales de Temporada"
        >
            {/* Announcement 1: Craft Beer 0.33L - Full Width Strip */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5 }}
                className="w-full relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-zinc-950 to-black"
            >
                {/* Ambient glow */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-12 items-center">
                        {/* Image Showcase */}
                        <div className="md:col-span-5 relative -mx-4 sm:mx-0 h-64 sm:h-80 md:h-96 sm:rounded-2xl overflow-hidden bg-black/60 shadow-2xl border-y sm:border border-amber-500/20 group">
                            <SafeImage
                                src="/images/announcements/craft-beer-033.webp"
                                alt="Cerveza Artesana 0.33L - Sushi de Maksim"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                optimize={false}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-3 left-3 sm:left-4 flex items-center gap-1 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                                <span>Botella 0.33L</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="md:col-span-7 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                                    Edición Limitada
                                </span>
                                <span className="text-xs font-bold text-zinc-400">
                                    Elaboración propia
                                </span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
                                Cerveza{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                    Artesana
                                </span>
                            </h3>

                            <p className="text-amber-400 font-extrabold italic text-xs sm:text-base mt-1.5 sm:mt-2 tracking-wide">
                                «¡Amamos la cerveza y la elaboramos nosotros!»
                            </p>

                            <p className="text-zinc-300 text-xs sm:text-base mt-2 sm:mt-3 leading-relaxed font-normal max-w-2xl">
                                Elaboramos nuestra propia cerveza artesanal en lote limitado.
                                Sabores diferentes para cada temporada, creada para maridar con
                                nuestro sushi.
                            </p>

                            <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 text-[11px] sm:text-xs font-semibold border border-white/5">
                                    Receta del Chef
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 text-[11px] sm:text-xs font-semibold border border-white/5">
                                    Sabores diferentes para cada temporada
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-5 sm:mt-6 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={handleOrderCraftBeer}
                                    disabled={isAdding}
                                    className={`flex-1 sm:flex-none sm:min-w-[190px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all cursor-pointer border-none ${
                                        justAdded
                                            ? 'bg-emerald-600 text-white shadow-emerald-600/30 scale-[1.02]'
                                            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 active:scale-[0.98]'
                                    }`}
                                >
                                    {justAdded ? (
                                        <>
                                            <Check size={16} className="text-white" />
                                            <span>¡Añadida a la cesta!</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag size={16} />
                                            <span>Pedir Botella</span>
                                        </>
                                    )}
                                </button>
                                <Link
                                    to="/menu?item=115#item-115"
                                    className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider border border-white/10 transition-colors no-underline"
                                >
                                    <span>Carta</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Announcement 2: Catering & Private Chef - Full Width Strip */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full relative overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black"
            >
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-12 items-center">
                        {/* Image Showcase (mobile top, desktop right: md:order-2) */}
                        <div className="md:col-span-5 md:order-2 relative -mx-4 sm:mx-0 h-64 sm:h-80 md:h-96 sm:rounded-2xl overflow-hidden bg-black/60 shadow-2xl border-y sm:border border-orange-500/20 group">
                            <SafeImage
                                src="/images/announcements/catering-private-chef.webp"
                                alt="Catering y Chef Privado para Eventos - Sushi de Maksim"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                optimize={false}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-3 left-3 sm:left-4 flex items-center gap-1 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                                <span>Showcooking</span>
                            </div>
                        </div>

                        {/* Content (mobile bottom, desktop left: md:order-1) */}
                        <div className="md:col-span-7 md:order-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                                    Chef Privado
                                </span>
                                <span className="text-xs font-bold text-zinc-400">
                                    Para cualquier ocasión
                                </span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
                                Catering y Chef{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                                    Para tu Fiesta
                                </span>
                            </h3>

                            <p className="text-zinc-300 text-xs sm:text-base mt-2 sm:mt-3 leading-relaxed font-normal max-w-2xl">
                                ¿Cumpleaños, fiesta privada o reunión de empresa? Nuestro chef
                                profesional cocina sushi fresco en directo en tu evento. Una
                                experiencia gastronómica inolvidable.
                            </p>

                            <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 text-[11px] sm:text-xs font-semibold border border-white/5">
                                    En tu domicilio o finca
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 text-[11px] sm:text-xs font-semibold border border-white/5">
                                    Menús a medida
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-5 sm:mt-6 pt-4 border-t border-white/10">
                                <a
                                    href={cateringWhatsApp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none sm:min-w-[190px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all no-underline"
                                >
                                    <ChefHat size={16} />
                                    <span>Solicitar Chef</span>
                                </a>
                                <Link
                                    to="/contacts"
                                    className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider border border-white/10 transition-colors no-underline"
                                >
                                    <span>Contacto</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
});
