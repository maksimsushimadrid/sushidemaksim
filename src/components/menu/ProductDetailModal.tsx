import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Share2, Plus, Minus, Check, Flame, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import SafeImage from '../common/SafeImage';
import { getOptimizedImageUrl } from '../../utils/images';
import { slugify } from '../../utils/formatters';
import { getAllergenInfo } from '../../utils/allergens';
import { MenuItem } from '../../hooks/queries/useMenu';
import { User } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useNavigate } from 'react-router-dom';

import { PRODUCT_VIDEO_OVERRIDES } from '../../constants/tableOverrides';

interface ProductDetailModalProps {
    item: MenuItem;
    onClose: () => void;
    user?: User | null;
    isFavorite?: boolean;
    onToggleFavorite?: (id: number) => void;
    onShare?: (item: MenuItem, e: React.MouseEvent) => void;
    onAddToCart?: (
        item: MenuItem,
        e: React.MouseEvent<HTMLButtonElement>,
        quantity: number
    ) => void;
    isAdded?: boolean;
    cartQuantity?: number;
    cartItemId?: number;
    cartSelectedOption?: string;
    onUpdateQuantity?: (
        id: string,
        quantity: number,
        cartItemId?: number,
        selectedOption?: string
    ) => void;
    onRemoveItem?: (id: string, cartItemId?: number) => void;
}

export default function ProductDetailModal({
    item,
    onClose,
    user,
    isFavorite = false,
    onToggleFavorite,
    onShare,
    onAddToCart,
    isAdded = false,
    cartQuantity = 0,
    cartItemId,
    cartSelectedOption,
    onUpdateQuantity,
    onRemoveItem,
}: ProductDetailModalProps) {
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(cartQuantity > 0 ? cartQuantity : 1);

    // Lock body scroll and stop Lenis smooth scrolling while modal is mounted
    useScrollLock(true);

    // Sync quantity with cart quantity if changed
    useEffect(() => {
        setQuantity(cartQuantity > 0 ? cartQuantity : 1);
    }, [cartQuantity]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleClose = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onClose();
    };

    const handleGoToAllergens = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        navigate('/alergenos');
    };

    const handleShareClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onShare) {
            onShare(item, e);
        } else if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: item.name,
                text: item.description,
                url: `${window.location.origin}/menu?category=${item.category}#item-${item.id}`,
            });
        }
    };

    const videoRef = useRef<HTMLVideoElement>(null);

    const videoSources = useMemo(
        () =>
            (typeof item.video === 'object' ? item.video : null) ||
            PRODUCT_VIDEO_OVERRIDES[String(item.id)] ||
            (item.name?.toLowerCase().includes('alaska')
                ? { mp4: '/alaska-roll.mp4', webm: '/alaska-roll.webm' }
                : null),
        [item.video, item.id, item.name]
    );

    // Programmatic play trigger for iOS Safari and mobile browsers for zero-delay start
    useEffect(() => {
        const el = videoRef.current;
        if (videoSources && el) {
            el.defaultMuted = true;
            el.muted = true;
            el.currentTime = 0;
            const playPromise = el.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Mobile video autoplay prevented:', error);
                });
            }
        }
    }, [videoSources]);

    const totalPrice = (item.price * quantity).toFixed(2).replace('.', ',');

    const modalContent = (
        <div
            className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center"
            onClick={e => e.stopPropagation()}
        >
            {/* Backdrop Fade */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={handleClose}
                onTouchMove={e => e.preventDefault()}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Bottom Sheet Slide Up / Down */}
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_e, info) => {
                    if (info.offset.y > 100) {
                        handleClose();
                    }
                }}
                className="relative bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 z-[1001] pointer-events-auto transform-gpu"
            >
                {/* Pull Indicator (Mobile) */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

                {/* Large Media Header (Video Animation or Image) */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-gray-100 shrink-0 overflow-hidden">
                    {videoSources ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            {...({ 'webkit-playsinline': 'true' } as any)}
                            onCanPlay={e => {
                                e.currentTarget.muted = true;
                                e.currentTarget.play().catch(() => {});
                            }}
                            className="w-full h-full object-cover pointer-events-none"
                        >
                            {videoSources.mp4 && <source src={videoSources.mp4} type="video/mp4" />}
                            {videoSources.webm && (
                                <source src={videoSources.webm} type="video/webm" />
                            )}
                        </video>
                    ) : (
                        <SafeImage
                            src={item.image}
                            getOptimizedUrl={(url: string) =>
                                getOptimizedImageUrl(url, 800, 85, slugify(item.name))
                            }
                            className="w-full h-full object-cover"
                            alt={item.name}
                            fallbackContent={null}
                        />
                    )}

                    {/* Top Floating Control Buttons */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 z-20">
                        <button
                            onClick={handleShareClick}
                            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-white transition-transform active:scale-90 border-none cursor-pointer"
                            title="Compartir"
                        >
                            <Share2 size={16} />
                        </button>

                        {user && onToggleFavorite && (
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleFavorite(item.id);
                                }}
                                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-gray-700 hover:bg-white transition-transform active:scale-90 border-none cursor-pointer"
                                title="Favorito"
                            >
                                <Heart
                                    size={18}
                                    className={isFavorite ? 'text-orange-500' : 'text-gray-400'}
                                    fill={isFavorite ? 'currentColor' : 'none'}
                                />
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-white transition-transform active:scale-90 border-none cursor-pointer"
                            title="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Image Badges */}
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[90%] z-10">
                        {item.isPopular && (
                            <div className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-orange-600 border border-orange-100 rounded-full flex items-center gap-1 shadow-md text-xs font-black">
                                <Flame size={14} className="fill-orange-500/20" />
                                <span>Popular</span>
                            </div>
                        )}
                        {item.isNew && (
                            <div className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full flex items-center gap-1 shadow-md text-xs font-black">
                                <span>✨ Nuevo</span>
                            </div>
                        )}
                        {item.isChefChoice && (
                            <div className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full flex items-center gap-1 shadow-md text-xs font-black">
                                <span>👨‍🍳 Chef</span>
                            </div>
                        )}
                        {item.spicy && (
                            <div className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full flex items-center gap-1 shadow-md text-xs font-black">
                                <span>🌶️ Picante</span>
                            </div>
                        )}
                        {item.vegetarian && (
                            <div className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full flex items-center gap-1 shadow-md text-xs font-black">
                                <span>🥬 Vegetariano</span>
                            </div>
                        )}
                        {item.pieces && (
                            <div className="px-2.5 py-1 bg-gray-900/80 backdrop-blur-md text-white rounded-full flex items-center shadow-md text-xs font-black">
                                <span>{item.pieces} Unidades</span>
                            </div>
                        )}
                        {item.weight && Boolean(String(item.weight).trim()) && (
                            <div className="px-2.5 py-1 bg-gray-900/80 backdrop-blur-md text-white rounded-full flex items-center gap-1 shadow-md text-xs font-black">
                                <span>
                                    ⚖️{' '}
                                    {String(item.weight).toLowerCase().includes('g')
                                        ? item.weight
                                        : `${item.weight} g`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar allow-modal-scroll">
                    {/* Title & Price */}
                    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                                {item.name}
                            </h2>
                            <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                {item.category && (
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {item.category}
                                    </span>
                                )}
                                {item.pieces && (
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                        {item.pieces} uds
                                    </span>
                                )}
                                {item.weight && Boolean(String(item.weight).trim()) && (
                                    <span className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                        ⚖️{' '}
                                        {String(item.weight).toLowerCase().includes('g')
                                            ? item.weight
                                            : `${item.weight} g`}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="text-2xl font-black text-orange-600 shrink-0">
                            {item.price.toFixed(2).replace('.', ',')} €
                        </span>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
                            Descripción
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-medium">
                            {item.description || 'Sin descripción disponible.'}
                        </p>
                    </div>

                    {/* Allergens Section */}
                    <div className="pt-2">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Info size={16} className="text-orange-500" />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                                Alérgenos
                            </h3>
                        </div>
                        {item.allergens && item.allergens.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {item.allergens.map(allergen => {
                                    const info = getAllergenInfo(allergen);
                                    return (
                                        <div
                                            key={allergen}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${info.bg} ${info.text} ${info.border} shadow-sm`}
                                        >
                                            <span className="text-base">{info.icon}</span>
                                            <span className="capitalize">{allergen}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-100 text-xs font-bold">
                                <span>🌿</span>
                                <span>Sin alérgenos declarados</span>
                            </div>
                        )}
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={handleGoToAllergens}
                                className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700 transition-colors border-none bg-transparent p-0 cursor-pointer"
                            >
                                <span>Ver guía completa de alérgenos</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                    {/* Quantity Control */}
                    <div className="flex items-center bg-white rounded-2xl p-1 border border-gray-200 shadow-sm shrink-0">
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                triggerHaptic();
                                const newQty = Math.max(1, quantity - 1);
                                setQuantity(newQty);
                                if (cartQuantity > 0 && onUpdateQuantity && onRemoveItem) {
                                    if (newQty === 0) {
                                        onRemoveItem(String(item.id), cartItemId);
                                    } else {
                                        onUpdateQuantity(
                                            String(item.id),
                                            newQty,
                                            cartItemId,
                                            cartSelectedOption
                                        );
                                    }
                                }
                            }}
                            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border-none cursor-pointer"
                            aria-label="Disminuir cantidad"
                        >
                            <Minus size={16} strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center text-sm font-black text-gray-900 select-none">
                            {quantity}
                        </span>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                triggerHaptic();
                                const newQty = quantity + 1;
                                setQuantity(newQty);
                                if (cartQuantity > 0 && onUpdateQuantity) {
                                    onUpdateQuantity(
                                        String(item.id),
                                        newQty,
                                        cartItemId,
                                        cartSelectedOption
                                    );
                                }
                            }}
                            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border-none cursor-pointer"
                            aria-label="Aumentar cantidad"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            triggerHaptic();
                            if (onAddToCart) {
                                onAddToCart(item, e, quantity);
                            }
                            handleClose(e);
                        }}
                        className={`flex-1 h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg border-none cursor-pointer ${
                            isAdded
                                ? 'bg-green-500 text-white shadow-green-200'
                                : 'bg-gray-900 text-white hover:bg-orange-600 shadow-gray-200 active:scale-95'
                        }`}
                    >
                        {isAdded ? (
                            <>
                                <Check size={18} strokeWidth={3} />
                                <span>¡Añadido al pedido!</span>
                            </>
                        ) : (
                            <>
                                <Plus size={18} strokeWidth={3} />
                                <span>Añadir • {totalPrice} €</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
