import { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    Package,
    Users,
    Menu as MenuIcon,
    HelpCircle,
    ShoppingBag,
    DollarSign,
    Activity,
    X,
    ArrowLeft,
    BarChart3,
    Heart,
    CalendarDays,
    Map as MapIcon,
    Bell,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { api } from '../utils/api';
const AdminMenu = lazy(() => import('../components/admin/AdminMenu'));
const AdminUsers = lazy(() => import('../components/admin/AdminUsers'));
const AdminOrders = lazy(() => import('../components/admin/AdminOrders'));
const AdminPromos = lazy(() => import('../components/admin/AdminPromos'));
const AdminTablon = lazy(() => import('../components/admin/AdminTablon'));
const AdminSettings = lazy(() => import('../components/admin/AdminSettings'));
const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
const AdminAnalytics = lazy(() => import('../components/admin/AdminAnalytics'));
const AdminDeliveryZones = lazy(() => import('../components/admin/AdminDeliveryZones'));
const AdminReservations = lazy(() => import('../components/admin/AdminReservations'));
import { useTablonPending } from '../hooks/queries/useTablon';
import { AdminSkeleton, AdminContentSkeleton } from '../components/skeletons/AdminSkeleton';
import { supabase } from '../utils/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Order } from '../types';
import { OrderReceipt } from '../components/admin/OrderReceipt';
import { ADMIN_TRANSLATIONS, type AdminLanguage } from '../constants/admin';

type TabId =
    | 'dashboard'
    | 'orders'
    | 'menu'
    | 'users'
    | 'promos'
    | 'tablon'
    | 'settings'
    | 'analytics'
    | 'abandoned'
    | 'delivery'
    | 'reservations';
export default function AdminPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as TabId) || 'dashboard';

    // Language State
    const [language, setLanguage] = useState<AdminLanguage>(() => {
        const saved = localStorage.getItem('admin_language');
        return (saved as AdminLanguage) || 'es';
    });

    useEffect(() => {
        localStorage.setItem('admin_language', language);
    }, [language]);

    const t = ADMIN_TRANSLATIONS[language];

    const setActiveTab = (tab: TabId) => {
        setSearchParams({ tab });
    };

    const [showHelp, setShowHelp] = useState(() => {
        const saved = localStorage.getItem('admin_show_help');
        return saved === null ? false : saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('admin_show_help', String(showHelp));
    }, [showHelp]);

    // Global Sound & Pending Orders Monitoring
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('admin_sound_enabled');
        return saved === null ? true : saved === 'true';
    });
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

    useEffect(() => {
        localStorage.setItem('admin_sound_enabled', String(isSoundEnabled));
    }, [isSoundEnabled]);
    const pendingReminders = useRef<Map<number, number>>(new Map());
    const pendingResReminders = useRef<Map<number, number>>(new Map());
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioMesaRef = useRef<HTMLAudioElement | null>(null);
    const [audioBlocked, setAudioBlocked] = useState(false);
    const hasInteracted = useRef(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isFirstLoad = useRef(true);

    // New Users Notification State
    const [newUsersCount, setNewUsersCount] = useState(0);

    // Prime audio on first interaction
    useEffect(() => {
        const primeAudio = async () => {
            if (hasInteracted.current) return;
            hasInteracted.current = true;

            try {
                if (audioRef.current) {
                    audioRef.current.muted = true;
                    await audioRef.current.play();
                    audioRef.current.pause();
                    audioRef.current.muted = false;
                }
                if (audioMesaRef.current) {
                    audioMesaRef.current.muted = true;
                    await audioMesaRef.current.play();
                    audioMesaRef.current.pause();
                    audioMesaRef.current.muted = false;
                }
                setAudioBlocked(false);
                console.log('🔊 Admin audio notifications primed successfully');
            } catch (e) {
                console.warn('🔇 Audio priming failed:', e);
                setAudioBlocked(true);
            }
        };

        window.addEventListener('mousedown', primeAudio, { once: true });
        window.addEventListener('touchstart', primeAudio, { once: true });
        window.addEventListener('keydown', primeAudio, { once: true });

        return () => {
            window.removeEventListener('mousedown', primeAudio);
            window.removeEventListener('touchstart', primeAudio);
            window.removeEventListener('keydown', primeAudio);
        };
    }, []);

    const playAlert = useCallback(
        async (type: 'delivery' | 'mesa' = 'delivery') => {
            const targetAudio = type === 'mesa' ? audioMesaRef.current : audioRef.current;
            if (!targetAudio || !isSoundEnabled) return;

            try {
                targetAudio.volume = 1.0;

                // Triple chirp for ALL orders (natural bird whistle)
                const gap = type === 'mesa' ? 700 : 900;

                for (let i = 0; i < 3; i++) {
                    targetAudio.currentTime = 0;
                    try {
                        await targetAudio.play();
                    } catch (e) {
                        /* ignore */
                    }
                    await new Promise(resolve => setTimeout(resolve, gap));
                }

                setAudioBlocked(false);
            } catch (error: any) {
                console.warn(`Admin ${type} notification sound blocked or failed:`, error?.message);
                if (error.name === 'NotAllowedError') {
                    setAudioBlocked(true);
                }
            }
        },
        [isSoundEnabled]
    );

    const handlePrintOrder = useCallback((order: Order) => {
        setPrintingOrder(order);
        // Small delay to ensure the receipt is rendered before printing
        setTimeout(() => {
            window.print();
            // Clear after print dialog closes
            setTimeout(() => setPrintingOrder(null), 1000);
        }, 100);
    }, []);

    // Stats Query
    const {
        data: stats,
        isLoading: statsLoading,
        refetch: refetchStats,
    } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => api.get('/admin/stats'),
        enabled:
            isAuthenticated &&
            (user?.role === 'admin' || user?.isSuperadmin) &&
            (activeTab === 'dashboard' || activeTab === 'analytics'),
        refetchInterval: 1000 * 60 * 60, // Poll only once per hour as fallback
    });

    // Reports Query
    const {
        data: reports,
        isLoading: reportsLoading,
        refetch: refetchReports,
    } = useQuery({
        queryKey: ['admin-reports'],
        queryFn: () => api.get('/admin/reports'),
        enabled:
            isAuthenticated &&
            (user?.role === 'admin' || user?.isSuperadmin) &&
            activeTab === 'dashboard',
        refetchInterval: 1000 * 60 * 60, // Poll only once per hour as fallback
    });

    // Pending Orders Query (Global Monitoring)
    const { data: pendingData } = useQuery({
        queryKey: ['admin-pending-monitor'],
        queryFn: () => api.get('/admin/orders?status=pending&limit=100'),
        enabled: isAuthenticated && (user?.role === 'admin' || user?.isSuperadmin),
        refetchInterval: 1000 * 30, // 30 sec fallback (increased from 30 min)
    });

    // Pending Reservations Query
    const { data: pendingResData } = useQuery({
        queryKey: ['admin-pending-res-monitor'],
        queryFn: () => api.get('/admin/reservations?status=pending'),
        enabled: isAuthenticated && (user?.role === 'admin' || user?.isSuperadmin),
        refetchInterval: 1000 * 30, // 30 sec fallback
    });

    // Pending Tablon Posts Query
    const { data: pendingTablonData } = useTablonPending();

    // Pending Tablon Categories Query
    const { data: pendingTablonCategoriesData } = useQuery({
        queryKey: ['tablon', 'suggested-categories'],
        queryFn: () => api.get('/admin/tablon-categories?approved=false'),
        enabled: isAuthenticated && (user?.role === 'admin' || user?.isSuperadmin),
        refetchInterval: 1000 * 30, // 30 sec fallback
    });

    // Initial New Users Count
    useEffect(() => {
        if (!isAuthenticated || (user?.role !== 'admin' && !user?.isSuperadmin)) return;

        const fetchNewUsersCount = async () => {
            try {
                const lastViewed = localStorage.getItem('admin_last_users_view');
                if (!lastViewed) {
                    // If never viewed, consider last 24h as "new" for the first time
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                    const { count } = await supabase
                        .from('users')
                        .select('*', { count: 'exact', head: true })
                        .eq('role', 'user')
                        .gte('created_at', yesterday);
                    setNewUsersCount(count || 0);
                    return;
                }

                const { count } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'user')
                    .gte('created_at', lastViewed);
                setNewUsersCount(count || 0);
            } catch (err) {
                console.error('Error fetching new users count:', err);
            }
        };

        fetchNewUsersCount();
    }, [isAuthenticated, user]);

    // Reset New Users Count when visiting the tab
    useEffect(() => {
        if (activeTab === 'users') {
            setNewUsersCount(0);
            localStorage.setItem('admin_last_users_view', new Date().toISOString());
        }
    }, [activeTab]);

    // Realtime Order Monitoring
    useEffect(() => {
        if (!isAuthenticated || (user?.role !== 'admin' && !user?.isSuperadmin)) return;

        const ordersChannel = supabase
            .channel('admin-orders-monitor')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'orders',
                },
                payload => {
                    const newOrder = payload.new as any;
                    const address = newOrder?.delivery_address || newOrder?.deliveryAddress || '';
                    const isMesa = address.toUpperCase().includes('MESA');

                    // If it's a new order (INSERT), play alert and set reminder
                    if (payload.eventType === 'INSERT' && isSoundEnabled) {
                        const now = Date.now();
                        pendingReminders.current.set(newOrder.id, now);
                        playAlert(isMesa ? 'mesa' : 'delivery');
                        console.log(`🔔 Realtime: New ${isMesa ? 'Mesa' : 'Delivery'} order ${newOrder.id}. Next reminder in 5m.`);
                    }

                    // Refresh relevant data
                    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-pending-monitor'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
                    queryClient.invalidateQueries({ queryKey: ['orders'] });
                }
            )
            .subscribe();

        const resChannel = supabase
            .channel('admin-res-monitor')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reservations',
                },
                () => {
                    // Play general alert for new reservations

                    queryClient.invalidateQueries({ queryKey: ['admin-pending-res-monitor'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
                }
            )
            .subscribe();

        const usersChannel = supabase
            .channel('admin-users-monitor')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'users',
                },
                payload => {
                    const newUser = payload.new as any;
                    // Only count if it's a 'user' role (not admin/waiter)
                    if (newUser.role === 'user' && activeTab !== 'users') {
                        setNewUsersCount(prev => prev + 1);
                    }
                }
            )
            .subscribe();

        const tablonChannel = supabase
            .channel('admin-tablon-monitor')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tablon_posts',
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['tablon', 'pending'] });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tablon_categories',
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['tablon', 'suggested-categories'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(resChannel);
            supabase.removeChannel(usersChannel);
            supabase.removeChannel(tablonChannel);
        };
    }, [isAuthenticated, user, isSoundEnabled, queryClient, playAlert, activeTab]);

    // Screen Wake Lock API to prevent sleep
    useEffect(() => {
        if (!isAuthenticated) return;

        let wakeLock: any = null;

        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && document.visibilityState === 'visible') {
                try {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('💡 Screen Wake Lock is active');
                } catch (err: any) {
                    console.warn(`🔒 Wake Lock failed: ${err.message}`);
                }
            }
        };

        requestWakeLock();

        // Re-request if visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock !== null) {
                wakeLock.release().then(() => {
                    wakeLock = null;
                    console.log('💤 Screen Wake Lock released');
                });
            }
        };
    }, [isAuthenticated]);

    const pendingOrders = useMemo(() => pendingData?.orders || [], [pendingData]);
    const pendingCount = pendingData?.pagination?.total || pendingOrders.length;

    // Audio Alert Effect
    useEffect(() => {
        const currentPendingOrders = pendingOrders || [];
        const currentPendingRes = pendingResData?.reservations || [];

        if (!currentPendingOrders.length && !currentPendingRes.length) {
            pendingReminders.current.clear();
            pendingResReminders.current.clear();
            isFirstLoad.current = false;
            return;
        }

        const checkReminders = () => {
            let shouldPlayDelivery = false;
            let shouldPlayMesa = false;
            const now = Date.now();

            // 1. Check Orders
            currentPendingOrders.forEach((order: any) => {
                const lastNotified = pendingReminders.current.get(order.id);
                const isMesa = order.deliveryAddress?.toUpperCase().includes('MESA');

                if (!lastNotified) {
                    // First time seeing this order (if not first load)
                    if (!isFirstLoad.current && isSoundEnabled) {
                        if (isMesa) shouldPlayMesa = true;
                        else shouldPlayDelivery = true;
                    }
                    pendingReminders.current.set(order.id, now);
                } else if (now - lastNotified >= 300000) { // 5 minutes
                    if (isSoundEnabled) {
                        if (isMesa) shouldPlayMesa = true;
                        else shouldPlayDelivery = true;
                        console.log(`⏰ Reminder: Order ${order.id} is still pending after 5m.`);
                    }
                    pendingReminders.current.set(order.id, now);
                }
            });

            // 2. Check Reservations
            currentPendingRes.forEach((res: any) => {
                const lastNotified = pendingResReminders.current.get(res.id);
                if (!lastNotified) {
                    if (!isFirstLoad.current && isSoundEnabled) shouldPlayDelivery = true;
                    pendingResReminders.current.set(res.id, now);
                } else if (now - lastNotified >= 300000) {
                    if (isSoundEnabled) {
                        shouldPlayDelivery = true;
                        console.log(`⏰ Reminder: Reservation ${res.id} is still pending after 5m.`);
                    }
                    pendingResReminders.current.set(res.id, now);
                }
            });

            if (shouldPlayMesa) playAlert('mesa');
            else if (shouldPlayDelivery) playAlert('delivery');

            isFirstLoad.current = false;
        };

        // Run immediately
        checkReminders();

        // Heartbeat: Check every 10 seconds for reminders
        const heartbeat = setInterval(checkReminders, 10000);

        // Cleanup stale reminders
        const pendingIds = new Set(currentPendingOrders.map((o: any) => o.id));
        for (const id of pendingReminders.current.keys()) {
            if (!pendingIds.has(id)) pendingReminders.current.delete(id);
        }

        const pendingResIds = new Set(currentPendingRes.map((r: any) => r.id));
        for (const id of pendingResReminders.current.keys()) {
            if (!pendingResIds.has(id)) pendingResReminders.current.delete(id);
        }

        return () => clearInterval(heartbeat);
    }, [pendingOrders, pendingResData, isSoundEnabled, playAlert]);

    const navLinks = useMemo(
        () => [
            { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
            { id: 'analytics', label: t.nav.analytics, icon: BarChart3 },
            // { id: 'abandoned', label: t.nav.abandoned, icon: ShoppingCart },
            {
                id: 'orders',
                label: t.nav.orders,
                icon: Package,
                badge: pendingCount > 0 ? pendingCount : null,
            },
            { id: 'menu', label: t.nav.menu, icon: MenuIcon },
            {
                id: 'users',
                label: t.nav.users,
                icon: Users,
                badge: newUsersCount > 0 ? newUsersCount : null,
            },
            { id: 'promos', label: t.nav.promos, icon: ShoppingBag },
            {
                id: 'tablon',
                label: t.nav.tablon,
                icon: Activity,
                badge:
                    (pendingTablonData?.posts?.length || 0) +
                        (pendingTablonCategoriesData?.categories?.length || 0) >
                    0
                        ? (pendingTablonData?.posts?.length || 0) +
                          (pendingTablonCategoriesData?.categories?.length || 0)
                        : null,
            },
            { id: 'settings', label: t.nav.settings, icon: DollarSign },
            {
                id: 'reservations',
                label: t.nav.reservations,
                icon: CalendarDays,
                badge: pendingResData?.total > 0 ? pendingResData.total : null,
            },
            { id: 'delivery', label: t.nav.delivery, icon: MapIcon },
        ],
        [
            pendingCount,
            pendingResData?.total,
            t,
            newUsersCount,
            pendingTablonData,
            pendingTablonCategoriesData,
        ]
    );

    // Authorization Check
    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            if (user.role === 'waiter') {
                navigate('/waiter');
            } else if (user.role !== 'admin' && !user.isSuperadmin) {
                navigate('/profile');
            }
        }
    }, [isLoading, isAuthenticated, user, navigate]);

    const handleRefetchStats = async (isPolling?: boolean) => {
        if (!isPolling) {
            await Promise.all([refetchStats(), refetchReports()]);
        }
    };

    // While waiting for auth status, show the skeleton to prevent layout shift and "restricted" flash
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('sushi_token');
    if (isLoading || (hasToken && !user)) {
        return <AdminSkeleton />;
    }

    if (!isAuthenticated || (user?.role !== 'admin' && !user?.isSuperadmin)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
                    <div className="shrink-0 flex items-center justify-center mx-auto mb-10 overflow-hidden">
                        <img
                            src="/logo.svg"
                            alt="Sushi de Maksim"
                            className="h-14 w-auto object-contain"
                        />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">{t.ui.restricted}</h2>
                    <p className="text-gray-500 mb-8 font-medium">{t.ui.restrictedDesc}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            backgroundColor: '#F26522',
                            color: 'white',
                            padding: '12px 32px',
                            borderRadius: '10px',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            cursor: 'pointer',
                        }}
                    >
                        {t.ui.backToHome}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen metallic-brushed flex flex-col md:flex-row">
            <SEO
                title="Panel de Administración"
                description="Gestión interna de Sushi de Maksim"
                robots="noindex, nofollow"
            />
            <audio ref={audioRef} src="/sounds/order-new.mp3" preload="auto" />
            <audio ref={audioMesaRef} src="/sounds/mesa-new.mp3" preload="auto" />
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 bottom-0 left-0 w-[280px] md:w-60 bg-white/95 backdrop-blur-xl border-r border-gray-200 flex flex-col z-[101] transition-transform duration-300 shadow-2xl
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col gap-3">
                        <img
                            src="/logo.svg"
                            alt="Sushi de Maksim"
                            className="h-10 w-auto object-contain brightness-0 opacity-70"
                        />
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
                    {navLinks.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as TabId);
                                    setIsMobileMenuOpen(false);
                                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                        navigator.vibrate(5);
                                    }
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm transition-all relative group
                                    ${
                                        isActive
                                            ? 'text-slate-900 bg-white/50 shadow-sm border border-white/50'
                                            : 'text-slate-500 hover:bg-white/30 hover:text-slate-900'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="admin-nav-active"
                                        className="absolute inset-0 bg-gradient-to-r from-white/80 to-transparent rounded-xl"
                                        transition={{
                                            type: 'spring',
                                            bounce: 0.2,
                                            duration: 0.6,
                                        }}
                                    />
                                )}
                                <div className="flex items-center gap-2.5 relative z-10 w-full">
                                    <Icon
                                        size={20}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
                                    />
                                    <span className="flex-1 text-left leading-[1.2] py-0.5">
                                        {tab.label}
                                    </span>
                                    {(tab as any).badge && (
                                        <span className="ml-auto bg-orange-600 text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full font-bold animate-pulse shadow-sm border border-white">
                                            {(tab as any).badge}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-gray-100 mt-auto">
                    <button
                        onClick={() => navigate('/menu')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 metallic-button rounded-xl active:scale-[0.98]"
                    >
                        <ArrowLeft size={16} strokeWidth={2} />
                        {t.ui.backToShop}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-60 p-3 md:p-4 flex flex-col min-h-screen">
                <div className="w-full flex-1 flex flex-col">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2 text-slate-600 hover:bg-gray-100 rounded-xl active:scale-95 transition-all"
                            >
                                <MenuIcon size={24} strokeWidth={2.5} />
                            </button>
                            <h1 className="text-xl md:text-2xl metallic-text flex items-center gap-2 md:gap-3 group">
                                <div className="hidden md:block w-1.5 h-6 bg-slate-800 rounded-full group-hover:h-8 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                {navLinks.find(t_link => t_link.id === activeTab)?.label}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Language Switcher */}
                            <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
                                <button
                                    onClick={() => setLanguage('ru')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        language === 'ru'
                                            ? 'bg-white text-orange-600 shadow-md transform scale-105'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    RU
                                </button>
                                <button
                                    onClick={() => setLanguage('es')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        language === 'es'
                                            ? 'bg-white text-orange-600 shadow-md transform scale-105'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    ESP
                                </button>
                            </div>

                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className="flex items-center gap-2 px-4 py-2 metallic-button rounded-xl active:scale-95"
                            >
                                <HelpCircle size={18} strokeWidth={2.5} />
                                <span className="hidden md:inline uppercase tracking-tight text-[11px] font-black">
                                    {showHelp ? t.ui.hideHelp : t.ui.showHelp}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Interactive Help Banner */}
                    <AnimatePresence>
                        {showHelp && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                className="mb-5 metallic-surface rounded-2xl p-4 relative backdrop-blur-md shadow-lg"
                            >
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 transition-colors p-1"
                                >
                                    <X size={18} strokeWidth={2} />
                                </button>
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="w-10 h-10 bg-white/50 text-slate-600 rounded-xl flex items-center justify-center shadow-inner border border-white/50">
                                            <HelpCircle
                                                size={20}
                                                strokeWidth={2.5}
                                                className="text-slate-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-900 mb-0.5 text-base metallic-text !bg-clip-text !text-transparent">
                                            {t.ui.welcome}
                                        </h3>
                                        <p className="text-slate-700 text-[13px] font-bold leading-relaxed max-w-4xl">
                                            {(t.help as any)[activeTab]}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Audio Blocked Warning */}
                    <AnimatePresence>
                        {audioBlocked && isSoundEnabled && (
                            <motion.div
                                initial={{ y: -100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -100, opacity: 0 }}
                                className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4"
                            >
                                <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-orange-500/50 backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-xl">
                                            <Bell className="animate-bounce" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest">
                                                Sonido Bloqueado
                                            </p>
                                            <p className="text-[10px] opacity-90 font-bold">
                                                Haz clic en cualquier lugar para activar avisos
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAudioBlocked(false)}
                                        className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tab Contents */}
                    <Suspense fallback={<AdminContentSkeleton />}>
                        {activeTab === 'dashboard' && (
                            <AdminDashboard
                                stats={stats}
                                reports={reports}
                                loading={statsLoading || reportsLoading}
                                loadStats={handleRefetchStats}
                                setActiveTab={setActiveTab}
                                language={language}
                            />
                        )}

                        {activeTab === 'analytics' && (
                            <AdminAnalytics
                                stats={stats}
                                loading={statsLoading}
                                language={language}
                            />
                        )}

                        {/* {activeTab === 'abandoned' && <AdminAbandonedCarts language={language} />} */}

                        {activeTab === 'menu' && <AdminMenu language={language} />}
                        {activeTab === 'users' && <AdminUsers language={language} />}
                        {activeTab === 'orders' && (
                            <AdminOrders
                                isGlobalSoundEnabled={isSoundEnabled}
                                setIsGlobalSoundEnabled={setIsSoundEnabled}
                                onTestSound={playAlert}
                                onPrintOrder={handlePrintOrder}
                                globalPendingCount={pendingCount}
                                language={language}
                            />
                        )}
                        {activeTab === 'settings' && <AdminSettings language={language} />}
                        {activeTab === 'delivery' && <AdminDeliveryZones language={language} />}
                        {activeTab === 'promos' && <AdminPromos language={language} />}
                        {activeTab === 'tablon' && <AdminTablon language={language} />}
                        {activeTab === 'reservations' && <AdminReservations language={language} />}
                    </Suspense>

                    {/* Developer Footer */}
                    <footer className="mt-auto py-6 border-t border-gray-100">
                        <p className="text-gray-400 text-[10px] md:text-[11px] font-bold flex items-center justify-center gap-2 flex-wrap text-center uppercase tracking-widest">
                            {t.ui.developedBy}{' '}
                            <Heart
                                size={14}
                                className="text-orange-500 fill-current animate-pulse"
                            />{' '}
                            {t.ui.by}{' '}
                            <span className="text-gray-700 font-black">
                                SelenIT / alekseevpo@gmail.com
                            </span>{' '}
                            — 2026. {t.ui.rights}
                        </p>
                    </footer>
                </div>
            </main>
            {printingOrder && <OrderReceipt order={printingOrder} />}
        </div>
    );
}
