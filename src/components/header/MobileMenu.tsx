import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, Megaphone, Phone, Star, LogOut, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { GoogleAuthButton } from '../LoginModal';
import SafeImage from '../common/SafeImage';
import { getSharpAvatar } from '../../utils/avatar';

interface MobileMenuProps {
    showMobileMenu: boolean;
    setShowMobileMenu: (show: boolean) => void;
}

export default function MobileMenu({ showMobileMenu, setShowMobileMenu }: MobileMenuProps) {
    const { user, isAuthenticated, isLoading, logout, loginWithGoogle } = useAuth();
    const { success: showSuccess, error: showError } = useToast();
    const location = useLocation();

    const hasToken = !!localStorage.getItem('sushi_token');
    const showSkeleton = isLoading || (hasToken && !user);

    const initials = user
        ? user.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '';

    const navLinks = [
        { to: '/menu', label: 'Menú', icon: Menu },
        { to: '/tablon', label: 'Tablón', icon: Megaphone },
        { to: '/contacts', label: 'Contactos', icon: Phone },
        { to: '/promo', label: 'Promo', icon: Star },
    ];

    const handleGoogleLogin = async (response: { access_token: string }) => {
        const res = await loginWithGoogle(response.access_token);
        if (res.success) {
            setShowMobileMenu(false);
            showSuccess('¡Bienvenido de nuevo! 🍣');
        } else {
            showError(res.error || 'Error al entrar con Google');
        }
    };

    return createPortal(
        <AnimatePresence>
            {showMobileMenu && (
                <>
                    {/* Full Screen Menu */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                        }}
                        className="fixed inset-0 w-full h-[100dvh] bg-[#FDFBF7] z-[10000] md:hidden overflow-hidden flex flex-col"
                        style={{
                            backgroundImage: `linear-gradient(rgba(251, 247, 240, 0.92), rgba(251, 247, 240, 0.92)), url('/admin-bg.webp')`,
                            backgroundSize: '400px',
                            backgroundRepeat: 'repeat',
                        }}
                        data-lenis-prevent
                    >
                        {/* Top bar: centered logo + close button */}
                        <div className="relative flex items-center justify-center px-4 pt-16 pb-8 shrink-0">
                            <img
                                src="/logo.svg"
                                alt="Sushi de Maksim"
                                className="h-16 w-auto object-contain brightness-0"
                            />
                            <button
                                onClick={() => setShowMobileMenu(false)}
                                className="absolute right-4 top-5 p-2 rounded-xl bg-white/60 text-gray-500 hover:bg-white hover:text-gray-900 transition-all z-20 border border-white/50 shadow-md cursor-pointer backdrop-blur-sm"
                            >
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div
                            className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 pt-2 pb-16 flex flex-col gap-6"
                            data-lenis-prevent
                        >
                            {/* Primary Reservation CTA */}
                            <Link
                                to="/reservar"
                                onClick={() => setShowMobileMenu(false)}
                                className="w-full py-4 px-5 flex items-center justify-center rounded-3xl bg-orange-600 text-white no-underline transition-all active:scale-[0.98] shadow-lg shadow-orange-600/20 border border-orange-500"
                            >
                                <span className="font-black text-[15px] tracking-tight uppercase">
                                    Reservar Mesa
                                </span>
                            </Link>
                            {/* Main Navigation Group */}
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-white/50 overflow-hidden flex flex-col">
                                {navLinks.map((link, idx) => {
                                    const isActive = link.to
                                        ? location.pathname === link.to
                                        : false;

                                    return (
                                        <Link
                                            key={link.to || idx}
                                            to={link.to!}
                                            onClick={() => setShowMobileMenu(false)}
                                            className={`flex items-center justify-center px-5 py-4 w-full transition-colors active:bg-gray-50/50
                                                ${idx !== navLinks.length - 1 ? 'border-b border-gray-100/50' : ''}
                                                ${isActive ? 'bg-orange-50/30' : 'hover:bg-white'}
                                            `}
                                        >
                                            <span
                                                className={`font-bold text-[15px] tracking-tight uppercase ${isActive ? 'text-orange-600' : 'text-gray-900'}`}
                                            >
                                                {link.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>{' '}
                            {/* Auth & Profile Area */}
                            <div className="mt-auto pt-4">
                                {showSkeleton ? (
                                    <div className="w-full h-16 bg-white/50 backdrop-blur-sm rounded-3xl animate-pulse" />
                                ) : isAuthenticated && user ? (
                                    <div className="space-y-4">
                                        <Link
                                            to="/profile"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="px-5 py-4 bg-white/90 backdrop-blur-md rounded-3xl flex items-center gap-3 no-underline transition-all active:scale-[0.98] border border-white shadow-sm"
                                        >
                                            <div
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0 shadow-inner border border-black/10
                                            ${user.avatar?.startsWith('http') ? 'bg-white' : user.avatar ? 'bg-gray-100 text-[24px]' : 'bg-orange-600'}`}
                                            >
                                                {user.avatar ? (
                                                    user.avatar.startsWith('http') ? (
                                                        <SafeImage
                                                            src={user.avatar}
                                                            getOptimizedUrl={getSharpAvatar}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                            fallbackContent={
                                                                <span className="select-none text-sm text-gray-900">
                                                                    {initials}
                                                                </span>
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="select-none text-2xl">
                                                            {user.avatar}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="select-none text-sm">
                                                        {initials}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="font-black text-gray-900 text-[15px] leading-none mb-1.5 truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-[12px] text-gray-500 font-medium leading-none mb-2 truncate">
                                                    {user.email}
                                                </p>
                                                <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest leading-none">
                                                    Ver perfil
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        logout();
                                                        setShowMobileMenu(false);
                                                    }}
                                                    className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border-none cursor-pointer active:scale-95"
                                                >
                                                    <LogOut size={20} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        </Link>

                                        {(user.role === 'admin' || user.role === 'waiter') && (
                                            <Link
                                                to={user.role === 'admin' ? '/admin' : '/waiter'}
                                                onClick={() => setShowMobileMenu(false)}
                                                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl no-underline text-orange-600 text-[13px] font-black bg-orange-100/50 backdrop-blur-sm border border-orange-200/50 shadow-sm"
                                            >
                                                <ShieldCheck size={18} strokeWidth={1.5} />
                                                {user.role === 'admin'
                                                    ? 'PANEL ADMINISTRADOR'
                                                    : 'TERMINAL CAMARERO'}
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                setShowMobileMenu(false);
                                                document.dispatchEvent(
                                                    new CustomEvent('custom:openLogin', {
                                                        detail: { mode: 'login' },
                                                    })
                                                );
                                            }}
                                            className="w-full bg-gray-900 text-white border-none py-4 rounded-[20px] font-black text-[14px] cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2"
                                        >
                                            INICIAR SESIÓN
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMobileMenu(false);
                                                document.dispatchEvent(
                                                    new CustomEvent('custom:openLogin', {
                                                        detail: { mode: 'register' },
                                                    })
                                                );
                                            }}
                                            className="w-full bg-white text-gray-900 border border-gray-200 py-4 rounded-[20px] font-black text-[14px] cursor-pointer active:scale-[0.98] transition-transform shadow-sm flex items-center justify-center gap-2"
                                        >
                                            CREAR CUENTA
                                        </button>
                                        <div className="pt-2">
                                            <GoogleAuthButton onSuccess={handleGoogleLogin} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
