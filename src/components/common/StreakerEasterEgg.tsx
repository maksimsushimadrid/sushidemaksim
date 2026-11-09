import { motion, AnimatePresence } from 'framer-motion';

interface StreakerEasterEggProps {
    isActive: boolean;
    onComplete: () => void;
}

export default function StreakerEasterEgg({ isActive, onComplete }: StreakerEasterEggProps) {
    if (!isActive) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden">
                {/* Streaker container that jumps out of the gift box on the right and sprints all the way to the left */}
                <motion.div
                    initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                    animate={{
                        x: [0, -30, -120, -300, -700, -1400],
                        y: [0, -85, -15, -25, -15, -20],
                        scale: [0.2, 1.1, 1, 1, 1, 1],
                        opacity: [0, 1, 1, 1, 1, 0],
                    }}
                    transition={{
                        duration: 1.8,
                        times: [0, 0.18, 0.35, 0.55, 0.8, 1],
                        ease: 'easeInOut',
                    }}
                    onAnimationComplete={onComplete}
                    className="absolute top-[56%] right-8 -translate-y-1/2 flex flex-col items-center select-none"
                    style={{ willChange: 'transform' }}
                >
                    {/* Comic speech bubble */}
                    <motion.div
                        animate={{
                            y: [-2, 3, -2],
                            rotate: [-4, 4, -4],
                        }}
                        transition={{ duration: 0.25, repeat: Infinity }}
                        className="mb-1 -ml-12 px-2.5 py-1 bg-white text-zinc-900 font-black text-xs rounded-xl shadow-xl border-2 border-amber-400 whitespace-nowrap flex items-center gap-1"
                    >
                        <span>¡¡¡LIBERTAD!!!</span>
                        <span className="text-base leading-none">🏃‍♂️💨</span>
                    </motion.div>

                    {/* Cartoon Streaker SVG */}
                    <div className="relative w-28 h-36 flex items-center justify-center">
                        {/* Speed lines / sweat drops flying backwards */}
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3], x: [10, 20, 10] }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                            className="absolute right-0 top-6 text-xl pointer-events-none"
                        >
                            💦💨
                        </motion.div>

                        <svg
                            viewBox="0 0 120 160"
                            className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                        >
                            {/* Head & Expression */}
                            <g>
                                {/* Head */}
                                <circle
                                    cx="60"
                                    cy="30"
                                    r="20"
                                    fill="#FFCBA4"
                                    stroke="#D48C5B"
                                    strokeWidth="2.5"
                                />
                                {/* Hair (windblown backward) */}
                                <path
                                    d="M 45 22 Q 55 10 75 14 Q 85 18 82 28 Q 72 24 55 24 Z"
                                    fill="#5A3825"
                                />
                                {/* Wild Eyes */}
                                <ellipse
                                    cx="52"
                                    cy="28"
                                    rx="4.5"
                                    ry="6"
                                    fill="#FFFFFF"
                                    stroke="#000"
                                    strokeWidth="1.5"
                                />
                                <circle cx="50.5" cy="28" r="2.2" fill="#000000" />

                                <ellipse
                                    cx="64"
                                    cy="28"
                                    rx="4.5"
                                    ry="6"
                                    fill="#FFFFFF"
                                    stroke="#000"
                                    strokeWidth="1.5"
                                />
                                <circle cx="62.5" cy="28" r="2.2" fill="#000000" />

                                {/* Eyebrows raised in shock */}
                                <path
                                    d="M 47 19 Q 53 15 57 18"
                                    stroke="#000"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <path
                                    d="M 61 18 Q 66 15 71 19"
                                    stroke="#000"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    fill="none"
                                />

                                {/* Screaming Open Mouth */}
                                <ellipse
                                    cx="56"
                                    cy="40"
                                    rx="6"
                                    ry="7"
                                    fill="#6B1D2F"
                                    stroke="#000"
                                    strokeWidth="1.5"
                                />
                                <ellipse cx="56" cy="43" rx="3.5" ry="2.5" fill="#FF6B81" />
                            </g>

                            {/* Torso & Chest */}
                            <g>
                                <path
                                    d="M 52 50 Q 38 65 42 95 L 70 95 Q 74 65 60 50 Z"
                                    fill="#FFCBA4"
                                    stroke="#D48C5B"
                                    strokeWidth="2.5"
                                />
                                {/* Chest details / nipples */}
                                <circle cx="48" cy="64" r="1.5" fill="#D48C5B" />
                                <circle cx="64" cy="64" r="1.5" fill="#D48C5B" />
                                <ellipse
                                    cx="56"
                                    cy="80"
                                    rx="3"
                                    ry="1.5"
                                    fill="#D48C5B"
                                    opacity="0.6"
                                />
                            </g>

                            {/* Flailing Left Arm (pumping back) */}
                            <motion.g
                                animate={{ rotate: [-35, 45, -35] }}
                                transition={{ duration: 0.22, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ transformOrigin: '45px 54px' }}
                            >
                                <path
                                    d="M 45 54 Q 30 65 24 50 L 16 54"
                                    stroke="#FFCBA4"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <circle cx="16" cy="54" r="4.5" fill="#FFCBA4" />
                            </motion.g>

                            {/* Flailing Right Arm (pumping forward) */}
                            <motion.g
                                animate={{ rotate: [45, -35, 45] }}
                                transition={{ duration: 0.22, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ transformOrigin: '67px 54px' }}
                            >
                                <path
                                    d="M 67 54 Q 82 65 88 50 L 96 54"
                                    stroke="#FFCBA4"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <circle cx="96" cy="54" r="4.5" fill="#FFCBA4" />
                            </motion.g>

                            {/* Frantic Running Left Leg */}
                            <motion.g
                                animate={{ rotate: [65, -55, 65] }}
                                transition={{ duration: 0.22, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ transformOrigin: '48px 94px' }}
                            >
                                <path
                                    d="M 48 94 Q 40 120 28 135 L 20 134"
                                    stroke="#FFCBA4"
                                    strokeWidth="9"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                {/* Running sneaker or bare foot */}
                                <path
                                    d="M 20 134 L 10 138"
                                    stroke="#D48C5B"
                                    strokeWidth="9"
                                    strokeLinecap="round"
                                />
                            </motion.g>

                            {/* Frantic Running Right Leg */}
                            <motion.g
                                animate={{ rotate: [-55, 65, -55] }}
                                transition={{ duration: 0.22, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ transformOrigin: '64px 94px' }}
                            >
                                <path
                                    d="M 64 94 Q 72 120 84 135 L 92 134"
                                    stroke="#FFCBA4"
                                    strokeWidth="9"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <path
                                    d="M 92 134 L 102 138"
                                    stroke="#D48C5B"
                                    strokeWidth="9"
                                    strokeLinecap="round"
                                />
                            </motion.g>

                            {/* Classic 8-bit Pixelated CENSORED Bar over waist */}
                            <g>
                                <rect
                                    x="32"
                                    y="88"
                                    width="48"
                                    height="22"
                                    rx="3"
                                    fill="#0F0F10"
                                    stroke="#F59E0B"
                                    strokeWidth="2"
                                />
                                {/* Pixel grid effect inside censor box */}
                                <rect x="36" y="91" width="8" height="7" fill="#27272A" />
                                <rect x="44" y="91" width="8" height="7" fill="#3F3F46" />
                                <rect x="52" y="91" width="8" height="7" fill="#18181B" />
                                <rect x="60" y="91" width="8" height="7" fill="#52525B" />
                                <rect x="68" y="91" width="8" height="7" fill="#27272A" />

                                <rect x="36" y="98" width="8" height="8" fill="#52525B" />
                                <rect x="44" y="98" width="8" height="8" fill="#18181B" />
                                <rect x="52" y="98" width="8" height="8" fill="#3F3F46" />
                                <rect x="60" y="98" width="8" height="8" fill="#27272A" />
                                <rect x="68" y="98" width="8" height="8" fill="#52525B" />

                                <text
                                    x="56"
                                    y="103"
                                    fill="#FBBF24"
                                    fontSize="8"
                                    fontFamily="monospace"
                                    fontWeight="900"
                                    textAnchor="middle"
                                    letterSpacing="0.5"
                                >
                                    CENSORED
                                </text>
                            </g>
                        </svg>
                    </div>

                    {/* Speed dust clouds at his feet */}
                    <motion.div
                        animate={{
                            opacity: [0.4, 0.9, 0.2],
                            scale: [0.8, 1.3, 0.7],
                            x: [15, 30, 20],
                        }}
                        transition={{ duration: 0.18, repeat: Infinity }}
                        className="text-lg leading-none -mt-3 mr-4 pointer-events-none"
                    >
                        💨💨
                    </motion.div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
