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
            const timer = setTimeout(() => setIsCartBumping(false), 500);
            return () => clearTimeout(timer);
        }
        prevCountRef.current = itemCount;
    }, [itemCount]);

    const remainingToFreeDelivery = 80 - total;
    const showFreeDeliveryHint = total >= 50 && total < 80;

    return (
        <div className="flex items-center gap-2 md:gap-3">
            <AnimatePresence>
                {showFreeDeliveryHint && !cartLoading && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex flex-col items-end justify-center text-right"
                    >
                        <span className="whitespace-nowrap text-[10px] md:text-[11px] font-black text-orange-600 leading-none mb-[3px]">
                            Faltan {remainingToFreeDelivery.toFixed(2)} €
                        </span>
                        <span className="whitespace-nowrap text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            Envío Gratis
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate={{
                    y: isCartBumping ? [0, 5, -2, 0] : 0,
                    scale: isCartBumping ? [1, 1.4, 0.85, 1.1, 1] : 1,
                    rotate: isCartBumping ? [0, -10, 10, -5, 5, 0] : 0,
                }}
                transition={{
                    duration: 0.6,
                    ease: 'anticipate',
                }}
                className="relative cursor-pointer"
            >
                <Link
                    id="cart-icon"
                    to="/cart"
                    className="relative no-underline transition-all flex items-center justify-center min-w-[44px] min-h-[44px] active:scale-90"
                >
                    <img
                        src="/cart.png"
                        alt="Cart"
                        className="w-10 h-10 object-contain drop-shadow-md"
                        style={{ filter: isCartBumping ? 'brightness(1.1)' : 'none' }}
                    />

                    {!cartLoading && total > 0 && (
                        <span className="hidden md:block ml-2 text-[14px] font-black whitespace-nowrap text-gray-900 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                            {total.toFixed(2)} €
                        </span>
                    )}

                    <AnimatePresence>
                        {!cartLoading && itemCount > 0 && (
                            <motion.span
                                key={itemCount}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: [0, 1.5, 1],
                                    opacity: 1,
                                }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 600,
                                    damping: 15,
                                }}
                                className="absolute -top-1 -right-1 bg-orange-600 text-white text-[11px] font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow-lg border-2 border-white"
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
