import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingCart() {
    const { itemCount, total } = useCart();
    const location = useLocation();

    // Don't show on admin, waiter, table, cart, order tracking pages, or if empty
    const isExcludedRoute =
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/waiter') ||
        location.pathname.startsWith('/table') ||
        location.pathname.startsWith('/cart') ||
        location.pathname.startsWith('/track');

    if (isExcludedRoute || itemCount === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className="fixed top-[calc(58%-46px)] -translate-y-full right-3 z-fixed md:hidden select-none"
            >
                <Link
                    to="/cart"
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-3.5 py-2.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(242,101,34,0.5)] no-underline active:scale-95 transition-all border border-white/20 backdrop-blur-md"
                >
                    <div className="relative">
                        <ShoppingCart size={20} strokeWidth={1.5} />
                        <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm border border-white/20">
                            {itemCount}
                        </span>
                    </div>
                    <div className="flex flex-col items-start leading-none pr-1">
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-80 mb-0.5">
                            Tu Cesta
                        </span>
                        <span className="text-sm font-black">
                            {total.toFixed(2).replace('.', ',')} €
                        </span>
                    </div>
                </Link>
            </motion.div>
        </AnimatePresence>
    );
}
