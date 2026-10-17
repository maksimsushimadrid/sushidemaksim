import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface BatInstance {
    id: number;
    startY: number;
    endY: number;
    isRtl: boolean;
    durationSec: number;
    scale: number;
    wingSpeedSec: number;
}

export const HalloweenAtmosphere = memo(function HalloweenAtmosphere() {
    const location = useLocation();
    const [bats, setBats] = useState<BatInstance[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const batIdCounterRef = useRef(0);
    const isMountedRef = useRef(true);
    const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

    // Exclude admin, waiter, table, track screens
    const isExcluded =
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/waiter') ||
        location.pathname.startsWith('/table') ||
        location.pathname.startsWith('/track');

    // Safe timeout helper that automatically cleans up on unmount
    const safeSetTimeout = useCallback((fn: () => void, delayMs: number): NodeJS.Timeout => {
        const timer = setTimeout(() => {
            timeoutsRef.current.delete(timer);
            if (isMountedRef.current) {
                fn();
            }
        }, delayMs);
        timeoutsRef.current.add(timer);
        return timer;
    }, []);

    // Global mount/unmount tracking and timer disposal
    useEffect(() => {
        isMountedRef.current = true;
        const currentTimers = timeoutsRef.current;
        return () => {
            isMountedRef.current = false;
            currentTimers.forEach(t => clearTimeout(t));
            currentTimers.clear();
        };
    }, []);

    // Check user accessibility preference for reduced motion
    const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Track scroll to make spider scurry away off-screen when scrolled
    useEffect(() => {
        if (isExcluded) return;

        const handleScroll = () => {
            const scrolled = window.scrollY > 20;
            setIsScrolled(prev => (prev === scrolled ? prev : scrolled));
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isExcluded]);

    // Helper to spawn a bat and remove it when its flight ends
    const spawnBat = useCallback(
        (config: {
            durationSec: number;
            scale: number;
            wingSpeedSec: number;
            startY?: number;
            endY?: number;
            isRtl?: boolean;
        }) => {
            if (!isMountedRef.current || prefersReducedMotion) return;

            batIdCounterRef.current += 1;
            const id = batIdCounterRef.current;
            const isRtl = config.isRtl ?? batIdCounterRef.current % 2 === 0;
            const startY = config.startY ?? 15 + Math.random() * 45;
            const endY = config.endY ?? 15 + Math.random() * 45;

            const newBat: BatInstance = {
                id,
                startY,
                endY,
                isRtl,
                durationSec: config.durationSec,
                scale: config.scale,
                wingSpeedSec: config.wingSpeedSec,
            };

            setBats(prev => [...prev, newBat]);

            // Remove after animation completes safely
            safeSetTimeout(
                () => {
                    setBats(prev => prev.filter(b => b.id !== id));
                },
                config.durationSec * 1000 + 100
            );
        },
        [prefersReducedMotion, safeSetTimeout]
    );

    // 1. Regular single bat flight (1.0s duration, runs every 20s)
    useEffect(() => {
        if (isExcluded || prefersReducedMotion) return;

        const launchRegularBat = () => {
            spawnBat({
                durationSec: 1.0,
                scale: 1.0,
                wingSpeedSec: 0.1,
            });
        };

        // First regular bat after 3s
        const initialTimer = safeSetTimeout(launchRegularBat, 3000);
        const intervalTimer = setInterval(launchRegularBat, 20000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(intervalTimer);
        };
    }, [isExcluded, prefersReducedMotion, safeSetTimeout, spawnBat]);

    // 2. Fast bats (0.5s duration, random interval between 30s and 60s)
    useEffect(() => {
        if (isExcluded || prefersReducedMotion) return;

        const scheduleNextFastBat = (delayMs: number) => {
            safeSetTimeout(() => {
                // Launch two fast bats swooping across together with slight offset
                const baseRtl = Math.random() > 0.5;
                const baseStart = 15 + Math.random() * 40;
                const baseEnd = 15 + Math.random() * 40;

                // Bat 1 (lead fast bat, 0.5s duration)
                spawnBat({
                    durationSec: 0.5,
                    scale: 0.8,
                    wingSpeedSec: 0.05,
                    startY: baseStart,
                    endY: baseEnd,
                    isRtl: baseRtl,
                });

                // Bat 2 (trailing fast bat, 0.5s duration, slightly smaller in background)
                safeSetTimeout(() => {
                    spawnBat({
                        durationSec: 0.5,
                        scale: 0.65,
                        wingSpeedSec: 0.048,
                        startY: Math.max(10, baseStart + (Math.random() * 12 - 6)),
                        endY: Math.max(10, baseEnd + (Math.random() * 12 - 6)),
                        isRtl: baseRtl,
                    });
                }, 90);

                // Schedule next interval randomly between 30s and 60s
                const nextDelay = 30000 + Math.random() * 30000;
                scheduleNextFastBat(nextDelay);
            }, delayMs);
        };

        // First preview fast bats flight after 7s, then randomized 30s-60s intervals
        scheduleNextFastBat(7000);
    }, [isExcluded, prefersReducedMotion, safeSetTimeout, spawnBat]);

    if (isExcluded) return null;

    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none z-[45] overflow-hidden select-none"
        >
            <style>{`
                /* Bat swooping animations */
                @keyframes bat-swoop-ltr {
                    0% {
                        transform: translate3d(-140px, var(--bat-start-y), 0) rotate(12deg) scale(0.85);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    50% {
                        transform: translate3d(50vw, calc((var(--bat-start-y) + var(--bat-end-y)) / 2 + 60px), 0) rotate(-6deg) scale(1.1);
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translate3d(calc(100vw + 140px), var(--bat-end-y), 0) rotate(8deg) scale(0.9);
                        opacity: 0;
                    }
                }
                @keyframes bat-swoop-rtl {
                    0% {
                        transform: translate3d(calc(100vw + 140px), var(--bat-start-y), 0) scaleX(-1) rotate(12deg) scale(0.85);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    50% {
                        transform: translate3d(50vw, calc((var(--bat-start-y) + var(--bat-end-y)) / 2 + 60px), 0) scaleX(-1) rotate(-6deg) scale(1.1);
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translate3d(-140px, var(--bat-end-y), 0) scaleX(-1) rotate(8deg) scale(0.9);
                        opacity: 0;
                    }
                }
                @keyframes bat-wing-flap-left {
                    0%, 100% { transform: rotate(0deg) scaleY(1); }
                    50% { transform: rotate(28deg) scaleY(-0.7); }
                }
                @keyframes bat-wing-flap-right {
                    0%, 100% { transform: rotate(0deg) scaleY(1); }
                    50% { transform: rotate(-28deg) scaleY(-0.7); }
                }
                .bat-flying-ltr {
                    animation: bat-swoop-ltr var(--bat-duration, 1s) cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
                    will-change: transform;
                }
                .bat-flying-rtl {
                    animation: bat-swoop-rtl var(--bat-duration, 1s) cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
                    will-change: transform;
                }
                .bat-wing-left {
                    transform-origin: 46px 28px;
                    animation: bat-wing-flap-left var(--bat-wing-speed, 0.1s) infinite ease-in-out;
                }
                .bat-wing-right {
                    transform-origin: 54px 28px;
                    animation: bat-wing-flap-right var(--bat-wing-speed, 0.1s) infinite ease-in-out;
                }

                /* Spider gentle pendulum sway on idle */
                @keyframes spider-sway {
                    0%, 100% {
                        transform: rotate(-3deg);
                    }
                    50% {
                        transform: rotate(3deg);
                    }
                }
                /* Spider legs scurry motion when escaping */
                @keyframes spider-leg-scurry-left {
                    0%, 100% { transform: rotate(-10deg); }
                    50% { transform: rotate(14deg); }
                }
                @keyframes spider-leg-scurry-right {
                    0%, 100% { transform: rotate(10deg); }
                    50% { transform: rotate(-14deg); }
                }
                .spider-scurrying-left {
                    animation: spider-leg-scurry-left 0.08s infinite ease-in-out;
                }
                .spider-scurrying-right {
                    animation: spider-leg-scurry-right 0.08s infinite ease-in-out;
                }

                @media (prefers-reduced-motion: reduce) {
                    .bat-flying-ltr,
                    .bat-flying-rtl,
                    .bat-wing-left,
                    .bat-wing-right,
                    .spider-scurrying-left,
                    .spider-scurrying-right {
                        animation: none !important;
                    }
                }
            `}</style>

            {/* TOP-LEFT CORNER SPIDERWEB & SPIDER */}
            <div className="absolute top-0 left-0 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none">
                {/* Spiderweb SVG */}
                <svg
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-0 left-0 w-full h-full filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] opacity-85"
                >
                    {/* Radial threads from (0,0) */}
                    <line
                        x1="0"
                        y1="0"
                        x2="116"
                        y2="0"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="0.9"
                    />
                    <line
                        x1="0"
                        y1="0"
                        x2="105"
                        y2="34"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="0.9"
                    />
                    <line
                        x1="0"
                        y1="0"
                        x2="86"
                        y2="70"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="0.9"
                    />
                    <line
                        x1="0"
                        y1="0"
                        x2="70"
                        y2="86"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="0.9"
                    />
                    <line
                        x1="0"
                        y1="0"
                        x2="34"
                        y2="105"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="0.9"
                    />
                    <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="116"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="0.9"
                    />

                    {/* Concentric curved connecting arcs */}
                    {/* Ring 1 */}
                    <path
                        d="M 32 0 Q 30 6 30 10 Q 26 16 25 20 Q 22 22 20 25 Q 16 26 10 30 Q 6 30 0 32"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="0.75"
                        fill="none"
                    />
                    {/* Ring 2 */}
                    <path
                        d="M 60 0 Q 56 10 55 18 Q 49 28 45 37 Q 40 40 37 45 Q 28 49 18 55 Q 10 56 0 60"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="0.75"
                        fill="none"
                    />
                    {/* Ring 3 */}
                    <path
                        d="M 88 0 Q 82 14 80 26 Q 72 41 66 54 Q 59 59 54 66 Q 41 72 26 80 Q 14 82 0 88"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="0.75"
                        fill="none"
                    />
                    {/* Ring 4 */}
                    <path
                        d="M 114 0 Q 106 18 104 34 Q 93 54 85 70 Q 77 77 70 85 Q 54 93 34 104 Q 18 106 0 114"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="0.7"
                        fill="none"
                    />

                    {/* Tiny dew droplets on intersections */}
                    <circle cx="25" cy="20" r="0.9" fill="white" opacity="0.8" />
                    <circle cx="45" cy="37" r="1.1" fill="white" opacity="0.8" />
                    <circle cx="66" cy="54" r="1.1" fill="white" opacity="0.8" />
                    <circle cx="37" cy="45" r="1.1" fill="white" opacity="0.8" />
                </svg>

                {/* HANGING SPIDER WITH RETRACTING THREAD */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '46px',
                        transformOrigin: 'top center',
                        transform: isScrolled
                            ? 'translate3d(0, -130px, 0)'
                            : 'translate3d(0, 0, 0)',
                        willChange: 'transform',
                        transition: isScrolled
                            ? 'transform 0.45s cubic-bezier(0.3, 0, 0.2, 1)'
                            : 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <div
                        style={{
                            transformOrigin: 'top center',
                            animation: isScrolled
                                ? 'none'
                                : 'spider-sway 3.8s ease-in-out infinite',
                        }}
                    >
                        {/* Silk Thread */}
                        <div
                            className="w-[1px] bg-white/70 mx-auto filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                            style={{ height: '78px' }}
                        />

                        {/* Spider Creature SVG */}
                        <svg
                            viewBox="-18 -12 36 34"
                            width="28"
                            height="28"
                            className="overflow-visible -mt-1 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]"
                        >
                            {/* Spider Left Legs */}
                            <g
                                className={isScrolled ? 'spider-scurrying-left' : ''}
                                style={{ transformOrigin: '0 2px' }}
                            >
                                <path
                                    d="M -3 -5 Q -11 -11 -13 -3"
                                    stroke="#27272a"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <path
                                    d="M -4 -3 Q -15 -5 -16 4"
                                    stroke="#27272a"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <path
                                    d="M -4 1 Q -16 3 -14 12"
                                    stroke="#27272a"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <path
                                    d="M -3 4 Q -13 11 -10 17"
                                    stroke="#27272a"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </g>

                            {/* Spider Right Legs */}
                            <g
                                className={isScrolled ? 'spider-scurrying-right' : ''}
                                style={{ transformOrigin: '0 2px' }}
                            >
                                <path
                                    d="M 3 -5 Q 11 -11 13 -3"
                                    stroke="#27272a"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <path
                                    d="M 4 -3 Q 15 -5 16 4"
                                    stroke="#27272a"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <path
                                    d="M 4 1 Q 16 3 14 12"
                                    stroke="#27272a"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <path
                                    d="M 3 4 Q 13 11 10 17"
                                    stroke="#27272a"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </g>

                            {/* Spider Abdomen */}
                            <ellipse
                                cx="0"
                                cy="3"
                                rx="5.2"
                                ry="6.8"
                                fill="#09090b"
                                stroke="#f97316"
                                strokeWidth="0.5"
                            />

                            {/* Halloween Orange Hourglass mark on back */}
                            <polygon points="0, 0.5 -2, 3 2, 3" fill="#f97316" />
                            <polygon points="-2, 3 2, 3 0, 5.5" fill="#f97316" />

                            {/* Spider Cephalothorax / Head */}
                            <circle cx="0" cy="-4.8" r="3.4" fill="#09090b" />

                            {/* Glowing Orange Halloween Eyes */}
                            <circle cx="-1.1" cy="-5.4" r="0.75" fill="#f97316" />
                            <circle cx="1.1" cy="-5.4" r="0.75" fill="#f97316" />
                            <circle cx="-1.1" cy="-5.4" r="0.3" fill="#ffffff" />
                            <circle cx="1.1" cy="-5.4" r="0.3" fill="#ffffff" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* BAT FLIGHT ANIMATIONS (Regular 1.0s bat + Fast 0.5s bat flock) */}
            {bats.map(bat => (
                <div
                    key={bat.id}
                    className={bat.isRtl ? 'bat-flying-rtl' : 'bat-flying-ltr'}
                    style={
                        {
                            '--bat-start-y': `${bat.startY}vh`,
                            '--bat-end-y': `${bat.endY}vh`,
                            '--bat-duration': `${bat.durationSec}s`,
                            '--bat-wing-speed': `${bat.wingSpeedSec}s`,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            transform: `scale(${bat.scale})`,
                        } as React.CSSProperties
                    }
                >
                    <svg
                        viewBox="0 0 100 60"
                        className="w-14 h-9 sm:w-20 sm:h-12 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] filter"
                    >
                        {/* Bat body */}
                        <ellipse cx="50" cy="32" rx="5.5" ry="11" fill="#09090b" />
                        {/* Bat head */}
                        <circle cx="50" cy="20" r="5" fill="#09090b" />
                        {/* Ears */}
                        <polygon points="46,18 43,10 48,16" fill="#09090b" />
                        <polygon points="54,18 57,10 52,16" fill="#09090b" />
                        {/* Glowing orange eyes */}
                        <circle cx="48" cy="20" r="1.1" fill="#f97316" />
                        <circle cx="52" cy="20" r="1.1" fill="#f97316" />
                        {/* Animated Left Wing */}
                        <g className="bat-wing-left">
                            <path
                                d="M 46 28 C 34 14, 14 14, 2 24 C 10 34, 24 37, 28 46 C 35 38, 41 35, 46 36 Z"
                                fill="#18181b"
                            />
                        </g>
                        {/* Animated Right Wing */}
                        <g className="bat-wing-right">
                            <path
                                d="M 54 28 C 66 14, 86 14, 98 24 C 90 34, 76 37, 72 46 C 65 38, 59 35, 54 36 Z"
                                fill="#18181b"
                            />
                        </g>
                    </svg>
                </div>
            ))}
        </div>
    );
});
