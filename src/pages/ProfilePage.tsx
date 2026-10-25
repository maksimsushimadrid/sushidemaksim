import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    MapPin,
    Package,
    LogOut,
    ChevronRight,
    Heart,
    Gift,
    Percent,
    Trophy,
    Tag,
    Copy,
    ClipboardCheck,
    Clock,
    Check,
    BellRing,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import SEO from '../components/SEO';
import { getSharpAvatar } from '../utils/avatar';
import ProfileTab from '../components/profile/ProfileTab';
import AddressesTab from '../components/profile/AddressesTab';
import OrdersTab from '../components/profile/OrdersTab';
import FavoritesTab from '../components/profile/FavoritesTab';
import SafeImage from '../components/common/SafeImage';
import { ProfileSkeleton } from '../components/skeletons/ProfileSkeleton';
import { api } from '../utils/api';

type TabId = 'profile' | 'addresses' | 'orders' | 'favorites';

export default function ProfilePage() {
    const {
        user,
        isAuthenticated,
        isLoading,
        logout,
        updateProfile,
        addAddress,
        editAddress,
        removeAddress,
        setDefaultAddress,
    } = useAuth();

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const { isSupported, isSubscribed, subscribeToPush } = usePushNotifications();

    // Initial tab from URL or state or default
    const getInitialTab = (): TabId => {
        const tabParam = searchParams.get('tab') as TabId;
        if (['profile', 'addresses', 'orders', 'favorites'].includes(tabParam)) {
            return tabParam;
        }
        return 'profile';
    };

    const [activeTab, setActiveTab] = useState<TabId>(getInitialTab());
    const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);

    // Load friends
    useEffect(() => {
        if (!isAuthenticated) return;
        const loadFriends = async () => {
            try {
                const data = await api.get('/user/friends');
                setFriends(data.friends || []);
            } catch (err) {
                console.error('Failed to load friends', err);
            }
        };
        loadFriends();
    }, [isAuthenticated]);

    // Load delivery zones for address cost calculation
    useEffect(() => {
        const loadZones = async () => {
            try {
                const res = await fetch('/api/delivery-zones');
                if (res.ok) {
                    const zonesData = await res.json();
                    setDeliveryZones(zonesData.zones || []);
                }
            } catch (err) {
                console.error('Failed to load delivery zones in profile', err);
            }
        };
        loadZones();
    }, []);

    // Sync tab with URL when it changes (e.g. back button)
    useEffect(() => {
        const tabParam = searchParams.get('tab') as TabId;
        if (tabParam && ['profile', 'addresses', 'orders', 'favorites'].includes(tabParam)) {
            if (tabParam !== activeTab) {
                setActiveTab(tabParam);
            }
        }
    }, [searchParams, activeTab]);

    const isFirstMount = useRef(true);

    useEffect(() => {
        // Set first mount to false after a delay to ensure App's scrollTo(0,0) wins
        const timer = setTimeout(() => {
            isFirstMount.current = false;
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Scroll active tab into view on mobile horizontal bar
    useEffect(() => {
        if (isFirstMount.current) return;
        const activeElement = document.getElementById(`tab-${activeTab}`);
        if (activeElement && typeof activeElement.scrollIntoView === 'function') {
            activeElement.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [activeTab]);

    // Update URL when tab changes manually
    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(5);
        }
    };

    // Automatically open register or login modal if requested via URL query params
    useEffect(() => {
        if (!isAuthenticated) {
            const isRegister = searchParams.get('register') === 'true';
            const isLogin = searchParams.get('login') === 'true';
            if (isRegister || isLogin) {
                const event = new CustomEvent('custom:openLogin', {
                    detail: { mode: isRegister ? 'register' : 'login' },
                    bubbles: true,
                });
                document.dispatchEvent(event);
                window.dispatchEvent(event);
            }
        }
    }, [isAuthenticated, searchParams]);

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[40px] p-8 sm:p-12 shadow-2xl text-center border border-gray-100">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 text-3xl sm:text-4xl shadow-inner border-2 border-white">
                        🔒
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">
                        Inicia sesión
                    </h1>
                    <p className="text-gray-500 font-medium mb-8 sm:mb-10 text-sm sm:text-base leading-relaxed">
                        Inicia sesión o regístrate para poder gestionar tu perfil, direcciones y ver
                        tu historial de pedidos.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                const isRegister = searchParams.get('register') === 'true';
                                const event = new CustomEvent('custom:openLogin', {
                                    detail: { mode: isRegister ? 'register' : 'login' },
                                    bubbles: true,
                                });
                                document.dispatchEvent(event);
                                window.dispatchEvent(event);
                            }}
                            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 transform hover:scale-[1.02] cursor-pointer border-none"
                        >
                            {searchParams.get('register') === 'true'
                                ? 'CREAR CUENTA'
                                : 'INICIAR SESIÓN'}
                        </button>
                        <button
                            onClick={() => {
                                const event = new CustomEvent('custom:openLogin', {
                                    detail: { mode: 'register' },
                                    bubbles: true,
                                });
                                document.dispatchEvent(event);
                                window.dispatchEvent(event);
                            }}
                            className="text-xs sm:text-sm font-bold text-gray-600 hover:text-orange-600 bg-transparent border-none py-2 cursor-pointer transition-colors"
                        >
                            ¿No tienes cuenta?{' '}
                            <span className="text-orange-600 underline">Regístrate</span>
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs sm:text-sm hover:bg-gray-200 transition-all border-none cursor-pointer mt-1"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([10, 30, 10]);
        }
        logout();
    };

    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const tabs: { id: TabId; label: string; icon: typeof User; color: string }[] = [
        { id: 'profile', label: 'Mi Perfil', icon: User, color: 'bg-blue-500' },
        { id: 'addresses', label: 'Direcciones', icon: MapPin, color: 'bg-green-500' },
        { id: 'orders', label: 'Pedidos', icon: Package, color: 'bg-amber-500' },
        { id: 'favorites', label: 'Favoritos', icon: Heart, color: 'bg-orange-50' },
    ];

    // Filter out used and expired coupons
    const validPromoCodes = (user.promoCodes || []).filter(p => {
        if (p.isUsed) return false;

        const created = new Date(p.createdAt);
        const now = new Date();
        if (p.code.startsWith('NUEVO') || p.code.startsWith('NEW')) {
            return now.getTime() < created.getTime() + 24 * 60 * 60 * 1000;
        }
        if (p.code.startsWith('LOYALTY')) {
            return now.getTime() < created.getTime() + 7 * 24 * 60 * 60 * 1000;
        }
        if (p.code.startsWith('BDAY')) {
            return now.getTime() < created.getTime() + 30 * 24 * 60 * 60 * 1000;
        }
        if (p.code.startsWith('DESSERT')) {
            return now.getTime() < created.getTime() + 30 * 24 * 60 * 60 * 1000;
        }
        return true;
    });

    const getExpiryString = (code: string, createdAt: string) => {
        const created = new Date(createdAt);
        let expiryDate: Date;
        if (code.startsWith('NUEVO') || code.startsWith('NEW')) {
            expiryDate = new Date(created.getTime() + 24 * 60 * 60 * 1000);
        } else if (code.startsWith('LOYALTY')) {
            expiryDate = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (code.startsWith('BDAY')) {
            expiryDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (code.startsWith('DESSERT')) {
            expiryDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
            return null;
        }

        return expiryDate.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const loyaltyCode = validPromoCodes.find(p => p.code.startsWith('LOYALTY'));
    const dessertCode = validPromoCodes.find(p => p.code.startsWith('DESSERT'));
    const welcomeCode = validPromoCodes.find(
        p => p.code.startsWith('NUEVO') || p.code.startsWith('NEW')
    );
    const birthdayCode = validPromoCodes.find(p => p.code.startsWith('BDAY'));
    const otherCodes = validPromoCodes.filter(
        p =>
            !p.code.startsWith('LOYALTY') &&
            !p.code.startsWith('DESSERT') &&
            !p.code.startsWith('NUEVO') &&
            !p.code.startsWith('NEW') &&
            !p.code.startsWith('BDAY')
    );

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(text);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col overflow-x-hidden">
            <SEO
                title="Mi Perfil"
                description="Gestiona tu cuenta, direcciones y pedidos en Sushi de Maksim."
            />

            {/* Full-Screen Hero with User Photo Background & Overlay Information */}
            <div
                className="relative w-full min-h-[82vh] md:min-h-[72vh] flex flex-col justify-end overflow-hidden pb-10 sm:pb-14 px-4 sm:px-6 md:px-8 bg-zinc-950"
                style={{ paddingTop: 'calc(var(--header-height, 64px) + 50px)' }}
            >
                {/* Big Full-Screen Photo Background */}
                {user.avatar && user.avatar.startsWith('http') ? (
                    <SafeImage
                        src={user.avatar}
                        getOptimizedUrl={url => getSharpAvatar(url, 1200)}
                        alt={user.name}
                        className="absolute inset-0 w-full h-full object-cover object-top sm:object-center select-none"
                        fallbackContent={
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-800 to-zinc-950 flex items-center justify-center">
                                <div className="text-8xl md:text-9xl font-black text-white/10 select-none uppercase">
                                    {initials}
                                </div>
                            </div>
                        }
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-800 to-zinc-950 flex items-center justify-center">
                        <div className="text-8xl md:text-9xl font-black text-white/10 select-none uppercase">
                            {initials}
                        </div>
                    </div>
                )}

                {/* Top Dark Header Scrim (makes transparent header, logo, and curtain crystal-clear) */}
                <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/85 via-black/35 to-transparent z-[1] pointer-events-none" />

                {/* Subtle Contrast Scrim */}
                <div className="absolute inset-0 bg-black/20 z-[2] pointer-events-none" />

                {/* Bottom Dark Gradient for Legibility of Overlaid Information */}
                <div className="absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/80 via-45% to-transparent z-[3] pointer-events-none" />

                {/* Information Layer Overlaid on Top of the Photo */}
                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                        {/* User Identity Details */}
                        <div className="flex-1">
                            {/* Status & Online Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-bold shadow-xl mb-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                <Trophy size={13} className="text-amber-400 shrink-0" />
                                <span>
                                    {(user.orderCount || 0) >= 50
                                        ? 'Leyenda del Sushi'
                                        : (user.orderCount || 0) >= 20
                                          ? 'Cliente VIP'
                                          : (user.orderCount || 0) >= 5
                                            ? 'Cliente Fiel'
                                            : 'Nuevo Miembro'}
                                </span>
                            </div>

                            {/* Name */}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white m-0 tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
                                {user.name}
                            </h1>

                            {/* Email & Member Since */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-zinc-300 text-xs sm:text-sm font-medium mt-2 drop-shadow-md">
                                <span>{user.email}</span>
                                <span className="text-white/40">•</span>
                                <span className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-zinc-200 border border-white/10">
                                    Miembro desde{' '}
                                    {new Date(user.createdAt || Date.now()).toLocaleDateString(
                                        'es-ES',
                                        { month: 'short', year: 'numeric' }
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats Grid & Logout Overlaid */}
                        <div className="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <div className="bg-black/50 hover:bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/15 text-center min-w-[110px] flex-1 md:flex-none shadow-2xl transition-all">
                                <div className="text-white font-black text-2xl leading-none drop-shadow">
                                    {user.orderCount || 0}
                                </div>
                                <div className="text-zinc-300 text-[10px] uppercase font-bold tracking-widest mt-1 opacity-80">
                                    Pedidos
                                </div>
                            </div>

                            <div className="bg-black/50 hover:bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/15 text-center min-w-[110px] flex-1 md:flex-none shadow-2xl transition-all">
                                <div className="text-amber-400 font-black text-2xl leading-none flex items-center justify-center gap-1 drop-shadow">
                                    {user.coinsBalance || 0}
                                </div>
                                <div className="text-zinc-300 text-[10px] uppercase font-bold tracking-widest mt-1 opacity-80">
                                    Maksim Coins
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="bg-white/15 hover:bg-red-500/80 hover:border-red-400/50 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20 text-white font-bold transition-all flex items-center justify-center gap-2 flex-1 md:flex-none shadow-2xl active:scale-95 cursor-pointer"
                                title="Cerrar sesión"
                            >
                                <LogOut size={18} strokeWidth={2} />
                                <span className="md:hidden">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-2 md:px-4 pt-6 pb-20 relative z-20">
                {/* Push Notifications Prompt - Clean & Slim */}
                {isSupported && !isSubscribed && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5 flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-50/90 border border-blue-200/60 rounded-2xl text-blue-950 shadow-sm"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <BellRing size={16} className="text-blue-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 m-0 truncate">
                                    Activa las notificaciones
                                </p>
                                <p className="text-[10px] text-gray-500 m-0 truncate hidden sm:block">
                                    Recibe avisos sobre el estado de tu pedido en tiempo real
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={subscribeToPush}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                        >
                            Activar
                        </button>
                    </motion.div>
                )}

                {/* Loyalty Program Section - Unified & Clean */}
                <div className="mb-6 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <div>
                            <h3 className="text-sm font-extrabold text-gray-900 m-0 uppercase tracking-tight">
                                Premios por fidelidad
                            </h3>
                            <p className="text-[11px] text-gray-400 font-medium m-0">
                                Descuentos y regalos automáticos acumulando pedidos
                            </p>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full shrink-0">
                            {user.orderCount || 0} pedidos
                        </span>
                    </div>

                    <div className="space-y-5">
                        {/* Reward 1: Descuento 5% */}
                        <div>
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                        <Percent size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                                            Próximo descuento 5%
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            Cada 5 pedidos
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-xs font-extrabold text-orange-600">
                                        {Math.max(0, 4 - ((user.orderCount || 0) % 5)) === 0
                                            ? '¡Listo para usar!'
                                            : `Faltan ${Math.max(0, 4 - ((user.orderCount || 0) % 5))}`}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block font-medium">
                                        {(user.orderCount || 0) % 5} / 4 pedidos
                                    </span>
                                </div>
                            </div>

                            {/* Clean, slim progress bar */}
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min(100, (((user.orderCount || 0) % 5) / 4) * 100)}%`,
                                    }}
                                    className={`h-full rounded-full transition-all ${
                                        (user.orderCount || 0) % 5 === 4
                                            ? 'bg-emerald-500'
                                            : 'bg-orange-500'
                                    }`}
                                />
                            </div>

                            {/* Active Loyalty Promo Code */}
                            {loyaltyCode && (
                                <div className="mt-3 p-2.5 bg-orange-50/80 rounded-xl border border-orange-100 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wide block">
                                            Tu código -5%:{' '}
                                            <span className="font-mono text-xs font-black">
                                                {loyaltyCode.code}
                                            </span>
                                        </span>
                                        <span className="text-[9px] text-gray-500 block">
                                            Expira:{' '}
                                            {getExpiryString(
                                                loyaltyCode.code,
                                                loyaltyCode.createdAt
                                            )}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(loyaltyCode.code)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                            copiedCode === loyaltyCode.code
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-orange-600 text-white hover:bg-orange-700'
                                        }`}
                                    >
                                        {copiedCode === loyaltyCode.code ? (
                                            <>
                                                <ClipboardCheck size={13} strokeWidth={2.5} />
                                                <span>Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={13} strokeWidth={2.5} />
                                                <span>Copiar</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Reward 2: Roll Dulce de Regalo */}
                        <div>
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <Gift size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                                            Roll dulce de regalo 🍣
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            Cada 10 pedidos
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-xs font-extrabold text-amber-600">
                                        {Math.max(0, 9 - ((user.orderCount || 0) % 10)) === 0
                                            ? '¡Listo para usar!'
                                            : `Faltan ${Math.max(0, 9 - ((user.orderCount || 0) % 10))}`}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block font-medium">
                                        {(user.orderCount || 0) % 10} / 9 pedidos
                                    </span>
                                </div>
                            </div>

                            {/* Clean, slim progress bar */}
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min(100, (((user.orderCount || 0) % 10) / 9) * 100)}%`,
                                    }}
                                    className={`h-full rounded-full transition-all ${
                                        (user.orderCount || 0) % 10 === 9
                                            ? 'bg-emerald-500'
                                            : 'bg-amber-500'
                                    }`}
                                />
                            </div>

                            {/* Active Dessert Promo Code */}
                            {dessertCode && (
                                <div className="mt-3 p-2.5 bg-amber-50/80 rounded-xl border border-amber-100 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block">
                                            Tu código regalo:{' '}
                                            <span className="font-mono text-xs font-black">
                                                {dessertCode.code}
                                            </span>
                                        </span>
                                        <span className="text-[9px] text-gray-500 block">
                                            Expira:{' '}
                                            {getExpiryString(
                                                dessertCode.code,
                                                dessertCode.createdAt
                                            )}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(dessertCode.code)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                            copiedCode === dessertCode.code
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-amber-600 text-white hover:bg-amber-700'
                                        }`}
                                    >
                                        {copiedCode === dessertCode.code ? (
                                            <>
                                                <ClipboardCheck size={13} strokeWidth={2.5} />
                                                <span>Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={13} strokeWidth={2.5} />
                                                <span>Copiar</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Invite a Friend Section */}
                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[32px] p-6 shadow-xl border border-white/20 relative overflow-hidden group text-white"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-colors" />

                        <div className="flex items-start justify-between gap-4 relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">🤝</span>
                                    <h3 className="text-xl font-black uppercase tracking-tight m-0">
                                        Invita y Gana
                                    </h3>
                                </div>
                                <p className="text-sm font-medium text-white/90 mb-4 leading-relaxed max-w-sm">
                                    Regala a un amigo un{' '}
                                    <strong className="text-white">15% de descuento</strong> en su
                                    primer pedido y llévate{' '}
                                    <strong className="text-white">5 Maksim Coins</strong> (5€)
                                    cuando lo reciba.
                                </p>

                                <div className="bg-black/20 rounded-2xl p-4 border border-white/10 backdrop-blur-sm flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                    <div>
                                        <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">
                                            Tu código de invitación
                                        </div>
                                        <div className="text-xl font-black font-mono tracking-wider">
                                            REF-{user.id.substring(0, 8).toUpperCase()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(
                                                `REF-${user.id.substring(0, 8).toUpperCase()}`
                                            )
                                        }
                                        className={`p-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center min-w-[48px] ${
                                            copiedCode ===
                                            `REF-${user.id.substring(0, 8).toUpperCase()}`
                                                ? 'bg-green-500 text-white shadow-green-900/20'
                                                : 'bg-white text-purple-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {copiedCode ===
                                        `REF-${user.id.substring(0, 8).toUpperCase()}` ? (
                                            <ClipboardCheck size={20} strokeWidth={2.5} />
                                        ) : (
                                            <Copy size={20} strokeWidth={2.5} />
                                        )}
                                    </button>
                                </div>

                                {friends.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-white/80 mb-4">
                                            Tus amigos invitados ({friends.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {friends.map((friend, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between bg-black/10 rounded-xl p-3 border border-white/5"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                                                            👤
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white leading-none mb-1">
                                                                {friend.name}
                                                            </div>
                                                            <div className="text-[10px] text-white/60 font-medium">
                                                                {new Date(
                                                                    friend.date
                                                                ).toLocaleDateString('es-ES')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {friend.rewarded ? (
                                                        <div className="bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <Check size={12} strokeWidth={3} />
                                                            +5 Coins
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white/10 text-white/70 border border-white/10 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                            <Clock size={12} strokeWidth={2} />
                                                            Pendiente
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Additional Active Coupons Section */}
                {(welcomeCode || birthdayCode || (otherCodes && otherCodes.length > 0)) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-white rounded-[40px] shadow-xl border border-white relative overflow-hidden"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                <Tag size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">
                                Mis Cupones Disponibles
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {welcomeCode && (
                                <div className="p-4 bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-3xl relative overflow-hidden group">
                                    <div className="mb-2 flex justify-between items-start">
                                        <div className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                            Bienvenida -10%
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(welcomeCode.code)}
                                            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                                                copiedCode === welcomeCode.code
                                                    ? 'bg-green-500 text-white'
                                                    : 'hover:bg-orange-600 hover:text-white text-orange-600'
                                            }`}
                                        >
                                            {copiedCode === welcomeCode.code ? (
                                                <ClipboardCheck size={12} strokeWidth={3} />
                                            ) : (
                                                <Copy size={12} strokeWidth={3} />
                                            )}
                                        </button>
                                    </div>
                                    <div className="text-lg font-black text-gray-900 mb-1">
                                        {welcomeCode.code}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium leading-tight mb-2">
                                        {
                                            'Válido por 7 días tras el registro. Úsalo al finalizar tu pedido.'
                                        }
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-500 uppercase tracking-tighter">
                                        <div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
                                        Expira el:{' '}
                                        {getExpiryString(welcomeCode.code, welcomeCode.createdAt)}
                                    </div>
                                </div>
                            )}

                            {birthdayCode && (
                                <div className="p-4 bg-gradient-to-br from-pink-50 to-white border border-pink-100 rounded-3xl relative overflow-hidden group">
                                    <div className="mb-2 flex justify-between items-start">
                                        <div className="px-2 py-0.5 bg-pink-100 text-pink-600 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                            Cumpleaños 🎉
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(birthdayCode.code)}
                                            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                                                copiedCode === birthdayCode.code
                                                    ? 'bg-green-500 text-white'
                                                    : 'hover:bg-pink-600 hover:text-white text-pink-600'
                                            }`}
                                        >
                                            {copiedCode === birthdayCode.code ? (
                                                <ClipboardCheck size={12} strokeWidth={3} />
                                            ) : (
                                                <Copy size={12} strokeWidth={3} />
                                            )}
                                        </button>
                                    </div>
                                    <div className="text-lg font-black text-gray-900 mb-1">
                                        {birthdayCode.code}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium leading-tight mb-2">
                                        ¡Feliz cumpleaños! Un regalo especial solo para ti.
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-pink-500 uppercase tracking-tighter">
                                        <div className="w-1 h-1 rounded-full bg-pink-400 animate-pulse" />
                                        Expira el:{' '}
                                        {getExpiryString(birthdayCode.code, birthdayCode.createdAt)}
                                    </div>
                                </div>
                            )}

                            {otherCodes &&
                                otherCodes.map(promo => (
                                    <div
                                        key={promo.code}
                                        className="p-4 bg-gray-50 border border-gray-100 rounded-3xl group"
                                    >
                                        <div className="mb-2 flex justify-between items-start">
                                            <div className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                                Bonifición Especial
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(promo.code)}
                                                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                                                    copiedCode === promo.code
                                                        ? 'bg-green-500 text-white'
                                                        : 'hover:bg-gray-900 hover:text-white text-gray-500'
                                                }`}
                                            >
                                                {copiedCode === promo.code ? (
                                                    <ClipboardCheck size={12} strokeWidth={3} />
                                                ) : (
                                                    <Copy size={12} strokeWidth={3} />
                                                )}
                                            </button>
                                        </div>
                                        <div className="text-lg font-black text-gray-900 mb-1">
                                            {promo.code}
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium leading-tight">
                                            -{promo.discountPercentage}% de descuento extra.
                                        </p>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Navigation Sidebar */}
                    <aside
                        className="lg:w-80 shrink-0 sticky z-40 mb-5 lg:mb-0 transition-[top] duration-300"
                        style={{
                            top: 'calc(var(--header-height, 64px) + 12px)',
                        }}
                    >
                        <div className="bg-white/95 md:bg-white backdrop-blur-xl border border-gray-100 md:border-white shadow-sm md:shadow-2xl rounded-2xl md:rounded-[32px] p-1.5 md:p-2 flex md:block overflow-x-auto no-scrollbar gap-1.5 md:gap-2 snap-x snap-mandatory scroll-px-1.5">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        id={`tab-${tab.id}`}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3.5 py-2 px-3 md:p-3.5 rounded-xl md:rounded-2xl transition-all duration-300 group snap-center relative scroll-mx-1.5
                                            ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 border border-transparent'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="profile-tab-active"
                                                className="absolute inset-0 bg-orange-600 shadow-md shadow-orange-200/60 ring-2 md:ring-4 ring-orange-600/5 rounded-xl md:rounded-2xl"
                                                transition={{
                                                    type: 'spring',
                                                    bounce: 0.2,
                                                    duration: 0.6,
                                                }}
                                            />
                                        )}
                                        <div
                                            className={`relative z-10 w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0
                                            ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            <Icon size={15} strokeWidth={2} />
                                        </div>
                                        <span
                                            className={`relative z-20 font-black text-xs md:text-sm whitespace-nowrap uppercase tracking-wider transition-transform ${isActive ? 'md:translate-x-0.5' : ''}`}
                                        >
                                            {tab.label}
                                        </span>
                                        <ChevronRight
                                            size={14}
                                            strokeWidth={1.5}
                                            className={`hidden md:block ml-auto transition-all ${isActive ? 'rotate-90 opacity-100' : 'opacity-20'}`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0" id="profile-content">
                        <div className="bg-transparent md:bg-white/90 md:backdrop-blur-xl md:border md:border-white md:shadow-2xl rounded-none md:rounded-[32px] md:overflow-hidden">
                            <div className="p-0 md:p-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {activeTab === 'profile' && (
                                            <ProfileTab user={user} updateProfile={updateProfile} />
                                        )}
                                        {activeTab === 'addresses' && (
                                            <AddressesTab
                                                addresses={user.addresses}
                                                deliveryZones={deliveryZones}
                                                addAddress={addAddress}
                                                editAddress={editAddress}
                                                removeAddress={removeAddress}
                                                setDefaultAddress={setDefaultAddress}
                                            />
                                        )}
                                        {activeTab === 'orders' && <OrdersTab />}
                                        {activeTab === 'favorites' && <FavoritesTab />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
