import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../../utils/haptics';

interface CartButtonProps {
    itemCount: number;
    total: number;
    cartLoading: boolean;
}

// 14 particles for the bursting paper bag explosion
const BURST_PARTICLES = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * Math.PI * 2 + Math.sin(i) * 0.35;
    const distance = 28 + (i % 3) * 16;
    return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: (i * 67) % 360,
        color:
            i % 4 === 0 ? '#C4975E' : i % 4 === 1 ? '#F97316' : i % 4 === 2 ? '#EAB308' : '#8B5A2B',
        size: 5 + (i % 4) * 2,
    };
});

function playPopSound() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch {
        // audio context blocked or not supported
    }
}

export default function CartButton({ itemCount, total, cartLoading }: CartButtonProps) {
    const [isCartBumping, setIsCartBumping] = useState(false);
    const prevCountRef = useRef(itemCount);

    const isPopped = total >= 300;
    const [isBursting, setIsBursting] = useState(false);
    const prevPoppedRef = useRef(isPopped);

    // Easter egg: trigger pop and particle burst when total reaches or exceeds 300€
    useEffect(() => {
        if (isPopped && !prevPoppedRef.current) {
            setIsBursting(true);
            triggerHaptic(HAPTIC_PATTERNS.ERROR);
            playPopSound();
            const timer = setTimeout(() => {
                setIsBursting(false);
            }, 700);
            return () => clearTimeout(timer);
        }
        prevPoppedRef.current = isPopped;
    }, [isPopped]);

    useEffect(() => {
        if (itemCount > prevCountRef.current && !isPopped) {
            // Delay bump to sync with flying item arrival (~0.7s flight)
            const delayTimer = setTimeout(() => {
                setIsCartBumping(true);
                const resetTimer = setTimeout(() => setIsCartBumping(false), 600);
                return () => clearTimeout(resetTimer);
            }, 700);
            return () => clearTimeout(delayTimer);
        }
        prevCountRef.current = itemCount;
    }, [itemCount, isPopped]);

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
            opacity: 1,
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
            opacity: 1,
        },
    };

    return (
        <div className="flex items-center gap-2 md:gap-3">
            <motion.div className="relative cursor-pointer overflow-visible group">
                <Link
                    id="cart-icon"
                    to="/cart"
                    className="relative no-underline transition-all flex items-center justify-center min-w-[52px] min-h-[52px] active:scale-90"
                    title={
                        isPopped
                            ? '¡El paquete ha reventado por tanto sushi! Toca para ir a tu cesta'
                            : 'Ver cesta de compra'
                    }
                >
                    {/* Wrapper to pin the badge to the bag */}
                    <div className="relative flex items-center justify-center">
                        {/* Shockwave and flying paper particles when bag pops */}
                        <AnimatePresence>
                            {isBursting && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                                    {/* Flash shockwave circle */}
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 1 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.45, ease: 'easeOut' }}
                                        className="absolute w-12 h-12 rounded-full border-2 border-orange-400 bg-orange-400/25"
                                    />
                                    {/* Burst debris particles */}
                                    {BURST_PARTICLES.map(p => (
                                        <motion.div
                                            key={p.id}
                                            initial={{
                                                x: 0,
                                                y: 0,
                                                scale: 1,
                                                opacity: 1,
                                                rotate: 0,
                                            }}
                                            animate={{
                                                x: p.x,
                                                y: p.y,
                                                scale: [1, 1.25, 0],
                                                opacity: [1, 1, 0],
                                                rotate: p.rotate,
                                            }}
                                            transition={{ duration: 0.65, ease: 'easeOut' }}
                                            style={{
                                                backgroundColor: p.color,
                                                width: p.size,
                                                height: p.size,
                                            }}
                                            className="absolute rounded-sm shadow-sm"
                                        />
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Comic burst explosion icon that replaces the popped bag */}
                        {isPopped && (
                            <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: [0, 1.35, 1], rotate: [0, 12, 0] }}
                                transition={{ type: 'spring', stiffness: 450, damping: 14 }}
                                className="w-11 h-11 flex items-center justify-center select-none"
                            >
                                <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(249,115,22,0.5)]">
                                    💥
                                </span>
                            </motion.div>
                        )}

                        {/* The Bag Image with Fisheye Distortion, Dynamic Rounding & Burst Popping */}
                        <motion.img
                            src="/cart.webp"
                            alt="Cart"
                            className={`w-11 h-11 object-cover z-10 overflow-hidden ${
                                isPopped && !isBursting ? 'hidden' : ''
                            }`}
                            variants={bagVariants}
                            initial="idle"
                            animate={
                                isPopped
                                    ? isBursting
                                        ? {
                                              scale: [
                                                  baseScale,
                                                  baseScale * 1.5,
                                                  baseScale * 2.1,
                                                  0,
                                              ],
                                              rotate: [0, -25, 25, 0],
                                              opacity: [1, 1, 0.7, 0],
                                          }
                                        : { scale: 0, opacity: 0 }
                                    : isCartBumping
                                      ? 'bump'
                                      : 'idle'
                            }
                            transition={
                                isBursting
                                    ? { duration: 0.45, ease: [0.36, 0.07, 0.19, 0.97] }
                                    : {
                                          duration: 0.8,
                                          type: 'spring',
                                          stiffness: 200,
                                          damping: 10,
                                      }
                            }
                        />

                        {/* Floating Item Count Badge pinned to the cart */}
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
                                    data-testid="cart-count"
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
