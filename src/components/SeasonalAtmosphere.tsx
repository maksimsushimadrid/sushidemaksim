import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../hooks/queries/useSettings';

interface BatInstance {
    id: number;
    startY: number;
    endY: number;
    isRtl: boolean;
    durationSec: number;
    scale: number;
    wingSpeedSec: number;
}

interface SnowflakeInstance {
    id: number;
    x: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
    swayDuration: number;
}

export const SeasonalAtmosphere = memo(function SeasonalAtmosphere() {
    const location = useLocation();
    const { data: settings } = useSettings();

    // Exclude administrative, waiter, table and track views
    const isExcluded =
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/waiter') ||
        location.pathname.startsWith('/table') ||
        location.pathname.startsWith('/track');

    // Resolve current active seasonal theme
    const themeSetting = settings?.holidayTheme || 'auto';
    const animationsEnabled = Boolean(settings?.holidayAnimationsEnabled);
    const wallpaperUntil = settings?.holidayWallpaperUntil || '2026-11-01';

    // Compute effective theme (evaluating date for 'auto' mode)
    const [effectiveTheme, setEffectiveTheme] = useState<
        'none' | 'halloween' | 'halloween_wallpaper' | 'new_year' | 'christmas'
    >('halloween_wallpaper');

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        if (themeSetting === 'auto') {
            // Until November 1st: Halloween theme
            if (todayStr <= wallpaperUntil) {
                setEffectiveTheme(animationsEnabled ? 'halloween' : 'halloween_wallpaper');
            } else if (todayStr >= '2026-12-01' || todayStr <= '2027-01-15') {
                setEffectiveTheme('new_year');
            } else {
                setEffectiveTheme('none');
            }
        } else {
            setEffectiveTheme(themeSetting as any);
        }
    }, [themeSetting, animationsEnabled, wallpaperUntil]);

    // Apply active wallpaper to CSS variable on document root
    useEffect(() => {
        const isHalloween =
            effectiveTheme === 'halloween' || effectiveTheme === 'halloween_wallpaper';

        if (isHalloween) {
            document.documentElement.style.setProperty(
                '--site-wallpaper',
                "url('/sushi-pattern-halloween.webp')"
            );
            document.documentElement.style.setProperty('--site-wallpaper-opacity', '0.06');
        } else {
            // Standard / default clean sushi pattern ("как раньше")
            document.documentElement.style.setProperty(
                '--site-wallpaper',
                "url('/sushi-pattern.webp')"
            );
            document.documentElement.style.setProperty('--site-wallpaper-opacity', '0.055');
        }
    }, [effectiveTheme]);

    // Accessibility check: user preference for reduced motion
    const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- HALLOWEEN ANIMATIONS LOGIC (Spider & Bats) ---
    const [bats, setBats] = useState<BatInstance[]>([]);
    const [scrollDescend, setScrollDescend] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isSpiderScared, setIsSpiderScared] = useState(false);
    const batIdCounterRef = useRef(0);
    const isMountedRef = useRef(true);
    const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
    const spiderScaredTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollStopTimerRef = useRef<NodeJS.Timeout | null>(null);

    const scareSpider = useCallback(() => {
        setIsSpiderScared(true);
        if (spiderScaredTimerRef.current) clearTimeout(spiderScaredTimerRef.current);
        spiderScaredTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setIsSpiderScared(false);
            }
        }, 2400);
    }, []);

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

    useEffect(() => {
        isMountedRef.current = true;
        const currentTimers = timeoutsRef.current;
        return () => {
            isMountedRef.current = false;
            currentTimers.forEach(t => clearTimeout(t));
            currentTimers.clear();
        };
    }, []);

    useEffect(() => {
        if (isExcluded) return;

        let rafId: number | null = null;
        let lastScrollY = typeof window !== 'undefined' ? window.scrollY || 0 : 0;

        const handleScroll = () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const currentY = window.scrollY || 0;
                // Descend proportionally with scroll, smoothly maxing out at 120px
                const descend = Math.min(Math.round(currentY * 0.28), 120);
                setScrollDescend(descend);

                if (Math.abs(currentY - lastScrollY) > 2) {
                    setIsScrolling(true);
                    if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
                    scrollStopTimerRef.current = setTimeout(() => {
                        if (isMountedRef.current) {
                            setIsScrolling(false);
                        }
                    }, 180);
                }
                lastScrollY = currentY;
            });
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
            if (spiderScaredTimerRef.current) clearTimeout(spiderScaredTimerRef.current);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isExcluded]);

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

            safeSetTimeout(
                () => {
                    setBats(prev => prev.filter(b => b.id !== id));
                },
                config.durationSec * 1000 + 100
            );
        },
        [prefersReducedMotion, safeSetTimeout]
    );

    // Regular bat flight interval
    useEffect(() => {
        if (
            isExcluded ||
            prefersReducedMotion ||
            effectiveTheme !== 'halloween' ||
            !animationsEnabled
        )
            return;

        const launchRegularBat = () => {
            spawnBat({
                durationSec: 1.0,
                scale: 1.0,
                wingSpeedSec: 0.1,
            });
        };

        const initialTimer = safeSetTimeout(launchRegularBat, 3000);
        const intervalTimer = setInterval(launchRegularBat, 20000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(intervalTimer);
        };
    }, [
        isExcluded,
        prefersReducedMotion,
        effectiveTheme,
        animationsEnabled,
        safeSetTimeout,
        spawnBat,
    ]);

    // Fast bat swoops interval
    useEffect(() => {
        if (
            isExcluded ||
            prefersReducedMotion ||
            effectiveTheme !== 'halloween' ||
            !animationsEnabled
        )
            return;

        const scheduleNextFastBat = (delayMs: number) => {
            safeSetTimeout(() => {
                const baseRtl = Math.random() > 0.5;
                const baseStart = 15 + Math.random() * 40;
                const baseEnd = 15 + Math.random() * 40;

                spawnBat({
                    durationSec: 0.5,
                    scale: 0.8,
                    wingSpeedSec: 0.05,
                    startY: baseStart,
                    endY: baseEnd,
                    isRtl: baseRtl,
                });

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

                const nextDelay = 30000 + Math.random() * 30000;
                scheduleNextFastBat(nextDelay);
            }, delayMs);
        };

        scheduleNextFastBat(7000);
    }, [
        isExcluded,
        prefersReducedMotion,
        effectiveTheme,
        animationsEnabled,
        safeSetTimeout,
        spawnBat,
    ]);

    // --- NEW YEAR & CHRISTMAS SNOWFALL EFFECT ---
    const [snowflakes] = useState<SnowflakeInstance[]>(() => {
        return Array.from({ length: 22 }, (_, i) => ({
            id: i,
            x: Math.round(Math.random() * 100),
            size: Math.round(4 + Math.random() * 6),
            duration: Math.round(8 + Math.random() * 8),
            delay: Math.round(Math.random() * 6 * 10) / 10,
            opacity: Math.round((0.35 + Math.random() * 0.45) * 100) / 100,
            swayDuration: Math.round((3 + Math.random() * 2) * 10) / 10,
        }));
    });

    if (isExcluded) return null;

    // If theme is "none" or "halloween_wallpaper", do not render animations
    if (effectiveTheme === 'none' || effectiveTheme === 'halloween_wallpaper') {
        return null;
    }

    // For Halloween, only render bats/spider if animations are enabled
    if (effectiveTheme === 'halloween' && !animationsEnabled) {
        return null;
    }

    return (
        <>
            {/* TOP-LEFT SPIDERWEB & INTERACTIVE DESCENDING SPIDER (High z-index to appear on top everywhere) */}
            {effectiveTheme === 'halloween' && (
                <>
                    <style>{`
                        @keyframes bat-swoop-ltr {
                            0% {
                                transform: translate3d(-140px, var(--bat-start-y), 0) rotate(12deg) scale(0.85);
                                opacity: 0;
                            }
                            10% { opacity: 1; }
                            50% {
                                transform: translate3d(50vw, calc((var(--bat-start-y) + var(--bat-end-y)) / 2 + 60px), 0) rotate(-6deg) scale(1.1);
                            }
                            90% { opacity: 1; }
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
                            10% { opacity: 1; }
                            50% {
                                transform: translate3d(50vw, calc((var(--bat-start-y) + var(--bat-end-y)) / 2 + 60px), 0) scaleX(-1) rotate(-6deg) scale(1.1);
                            }
                            90% { opacity: 1; }
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

                        @keyframes spider-sway {
                            0%, 100% { transform: rotate(-3.5deg); }
                            50% { transform: rotate(3.5deg); }
                        }
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

                    <div
                        aria-hidden="true"
                        className="fixed top-0 left-0 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none z-[550] overflow-visible select-none"
                    >
                        <svg
                            viewBox="0 0 120 120"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute top-0 left-0 w-full h-full filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] opacity-85 pointer-events-none"
                        >
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

                            <path
                                d="M 32 0 Q 30 6 30 10 Q 26 16 25 20 Q 22 22 20 25 Q 16 26 10 30 Q 6 30 0 32"
                                stroke="rgba(255,255,255,0.5)"
                                strokeWidth="0.75"
                                fill="none"
                            />
                            <path
                                d="M 60 0 Q 56 10 55 18 Q 49 28 45 37 Q 40 40 37 45 Q 28 49 18 55 Q 10 56 0 60"
                                stroke="rgba(255,255,255,0.5)"
                                strokeWidth="0.75"
                                fill="none"
                            />
                            <path
                                d="M 88 0 Q 82 14 80 26 Q 72 41 66 54 Q 59 59 54 66 Q 41 72 26 80 Q 14 82 0 88"
                                stroke="rgba(255,255,255,0.5)"
                                strokeWidth="0.75"
                                fill="none"
                            />
                            <path
                                d="M 114 0 Q 106 18 104 34 Q 93 54 85 70 Q 77 77 70 85 Q 54 93 34 104 Q 18 106 0 114"
                                stroke="rgba(255,255,255,0.4)"
                                strokeWidth="0.7"
                                fill="none"
                            />

                            <circle cx="25" cy="20" r="0.9" fill="white" opacity="0.8" />
                            <circle cx="45" cy="37" r="1.1" fill="white" opacity="0.8" />
                            <circle cx="66" cy="54" r="1.1" fill="white" opacity="0.8" />
                            <circle cx="37" cy="45" r="1.1" fill="white" opacity="0.8" />
                        </svg>

                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: '46px',
                                transformOrigin: 'top center',
                                transform: isSpiderScared
                                    ? 'translate3d(0, -260px, 0)'
                                    : 'translate3d(0, 0, 0)',
                                willChange: 'transform',
                                transition: isSpiderScared
                                    ? 'transform 0.22s cubic-bezier(0.1, 0.9, 0.2, 1)'
                                    : 'transform 0.85s cubic-bezier(0.2, 1, 0.35, 1)',
                            }}
                        >
                            <div
                                style={{
                                    transformOrigin: 'top center',
                                    animation: isSpiderScared
                                        ? 'none'
                                        : 'spider-sway 3.8s ease-in-out infinite',
                                }}
                            >
                                <div
                                    className="w-[1px] bg-white/70 mx-auto filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                                    style={{
                                        height: `${72 + scrollDescend}px`,
                                        transition: 'height 0.2s cubic-bezier(0.2, 0.8, 0.4, 1)',
                                    }}
                                />
                                <div
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Halloween Spider"
                                    onMouseEnter={() => {
                                        setIsSpiderScared(true);
                                        if (spiderScaredTimerRef.current)
                                            clearTimeout(spiderScaredTimerRef.current);
                                    }}
                                    onMouseLeave={() => {
                                        if (spiderScaredTimerRef.current)
                                            clearTimeout(spiderScaredTimerRef.current);
                                        spiderScaredTimerRef.current = setTimeout(() => {
                                            if (isMountedRef.current) {
                                                setIsSpiderScared(false);
                                            }
                                        }, 900);
                                    }}
                                    onTouchStart={e => {
                                        e.stopPropagation();
                                        scareSpider();
                                    }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        scareSpider();
                                    }}
                                    className="pointer-events-auto cursor-pointer relative -mt-3 flex items-center justify-center p-2 select-none -ml-3.5 w-10 h-10 sm:w-12 sm:h-12"
                                >
                                    <svg
                                        viewBox="-18 -12 36 34"
                                        width="28"
                                        height="28"
                                        className="overflow-visible filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)] pointer-events-none transition-transform duration-200 hover:scale-110 active:scale-95"
                                    >
                                        <g
                                            className={
                                                isSpiderScared || isScrolling
                                                    ? 'spider-scurrying-left'
                                                    : ''
                                            }
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
                                        <g
                                            className={
                                                isSpiderScared || isScrolling
                                                    ? 'spider-scurrying-right'
                                                    : ''
                                            }
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
                                        <ellipse
                                            cx="0"
                                            cy="3"
                                            rx="5.2"
                                            ry="6.8"
                                            fill="#09090b"
                                            stroke="#f97316"
                                            strokeWidth="0.5"
                                        />
                                        <polygon points="0, 0.5 -2, 3 2, 3" fill="#f97316" />
                                        <polygon points="-2, 3 2, 3 0, 5.5" fill="#f97316" />
                                        <circle cx="0" cy="-4.8" r="3.4" fill="#09090b" />
                                        <circle cx="-1.1" cy="-5.4" r="0.75" fill="#f97316" />
                                        <circle cx="1.1" cy="-5.4" r="0.75" fill="#f97316" />
                                        <circle cx="-1.1" cy="-5.4" r="0.3" fill="#ffffff" />
                                        <circle cx="1.1" cy="-5.4" r="0.3" fill="#ffffff" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* BACKGROUND SEASONAL EFFECTS (Bats, falling leaves, etc. at z-[45]) */}
            <div
                aria-hidden="true"
                className="fixed inset-0 pointer-events-none z-[45] overflow-hidden select-none"
            >
                {/* FLYING BATS */}
                {effectiveTheme === 'halloween' &&
                    bats.map(bat => (
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
                                <ellipse cx="50" cy="32" rx="5.5" ry="11" fill="#09090b" />
                                <circle cx="50" cy="20" r="5" fill="#09090b" />
                                <polygon points="46,18 43,10 48,16" fill="#09090b" />
                                <polygon points="54,18 57,10 52,16" fill="#09090b" />
                                <circle cx="48" cy="20" r="1.1" fill="#f97316" />
                                <circle cx="52" cy="20" r="1.1" fill="#f97316" />
                                <g className="bat-wing-left">
                                    <path
                                        d="M 46 28 C 34 14, 14 14, 2 24 C 10 34, 24 37, 28 46 C 35 38, 41 35, 46 36 Z"
                                        fill="#18181b"
                                    />
                                </g>
                                <g className="bat-wing-right">
                                    <path
                                        d="M 54 28 C 66 14, 86 14, 98 24 C 90 34, 76 37, 72 46 C 65 38, 59 35, 54 36 Z"
                                        fill="#18181b"
                                    />
                                </g>
                            </svg>
                        </div>
                    ))}

                {/* NEW YEAR & CHRISTMAS SNOWFALL */}
                {(effectiveTheme === 'new_year' || effectiveTheme === 'christmas') && (
                    <>
                        <style>{`
                        @keyframes snowflake-fall {
                            0% {
                                transform: translate3d(0, -20px, 0);
                                opacity: 0;
                            }
                            10% { opacity: var(--snow-opacity, 0.7); }
                            90% { opacity: var(--snow-opacity, 0.7); }
                            100% {
                                transform: translate3d(var(--snow-drift, 40px), 105vh, 0);
                                opacity: 0;
                            }
                        }
                        @keyframes snowflake-sway {
                            0%, 100% { transform: translateX(-15px); }
                            50% { transform: translateX(15px); }
                        }
                        .snowflake-particle {
                            animation: snowflake-fall var(--snow-duration, 10s) linear infinite;
                            animation-delay: var(--snow-delay, 0s);
                            will-change: transform;
                        }
                        .snowflake-inner {
                            animation: snowflake-sway var(--snow-sway, 4s) ease-in-out infinite;
                        }
                        @media (prefers-reduced-motion: reduce) {
                            .snowflake-particle,
                            .snowflake-inner {
                                animation: none !important;
                                display: none;
                            }
                        }
                    `}</style>
                        {snowflakes.map(flake => (
                            <div
                                key={flake.id}
                                className="snowflake-particle absolute top-0"
                                style={
                                    {
                                        left: `${flake.x}vw`,
                                        '--snow-duration': `${flake.duration}s`,
                                        '--snow-delay': `${flake.delay}s`,
                                        '--snow-opacity': flake.opacity,
                                        '--snow-drift': `${(flake.id % 2 === 0 ? 1 : -1) * (20 + (flake.id % 5) * 10)}px`,
                                    } as React.CSSProperties
                                }
                            >
                                <div
                                    className="snowflake-inner"
                                    style={
                                        {
                                            '--snow-sway': `${flake.swayDuration}s`,
                                        } as React.CSSProperties
                                    }
                                >
                                    <div
                                        className="rounded-full bg-white blur-[0.4px] shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                                        style={{
                                            width: `${flake.size}px`,
                                            height: `${flake.size}px`,
                                            opacity: flake.opacity,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </>
    );
});
