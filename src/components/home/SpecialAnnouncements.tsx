import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Beer, ChefHat, Sparkles, ShoppingBag, Check, ArrowRight, Flame } from 'lucide-react';
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

    const handleOrderPumpkinBeer = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isAdding) return;

        triggerHaptic();
        setIsAdding(true);

        const beerItem = menuItems.find(i => i.id === 115);
        const sushiItem: SushiItem = {
            id: '115',
            name: 'Cerveza de Calabaza (Pumpkin Ale)',
            description:
                beerItem?.description ||
                'Cerveza artesana de calabaza edición limitada Halloween (0.33L)',
            price: beerItem?.price ?? 6,
            image: '/images/announcements/pumpkin-beer-033.webp',
            category: 'bebidas',
        };

        try {
            await addItem(sushiItem, 1, 'Cerveza de Calabaza');
            setJustAdded(true);
            setTimeout(() => {
                setJustAdded(false);
                setIsAdding(false);
            }, 2000);
        } catch (error) {
            console.error('Error adding pumpkin beer to cart:', error);
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
            id="halloween-specials"
            className="pt-4 pb-8 md:pt-6 md:pb-12 px-4 md:px-6 bg-black border-b border-white/10 scroll-mt-20"
            aria-label="Novedades y Especiales de Temporada"
        >
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* Announcement 1: Pumpkin Beer 0.33L */}
                    <motion.article
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.5 }}
                        className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-amber-950/30 border border-amber-500/20 hover:border-amber-500/40 shadow-2xl transition-all duration-300 flex flex-col sm:flex-row items-stretch"
                    >
                        {/* Ambient glow */}
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />

                        {/* Image Showcase */}
                        <div className="relative sm:w-48 lg:w-56 h-48 sm:h-auto shrink-0 overflow-hidden bg-black/60">
                            <SafeImage
                                src="/images/announcements/pumpkin-beer-033.webp"
                                alt="Cerveza Artesanal Pumpkin Ale 0.33L - Sushi de Maksim"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                optimize={false}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-zinc-950/80 pointer-events-none" />
                            <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                                <Beer size={11} />
                                <span>Botella 0.33L</span>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="relative z-10 flex-1 p-5 sm:p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                                        <Flame size={10} className="text-orange-400" />
                                        Halloween Edición
                                    </span>
                                    <span className="text-[11px] font-bold text-zinc-400">
                                        Elaboración propia
                                    </span>
                                </div>

                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                                    Cerveza de Calabaza{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                        Pumpkin Ale
                                    </span>
                                </h3>

                                <p className="text-amber-400 font-extrabold italic text-xs sm:text-sm mt-1 tracking-wide">
                                    «¡Amamos la cerveza y la elaboramos nosotros!»
                                </p>

                                <p className="text-zinc-300 text-xs sm:text-sm mt-2 leading-relaxed font-normal">
                                    Elaboramos nuestra propia cerveza artesanal en lote limitado.
                                    Receta de autor con notas de calabaza asada y sutiles especias,
                                    creada para maridar con nuestro sushi.
                                </p>

                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 text-[10px] font-semibold border border-white/5">
                                        🎃 Receta del Chef
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 text-[10px] font-semibold border border-white/5">
                                        🍂 Notas tostadas
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={handleOrderPumpkinBeer}
                                    disabled={isAdding}
                                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-md transition-all cursor-pointer border-none ${
                                        justAdded
                                            ? 'bg-emerald-600 text-white shadow-emerald-600/30 scale-[1.02]'
                                            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 active:scale-[0.98]'
                                    }`}
                                >
                                    {justAdded ? (
                                        <>
                                            <Check size={14} className="text-white" />
                                            <span>¡Añadida a la cesta!</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag size={14} />
                                            <span>Pedir Botella</span>
                                        </>
                                    )}
                                </button>
                                <Link
                                    to="/menu?item=115#item-115"
                                    className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-[11px] uppercase tracking-wider border border-white/10 transition-colors no-underline"
                                >
                                    <span>Carta</span>
                                    <ArrowRight size={12} />
                                </Link>
                            </div>
                        </div>
                    </motion.article>

                    {/* Announcement 2: Catering & Private Chef */}
                    <motion.article
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-orange-950/30 border border-orange-500/20 hover:border-orange-500/40 shadow-2xl transition-all duration-300 flex flex-col sm:flex-row items-stretch"
                    >
                        {/* Ambient glow */}
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-500" />

                        {/* Image Showcase */}
                        <div className="relative sm:w-48 lg:w-56 h-48 sm:h-auto shrink-0 overflow-hidden bg-black/60">
                            <SafeImage
                                src="/images/announcements/catering-private-chef.webp"
                                alt="Catering y Chef Privado para Eventos - Sushi de Maksim"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                optimize={false}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-zinc-950/80 pointer-events-none" />
                            <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                                <Sparkles size={11} />
                                <span>Showcooking</span>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="relative z-10 flex-1 p-5 sm:p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                                        <ChefHat size={10} className="text-emerald-400" />
                                        Chef Privado
                                    </span>
                                    <span className="text-[11px] font-bold text-zinc-400">
                                        Para cualquier ocasión
                                    </span>
                                </div>

                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                                    Catering y Chef{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                                        Para tu Fiesta
                                    </span>
                                </h3>

                                <p className="text-zinc-300 text-xs sm:text-sm mt-2 leading-relaxed font-normal">
                                    ¿Cumpleaños, fiesta privada o reunión de empresa? Nuestro chef
                                    profesional cocina sushi fresco en directo en tu evento. Una
                                    experiencia gastronómica inolvidable.
                                </p>

                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 text-[10px] font-semibold border border-white/5">
                                        🍣 En tu domicilio o finca
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 text-[10px] font-semibold border border-white/5">
                                        🍱 Menús a medida
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                <a
                                    href={cateringWhatsApp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-[11px] uppercase tracking-wider shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all"
                                >
                                    <ChefHat size={14} />
                                    <span>Solicitar Chef</span>
                                </a>
                                <Link
                                    to="/contacts"
                                    className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-[11px] uppercase tracking-wider border border-white/10 transition-colors"
                                >
                                    <span>Contacto</span>
                                    <ArrowRight size={12} />
                                </Link>
                            </div>
                        </div>
                    </motion.article>
                </div>
            </div>
        </section>
    );
});
