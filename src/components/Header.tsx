import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import StoreStatusBanner from './StoreStatusBanner';
const LoginModal = lazy(() => import('./LoginModal'));
import { useScrollLock } from '../hooks/useScrollLock';
const ReservationModal = lazy(() => import('./reservations/ReservationModal'));

// Imported Header Subcomponents
import HeaderLogo from './header/HeaderLogo';
import DesktopNav from './header/DesktopNav';
import CartButton from './header/CartButton';
import UserActions from './header/UserActions';
import { useAuth } from '../hooks/useAuth';
import SafeImage from './common/SafeImage';
import { getSharpAvatar } from '../utils/avatar';
import MobileMenu from './header/MobileMenu';

export default function Header() {
    const { itemCount, total, isLoading: cartLoading } = useCart();
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    // Global Header States
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginModalMode, setLoginModalMode] = useState<
        'login' | 'register' | 'forgot' | 'verify-sent' | 'reset-password'
    >('login');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

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

    useScrollLock(showMobileMenu || isLoginModalOpen || isReservationModalOpen);

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
        document.addEventListener('custom:openLogin', handleOpenLogin as EventListener);
        window.addEventListener('open:reservation', handleOpenReservation);
        return () => {
            document.removeEventListener('custom:openLogin', handleOpenLogin as EventListener);
            window.removeEventListener('open:reservation', handleOpenReservation);
        };
    }, []);

    // Page state identifiers
    const isHome = location.pathname === '/';
    const isProfile = location.pathname === '/profile';
    const isMenu = location.pathname === '/menu' || location.pathname.startsWith('/menu/');
    const isTable = location.pathname === '/table';
    const isTransparentHeaderPage = (isHome || isProfile) && !isTable;

    const initials = user
        ? user.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '';

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

                                    <button
                                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                                        className={`md:hidden border-none p-1 rounded-xl cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] transition-all ${
                                            isScrolled || !isHome
                                                ? 'bg-gray-50 text-gray-800 shadow-sm hover:shadow-md'
                                                : 'bg-white/15 text-white border border-white/20 backdrop-blur-md shadow-lg'
                                        }`}
                                    >
                                        {showMobileMenu ? (
                                            <X size={22} strokeWidth={1.5} />
                                        ) : isAuthenticated && user ? (
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm overflow-hidden shrink-0
                                                    ${user.avatar?.startsWith('http') ? 'bg-white' : user.avatar ? 'bg-gray-100 text-[14px]' : 'bg-orange-600'}`}
                                            >
                                                {user.avatar ? (
                                                    user.avatar.startsWith('http') ? (
                                                        <SafeImage
                                                            src={user.avatar}
                                                            getOptimizedUrl={getSharpAvatar}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                            fallbackContent={
                                                                <span className="select-none text-[16px] text-gray-900">
                                                                    {initials}
                                                                </span>
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="select-none text-[20px]">
                                                            {user.avatar}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="select-none text-[16px]">
                                                        {initials}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <Menu size={22} strokeWidth={1.5} />
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <MobileMenu showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
            </header>

            {/* Global Modals triggered from Header */}
            <Suspense fallback={null}>
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
