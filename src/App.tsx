import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from './hooks/useCart';
import { AuthProvider } from './hooks/useAuth';
import { TableOrderProvider } from './context/TableOrderContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import FloatingCart from './components/FloatingCart';
import SmoothScroll from './components/SmoothScroll';
import RegistrationPrompt from './components/RegistrationPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import ReloadPrompt from './components/ReloadPrompt';
import { ToastProvider } from './context/ToastContext';
import Schema from './components/SEO/Schema';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CartSkeleton } from './components/skeletons/CartSkeleton';
import { MenuSkeleton } from './components/skeletons/MenuSkeleton';
import { HomeSkeleton } from './components/skeletons/HomeSkeleton';
import { AdminSkeleton } from './components/skeletons/AdminSkeleton';
import { ProfileSkeleton } from './components/skeletons/ProfileSkeleton';
import { PromoSkeleton } from './components/skeletons/PromoSkeleton';
import { TablonSkeleton } from './components/skeletons/TablonSkeleton';
import { TrackSkeleton } from './components/skeletons/TrackSkeleton';
import { TableMenuSkeleton } from './components/skeletons/TableMenuSkeleton';
import { GenericSkeleton } from './components/skeletons/GenericSkeleton';
import { usePageTracking } from './hooks/usePageTracking';
import { safeReload } from './utils/reload';

// Lazy-loaded pages with retry logic
const lazyRetry = (componentImport: () => Promise<{ default: React.ComponentType<any> }>) => {
    return lazy(async () => {
        try {
            const component = await componentImport();
            return component;
        } catch (error: any) {
            console.error('[LazyRetry] Loading failed:', error);

            // Attempt safe reload
            const reloaded = safeReload(`LazyLoad: ${error.message || 'ChunkError'}`);
            if (!reloaded) {
                // If limit reached, rethrow to be caught by ErrorBoundary
                throw error;
            }
            return { default: () => null } as any;
        }
    });
};

const HomePage = lazyRetry(() => import('./pages/HomePage'));
const MenuPage = lazyRetry(() => import('./pages/MenuPage'));
const CartPage = lazyRetry(() => import('./pages/CartPage'));
const PromoPage = lazyRetry(() => import('./pages/PromoPage'));
const ProfilePage = lazyRetry(() => import('./pages/ProfilePage'));
const AdminPage = lazyRetry(() => import('./pages/AdminPage'));
const ContactsPage = lazyRetry(() => import('./pages/ContactsPage'));
const TablonPage = lazyRetry(() => import('./pages/TablonPage'));
const TablonPostPage = lazyRetry(() => import('./pages/TablonPostPage'));
const PayForFriendPage = lazyRetry(() => import('./pages/PayForFriendPage'));
const VerifyPage = lazyRetry(() => import('./pages/VerifyPage'));
const ReservationPage = lazyRetry(() => import('./pages/ReservationPage'));
const VerifyEmailChangePage = lazyRetry(() => import('./pages/VerifyEmailChangePage'));
const OrderTrackingPage = lazyRetry(() => import('./pages/OrderTrackingPage'));
const WaiterOrderPage = lazyRetry(() => import('./pages/WaiterOrderPage'));
const TableMenuPage = lazyRetry(() => import('./pages/HallMenuPage'));
const PartnersPage = lazyRetry(() => import('./pages/PartnersPage'));
const RefundPolicyPage = lazyRetry(() => import('./pages/RefundPolicyPage'));
const PrivacyPage = lazyRetry(() => import('./pages/PrivacyPage'));
const NotFoundPage = lazyRetry(() => import('./pages/NotFoundPage'));

// Page Wrapper for consistent transitions
const PageWrapper = ({
    children,
    skeleton,
    isHome = false,
    isAdmin = false,
}: {
    children: React.ReactNode;
    skeleton: React.ReactNode;
    isHome?: boolean;
    isAdmin?: boolean;
}) => {
    const location = useLocation();
    const isProfile = location.pathname === '/profile';
    const isWaiterRoute = location.pathname.startsWith('/waiter');
    const isTablonRoute = location.pathname.startsWith('/tablon');

    useEffect(() => {
        // Scroll to top on pathname change, regardless of search params.
        // We keep hash check to respect anchor links.
        // Skip auto-scroll when navigating with a category param (e.g. /menu?category=sopas)
        // — the target page will handle scrolling to the correct section.
        const hasCategory = new URLSearchParams(location.search).has('category');
        if (!location.hash && !hasCategory) {
            // Use requestAnimationFrame to ensure it wins against browser native restoration
            requestAnimationFrame(() => {
                window.scrollTo(0, 0);
                (window as any).lenis?.scrollTo(0, { immediate: true });
            });
        }
    }, [location.pathname, location.hash, location.search]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'linear' }}
            className="flex-1 flex flex-col [grid-area:1/1]"
            style={{
                paddingTop: '0',
            }}
        >
            <div
                className="flex-1 flex flex-col w-full"
                style={{
                    paddingTop:
                        !isAdmin && !isWaiterRoute && !isHome && !isProfile && !isTablonRoute
                            ? 'var(--header-height, 4rem)'
                            : '0',
                }}
            >
                <Suspense fallback={skeleton}>{children}</Suspense>
            </div>
        </motion.div>
    );
};

function PageTracker() {
    usePageTracking();
    return null;
}

function App() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isWaiterRoute = location.pathname.startsWith('/waiter');
    const isTableRoute = location.pathname === '/table';
    const isTablonRoute = location.pathname.startsWith('/tablon');

    useEffect(() => {
        // Disable automatic scroll restoration on mount
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    useEffect(() => {
        // Canonical domain redirect (non-www to www)
        // This is a safety measure to prevent CORS issues and header loss on redirects
        const isProduction =
            window.location.hostname !== 'localhost' &&
            !window.location.hostname.includes('vercel.app');
        if (isProduction && window.location.hostname === 'sushidemaksim.com') {
            const canonicalUrl = `https://www.sushidemaksim.com${window.location.pathname}${window.location.search}${window.location.hash}`;
            window.location.replace(canonicalUrl);
        }
    }, []);

    useEffect(() => {
        const isTable = location.pathname === '/table';
        const isTablon = location.pathname.startsWith('/tablon');

        if (isTable) {
            document.documentElement.classList.add('is-table-route');
        } else {
            document.documentElement.classList.remove('is-table-route');
        }

        if (isTablon) {
            document.documentElement.classList.add('is-tablon-route');
        } else {
            document.documentElement.classList.remove('is-tablon-route');
        }
    }, [location.pathname]);

    return (
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <CartProvider>
                        <Schema />
                        <PageTracker />
                        <div
                            className={`min-h-[100svh] flex flex-col transition-colors duration-500 ${
                                isTableRoute || isTablonRoute ? 'bg-[#0d0d0d]' : 'bg-[#FBF7F0]'
                            }`}
                        >
                            <Analytics />
                            <SpeedInsights />
                            <SmoothScroll />
                            {!isAdminRoute && !isWaiterRoute && !isTableRoute && <CookieConsent />}
                            {!isTableRoute && <RegistrationPrompt />}
                            <ReloadPrompt />
                            <FloatingCart />

                            {!isAdminRoute && !isWaiterRoute && <Header />}
                            <main className="flex-1 grid grid-cols-1 grid-rows-1 relative w-full overflow-x-clip">
                                <AnimatePresence initial={false}>
                                    <Routes location={location} key={location.pathname}>
                                        <Route
                                            path="/reservar"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <ReservationPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/"
                                            element={
                                                <PageWrapper
                                                    skeleton={<HomeSkeleton />}
                                                    isHome={true}
                                                >
                                                    <HomePage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/menu"
                                            element={
                                                <PageWrapper skeleton={<MenuSkeleton />}>
                                                    <MenuPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/cart"
                                            element={
                                                <PageWrapper skeleton={<CartSkeleton />}>
                                                    <CartPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/promo"
                                            element={
                                                <PageWrapper skeleton={<PromoSkeleton />}>
                                                    <PromoPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/profile"
                                            element={
                                                <PageWrapper skeleton={<ProfileSkeleton />}>
                                                    <ProfilePage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/admin/*"
                                            element={
                                                <Suspense fallback={<AdminSkeleton />}>
                                                    <AdminPage />
                                                </Suspense>
                                            }
                                        />
                                        <Route
                                            path="/contacts"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <ContactsPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/contacto"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <ContactsPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/tablon"
                                            element={
                                                <PageWrapper skeleton={<TablonSkeleton />}>
                                                    <TablonPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/tablon/:id"
                                            element={
                                                <PageWrapper skeleton={<TablonSkeleton />}>
                                                    <TablonPostPage />
                                                </PageWrapper>
                                            }
                                        />
                                        {/* Redirect old blog URLs to tablón */}
                                        <Route
                                            path="/blog"
                                            element={
                                                <PageWrapper skeleton={<TablonSkeleton />}>
                                                    <TablonPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/pay-for-friend/:id"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <PayForFriendPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/verify"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <VerifyPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/verify-email-change"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <VerifyEmailChangePage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/track/:id"
                                            element={
                                                <PageWrapper skeleton={<TrackSkeleton />}>
                                                    <OrderTrackingPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/waiter"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <WaiterOrderPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/table"
                                            element={
                                                <TableOrderProvider>
                                                    <PageWrapper skeleton={<TableMenuSkeleton />}>
                                                        <TableMenuPage />
                                                    </PageWrapper>
                                                </TableOrderProvider>
                                            }
                                        />
                                        <Route
                                            path="/partners"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <PartnersPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/refund-policy"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <RefundPolicyPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="/privacy"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <PrivacyPage />
                                                </PageWrapper>
                                            }
                                        />
                                        <Route
                                            path="*"
                                            element={
                                                <PageWrapper skeleton={<GenericSkeleton />}>
                                                    <NotFoundPage />
                                                </PageWrapper>
                                            }
                                        />
                                    </Routes>
                                </AnimatePresence>
                            </main>
                            {!isAdminRoute && !isWaiterRoute && !isTableRoute && <Footer />}
                        </div>
                    </CartProvider>
                </AuthProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
}

export default App;
