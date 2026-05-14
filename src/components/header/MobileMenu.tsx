import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, Megaphone, Phone, Star, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SafeImage from '../common/SafeImage';
import { getSharpAvatar } from '../../utils/avatar';

interface MobileMenuProps {
    showMobileMenu: boolean;
    setShowMobileMenu: (show: boolean) => void;
}

export default function MobileMenu({ showMobileMenu, setShowMobileMenu }: MobileMenuProps) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
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

    return createPortal(
        <AnimatePresence>
            {showMobileMenu && (
                <>
                    {/* Backdrop overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowMobileMenu(false)}
                        className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
                        data-lenis-prevent
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8,
                        }}
                        className="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] z-[9999] md:hidden overflow-hidden border-t border-gray-100 will-change-transform flex flex-col max-h-[92dvh]"
                        data-lenis-prevent
                    >
                        {/* Drag Handle Container */}
                        <div className="flex justify-center pt-5 pb-2 shrink-0">
                            <div className="w-12 h-1.5 bg-gray-200/80 rounded-full" />
                        </div>

                        {/* Scrollable Content Area */}
                        <div
                            className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
                            data-lenis-prevent
                        >
                            <div className="px-3 pt-4 pb-2 space-y-1">
                                {/* Primary Reservation CTA in Mobile Menu - Styled as text with shadow */}
                                <div className="px-1 pb-2">
                                    <Link
                                        to="/reservar"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="w-full py-2 group flex items-center justify-center gap-3 px-4 rounded-[20px] font-black text-[16px] text-orange-600 no-underline transition-all active:scale-[0.97] border-none bg-transparent text-center drop-shadow-[0_2px_4px_rgba(234,88,12,0.2)]"
                                    >
                                        <span className="tracking-tight uppercase">
                                            RESERVAR MESA
                                        </span>
                                    </Link>
                                </div>

                                {navLinks.map((link, idx) => {
                                    const isActive = link.to
                                        ? location.pathname === link.to
                                        : false;

                                    const commonStyles = `group flex items-center justify-center px-4 py-2 rounded-[20px] font-black text-[16px] transition-all active:scale-[0.97] border-none bg-transparent text-center w-full
                                        ${
                                            isActive
                                                ? 'text-orange-600 underline underline-offset-4 decoration-2'
                                                : 'text-gray-600 hover:text-gray-900 no-underline'
                                        }`;

                                    const content = (
                                        <div
                                            className={`flex items-center gap-3 tracking-tight uppercase ${isActive ? 'text-orange-600' : 'text-gray-900'}`}
                                        >
                                            <span>{link.label}</span>
                                        </div>
                                    );

                                    return (
                                        <Link
                                            key={link.to || idx}
                                            to={link.to!}
                                            onClick={() => setShowMobileMenu(false)}
                                            className={commonStyles}
                                        >
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="px-3 pb-8 space-y-3">
                                <div className="h-px bg-gray-100 my-2 mx-2" />

                                {showSkeleton ? (
                                    <div className="w-full h-12 bg-gray-100 skeleton rounded-2xl animate-pulse" />
                                ) : isAuthenticated && user ? (
                                    <div className="space-y-4">
                                        <Link
                                            to="/profile"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="px-5 py-4 bg-gray-50 rounded-3xl flex items-center gap-3 no-underline transition-all active:scale-[0.98] hover:bg-gray-100 group border border-gray-100"
                                        >
                                            <div
                                                className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0 shadow-inner border border-black/10
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
                                                <p className="font-black text-gray-900 text-[14px] leading-none mb-1 truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-[12px] text-gray-400 font-medium leading-none mb-1 truncate">
                                                    {user.email}
                                                </p>
                                                <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest leading-none mt-1.5">
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
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer active:scale-90"
                                                >
                                                    <LogOut size={20} />
                                                </button>
                                            </div>
                                        </Link>

                                        {(user.role === 'admin' || user.role === 'waiter') && (
                                            <Link
                                                to={user.role === 'admin' ? '/admin' : '/waiter'}
                                                onClick={() => setShowMobileMenu(false)}
                                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl no-underline text-orange-600 text-[13px] font-black bg-orange-50 border border-orange-100"
                                            >
                                                <ShieldCheck size={18} strokeWidth={1.5} />
                                                {user.role === 'admin'
                                                    ? 'PANEL ADMINISTRADOR'
                                                    : 'TERMINAL CAMARERO'}
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => {
                                                setShowMobileMenu(false);
                                                document.dispatchEvent(
                                                    new CustomEvent('custom:openLogin', {
                                                        detail: { mode: 'login' },
                                                    })
                                                );
                                            }}
                                            className="w-full bg-gray-900 text-white border-none py-3.5 rounded-2xl font-black text-[14px] cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-gray-900/20"
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
                                            className="w-full bg-white text-gray-900 border-2 border-gray-900 py-3.5 rounded-2xl font-black text-[14px] cursor-pointer active:scale-[0.98] transition-transform"
                                        >
                                            CREAR CUENTA
                                        </button>
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
