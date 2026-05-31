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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
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

    // Scroll active tab into view on mobile
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

    // Scroll to content when tab changes (especially on mobile)
    // Removed isFirstMount from here because PageWrapper handles initial scroll
    useEffect(() => {
        if (isFirstMount.current) return;
        if (activeTab) {
            const contentElement = document.getElementById('profile-content');
            if (contentElement && typeof contentElement.scrollIntoView === 'function') {
                const headerOffset = window.innerWidth < 768 ? 190 : 150;
                const elementPosition = contentElement.getBoundingClientRect().top;
                const offsetPosition =
                    elementPosition + (window.scrollY || window.pageYOffset) - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth',
                });
            }
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

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl text-center border border-gray-100">
                    <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner border-2 border-white">
                        🔒
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                        Inicia sesión
                    </h1>
                    <p className="text-gray-500 font-medium mb-10 leading-relaxed italic">
                        Inicia sesión para poder gestionar tu perfil, direcciones y ver tu historial
                        de pedidos.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 transform hover:scale-[1.02]"
                    >
                        Volver al inicio
                    </button>
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

            {/* Header Section - Increased pt for mobile to account for transparent header */}
            <div
                className="bg-orange-600 pb-28 px-2 md:px-4 relative overflow-hidden"
                style={{ paddingTop: 'calc(var(--header-height, 64px) + 40px)' }}
            >
                {/* Wallpaper Pattern Overlay (Staggered Checkerboard) */}
                <div className="absolute inset-[-50%] z-0 opacity-10 pointer-events-none flex flex-col justify-center items-center gap-24 md:gap-32 -rotate-12 scale-110">
                    {Array.from({ length: 12 }).map((_, rowIndex) => (
                        <div
                            key={`row-${rowIndex}`}
                            className="flex items-center gap-24 md:gap-32"
                            style={{
                                transform: rowIndex % 2 !== 0 ? 'translateX(200px)' : 'none',
                            }}
                        >
                            {Array.from({ length: 8 }).map((_, colIndex) => (
                                <img
                                    key={`col-${rowIndex}-${colIndex}`}
                                    src="/logo.svg"
                                    alt=""
                                    className="h-10 md:h-16 object-contain grayscale brightness-200"
                                />
                            ))}
                        </div>
                    ))}
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white p-1 shadow-xl relative">
                            <div className="w-full h-full rounded-[22px] bg-orange-50 flex items-center justify-center text-2xl md:text-4xl border-2 border-white overflow-hidden shadow-inner">
                                {user.avatar ? (
                                    user.avatar.startsWith('http') ? (
                                        <SafeImage
                                            src={user.avatar}
                                            getOptimizedUrl={getSharpAvatar}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                            fallbackContent={
                                                <div className="text-2xl md:text-4xl select-none font-black text-orange-600/60 uppercase">
                                                    {initials}
                                                </div>
                                            }
                                        />
                                    ) : (
                                        <span className="select-none">{user.avatar}</span>
                                    )
                                ) : (
                                    <span className="select-none text-orange-600/60 font-black">
                                        {initials}
                                    </span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white w-6 h-6 rounded-full shadow-lg flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 mb-2">
                                <h1 className="text-2xl md:text-3xl font-black text-white m-0 tracking-tight">
                                    {user.name}
                                </h1>
                                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-white border border-white/10 w-fit mx-auto md:mx-0">
                                    <Trophy size={10} className="text-amber-400" />
                                    {(user.orderCount || 0) >= 50
                                        ? 'Leyenda del Sushi'
                                        : (user.orderCount || 0) >= 20
                                          ? 'Cliente VIP'
                                          : (user.orderCount || 0) >= 5
                                            ? 'Cliente Fiel'
                                            : 'Nuevo Miembro'}
                                </div>
                            </div>
                            <p className="text-orange-100 font-medium opacity-80 m-0 text-sm mb-3">
                                {user.email}
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white border border-white/5">
                                    Miembro desde{' '}
                                    {new Date(user.createdAt || Date.now()).toLocaleDateString(
                                        'es-ES',
                                        { month: 'short', year: 'numeric' }
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:flex gap-3 md:gap-4 w-full md:w-auto mt-4 md:mt-0">
                            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-[18px] border border-white/20 text-center min-w-[120px] flex-1 md:flex-none">
                                <div className="text-white font-black text-2xl leading-none">
                                    {user.orderCount || 0}
                                </div>
                                <div className="text-orange-100 text-[10px] uppercase font-bold tracking-widest mt-1 opacity-70">
                                    Pedidos
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-[18px] border border-white/20 text-center min-w-[120px] flex-1 md:flex-none">
                                <div className="text-white font-black text-2xl leading-none flex items-center justify-center gap-1">
                                    {user.coinsBalance || 0}
                                </div>
                                <div className="text-orange-100 text-[10px] uppercase font-bold tracking-widest mt-1 opacity-70">
                                    Maksim Coins
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-[18px] border border-white/20 text-white font-bold transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"
                            >
                                <LogOut size={18} strokeWidth={1.5} />
                                <span className="md:hidden">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-2 md:px-4 -mt-16 pb-20 relative z-20">
                {/* Loyalty Program Section */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[32px] p-5 shadow-xl border border-white relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
                                <motion.div
                                    animate={
                                        (user.orderCount || 0) % 5 === 4
                                            ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                                            : {}
                                    }
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Percent size={24} strokeWidth={2.5} />
                                </motion.div>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 m-0 uppercase tracking-tight">
                                    Próximo Descuento 5%
                                </h3>
                                <p className="text-[11px] text-gray-400 font-medium m-0">
                                    Cada 5 pedidos
                                </p>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="block text-lg font-black text-orange-600 leading-none">
                                    {Math.max(0, 4 - ((user.orderCount || 0) % 5))}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                    {Math.max(0, 4 - ((user.orderCount || 0) % 5)) === 0
                                        ? '¡LISTO!'
                                        : 'faltan'}
                                </span>
                            </div>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 mb-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${Math.min(100, (((user.orderCount || 0) % 5) / 4) * 100)}%`,
                                }}
                                className={`h-full rounded-full shadow-[0_0_8px_rgba(242,101,34,0.3)] ${
                                    (user.orderCount || 0) % 5 === 4
                                        ? 'bg-green-500'
                                        : 'bg-orange-600'
                                }`}
                            />
                        </div>

                        {loyaltyCode && (
                            <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-0.5">
                                        Tu Código -5%:
                                    </span>
                                    <span className="text-sm font-black text-orange-600 tracking-wider">
                                        {loyaltyCode.code}
                                    </span>
                                    <span className="text-[9px] font-black text-gray-400 mt-1 flex items-center gap-1.5 uppercase tracking-tighter">
                                        <div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
                                        Expira el:{' '}
                                        {getExpiryString(loyaltyCode.code, loyaltyCode.createdAt)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(loyaltyCode.code)}
                                    className={`p-2.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
                                        copiedCode === loyaltyCode.code
                                            ? 'bg-green-500 text-white shadow-green-200'
                                            : 'bg-orange-600 text-white shadow-orange-200'
                                    }`}
                                >
                                    {copiedCode === loyaltyCode.code ? (
                                        <>
                                            <ClipboardCheck size={14} strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">
                                                Copiado
                                            </span>
                                        </>
                                    ) : (
                                        <Copy size={14} strokeWidth={3} />
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {(user.orderCount || 0) % 5} / 4 pedidos
                            </span>
                            <span className="text-[9px] font-bold text-gray-300 italic">
                                *Código enviado tras el 4º pedido para usar en el 5º
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[32px] p-6 shadow-xl border border-white relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                                <motion.div
                                    animate={
                                        (user.orderCount || 0) % 10 === 9
                                            ? { scale: [1, 1.2, 1], y: [0, -5, 0] }
                                            : {}
                                    }
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Gift size={24} strokeWidth={2.5} />
                                </motion.div>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 m-0 uppercase tracking-tight">
                                    Roll Dulce de Regalo
                                </h3>
                                <p className="text-[11px] text-gray-400 font-medium m-0">
                                    Cada 10 pedidos
                                </p>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="block text-lg font-black text-amber-600 leading-none">
                                    {Math.max(0, 9 - ((user.orderCount || 0) % 10))}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                    {Math.max(0, 9 - ((user.orderCount || 0) % 10)) === 0
                                        ? '¡LISTO!'
                                        : 'faltan'}
                                </span>
                            </div>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 mb-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${Math.min(100, (((user.orderCount || 0) % 10) / 9) * 100)}%`,
                                }}
                                className={`h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)] ${
                                    (user.orderCount || 0) % 10 === 9
                                        ? 'bg-green-500'
                                        : 'bg-amber-500'
                                }`}
                            />
                        </div>

                        {dessertCode && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-0.5">
                                        Tu Código Roll Dulce 🍣
                                    </span>
                                    <span className="text-sm font-black text-amber-600 tracking-wider">
                                        {dessertCode.code}
                                    </span>
                                    <span className="text-[8px] font-bold text-amber-500">
                                        Expira el:{' '}
                                        {getExpiryString(dessertCode.code, dessertCode.createdAt)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(dessertCode.code)}
                                    className={`p-2.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
                                        copiedCode === dessertCode.code
                                            ? 'bg-green-500 text-white shadow-green-200'
                                            : 'bg-amber-600 text-white shadow-amber-200'
                                    }`}
                                >
                                    {copiedCode === dessertCode.code ? (
                                        <>
                                            <ClipboardCheck size={14} strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">
                                                Copiado
                                            </span>
                                        </>
                                    ) : (
                                        <Copy size={14} strokeWidth={3} />
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {(user.orderCount || 0) % 10} / 9 pedidos
                            </span>
                            <span className="text-[9px] font-bold text-gray-300 italic">
                                *Roll dulce enviado tras el 9º pedido para usar en el 10º
                            </span>
                        </div>
                    </motion.div>
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
                        <div className="bg-white/95 md:bg-white backdrop-blur-xl border-y md:border border-gray-100 md:border-white shadow-sm md:shadow-2xl rounded-none md:rounded-[32px] p-1.5 flex md:block overflow-x-auto no-scrollbar gap-2 px-4 md:px-2 snap-x snap-mandatory scroll-px-4">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        id={`tab-${tab.id}`}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`shrink-0 md:w-full flex items-center gap-2.5 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 group snap-center relative scroll-mx-2
                                            ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 border border-transparent'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="profile-tab-active"
                                                className="absolute inset-0 bg-orange-600 shadow-lg shadow-orange-200 ring-4 ring-orange-600/5 rounded-2xl"
                                                transition={{
                                                    type: 'spring',
                                                    bounce: 0.2,
                                                    duration: 0.6,
                                                }}
                                            />
                                        )}
                                        <div
                                            className={`relative z-10 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                                            ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            <Icon size={16} strokeWidth={1.5} />
                                        </div>
                                        <span
                                            className={`relative z-20 font-black text-[11px] md:text-sm whitespace-nowrap uppercase tracking-wider transition-transform ${isActive ? 'md:translate-x-0.5' : ''}`}
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
                        <div className="bg-transparent md:bg-white/90 md:backdrop-blur-xl md:border md:border-white md:shadow-2xl rounded-[32px] overflow-hidden">
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
