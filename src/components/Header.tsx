import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import StoreStatusBanner from './StoreStatusBanner';
const LoginModal = lazy(() => import('./LoginModal'));
import { useScrollLock } from '../hooks/useScrollLock';
const ReservationModal = lazy(() => import('./reservations/ReservationModal'));
const RegistrationDiscountModal = lazy(() => import('./RegistrationDiscountModal'));

// Imported Header Subcomponents
import HeaderLogo from './header/HeaderLogo';
import DesktopNav from './header/DesktopNav';
import CartButton from './header/CartButton';
import UserActions from './header/UserActions';
import { useAuth } from '../hooks/useAuth';
import SafeImage from './common/SafeImage';
import { getSharpAvatar, getDefaultAvatar } from '../utils/avatar';
import MobileMenu from './header/MobileMenu';
import { triggerHaptic } from '../utils/haptics';
import { JapaneseNavIcon } from './header/JapaneseNavIcon';

const MOBILE_NAV_CYCLE = [
    { path: '/', label: 'Inicio' },
    { path: '/menu', label: 'Carta' },
    { path: '/promo', label: 'Promo' },
    { path: '/tablon', label: 'Tablón' },
    { path: '/reservar', label: 'Reserva' },
    { path: '/contacts', label: 'Contacto' },
];

export default function Header() {
    const { itemCount, total, isLoading: cartLoading } = useCart();
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    // Global Header States
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginModalMode, setLoginModalMode] = useState<
        'login' | 'register' | 'forgot' | 'verify-sent' | 'reset-password'
    >('login');
    const [isRegistrationDiscountOpen, setIsRegistrationDiscountOpen] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [isAvatarDistorting, setIsAvatarDistorting] = useState(false);
    const [isBouncing, setIsBouncing] = useState(false);

    const headerRef = useRef<HTMLElement>(null);

    // Track scroll for dynamic header styling and measure height
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 20;
            setIsScrolled(prev => {
                if (prev === scrolled) return prev;
                return scrolled;
            });
        };

        const updateHeight = () => {
            if (headerRef.current) {
                const height = headerRef.current.getBoundingClientRect().height;
                document.documentElement.style.setProperty('--header-height', `${height}px`);
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            updateHeight();
        });

        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        updateHeight();
        const timeoutId = setTimeout(updateHeight, 500);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
            clearTimeout(timeoutId);
        };
    }, []);

    useScrollLock(
        showMobileMenu || isLoginModalOpen || isReservationModalOpen || isRegistrationDiscountOpen
    );

    // Close mobile menu on route change
    useEffect(() => {
        setShowMobileMenu(false);
    }, [location.pathname]);

    // Handle global modal events
    useEffect(() => {
        const handleOpenLogin = (e: any) => {
            if (e.detail?.mode) setLoginModalMode(e.detail.mode);
            else setLoginModalMode('login');
            setIsLoginModalOpen(true);
        };
        const handleOpenReservation = () => {
            setIsReservationModalOpen(true);
        };
        const handleOpenRegistrationDiscount = () => {
            setIsRegistrationDiscountOpen(true);
        };
        document.addEventListener('custom:openLogin', handleOpenLogin as EventListener);
        window.addEventListener('open:reservation', handleOpenReservation);
        document.addEventListener(
            'custom:openRegistrationDiscount',
            handleOpenRegistrationDiscount
        );
        return () => {
            document.removeEventListener('custom:openLogin', handleOpenLogin as EventListener);
            window.removeEventListener('open:reservation', handleOpenReservation);
            document.removeEventListener(
                'custom:openRegistrationDiscount',
                handleOpenRegistrationDiscount
            );
        };
    }, []);

    // Page state identifiers
    const isHome = location.pathname === '/';
    const isProfile = location.pathname === '/profile';
    const isMenu = location.pathname === '/menu' || location.pathname.startsWith('/menu/');
    const isTable = location.pathname === '/table';
    const isTransparentHeaderPage = (isHome || isProfile) && !isTable;

    const navigate = useNavigate();
    const currentPath = location.pathname;
    const currentIndex = MOBILE_NAV_CYCLE.findIndex(p =>
        p.path === '/' ? currentPath === '/' : currentPath.startsWith(p.path)
    );

    const currentPage = currentIndex !== -1 ? MOBILE_NAV_CYCLE[currentIndex] : null;
    const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % MOBILE_NAV_CYCLE.length : 0;
    const nextPage = MOBILE_NAV_CYCLE[nextIndex];

    const currentLabel = currentPage
        ? currentPage.label
        : currentPath.includes('cart')
          ? 'Carrito'
          : currentPath.includes('profile')
            ? 'Perfil'
            : 'Página';

    const [showTapHint, setShowTapHint] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !localStorage.getItem('sushi_cycle_hint_seen_v2');
    });

    useEffect(() => {
        if (!showTapHint) return;
        const timer = setTimeout(() => {
            setShowTapHint(false);
            localStorage.setItem('sushi_cycle_hint_seen_v2', 'true');
        }, 8000);
        return () => clearTimeout(timer);
    }, [showTapHint]);

    // Periodic double-bounce for unauthenticated users every minute
    useEffect(() => {
        if (isAuthenticated) return;

        const triggerDoubleBounce = () => {
            setIsBouncing(true);
            setTimeout(() => {
                setIsBouncing(false);
            }, 900);
        };

        // First gentle nudge after 4s, then every minute (60s)
        const initialTimer = setTimeout(triggerDoubleBounce, 4000);
        const interval = setInterval(triggerDoubleBounce, 60000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [isAuthenticated]);

    const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    const handleTouchStart = () => {
        isLongPress.current = false;
        longPressTimeout.current = setTimeout(() => {
            isLongPress.current = true;
            setShowMobileMenu(true);
        }, 550);
    };

    const handleTouchEnd = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
    };

    const handleMenuButtonClick = () => {
        if (showTapHint) {
            setShowTapHint(false);
            localStorage.setItem('sushi_cycle_hint_seen_v2', 'true');
        }
        if (isLongPress.current) {
            isLongPress.current = false;
            return;
        }
        if (showMobileMenu) {
            setShowMobileMenu(false);
            return;
        }
        triggerHaptic(15);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        if ((window as any).lenis) {
            try {
                (window as any).lenis.scrollTo(0, { immediate: true });
            } catch (_) {
                // ignore
            }
        }
        navigate(nextPage.path);
        requestAnimationFrame(() => {
            window.scrollTo(0, 0);
        });
    };

    return (
        <>
            <header
                ref={headerRef}
                className={`fixed top-0 inset-x-0 z-header transition-[background-color,border-color] duration-300
                ${
                    isTable
                        ? 'bg-[#0A0A0A] border-b border-white/5'
                        : isScrolled
                          ? `bg-[#FBF7F0] ${
                                isMenu
                                    ? 'md:shadow-sm md:border-b md:border-gray-200 border-b-0 shadow-none'
                                    : 'shadow-sm border-b border-gray-200'
                            }`
                          : isTransparentHeaderPage
                            ? 'bg-transparent border-b border-transparent'
                            : `bg-[#FBF7F0] ${
                                  isMenu
                                      ? 'md:border-b md:border-gray-100 border-b-0 shadow-none'
                                      : 'border-b border-gray-100'
                              }`
                }
            `}
            >
                <StoreStatusBanner />
                <div className="max-w-[1440px] mx-auto px-3 md:px-6">
                    <div
                        className={`flex items-center justify-between h-16 md:h-20 gap-4 ${isTable ? 'flex-row-reverse' : ''}`}
                    >
                        <HeaderLogo
                            isTable={isTable}
                            isScrolled={isScrolled}
                            isTransparentHeaderPage={isTransparentHeaderPage}
                            setShowMobileMenu={setShowMobileMenu}
                        />

                        {!isTable && (
                            <DesktopNav
                                isScrolled={isScrolled}
                                isTransparentHeaderPage={isTransparentHeaderPage}
                            />
                        )}

                        {/* Right side Area */}
                        <div
                            className={`flex-1 flex items-center gap-3 h-full md:min-w-[200px] ${isTable ? 'justify-start' : 'justify-end'}`}
                        >
                            <UserActions
                                isTable={isTable}
                                setLoginModalMode={setLoginModalMode}
                                setIsLoginModalOpen={setIsLoginModalOpen}
                            />

                            {!isTable && (
                                <>
                                    <CartButton
                                        itemCount={itemCount}
                                        total={total}
                                        cartLoading={cartLoading}
                                    />

                                    <div className="relative shrink-0">
                                        <button
                                            onClick={handleMenuButtonClick}
                                            onTouchStart={handleTouchStart}
                                            onTouchEnd={handleTouchEnd}
                                            onMouseDown={handleTouchStart}
                                            onMouseUp={handleTouchEnd}
                                            className={`md:hidden cursor-pointer flex items-center justify-center gap-2 px-3 h-[44px] w-[126px] rounded-full shrink-0 transition-all duration-200 active:scale-95 select-none ${
                                                isScrolled || !isHome
                                                    ? 'bg-white text-zinc-900 border-2 border-orange-500/25 shadow-[0_4px_14px_-2px_rgba(242,101,34,0.18),0_2px_6px_rgba(0,0,0,0.06)] hover:border-orange-500/50'
                                                    : 'bg-zinc-900/80 text-white border-2 border-orange-500/35 backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4),0_0_12px_rgba(242,101,34,0.25)] hover:bg-zinc-900/90 hover:border-orange-500/60'
                                            }`}
                                            title={
                                                showMobileMenu
                                                    ? 'Cerrar menú'
                                                    : `Siguiente: ${nextPage.label}`
                                            }
                                            aria-label="Navegación del menú"
                                        >
                                            {showMobileMenu ? (
                                                <div className="flex items-center justify-center gap-1.5 w-full">
                                                    <X
                                                        size={16}
                                                        strokeWidth={2.5}
                                                        className="text-orange-500"
                                                    />
                                                    <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                                                        Cerrar
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <AnimatePresence
                                                            mode="popLayout"
                                                            initial={false}
                                                        >
                                                            <motion.div
                                                                key={currentLabel}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.8 }}
                                                                transition={{
                                                                    duration: 0.14,
                                                                    ease: 'easeOut',
                                                                }}
                                                                className={
                                                                    isScrolled || !isHome
                                                                        ? 'text-orange-600'
                                                                        : 'text-orange-400 drop-shadow-sm'
                                                                }
                                                            >
                                                                <JapaneseNavIcon
                                                                    pageKey={currentLabel}
                                                                    isScrolled={isScrolled}
                                                                    isHome={isHome}
                                                                    size={20}
                                                                />
                                                            </motion.div>
                                                        </AnimatePresence>
                                                    </div>
                                                    <div
                                                        className={`w-px h-4 shrink-0 ${
                                                            isScrolled || !isHome
                                                                ? 'bg-zinc-200'
                                                                : 'bg-white/20'
                                                        }`}
                                                    />
                                                    <div className="w-[66px] flex items-center justify-center overflow-hidden shrink-0">
                                                        <AnimatePresence
                                                            mode="popLayout"
                                                            initial={false}
                                                        >
                                                            <motion.span
                                                                key={currentLabel}
                                                                initial={{ opacity: 0, y: 3 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -3 }}
                                                                transition={{
                                                                    duration: 0.14,
                                                                    ease: 'easeOut',
                                                                }}
                                                                className={`block text-[10px] font-black uppercase tracking-wide text-center w-full leading-none whitespace-nowrap ${
                                                                    isScrolled || !isHome
                                                                        ? 'text-orange-600'
                                                                        : 'text-orange-400 drop-shadow-sm'
                                                                }`}
                                                            >
                                                                {currentLabel}
                                                            </motion.span>
                                                        </AnimatePresence>
                                                    </div>
                                                </>
                                            )}
                                        </button>

                                        {/* Tooltip hint on mobile */}
                                        <AnimatePresence>
                                            {showTapHint && !showMobileMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4, scale: 0.94 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -4, scale: 0.94 }}
                                                    transition={{ duration: 0.18 }}
                                                    className="absolute top-[calc(100%+8px)] right-0 bg-[#161616]/95 backdrop-blur-xl text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-white/15 flex items-center gap-1.5 whitespace-nowrap z-50 pointer-events-none"
                                                >
                                                    {/* Triangle notch pointing to center of 126px button */}
                                                    <div className="absolute -top-1 right-[59px] w-2 h-2 bg-[#161616]/95 rotate-45 border-t border-l border-white/15" />
                                                    <Compass
                                                        size={12}
                                                        className="text-orange-400"
                                                    />
                                                    <span>Toca para rotar</span>
                                                    <span className="text-orange-400 font-black bg-orange-500/20 px-1 py-0.5 rounded text-[9px] border border-orange-400/25">
                                                        tap tap
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <MobileMenu showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
            </header>

            {/* Floating User Photo / Profile FAB Button (Ergonomic Right-Thumb Zone) */}
            {!isTable && !showMobileMenu && (
                <AnimatePresence>
                    <motion.div
                        initial={{ x: 60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 60, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        className={`fixed top-[58%] right-3 md:right-5 -translate-y-1/2 z-fixed select-none ${
                            isAuthenticated && user ? 'md:hidden' : ''
                        }`}
                    >
                        {/* Periodic double-bounce animation for unauthenticated question mark */}
                        <motion.div
                            animate={
                                isBouncing
                                    ? {
                                          y: [0, -18, 2, -11, 0],
                                          scaleY: [1, 1.14, 0.93, 1.07, 1],
                                          scaleX: [1, 0.93, 1.07, 0.96, 1],
                                      }
                                    : { y: 0, scaleY: 1, scaleX: 1 }
                            }
                            transition={{
                                duration: 0.85,
                                times: [0, 0.28, 0.52, 0.76, 1],
                                ease: 'easeInOut',
                            }}
                        >
                            {isAuthenticated && user ? (
                                <button
                                    onClick={() => {
                                        triggerHaptic(20);
                                        setIsAvatarDistorting(true);
                                        setTimeout(() => {
                                            setIsAvatarDistorting(false);
                                            setShowMobileMenu(true);
                                        }, 280);
                                    }}
                                    className="relative w-[62px] h-[62px] rounded-full p-[2px] bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 shadow-[0_10px_28px_-4px_rgba(242,101,34,0.55),0_3px_10px_rgba(0,0,0,0.25)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform group"
                                    title="Abrir perfil y menú"
                                    aria-label="Abrir perfil y menú"
                                >
                                    {/* Inner circle container with 3D sphere bulge distortion */}
                                    <motion.div
                                        animate={
                                            isAvatarDistorting
                                                ? {
                                                      scale: [1, 1.25, 0.93, 1],
                                                      boxShadow: [
                                                          'inset 0 0 0 rgba(0,0,0,0)',
                                                          'inset -5px -7px 18px rgba(0,0,0,0.65), inset 5px 7px 16px rgba(255,255,255,0.7)',
                                                          'inset 0 0 0 rgba(0,0,0,0)',
                                                      ],
                                                  }
                                                : {}
                                        }
                                        transition={{ duration: 0.32, ease: 'easeOut' }}
                                        className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white shadow-inner"
                                    >
                                        <motion.div
                                            animate={
                                                isAvatarDistorting
                                                    ? {
                                                          scale: [1, 1.48, 0.96, 1],
                                                      }
                                                    : { scale: 1 }
                                            }
                                            transition={{
                                                duration: 0.32,
                                                ease: [0.34, 1.56, 0.64, 1],
                                            }}
                                            className="w-full h-full flex items-center justify-center"
                                        >
                                            {user.avatar && user.avatar.startsWith('http') ? (
                                                <SafeImage
                                                    src={user.avatar}
                                                    getOptimizedUrl={getSharpAvatar}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover rounded-full pointer-events-none"
                                                    fallbackContent={
                                                        <span className="text-2xl select-none">
                                                            {getDefaultAvatar(user)}
                                                        </span>
                                                    }
                                                />
                                            ) : (
                                                <span className="text-2xl select-none">
                                                    {user.avatar || getDefaultAvatar(user)}
                                                </span>
                                            )}
                                        </motion.div>

                                        {/* 3D Spherical Fisheye Lens Sheen Overlay */}
                                        <motion.div
                                            animate={
                                                isAvatarDistorting
                                                    ? {
                                                          opacity: [0, 0.9, 0],
                                                          scale: [0.85, 1.12, 1],
                                                      }
                                                    : { opacity: 0 }
                                            }
                                            transition={{ duration: 0.32, ease: 'easeOut' }}
                                            className="absolute inset-0 rounded-full pointer-events-none"
                                            style={{
                                                background:
                                                    'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.3) 28%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.55) 100%)',
                                                boxShadow:
                                                    'inset -3px -5px 12px rgba(0,0,0,0.5), inset 3px 5px 12px rgba(255,255,255,0.6)',
                                            }}
                                        />
                                    </motion.div>

                                    {/* Subtitle label under floating avatar */}
                                    <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-[#121212]/92 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg border border-white/15 leading-none">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </button>
                            ) : (
                                /* Guest state: 3D Festive Gift Box with ribbon, bow and -10% badge */
                                <button
                                    onClick={() => {
                                        triggerHaptic(20);
                                        setIsAvatarDistorting(true);
                                        setTimeout(() => {
                                            setIsAvatarDistorting(false);
                                            setIsRegistrationDiscountOpen(true);
                                        }, 280);
                                    }}
                                    className="relative w-[60px] h-[60px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform group"
                                    title="¡10% de descuento al registrarte! Toca para abrir tu regalo"
                                    aria-label="¡10% de descuento al registrarte! Toca para abrir tu regalo"
                                >
                                    {/* 3D Bow sitting on top of the gift box */}
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md">
                                        <svg
                                            width="34"
                                            height="20"
                                            viewBox="0 0 34 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M17 12 C13 3, 2 3, 4 10 C 6 15, 14 13, 17 12 Z"
                                                fill="url(#header-bow-grad)"
                                                stroke="#FDE68A"
                                                strokeWidth="0.8"
                                            />
                                            <path
                                                d="M17 12 C21 3, 32 3, 30 10 C 28 15, 20 13, 17 12 Z"
                                                fill="url(#header-bow-grad)"
                                                stroke="#FDE68A"
                                                strokeWidth="0.8"
                                            />
                                            <ellipse
                                                cx="17"
                                                cy="12"
                                                rx="3.5"
                                                ry="3"
                                                fill="#F59E0B"
                                                stroke="#FEF3C7"
                                                strokeWidth="0.8"
                                            />
                                            <path
                                                d="M15 13 Q 12 18 10 19"
                                                stroke="#FBBF24"
                                                strokeWidth="2.2"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d="M19 13 Q 22 18 24 19"
                                                stroke="#FBBF24"
                                                strokeWidth="2.2"
                                                strokeLinecap="round"
                                            />
                                            <defs>
                                                <linearGradient
                                                    id="header-bow-grad"
                                                    x1="0"
                                                    y1="0"
                                                    x2="34"
                                                    y2="20"
                                                    gradientUnits="userSpaceOnUse"
                                                >
                                                    <stop stopColor="#FDE047" />
                                                    <stop offset="0.5" stopColor="#F59E0B" />
                                                    <stop offset="1" stopColor="#D97706" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>

                                    {/* Gift Box Container with 3D bulge animation on tap */}
                                    <motion.div
                                        animate={
                                            isAvatarDistorting
                                                ? {
                                                      scale: [1, 1.25, 0.93, 1],
                                                  }
                                                : {}
                                        }
                                        transition={{ duration: 0.32, ease: 'easeOut' }}
                                        className="relative w-full h-full rounded-[22px] bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 shadow-[0_12px_28px_-3px_rgba(242,101,34,0.65),0_4px_12px_rgba(0,0,0,0.3)] border-2 border-amber-300/80 overflow-hidden flex items-center justify-center"
                                    >
                                        {/* Box Lid highlight */}
                                        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white/40 to-transparent border-b border-white/20 pointer-events-none" />

                                        {/* Satin Ribbons crossing */}
                                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3.5 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-300 shadow-sm" />
                                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3.5 bg-gradient-to-b from-amber-300 via-yellow-100 to-amber-300 shadow-sm" />

                                        {/* Center Sparkle Badge */}
                                        <div className="relative z-10 w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 flex items-center justify-center shadow-md border border-white/60">
                                            <span className="text-[10px] font-black text-amber-900 tracking-tight leading-none">
                                                -10%
                                            </span>
                                        </div>

                                        {/* Glossy light reflection sheen */}
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/45 to-transparent pointer-events-none" />
                                    </motion.div>

                                    {/* Subtitle label under gift box */}
                                    <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-[#121212]/92 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg border border-white/15 leading-none">
                                        -10% DTO
                                    </span>
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Global Modals triggered from Header */}
            <Suspense fallback={null}>
                <RegistrationDiscountModal
                    isOpen={isRegistrationDiscountOpen}
                    onClose={() => setIsRegistrationDiscountOpen(false)}
                    onContinue={() => {
                        setIsRegistrationDiscountOpen(false);
                        setLoginModalMode('register');
                        setIsLoginModalOpen(true);
                    }}
                    onLogin={() => {
                        setIsRegistrationDiscountOpen(false);
                        setLoginModalMode('login');
                        setIsLoginModalOpen(true);
                    }}
                />

                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    initialMode={loginModalMode}
                />

                <ReservationModal
                    isOpen={isReservationModalOpen}
                    onClose={() => setIsReservationModalOpen(false)}
                />
            </Suspense>
        </>
    );
}
