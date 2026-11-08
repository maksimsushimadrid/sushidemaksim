import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
    Share2,
    Camera,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { USER_QUERY_KEY } from '../hooks/queries/useUser';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../context/ToastContext';
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
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isUploadingHeroPhoto, setIsUploadingHeroPhoto] = useState(false);
    const heroPhotoInputRef = useRef<HTMLInputElement>(null);
    const { isSupported, isSubscribed, isSubscribing, subscribeToPush } = usePushNotifications();
    const { success: showSuccess, error: showError } = useToast();

    const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showError('La imagen no debe superar los 5MB');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showError('Formato no permitido. Usa JPG, PNG o WebP');
            return;
        }

        try {
            setIsUploadingHeroPhoto(true);
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await api.formData('/user/upload-avatar', formData);
            if (!res.url) throw new Error('No se recibió la URL de la imagen');

            await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
            await updateProfile({ avatar: res.url });
            showSuccess('¡Foto de perfil subida con éxito! 📸');
        } catch (err: any) {
            showError(err.message || 'Error al subir la imagen');
        } finally {
            setIsUploadingHeroPhoto(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleActivatePush = async () => {
        const res = await subscribeToPush();
        if (res.ok) {
            showSuccess('¡Notificaciones activadas correctamente! 🔔');
        } else if (res.reason === 'denied') {
            showError(
                'Las notificaciones están bloqueadas en tu navegador. Actívalas en los ajustes del sitio (icono 🔒 en la barra de direcciones).'
            );
        } else if (res.reason) {
            showError('No se pudieron activar las notificaciones en este momento.');
        }
    };

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
                <div className="max-w-md w-full bg-white rounded-2xl p-8 sm:p-12 shadow-2xl text-center border border-gray-100">
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
            return now.getTime() < created.getTime() + 7 * 24 * 60 * 60 * 1000;
        }
        if (p.code.startsWith('LOYALTY')) {
            return now.getTime() < created.getTime() + 7 * 24 * 60 * 60 * 1000;
        }
        if (p.code.startsWith('SPECIAL')) {
            return now.getTime() < created.getTime() + 14 * 24 * 60 * 60 * 1000;
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
            expiryDate = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (code.startsWith('LOYALTY')) {
            expiryDate = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (code.startsWith('SPECIAL')) {
            expiryDate = new Date(created.getTime() + 14 * 24 * 60 * 60 * 1000);
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

    const shareReferralCode = async (code: string) => {
        const shareUrl = `${window.location.origin}/menu`;
        const shareText = `¡Usa mi código de invitación ${code} en Sushi de Maksim y llévate un 15% de descuento en tu primer pedido! 🍣`;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: '¡15% de descuento en Sushi de Maksim!',
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
            }
        }
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        showSuccess('¡Enlace de invitación copiado para compartir!');
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

                {/* Centered Add Photo Button in Open Hero Space */}
                <div className="flex-1 flex items-center justify-center relative z-10 py-6">
                    <input
                        ref={heroPhotoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleHeroPhotoUpload}
                        className="hidden"
                    />
                    <button
                        type="button"
                        disabled={isUploadingHeroPhoto}
                        onClick={() => heroPhotoInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center gap-2 text-white/85 hover:text-white transition-all active:scale-95 cursor-pointer bg-transparent border-none p-3 disabled:opacity-50"
                    >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-2xl transition-all group-hover:scale-105">
                            <Camera size={24} strokeWidth={2} className="text-white" />
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest drop-shadow-md">
                            {isUploadingHeroPhoto
                                ? 'Subiendo...'
                                : user.avatar && user.avatar.startsWith('http')
                                  ? 'Cambiar foto'
                                  : 'Añadir foto'}
                        </span>
                    </button>
                </div>

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
            <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 pt-6 pb-20 relative z-20">
                {/* Push Notifications Prompt - Flat & Clean */}
                {isSupported && !isSubscribed && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleActivatePush}
                        className="mb-5 flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-white hover:bg-gray-50/90 border border-gray-100 rounded-2xl shadow-sm transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <BellRing
                                size={18}
                                className="text-orange-600 shrink-0 group-hover:scale-110 transition-transform"
                            />
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-gray-900 m-0 leading-snug">
                                    Activa las notificaciones
                                </p>
                                <p className="text-[11px] text-gray-500 m-0 leading-snug">
                                    Recibe avisos sobre el estado de tu pedido en tiempo real
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={isSubscribing}
                            onClick={e => {
                                e.stopPropagation();
                                handleActivatePush();
                            }}
                            className="text-xs font-extrabold text-orange-600 group-hover:text-orange-700 flex items-center gap-1 shrink-0 bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
                        >
                            {isSubscribing ? 'Activando...' : 'Activar'}
                            <ChevronRight size={15} strokeWidth={2.5} />
                        </button>
                    </motion.div>
                )}

                {/* Loyalty Program Section - Unified & Clean */}
                <div className="mb-5 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <div>
                            <h3 className="text-sm font-extrabold text-gray-900 m-0 uppercase tracking-tight">
                                Premios por fidelidad
                            </h3>
                            <p className="text-[11px] text-gray-400 font-medium m-0">
                                Descuentos y regalos automáticos acumulando pedidos entregados
                            </p>
                        </div>
                        <span className="text-xs font-bold text-orange-600 shrink-0">
                            {user.orderCount || 0} pedidos
                        </span>
                    </div>

                    <div className="space-y-5">
                        {/* Reward 1: Descuento 5% */}
                        <div>
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <Percent
                                        size={16}
                                        strokeWidth={2.5}
                                        className="text-orange-600 shrink-0"
                                    />
                                    <div>
                                        <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                                            Próximo descuento 5%
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            Cada 5 pedidos • Recibes un cupón al completar 4 pedidos
                                            entregados (válido 7 días)
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
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
                                <div className="mt-3 pt-2.5 border-t border-dashed border-gray-200 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wide block">
                                            Tu código -{loyaltyCode.discountPercentage || 5}%:{' '}
                                            <span className="font-mono text-xs font-black text-gray-900">
                                                {loyaltyCode.code}
                                            </span>
                                        </span>
                                        <span className="text-[10px] text-gray-400 block">
                                            Válido 7 días • Un solo uso • Expira:{' '}
                                            {getExpiryString(
                                                loyaltyCode.code,
                                                loyaltyCode.createdAt
                                            )}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(loyaltyCode.code)}
                                        className={`text-xs font-extrabold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer bg-transparent border-none p-0 ${
                                            copiedCode === loyaltyCode.code
                                                ? 'text-emerald-600'
                                                : 'text-orange-600 hover:text-orange-700'
                                        }`}
                                    >
                                        {copiedCode === loyaltyCode.code ? (
                                            <>
                                                <ClipboardCheck size={14} strokeWidth={2.5} />
                                                <span>Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} strokeWidth={2.5} />
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
                                    <Gift
                                        size={16}
                                        strokeWidth={2.5}
                                        className="text-amber-600 shrink-0"
                                    />
                                    <div>
                                        <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                                            Roll dulce de regalo
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            Cada 10 pedidos • Recibes un cupón al completar 9
                                            pedidos entregados (válido 30 días)
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
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
                                <div className="mt-3 pt-2.5 border-t border-dashed border-gray-200 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide block">
                                            Tu código regalo (Roll dulce gratis):{' '}
                                            <span className="font-mono text-xs font-black text-gray-900">
                                                {dessertCode.code}
                                            </span>
                                        </span>
                                        <span className="text-[10px] text-gray-400 block">
                                            Válido 30 días • Añade automáticamente el postre al
                                            carrito • Expira:{' '}
                                            {getExpiryString(
                                                dessertCode.code,
                                                dessertCode.createdAt
                                            )}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(dessertCode.code)}
                                        className={`text-xs font-extrabold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer bg-transparent border-none p-0 ${
                                            copiedCode === dessertCode.code
                                                ? 'text-emerald-600'
                                                : 'text-amber-600 hover:text-amber-700'
                                        }`}
                                    >
                                        {copiedCode === dessertCode.code ? (
                                            <>
                                                <ClipboardCheck size={14} strokeWidth={2.5} />
                                                <span>Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} strokeWidth={2.5} />
                                                <span>Copiar</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium">
                        <span>• Solo cuentan pedidos entregados.</span>
                        <span>• Además, ganas un 5% en Maksim Coins por cada pedido.</span>
                        <span>• 1 cupón por pedido (no acumulables entre sí).</span>
                    </div>
                </div>

                {/* Invite a Friend Section - Unified & Flat (No Nested Blocks) */}
                <div className="mb-5 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">🤝</span>
                                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-tight m-0">
                                    Invita y gana
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 font-medium m-0 leading-relaxed">
                                Regala a un amigo un{' '}
                                <strong className="text-gray-900">15% de descuento</strong> en su
                                primer pedido y llévate{' '}
                                <strong className="text-orange-600">5 Maksim Coins (5€)</strong>{' '}
                                cuando lo reciba.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                                    Tu código de invitación
                                </span>
                                <span className="text-lg sm:text-xl font-black font-mono text-gray-900 tracking-wider block">
                                    REF-{user.id.substring(0, 8).toUpperCase()}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5 w-full max-w-[280px] sm:w-[260px]">
                                <button
                                    type="button"
                                    onClick={() =>
                                        copyToClipboard(
                                            `REF-${user.id.substring(0, 8).toUpperCase()}`
                                        )
                                    }
                                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                                        copiedCode ===
                                        `REF-${user.id.substring(0, 8).toUpperCase()}`
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                    }`}
                                >
                                    {copiedCode ===
                                    `REF-${user.id.substring(0, 8).toUpperCase()}` ? (
                                        <>
                                            <ClipboardCheck size={14} strokeWidth={2.5} />
                                            <span>Copiado</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} strokeWidth={2.5} />
                                            <span>Copiar</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        shareReferralCode(
                                            `REF-${user.id.substring(0, 8).toUpperCase()}`
                                        )
                                    }
                                    className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    <Share2 size={14} strokeWidth={2.5} />
                                    <span>Compartir</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-400 font-medium">
                            Código válido para el primer pedido de tu amigo.
                        </span>
                        <Link
                            to="/promo"
                            className="text-[11px] font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 no-underline shrink-0"
                        >
                            <span>¿Cómo funciona?</span>
                            <ChevronRight size={13} strokeWidth={2.5} />
                        </Link>
                    </div>

                    {friends.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2.5 m-0">
                                Tus amigos invitados ({friends.length})
                            </h4>
                            <div className="divide-y divide-gray-100">
                                {friends.map((friend, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                                    >
                                        <div>
                                            <div className="text-xs font-bold text-gray-900">
                                                {friend.name}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium">
                                                {new Date(friend.date).toLocaleDateString('es-ES')}
                                            </div>
                                        </div>
                                        {friend.rewarded ? (
                                            <span className="text-emerald-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                <Check size={12} strokeWidth={3} />
                                                +5 Coins
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Clock size={12} strokeWidth={2} />
                                                Pendiente de entrega
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Active Coupons Section - Flat Rows */}
                {(welcomeCode || birthdayCode || (otherCodes && otherCodes.length > 0)) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-2.5 pb-3.5 mb-3.5 border-b border-gray-100">
                            <Tag size={16} strokeWidth={2.5} className="text-orange-600 shrink-0" />
                            <div>
                                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-tight m-0">
                                    Mis cupones disponibles
                                </h3>
                                <p className="text-[11px] text-gray-400 font-medium m-0">
                                    Copia tu código y aplícalo en la cesta antes de finalizar el
                                    pedido (1 cupón por pedido)
                                </p>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {welcomeCode && (
                                <div className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-mono text-sm font-black text-gray-900">
                                                {welcomeCode.code}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-orange-600 uppercase">
                                                Bienvenida -{welcomeCode.discountPercentage || 10}%
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium m-0 leading-snug">
                                            Pedido mínimo de 20,00€ (subtotal). Válido 7 días tras
                                            el registro. Expira el:{' '}
                                            {getExpiryString(
                                                welcomeCode.code,
                                                welcomeCode.createdAt
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(welcomeCode.code)}
                                        className={`text-xs font-extrabold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer bg-transparent border-none p-0 ${
                                            copiedCode === welcomeCode.code
                                                ? 'text-emerald-600'
                                                : 'text-orange-600 hover:text-orange-700'
                                        }`}
                                    >
                                        {copiedCode === welcomeCode.code ? (
                                            <>
                                                <ClipboardCheck size={14} strokeWidth={2.5} />
                                                <span>Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} strokeWidth={2.5} />
                                                <span>Copiar</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {birthdayCode && (
                                <div className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-mono text-sm font-black text-gray-900">
                                                {birthdayCode.code}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-pink-600 uppercase">
                                                Cumpleaños -{birthdayCode.discountPercentage || 10}%
                                                🎉
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium m-0 leading-snug">
                                            ¡Feliz cumpleaños! Un solo uso, válido 30 días. Expira
                                            el:{' '}
                                            {getExpiryString(
                                                birthdayCode.code,
                                                birthdayCode.createdAt
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(birthdayCode.code)}
                                        className={`text-xs font-extrabold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer bg-transparent border-none p-0 ${
                                            copiedCode === birthdayCode.code
                                                ? 'text-emerald-600'
                                                : 'text-pink-600 hover:text-pink-700'
                                        }`}
                                    >
                                        {copiedCode === birthdayCode.code ? (
                                            <>
                                                <ClipboardCheck size={14} strokeWidth={2.5} />
                                                <span>Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} strokeWidth={2.5} />
                                                <span>Copiar</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {otherCodes &&
                                otherCodes.map(promo => (
                                    <div
                                        key={promo.code}
                                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-mono text-sm font-black text-gray-900">
                                                    {promo.code}
                                                </span>
                                                <span className="text-[10px] font-extrabold text-gray-600 uppercase">
                                                    Bonificación -{promo.discountPercentage}%
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium m-0 leading-snug">
                                                -{promo.discountPercentage}% de descuento especial
                                                de un solo uso.
                                                {getExpiryString(promo.code, promo.createdAt)
                                                    ? ` Expira el: ${getExpiryString(promo.code, promo.createdAt)}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(promo.code)}
                                            className={`text-xs font-extrabold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer bg-transparent border-none p-0 ${
                                                copiedCode === promo.code
                                                    ? 'text-emerald-600'
                                                    : 'text-orange-600 hover:text-orange-700'
                                            }`}
                                        >
                                            {copiedCode === promo.code ? (
                                                <>
                                                    <ClipboardCheck size={14} strokeWidth={2.5} />
                                                    <span>Copiado</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} strokeWidth={2.5} />
                                                    <span>Copiar</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                <div className="flex flex-col lg:flex-row gap-5">
                    {/* Navigation Sidebar */}
                    <aside
                        className="lg:w-72 shrink-0 sticky z-40 mb-1 lg:mb-0 transition-[top] duration-300"
                        style={{
                            top: 'calc(var(--header-height, 64px) + 12px)',
                        }}
                    >
                        <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-sm rounded-2xl p-1.5 grid grid-cols-4 lg:flex lg:flex-col gap-1.5">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        id={`tab-${tab.id}`}
                                        type="button"
                                        title={tab.label}
                                        aria-label={tab.label}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`w-full flex items-center justify-center lg:justify-start gap-3 py-3 px-3.5 rounded-xl transition-all duration-200 group relative cursor-pointer border-none bg-transparent
                                            ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="profile-tab-active"
                                                className="absolute inset-0 bg-orange-600 rounded-xl"
                                                transition={{
                                                    type: 'spring',
                                                    bounce: 0.15,
                                                    duration: 0.5,
                                                }}
                                            />
                                        )}
                                        <Icon
                                            size={20}
                                            strokeWidth={2.2}
                                            className={`relative z-10 shrink-0 transition-colors ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-gray-500 group-hover:text-gray-900'
                                            }`}
                                        />
                                        <span className="hidden lg:inline relative z-10 font-extrabold text-sm whitespace-nowrap uppercase tracking-wider">
                                            {tab.label}
                                        </span>
                                        <ChevronRight
                                            size={14}
                                            strokeWidth={2}
                                            className={`hidden lg:block relative z-10 ml-auto transition-all ${
                                                isActive ? 'rotate-90 opacity-100' : 'opacity-20'
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0" id="profile-content">
                        <div
                            className={
                                activeTab === 'favorites'
                                    ? ''
                                    : 'bg-white border border-gray-100 shadow-sm rounded-3xl p-5 sm:p-6 md:p-8'
                            }
                        >
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
            </main>
        </div>
    );
}
