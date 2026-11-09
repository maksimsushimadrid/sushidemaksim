import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { X, User, ShoppingCart } from 'lucide-react';
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
import { MOBILE_NAV_CYCLE, getCycleIndexForPath } from '../constants/navigation';
import StreakerEasterEgg from './common/StreakerEasterEgg';

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
    const [isScrolling, setIsScrolling] = useState(false);
    const [isStreakerActive, setIsStreakerActive] = useState(false);

    const scrollStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shakeAfterScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isBouncingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        window.addEventListener('custom:openLogin', handleOpenLogin as EventListener);
        window.addEventListener('open:reservation', handleOpenReservation);
        document.addEventListener('open:reservation', handleOpenReservation);
        document.addEventListener(
            'custom:openRegistrationDiscount',
            handleOpenRegistrationDiscount
        );
        window.addEventListener('custom:openRegistrationDiscount', handleOpenRegistrationDiscount);
        return () => {
            document.removeEventListener('custom:openLogin', handleOpenLogin as EventListener);
            window.removeEventListener('custom:openLogin', handleOpenLogin as EventListener);
            window.removeEventListener('open:reservation', handleOpenReservation);
            document.removeEventListener('open:reservation', handleOpenReservation);
            document.removeEventListener(
                'custom:openRegistrationDiscount',
                handleOpenRegistrationDiscount
            );
            window.removeEventListener(
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
    const isExcludedCartRoute =
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/waiter') ||
        location.pathname.startsWith('/table') ||
        location.pathname.startsWith('/cart') ||
        location.pathname.startsWith('/track');
    const isTransparentHeaderPage = (isHome || isProfile) && !isTable;

    const navigate = useNavigate();
    const currentPath = location.pathname;
    const currentIndex = getCycleIndexForPath(currentPath);

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

    // Attention and scroll-aware animation for unauthenticated gift box
    useEffect(() => {
        if (isAuthenticated) return;

        const triggerGiftAttention = () => {
            setIsBouncing(true);
            if (isBouncingTimer.current) clearTimeout(isBouncingTimer.current);
            isBouncingTimer.current = setTimeout(() => {
                setIsBouncing(false);
            }, 850);
        };

        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (Math.abs(currentScrollY - lastScrollY) > 2) {
                setIsScrolling(true);
                setIsBouncing(false);
                if (shakeAfterScrollTimer.current) {
                    clearTimeout(shakeAfterScrollTimer.current);
                    shakeAfterScrollTimer.current = null;
                }
                lastScrollY = currentScrollY;
            }

            if (scrollStopTimer.current) {
                clearTimeout(scrollStopTimer.current);
            }

            scrollStopTimer.current = setTimeout(() => {
                setIsScrolling(false);
                // After 3s of no scrolling, box expands to normal size and shakes playfully
                shakeAfterScrollTimer.current = setTimeout(() => {
                    triggerGiftAttention();
                }, 120);
            }, 3000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // First gentle shake after 3.5s, then periodic wiggle every 12 seconds when idle
        const initialTimer = setTimeout(triggerGiftAttention, 3500);
        const interval = setInterval(() => {
            setIsScrolling(scrolling => {
                if (!scrolling) {
                    triggerGiftAttention();
                }
                return scrolling;
            });
        }, 12000);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
            if (shakeAfterScrollTimer.current) clearTimeout(shakeAfterScrollTimer.current);
            if (isBouncingTimer.current) clearTimeout(isBouncingTimer.current);
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [isAuthenticated]);

    const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    const goToNext = () => {
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

    const handleTouchStart = () => {
        isLongPress.current = false;
        longPressTimeout.current = setTimeout(() => {
            isLongPress.current = true;
            setShowMobileMenu(true);
        }, 550);
    };

    const handleTouchMove = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
    };

    const handleTouchEnd = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
    };

    const handleMenuButtonClick = () => {
        if (isLongPress.current) {
            isLongPress.current = false;
            return;
        }
        if (showMobileMenu) {
            setShowMobileMenu(false);
            return;
        }
        goToNext();
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
                                            type="button"
                                            onClick={handleMenuButtonClick}
                                            onTouchStart={handleTouchStart}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={handleTouchEnd}
                                            className={`md:hidden cursor-pointer flex items-center justify-center gap-2 px-3 h-[44px] w-[126px] rounded-full shrink-0 transition-colors duration-200 active:scale-95 select-none ${
                                                isScrolled || !isHome
                                                    ? 'bg-white text-zinc-900 border-2 border-orange-500/25 shadow-[0_4px_14px_-2px_rgba(242,101,34,0.18),0_2px_6px_rgba(0,0,0,0.06)] hover:border-orange-500/50'
                                                    : 'bg-zinc-900/80 text-white border-2 border-orange-500/35 backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4),0_0_12px_rgba(242,101,34,0.25)] hover:bg-zinc-900/90 hover:border-orange-500/60'
                                            }`}
                                            title={
                                                showMobileMenu
                                                    ? 'Cerrar menú'
                                                    : `Ir a ${nextPage.label} (o desliza la pantalla)`
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
                                                                initial={{
                                                                    opacity: 0,
                                                                    scale: 0.8,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    scale: 1,
                                                                }}
                                                                exit={{
                                                                    opacity: 0,
                                                                    scale: 0.8,
                                                                }}
                                                                transition={{
                                                                    duration: 0.16,
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
                                                                initial={{
                                                                    opacity: 0,
                                                                    y: 3,
                                                                }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{
                                                                    opacity: 0,
                                                                    y: -3,
                                                                }}
                                                                transition={{
                                                                    duration: 0.16,
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
                        className={`fixed top-1/2 right-3 md:right-4 -translate-y-1/2 z-40 select-none ${
                            isAuthenticated && user ? 'md:hidden' : ''
                        }`}
                    >
                        {/* Smooth size reduction during scroll with spring bounce-back */}
                        <motion.div
                            animate={{
                                scale: isScrolling ? 0.74 : 1,
                                opacity: isScrolling ? 0.85 : 1,
                            }}
                            transition={{
                                type: 'spring',
                                damping: 14,
                                stiffness: 240,
                            }}
                            className="origin-center flex flex-col items-end gap-3"
                        >
                            {/* Guest state: Floating Profile / Menu FAB Button above the gift box */}
                            {(!isAuthenticated || !user) && (
                                <button
                                    onClick={() => {
                                        triggerHaptic(20);
                                        setShowMobileMenu(true);
                                    }}
                                    className="relative w-[46px] h-[46px] rounded-full p-[2px] bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 shadow-[0_6px_16px_-3px_rgba(242,101,34,0.45),0_2px_6px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform group"
                                    title="Abrir menú y perfil"
                                    aria-label="Abrir menú y perfil"
                                >
                                    <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white shadow-inner text-gray-800">
                                        <User
                                            size={21}
                                            strokeWidth={2}
                                            className="text-gray-800 group-hover:text-orange-600 transition-colors"
                                        />
                                    </div>
                                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#121212]/92 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-lg border border-white/15 leading-none">
                                        PERFIL
                                    </span>
                                </button>
                            )}
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
                                    className="relative w-[50px] h-[50px] rounded-full p-[2px] bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 shadow-[0_8px_20px_-4px_rgba(242,101,34,0.55),0_2px_8px_rgba(0,0,0,0.25)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform group"
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
                                /* Guest state: 3D Luxury Black & Gold Gift Box with -10% badge matching user reference */
                                <button
                                    onClick={() => {
                                        triggerHaptic(25);
                                        setIsAvatarDistorting(true);
                                        setIsStreakerActive(true);
                                        setTimeout(() => {
                                            setIsAvatarDistorting(false);
                                        }, 400);
                                        // Wait for streaker to sprint across screen before opening modal
                                        setTimeout(() => {
                                            setIsRegistrationDiscountOpen(true);
                                        }, 1300);
                                    }}
                                    className="relative w-[52px] h-[52px] flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-200 group focus:outline-none"
                                    title="¡10% de descuento al registrarte! Toca para abrir tu regalo"
                                    aria-label="¡10% de descuento al registrarte! Toca para abrir tu regalo"
                                >
                                    {/* Ambient golden luxury glow behind the box */}
                                    <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/25 to-amber-300/10 blur-md pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                                    {/* 3D Black & Gold Gift Box from reference */}
                                    <motion.div
                                        animate={
                                            isAvatarDistorting
                                                ? {
                                                      scale: [1, 1.28, 0.92, 1],
                                                      rotate: [0, -12, 12, -6, 0],
                                                  }
                                                : isBouncing && !isScrolling
                                                  ? {
                                                        rotate: [0, -14, 14, -10, 10, -5, 5, 0],
                                                        y: [0, -7, 2, -5, 1, -2, 0],
                                                        scale: [1, 1.14, 1.14, 1.08, 1.08, 1.02, 1],
                                                    }
                                                  : { rotate: 0, y: 0, scale: 1 }
                                        }
                                        transition={
                                            isAvatarDistorting
                                                ? { duration: 0.35, ease: 'easeOut' }
                                                : isBouncing && !isScrolling
                                                  ? { duration: 0.85, ease: 'easeInOut' }
                                                  : { duration: 0.2 }
                                        }
                                        className="relative w-full h-full flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] group-hover:scale-108 transition-transform duration-300"
                                    >
                                        <picture>
                                            <source srcSet="/gift-box-3d.webp" type="image/webp" />
                                            <img
                                                src="/gift-box-3d.png"
                                                alt="Regalo 10% de descuento"
                                                className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_4px_10px_rgba(245,158,11,0.25)]"
                                                draggable={false}
                                                width={52}
                                                height={52}
                                            />
                                        </picture>
                                    </motion.div>

                                    {/* Subtitle luxury badge under gift box */}
                                    <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-amber-300 text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.6)] border border-amber-400/40 leading-none flex items-center justify-center group-hover:border-amber-300 group-hover:text-amber-200 transition-colors">
                                        DESCUENTO 10%
                                    </span>
                                </button>
                            )}

                            {/* 3. Floating Cart Button: placed directly and safely UNDER the Gift Box in the same flex column */}
                            {itemCount > 0 && !isExcludedCartRoute && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="pt-2"
                                >
                                    <Link
                                        to="/cart"
                                        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-3 py-1.5 rounded-xl shadow-[0_6px_18px_-3px_rgba(242,101,34,0.45)] no-underline active:scale-95 transition-all border border-white/20 backdrop-blur-md whitespace-nowrap"
                                    >
                                        <div className="relative">
                                            <ShoppingCart size={16} strokeWidth={1.5} />
                                            <span className="absolute -top-1 -right-1 bg-black text-white text-[8.5px] font-black min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-sm border border-white/20">
                                                {itemCount}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-start leading-none pr-0.5">
                                            <span className="text-[7.5px] font-black uppercase tracking-wider opacity-85 mb-0.5">
                                                Tu Cesta
                                            </span>
                                            <span className="text-xs font-black">
                                                {total.toFixed(2).replace('.', ',')} €
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Streaker Easter Egg Running Across Screen */}
            <StreakerEasterEgg
                isActive={isStreakerActive}
                onComplete={() => setIsStreakerActive(false)}
            />

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
