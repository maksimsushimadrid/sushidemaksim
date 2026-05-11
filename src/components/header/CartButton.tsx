import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface CartButtonProps {
    itemCount: number;
    total: number;
    cartLoading: boolean;
}

export default function CartButton({ itemCount, total, cartLoading }: CartButtonProps) {
    const [isCartBumping, setIsCartBumping] = useState(false);
    const prevCountRef = useRef(itemCount);

    useEffect(() => {
        if (itemCount > prevCountRef.current) {
            // Delay bump to sync with flying item arrival (~0.7s flight)
            const delayTimer = setTimeout(() => {
                setIsCartBumping(true);
                const resetTimer = setTimeout(() => setIsCartBumping(false), 600);
                return () => clearTimeout(resetTimer);
            }, 700);
            return () => clearTimeout(delayTimer);
        }
        prevCountRef.current = itemCount;
    }, [itemCount]);

    // Base scale grows with total: from 1.0 (at 10€) up to 1.55 (at 120€)
    const scaleRatio = Math.max(0, Math.min((total - 10) / 110, 1));
    const baseScale = 1 + scaleRatio * 0.55;

    // Intensity of the 'fisheye' bump: From 2.2x up to 4.5x
    const bulgeFactor = 2.2 + scaleRatio * 2.3;

    const bagVariants = {
        idle: {
            scaleX: baseScale,
            scaleY: baseScale,
            borderRadius: `${15 + scaleRatio * 15}% / 100%`,
            y: 0,
            rotate: 0,
        },
        bump: {
            // Aggressive horizontal scaling for side bulge
            scaleX: [baseScale, baseScale * bulgeFactor * 1.5, baseScale * 0.9, baseScale],
            scaleY: [baseScale, baseScale * bulgeFactor * 0.7, baseScale * 1.05, baseScale],
            borderRadius: [
                `${15 + scaleRatio * 15}% / 100%`,
                '50% / 100%',
                '5% / 100%',
                `${15 + scaleRatio * 15}% / 100%`,
            ],
            y: [0, -12, 8, -6, 4, -2, 0],
            rotate: [0, -18, 18, -14, 14, -8, 8, -4, 0],
        },
    };

    return (
        <div className="flex items-center gap-2 md:gap-3">
            <motion.div className="relative cursor-pointer overflow-visible group">
                <Link
                    id="cart-icon"
                    to="/cart"
                    className="relative no-underline transition-all flex items-center justify-center min-w-[80px] min-h-[80px] active:scale-90"
                >
                    {/* Wrapper to pin the badge to the bag */}
                    <div className="relative">
                        {/* The Bag Image with Fisheye Distortion and Dynamic Rounding */}
                        <motion.img
                            src="/cart.webp"
                            alt="Cart"
                            className="w-11 h-11 object-cover z-10 overflow-hidden"
                            variants={bagVariants}
                            initial="idle"
                            animate={isCartBumping ? 'bump' : 'idle'}
                            transition={{
                                duration: 0.8,
                                type: 'spring',
                                stiffness: 200,
                                damping: 10,
                            }}
                        />

                        <AnimatePresence>
                            {!cartLoading && itemCount > 0 && (
                                <motion.span
                                    key={itemCount}
                                    initial={{ scale: 0, opacity: 0, y: 15 }}
                                    animate={{
                                        scale: [0, 1.8, 1],
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 800,
                                        damping: 12,
                                    }}
                                    className="absolute -top-2 -right-2 bg-orange-600 text-white text-[13px] font-black rounded-full min-w-[24px] h-[24px] flex items-center justify-center px-1 shadow-2xl border-2 border-white z-20"
                                >
                                    {itemCount}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    {!cartLoading && total > 0 && (
                        <span className="hidden md:block ml-2 text-[16px] font-black whitespace-nowrap text-gray-900 bg-white/95 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-gray-100 shadow-2xl">
                            {total.toFixed(2)} €
                        </span>
                    )}
                </Link>
            </motion.div>
        </div>
    );
}
