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

    // Base scale grows with total: from 1.0 (at 10€) up to 1.55 (at 120€)
    const scaleRatio = Math.max(0, Math.min((total - 10) / 110, 1));
    const baseScale = 1 + scaleRatio * 0.55;

    // Intensity of the 'fisheye' bump: From 2.2x up to 4.5x
    const bulgeFactor = 2.2 + scaleRatio * 2.3;

    return (
        <div className="flex items-center gap-2 md:gap-3">
            <motion.div className="relative cursor-pointer overflow-visible group">
                <Link
                    id="cart-icon"
                    to="/cart"
                    className="relative no-underline transition-all flex items-center justify-center min-w-[52px] min-h-[52px] active:scale-90"
                >
                    {/* The Bag Image with Fisheye Distortion */}
                    <motion.img
                        key={itemCount}
                        src="/cart.png"
                        alt="Cart"
                        className="w-12 h-12 object-contain z-10"
                        animate={{
                            scaleX: isCartBumping
                                ? [
                                      baseScale,
                                      baseScale * bulgeFactor * 1.3,
                                      baseScale * 0.5,
                                      baseScale * 1.15,
                                      baseScale,
                                  ]
                                : baseScale,
                            scaleY: isCartBumping
                                ? [
                                      baseScale,
                                      baseScale * bulgeFactor * 0.7,
                                      baseScale * 0.9,
                                      baseScale * 1.05,
                                      baseScale,
                                  ]
                                : baseScale,
                            y: isCartBumping ? [0, 20, -15, 0] : 0,
                            rotate: isCartBumping ? [0, -25, 25, 0] : 0,
                        }}
                        transition={{
                            duration: 0.8,
                            type: 'spring',
                            stiffness: 400,
                            damping: 10,
                        }}
                        style={{
                            filter: isCartBumping
                                ? `drop-shadow(0 15px 25px rgba(0,0,0,0.25))`
                                : `drop-shadow(0 8px 12px rgba(0,0,0,${0.1 + scaleRatio * 0.1}))`,
                        }}
                    />

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
