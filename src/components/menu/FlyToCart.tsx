import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export interface FlyingItem {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    image?: string;
    emoji?: string;
}

interface FlyToCartProps {
    items: FlyingItem[];
}

export default function FlyToCart({ items }: FlyToCartProps) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {items.map(fly => (
                <motion.div
                    key={fly.id}
                    initial={{
                        x: fly.startX - 20,
                        y: fly.startY - 20,
                        scale: 1,
                        opacity: 1,
                        rotate: 0,
                    }}
                    animate={{
                        x: fly.endX - 20,
                        y: [
                            fly.startY - 20,
                            Math.min(fly.startY - 100, fly.endY - 30),
                            fly.endY - 20,
                        ],
                        scale: [1, 0.8, 0.2],
                        opacity: [1, 1, 0],
                        rotate: [0, -15, 15],
                    }}
                    transition={{
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1], // Smooth custom cubic bezier
                        x: {
                            duration: 0.8,
                            ease: [0.4, 0, 0.2, 1],
                        },
                        y: {
                            duration: 0.8,
                            ease: [0, 0.55, 0.45, 1], // Different ease for Y to create an arc
                            times: [0, 0.4, 1],
                        },
                        scale: {
                            duration: 0.8,
                            ease: 'easeIn',
                        },
                        opacity: {
                            duration: 0.8,
                            ease: 'linear',
                            times: [0, 0.85, 1],
                        },
                    }}
                    className="fixed top-0 left-0 z-[1000] pointer-events-none rounded-full overflow-hidden shadow-lg flex items-center justify-center bg-white border-2 border-orange-500"
                    style={{ width: '40px', height: '40px' }}
                >
                    {fly.image ? (
                        <img
                            src={fly.image}
                            alt=""
                            className="w-full h-full object-cover scale-105"
                        />
                    ) : (
                        <span className="text-2xl">{fly.emoji}</span>
                    )}
                </motion.div>
            ))}
        </AnimatePresence>,
        document.body
    );
}
