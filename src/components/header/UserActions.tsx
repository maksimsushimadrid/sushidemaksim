import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User as UserIcon,
    ChevronDown,
    LogOut,
    ShieldCheck,
    MapPin,
    Package,
    Heart,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SafeImage from '../common/SafeImage';
import { getSharpAvatar } from '../../utils/avatar';
import { useTableI18n } from '../../utils/tableI18n';
import { cn } from '../../utils/cn';

interface UserActionsProps {
    isTable: boolean;
    setLoginModalMode: (mode: 'login' | 'register') => void;
    setIsLoginModalOpen: (open: boolean) => void;
}

export default function UserActions({
    isTable,
    setLoginModalMode,
    setIsLoginModalOpen,
}: UserActionsProps) {
    const { t } = useTableI18n();
    const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const hasToken = !!localStorage.getItem('sushi_token');
    const showSkeleton = authLoading || (hasToken && !user);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = user
        ? user.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '';

    if (isTable) {
        if (showSkeleton) {
            return (
                <div className="w-24 h-9 bg-white/5 animate-pulse rounded-xl border border-white/10" />
            );
        }

        if (!isAuthenticated) {
            return (
                <button
                    onClick={() => {
                        setLoginModalMode('register');
                        setIsLoginModalOpen(true);
                    }}
                    className="bg-white text-black px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-black text-[12px] md:text-[13px] cursor-pointer active:scale-95 transition-all hover:bg-orange-600 hover:text-white uppercase tracking-tighter border border-white/20 whitespace-nowrap shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                    {t('join_club')}
                </button>
            );
        }

        // For authenticated users on /table, show a compact profile trigger
        return (
            <div ref={userMenuRef} className="relative">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={cn(
                        'flex items-center gap-2 bg-white/5 border border-white/10 p-1 pr-3 rounded-2xl cursor-pointer transition-all duration-200',
                        showUserMenu && 'bg-white/10 border-white/20'
                    )}
                >
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm overflow-hidden shrink-0 border border-white/10
                            ${user?.avatar?.startsWith('http') ? 'bg-white' : user?.avatar ? 'bg-white/10 text-[14px]' : 'bg-orange-600'}`}
                    >
                        {user?.avatar ? (
                            user.avatar.startsWith('http') ? (
                                <SafeImage
                                    src={user.avatar}
                                    getOptimizedUrl={getSharpAvatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    fallbackContent={
                                        <span className="select-none text-[12px] text-white">
                                            {initials}
                                        </span>
                                    }
                                />
                            ) : (
                                <span className="select-none">{user.avatar}</span>
                            )
                        ) : (
                            <span className="select-none">{initials}</span>
                        )}
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-tight">
                        {user?.name.split(' ')[0]}
                    </span>
                    <ChevronDown
                        size={12}
                        className={cn(
                            'text-gray-500 transition-transform duration-300',
                            showUserMenu && 'rotate-180'
                        )}
                    />
                </button>

                <AnimatePresence>
                    {showUserMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-[calc(100%+12px)] left-0 bg-[#0d0d0d] rounded-2xl shadow-2xl p-1.5 w-[220px] z-[100] border border-white/10"
                        >
                            <Link
                                to="/profile"
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2.5 px-3 py-3 rounded-xl no-underline text-white text-[13px] font-bold hover:bg-white/5 transition-colors"
                            >
                                <UserIcon size={16} className="text-gray-500" /> Mi Perfil
                            </Link>
                            <Link
                                to="/profile?tab=orders"
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2.5 px-3 py-3 rounded-xl no-underline text-white text-[13px] font-bold hover:bg-white/5 transition-colors"
                            >
                                <Package size={16} className="text-gray-500" /> Mis Pedidos
                            </Link>

                            <div className="h-px bg-white/5 my-1" />

                            <button
                                onClick={() => {
                                    logout(isTable ? '/table' : '/');
                                }}
                                className="flex items-center gap-2.5 px-3 py-3 rounded-xl w-full border-none cursor-pointer text-orange-500 text-[13px] font-bold bg-transparent hover:bg-orange-500/10 transition-colors text-left"
                            >
                                <LogOut size={16} /> Cerrar sesión
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="hidden md:block">
            {showSkeleton ? (
                <div className="w-24 h-10 bg-gray-100 skeleton rounded-xl" />
            ) : isAuthenticated && user ? (
                <div ref={userMenuRef} className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 p-1 md:pl-1 md:pr-3 md:py-1 rounded-2xl cursor-pointer transition-all duration-200
    ${showUserMenu ? 'ring-2 ring-orange-600/20 bg-white' : ''}`}
                    >
                        <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm overflow-hidden shrink-0 border border-black/5
                                ${user.avatar?.startsWith('http') ? 'bg-white' : user.avatar ? 'bg-gray-100 text-[18px]' : 'bg-orange-600'}`}
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
                                    <span className="select-none">{user.avatar}</span>
                                )
                            ) : (
                                <span className="select-none">{initials}</span>
                            )}
                        </div>
                        <span className="hidden md:block text-sm font-bold text-gray-700 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                            {user.name.split(' ')[0]}
                        </span>
                        <ChevronDown
                            size={14}
                            strokeWidth={1.5}
                            className={`hidden md:block text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-[calc(100%+12px)] right-0 bg-white rounded-2xl shadow-2xl p-1.5 w-[240px] z-[100] border border-gray-100"
                            >
                                <div className="px-2.5 py-3 border-b border-gray-50 mb-1 flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-inner overflow-hidden shrink-0 border border-black/10
                ${user.avatar?.startsWith('http') ? 'bg-white' : user.avatar ? 'bg-gray-200 text-xl' : 'bg-orange-600'}`}
                                    >
                                        {user.avatar ? (
                                            user.avatar.startsWith('http') ? (
                                                <SafeImage
                                                    src={user.avatar}
                                                    getOptimizedUrl={getSharpAvatar}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover"
                                                    fallbackContent={
                                                        <span className="select-none text-xl text-gray-900">
                                                            {initials}
                                                        </span>
                                                    }
                                                />
                                            ) : (
                                                <span className="select-none">{user.avatar}</span>
                                            )
                                        ) : (
                                            <span className="select-none">{initials}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-gray-900 mb-0.5 truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold tracking-tight uppercase whitespace-nowrap truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                {(user.role === 'admin' || user.role === 'waiter') && (
                                    <>
                                        <Link
                                            to={user.role === 'admin' ? '/admin' : '/waiter'}
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl no-underline text-orange-600 text-[13px] font-black bg-orange-50 hover:bg-orange-100 transition-colors duration-150"
                                        >
                                            <ShieldCheck size={16} strokeWidth={1.5} />{' '}
                                            {user.role === 'admin'
                                                ? 'PANEL ADMIN'
                                                : 'TERMINAL CAMARERO'}
                                        </Link>
                                        <div className="h-px bg-gray-50 my-1.5" />
                                    </>
                                )}

                                <Link
                                    to="/profile"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl no-underline text-gray-700 text-[13px] font-bold hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <UserIcon
                                        size={16}
                                        strokeWidth={1.5}
                                        className="text-gray-400"
                                    />{' '}
                                    Mi Perfil
                                </Link>
                                <Link
                                    to="/profile?tab=orders"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl no-underline text-gray-700 text-[13px] font-bold hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <Package
                                        size={16}
                                        strokeWidth={1.5}
                                        className="text-gray-400"
                                    />{' '}
                                    Mis Pedidos
                                </Link>
                                <Link
                                    to="/profile?tab=addresses"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl no-underline text-gray-700 text-[13px] font-bold hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <MapPin size={16} strokeWidth={1.5} className="text-gray-400" />{' '}
                                    Mis Direcciones
                                </Link>
                                <Link
                                    to="/profile?tab=favorites"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl no-underline text-gray-700 text-[13px] font-bold hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <Heart size={16} strokeWidth={1.5} className="text-gray-400" />{' '}
                                    Favoritos
                                </Link>

                                <div className="h-px bg-gray-50 my-1.5" />

                                <button
                                    onClick={() => {
                                        logout(isTable ? '/table' : '/');
                                    }}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl w-full border-none cursor-pointer text-orange-600 text-[13px] font-bold bg-transparent hover:bg-orange-50 transition-colors duration-150 text-left"
                                >
                                    <LogOut size={16} strokeWidth={1.5} /> Cerrar sesión
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={() => {
                            setLoginModalMode('login');
                            setIsLoginModalOpen(true);
                        }}
                        className="bg-gray-900 text-white border-2 border-transparent px-5 py-2.5 rounded-xl font-black text-[13px] cursor-pointer shadow-lg active:scale-95 transition-all hover:bg-black"
                    >
                        ACCEDER
                    </button>
                    <button
                        onClick={() => {
                            setLoginModalMode('register');
                            setIsLoginModalOpen(true);
                        }}
                        className="bg-transparent border-none text-gray-400 text-[10px] font-bold cursor-pointer hover:text-orange-600 transition-colors p-0"
                    >
                        Registrarse
                    </button>
                </div>
            )}
        </div>
    );
}
