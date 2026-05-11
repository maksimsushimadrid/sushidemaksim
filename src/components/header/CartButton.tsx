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
            setIsCartBumping(true);
            const timer = setTimeout(() => setIsCartBumping(false), 800);
            return () => clearTimeout(timer);
        }
        prevCountRef.current = itemCount;
    }, [itemCount]);

    // Base scale grows with total: from 1.0 (at 10€) up to 1.5 (at 120€)
    const scaleRatio = Math.max(0, Math.min((total - 10) / 110, 1));
    const baseScale = 1 + scaleRatio * 0.5;

    // Intensity of the 'fisheye' bump increases with total
    const bulgeFactor = 1.8 + scaleRatio * 1.7;

    return (
        <div className="flex items-center gap-2 md:gap-3">
            <motion.div
                animate={{
                    y: isCartBumping ? [0, 18, -12, 0] : 0,
                    // Intensified non-uniform scaling for fish-eye
                    scaleX: isCartBumping
                        ? [
                              baseScale,
                              baseScale * bulgeFactor * 1.2,
                              baseScale * 0.6,
                              baseScale * 1.1,
                              baseScale,
                          ]
                        : baseScale,
                    scaleY: isCartBumping
                        ? [
                              baseScale,
                              baseScale * bulgeFactor * 0.8,
                              baseScale * 0.9,
                              baseScale * 1.05,
                              baseScale,
                          ]
                        : baseScale,
                    rotate: isCartBumping ? [0, -20, 20, 0] : 0,
                }}
                transition={{
                    duration: 0.85,
                    type: 'spring',
                    stiffness: 450,
                    damping: 10,
                }}
                className="relative cursor-pointer overflow-visible group"
            >
                <Link
                    id="cart-icon"
                    to="/cart"
                    className="relative no-underline transition-all flex items-center justify-center min-w-[60px] min-h-[60px] active:scale-90"
                >
                    {/* The Bag Image */}
                    <img
                        src="/cart.png"
                        alt="Cart"
                        className="w-16 h-16 object-contain transition-all"
                        style={{
                            filter: isCartBumping
                                ? `drop-shadow(0 0 30px rgba(234, 88, 12, ${0.4 + scaleRatio * 0.4})) brightness(1.2)`
                                : `drop-shadow(0 8px 12px rgba(0,0,0,${0.1 + scaleRatio * 0.1}))`,
                        }}
                    />

                    {/* Fisheye / Spherical Reflection Overlay */}
                    <AnimatePresence>
                        {isCartBumping && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{ opacity: 0.8, scale: 1.4 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 rounded-full pointer-events-none z-10"
                                style={{
                                    background:
                                        'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)',
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {!cartLoading && total > 0 && (
                        <span className="hidden md:block ml-2 text-[16px] font-black whitespace-nowrap text-gray-900 bg-white/95 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-gray-100 shadow-2xl">
                            {total.toFixed(2)} €
                        </span>
                    )}

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
                                className="absolute -top-1 -right-1 bg-orange-600 text-white text-[13px] font-black rounded-full min-w-[26px] h-[26px] flex items-center justify-center px-1 shadow-2xl border-2 border-white z-20"
                            >
                                {itemCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            </motion.div>
        </div>
    );
}
