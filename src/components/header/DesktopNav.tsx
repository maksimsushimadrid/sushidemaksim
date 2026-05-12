import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Megaphone, Phone, Star, Calendar } from 'lucide-react';

interface DesktopNavProps {
    isScrolled: boolean;
    isTransparentHeaderPage: boolean;
}

interface NavLink {
    to?: string;
    label: string;
    icon: any;
    onClick?: () => void;
}

export default function DesktopNav({ isScrolled, isTransparentHeaderPage }: DesktopNavProps) {
    const location = useLocation();

    const navLinks: NavLink[] = [
        { to: '/menu', label: 'Menú', icon: Menu },
        { to: '/tablon', label: 'Tablón', icon: Megaphone },
        { to: '/contacts', label: 'Contactos', icon: Phone },
        { to: '/promo', label: 'Promo', icon: Star },
        { to: '/reservar', label: 'Reserva', icon: Calendar },
    ];

    return (
        <nav className="hidden md:flex items-center justify-center gap-2 lg:gap-4 xl:gap-8 mx-auto">
            {navLinks.map((link, idx) => {
                const isActive = link.to ? location.pathname === link.to : false;
                const isAction = !!link.onClick;

                const commonStyles = `relative no-underline font-bold px-3 lg:px-4 py-2 transition-all duration-300 rounded-xl text-[13px] lg:text-sm border-none bg-transparent cursor-pointer whitespace-nowrap
                    ${
                        isActive
                            ? 'text-white shadow-inner'
                            : isScrolled || !isTransparentHeaderPage
                              ? 'text-gray-600 hover:text-gray-900'
                              : 'text-white/80 hover:text-white'
                    }`;

                if (isAction) {
                    return (
                        <button
                            key={link.label || idx}
                            onClick={link.onClick}
                            type="button"
                            className={`${commonStyles} flex items-center`}
                        >
                            {link.label}
                        </button>
                    );
                }

                return (
                    <Link
                        key={link.to || idx}
                        to={link.to!}
                        className={`${commonStyles} flex items-center`}
                    >
                        <span className="relative z-10">{link.label}</span>
                        {isActive && (
                            <motion.div
                                layoutId="active-nav"
                                className="absolute inset-0 bg-orange-600 rounded-xl"
                                transition={{
                                    type: 'spring',
                                    stiffness: 380,
                                    damping: 30,
                                }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
