import React, { useState } from 'react';
import { Heart, Share2, Flame, Check, Plus, Minus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getOptimizedImageUrl } from '../../utils/images';
import { slugify } from '../../utils/formatters';
import SafeImage from '../common/SafeImage';
import { MenuItem } from '../../hooks/queries/useMenu';
import { User } from '../../types';

import { getAllergenInfo } from '../../utils/allergens';

interface ProductCardProps {
    item: MenuItem;
    user: User | null;
    isFavorite: boolean;
    onToggleFavorite: (id: number) => void;
    onShare: (item: MenuItem, e: React.MouseEvent) => void;
    onAddToCart: (item: MenuItem, e: React.MouseEvent<HTMLButtonElement>, quantity: number) => void;
    isAdded: boolean;
    isPriority?: boolean;
    isHighlighted?: boolean;
    isZoomed?: boolean;
    onZoom?: () => void;
}

const ProductCard = React.memo(function ProductCard({
    item,
    user,
    isFavorite,
    onToggleFavorite,
    onShare,
    onAddToCart,
    isAdded,
    isPriority,
    isHighlighted,
    isZoomed,
    onZoom,
}: ProductCardProps) {
    const [quantity, setQuantity] = useState(1);

    const isExtra = item.category === 'extras';

    return (
        <div
            id={`item-${item.id}`}
            onClick={() => onZoom?.()}
            className={`premium-card group relative flex flex-col h-full rounded-[24px] md:rounded-[32px] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)] ${
                isHighlighted ? 'highlight-item' : ''
            } ${isZoomed ? 'ring-2 ring-orange-500/20 shadow-2xl' : ''}`}
        >
            {/* Action Buttons */}
            <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                <button
                    onClick={e => onShare(item, e)}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-xl md:rounded-2xl bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-transform cursor-pointer border-none"
                    title="Compartir"
                >
                    <Share2 size={14} className="text-gray-900" />
                </button>
            </div>

            {user && (
                <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
                    <button
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavorite(item.id);
                        }}
                        className="w-8 h-8 md:w-9 md:h-9 rounded-xl md:rounded-2xl bg-white/95 backdrop-blur-md shadow-lg flex items-center justify-center transition-all cursor-pointer border-none z-20 touch-manipulation active:scale-90"
                    >
                        <Heart
                            size={16}
                            className={isFavorite ? 'text-orange-500' : 'text-gray-400'}
                            fill={isFavorite ? 'currentColor' : 'none'}
                        />
                    </button>
                </div>
            )}

            {/* Image Container */}
            <div className="aspect-[4/3] md:h-56 bg-gray-50 overflow-hidden relative group/img">
                <SafeImage
                    src={item.image}
                    loading={isPriority ? 'eager' : 'lazy'}
                    decoding="async"
                    getOptimizedUrl={(url: string) =>
                        getOptimizedImageUrl(url, 640, 80, slugify(item.name))
                    }
                    {...({ fetchpriority: isPriority ? 'high' : 'auto' } as any)}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                        isZoomed ? 'scale-[1.3] shadow-inner' : 'group-hover:scale-125'
                    }`}
                    alt={`${item.name} — ${item.category} | Menú de Sushi de Maksim Madrid`}
                    title={`${item.name} — ${item.description}`}
                    fallbackContent={null}
                />

                {/* Badges Lowered */}
                <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 flex flex-wrap gap-1.5 max-w-[90%]">
                    {item.isPopular && (
                        <div
                            className="h-5 w-5 md:h-8 md:w-8 bg-white/95 backdrop-blur-md text-orange-600 border border-orange-100 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:-rotate-12 transition-transform duration-300 cursor-default"
                            title="Popular"
                        >
                            <Flame
                                size={12}
                                className="flex-shrink-0 fill-orange-500/20 md:hidden"
                                strokeWidth={2.5}
                            />
                            <Flame
                                size={18}
                                className="hidden md:block flex-shrink-0 fill-orange-500/20"
                                strokeWidth={2.5}
                            />
                        </div>
                    )}
                    {item.isNew && (
                        <div
                            className="h-5 w-5 md:h-8 md:w-8 bg-blue-50 text-blue-700 border border-blue-100 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-12 transition-transform duration-300 cursor-default"
                            title="Nuevo"
                        >
                            <span className="text-[10px] md:text-[18px] flex-shrink-0">✨</span>
                        </div>
                    )}
                    {item.isChefChoice && (
                        <div
                            className="h-5 w-5 md:h-8 md:w-8 bg-purple-50 text-purple-700 border border-purple-100 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:-rotate-6 transition-transform duration-300 cursor-default"
                            title="Sugerencia del Chef"
                        >
                            <span className="text-[10px] md:text-[18px] flex-shrink-0">👨‍🍳</span>
                        </div>
                    )}
                    {item.spicy && (
                        <div
                            className="h-5 w-5 md:h-8 md:w-8 bg-red-50 text-red-600 border border-red-100 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-12 transition-transform duration-300 cursor-default animate-pulse"
                            title="Picante"
                        >
                            <span className="text-[10px] md:text-[18px]">🌶️</span>
                        </div>
                    )}
                    {item.vegetarian && (
                        <div
                            className="h-5 w-5 md:h-8 md:w-8 bg-green-50 text-green-700 border border-green-100 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:-rotate-12 transition-transform duration-300 cursor-default"
                            title="Vegetariano"
                        >
                            <span className="text-[10px] md:text-[18px]">🥬</span>
                        </div>
                    )}
                    {item.allergens &&
                        item.allergens.length > 0 &&
                        item.allergens.map(allergen => {
                            const info = getAllergenInfo(allergen);
                            return (
                                <div
                                    key={allergen}
                                    className={`h-5 w-5 md:h-8 md:w-8 ${info.bg} ${info.text} border ${info.border} rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:-rotate-6 transition-transform duration-300 cursor-default`}
                                    title={`Alérgeno: ${allergen}`}
                                >
                                    <span className="text-[10px] md:text-[18px] flex-shrink-0">
                                        {info.icon}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Info Container */}
            <div className="p-3 md:p-4 flex flex-col flex-1">
                <div className="mb-1 md:mb-2 text-left min-h-[56px] md:min-h-0">
                    <h3 className="text-sm md:text-xl font-black text-gray-900 leading-tight line-clamp-2 md:line-clamp-none h-8 md:h-auto md:min-h-[60px]">
                        {item.name}
                    </h3>
                    {item.pieces && (
                        <span className="text-[8px] md:text-[10px] font-black text-gray-400 tracking-widest block opacity-70">
                            {item.pieces} Unidades
                        </span>
                    )}
                </div>

                <p className="text-gray-500 text-xs md:text-sm leading-tight md:leading-relaxed mb-3 md:mb-6 line-clamp-3 min-h-[2.8rem] md:min-h-[4.5rem] font-medium overflow-hidden">
                    {item.description}
                </p>
                <div className="mt-auto flex items-center justify-between gap-1">
                    <div className="flex flex-col">
                        <span className="text-base md:text-xl font-black text-gray-900 whitespace-nowrap">
                            {item.price.toFixed(2).replace('.', ',')} €
                        </span>
                        {isExtra && !isAdded && (
                            <div className="flex items-center bg-gray-100 rounded-lg md:rounded-xl px-0.5 py-0.5 mt-1 md:w-fit">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors bg-transparent border-none cursor-pointer"
                                    aria-label="Disminuir cantidad"
                                >
                                    <Minus size={12} strokeWidth={3} />
                                </button>
                                <span className="w-4 md:w-6 text-center text-[10px] md:text-[12px] font-black text-gray-900">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="w-5 h-5 md:w-7 md:h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors bg-transparent border-none cursor-pointer"
                                    aria-label="Aumentar cantidad"
                                >
                                    <Plus size={12} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        aria-label="Añadir"
                        data-testid="add-to-cart-button"
                        disabled={isAdded}
                        onClick={e => onAddToCart(item, e, quantity)}
                        className={`h-9 w-9 md:h-10 md:w-10 rounded-xl md:rounded-2xl font-black transition-all duration-500 flex items-center justify-center border-none cursor-pointer flex-shrink-0 relative overflow-hidden ${
                            isAdded
                                ? 'bg-green-500 text-white cursor-default'
                                : 'bg-gray-900 text-white hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-200 active:scale-95'
                        }`}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {isAdded ? (
                                <motion.div
                                    key="added"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="flex items-center justify-center w-full"
                                >
                                    <Check size={18} strokeWidth={3} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="add"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="flex items-center justify-center w-full"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ProductCard;
