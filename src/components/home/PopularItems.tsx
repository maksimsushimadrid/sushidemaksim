import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../menu/ProductCard';
import { MenuItem } from '../../hooks/queries/useMenu';

interface PopularItemsProps {
    popularItems: MenuItem[];
    cartItemIds: Set<string>;
    onShare: (item: MenuItem, e: React.MouseEvent) => void;
    onAddToCart: (item: any, e?: any, quantity?: number) => void;
    isLoading?: boolean;
    user?: any;
    favorites?: Set<number>;
    onToggleFavorite?: (id: number) => void;
}

export function PopularItems({
    popularItems,
    cartItemIds,
    onShare,
    onAddToCart,
    isLoading,
    user = null,
    favorites,
    onToggleFavorite,
}: PopularItemsProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section className="py-10 md:py-24 px-0 md:px-6 bg-gray-50/50 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-xl text-center md:text-left">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-orange-600 font-black text-xs uppercase tracking-widest mb-4 block"
                        >
                            Seleccionados por el Chef
                        </motion.span>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                            Nuestros <span className="text-orange-600">Favoritos</span> Ineludibles
                        </h2>
                    </div>
                    <div className="flex items-center">
                        <Link
                            to="/menu"
                            className="group flex items-center justify-center md:justify-start gap-3 text-gray-900 font-black text-sm hover:text-orange-600 transition-colors no-underline"
                        >
                            VER CARTA COMPLETA
                            <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                                <ArrowRight size={18} strokeWidth={2} />
                            </div>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="relative -mx-4 px-4 overflow-hidden pb-10">
                        <div className="flex gap-2.5 md:gap-8 flex-nowrap w-max min-w-full">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="w-[260px] md:w-[320px] h-[380px] bg-[#1a1a1a] animate-pulse skeleton rounded-3xl shrink-0"
                                />
                            ))}
                        </div>
                    </div>
                ) : popularItems.length > 0 ? (
                    <div className="relative group/slider">
                        {/* Desktop Arrows - Left */}
                        <button
                            onClick={() => scroll('left')}
                            className="hidden md:flex absolute -left-4 lg:-left-16 top-[40%] -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md shadow-2xl items-center justify-center hover:bg-orange-600 hover:text-white transition-all border border-gray-100/50 group-hover/slider:translate-x-[-4px]"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={28} strokeWidth={2.5} />
                        </button>

                        {/* Desktop Arrows - Right */}
                        <button
                            onClick={() => scroll('right')}
                            className="hidden md:flex absolute -right-4 lg:-right-16 top-[40%] -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md shadow-2xl items-center justify-center hover:bg-orange-600 hover:text-white transition-all border border-gray-100/50 group-hover/slider:translate-x-[4px]"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={28} strokeWidth={2.5} />
                        </button>

                        <div
                            ref={scrollContainerRef}
                            className="relative -mx-4 px-4 overflow-x-auto no-scrollbar pb-10 snap-x snap-mandatory md:snap-none scroll-smooth scroll-px-4"
                        >
                            <div className="flex gap-2.5 md:gap-8 flex-nowrap w-max min-w-full">
                                {popularItems.map((item: any, index: number) => (
                                    <div
                                        key={item.id}
                                        className="w-[260px] md:w-[320px] snap-start shrink-0"
                                    >
                                        <ProductCard
                                            item={item as any}
                                            user={user}
                                            isFavorite={favorites ? favorites.has(item.id) : false}
                                            onToggleFavorite={onToggleFavorite || (() => {})}
                                            onShare={onShare}
                                            onAddToCart={onAddToCart}
                                            isAdded={cartItemIds.has(String(item.id))}
                                            isPriority={index < 2}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400 font-medium">
                        No se encontraron productos destacados.
                    </div>
                )}
            </div>
        </section>
    );
}
