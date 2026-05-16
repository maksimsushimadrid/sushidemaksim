import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useMenu } from '../hooks/queries/useMenu';
import { CATEGORIES } from '../constants/menu';
import { TableNav } from '../components/table/TableNav';
import { TableProductCard } from '../components/table/TableProductCard';
import { TableBottomSheet } from '../components/table/TableBottomSheet';
import { TableCartDrawer } from '../components/table/TableCartDrawer';
import { TableFooter } from '../components/table/TableFooter';
import { TableDesktopRestriction } from '../components/table/TableDesktopRestriction';
import { useTableOrder } from '../context/TableOrderContext';
import { useTableI18n } from '../utils/tableI18n';
import { SushiItem } from '../types';
import SEO from '../components/SEO';
import { SITE_URL } from '../constants/config';
import { TableMenuSkeleton } from '../components/skeletons/TableMenuSkeleton';
import Newsletter from '../components/Newsletter';
import { UAParser } from 'ua-parser-js';

export default function TableMenuPage() {
    const { data: allItems = [], isLoading } = useMenu('all', '');
    const { addItem, total, itemCount } = useTableOrder();
    const { t } = useTableI18n();

    const [activeType, setActiveType] = useState<'food' | 'drinks'>('food');
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<SushiItem | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState<boolean | null>(null);

    // Refs for ScrollSpy
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const activeCategoryRef = useRef<string>('');
    const isScrollingRef = useRef<boolean>(false);

    // Device detection and Welcome Modal logic
    useEffect(() => {
        const parser = new UAParser(window.navigator.userAgent);
        const deviceType = parser.getDevice().type;
        setIsMobileDevice(deviceType === 'mobile');
    }, []);

    // Categorize data
    const menuData = useMemo(() => {
        const mappedItems = allItems.map(item => ({
            ...item,
            id: String(item.id),
        })) as SushiItem[];

        const drinks = mappedItems.filter(item => item.category === 'bebidas');
        const food = mappedItems.filter(
            item => item.category !== 'bebidas' && item.category !== 'extras'
        );

        return { food, drinks };
    }, [allItems]);

    const activeItems = activeType === 'food' ? menuData.food : menuData.drinks;
    const activeCategories = useMemo(() => {
        const availableIds = new Set(activeItems.map(i => i.category));
        return CATEGORIES.filter(cat => availableIds.has(cat.id as any));
    }, [activeItems]);

    // Initial category
    useEffect(() => {
        if (activeCategories.length > 0 && !activeCategory) {
            setActiveCategory(activeCategories[0].id);
        }
    }, [activeCategories, activeCategory]);

    // ScrollSpy Logic
    useEffect(() => {
        // Use a more reliable detection area:
        // From the bottom of the nav (approx 220px) to the middle of the screen.
        const observerOptions = {
            root: null,
            rootMargin: '-180px 0px -60% 0px',
            threshold: [0, 0.1],
        };

        const handleIntersect = (entries: IntersectionObserverEntry[]) => {
            if (isScrollingRef.current) return;

            // We want the category that is most prominent in the top-middle of the screen
            const visible = entries.find(entry => entry.isIntersecting);

            if (visible && visible.target.id !== activeCategoryRef.current) {
                activeCategoryRef.current = visible.target.id;
                setActiveCategory(visible.target.id);
            }
        };

        const observer = new IntersectionObserver(handleIntersect, observerOptions);

        // Observe only categories that are present in the current active list
        activeCategories.forEach(cat => {
            const ref = sectionRefs.current[cat.id];
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [activeType, activeItems, activeCategories]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            // Block observer updates during manual navigation
            isScrollingRef.current = true;
            setActiveCategory(id);
            activeCategoryRef.current = id;

            const offset = 220; // Height of Header + TableNav
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });

            // Unlock after animation finishes (approx 800ms)
            setTimeout(() => {
                isScrollingRef.current = false;
            }, 500);
        }
    };

    const handleAddToCart = (item: SushiItem, e?: React.MouseEvent, selectedOption?: string) => {
        if (e) e.stopPropagation();
        addItem(item, 1, selectedOption);
    };

    if (isLoading || isMobileDevice === null) {
        return <TableMenuSkeleton />;
    }

    if (!isMobileDevice) {
        return <TableDesktopRestriction />;
    }

    return (
        <div className="min-h-[100svh] bg-[#0d0d0d] pb-32 relative">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-orange-900/15 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-orange-950/25 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[110vw] h-[70vw] bg-orange-900/20 rounded-full blur-[160px]" />
            </div>

            <SEO
                title="Carta Digital y Pedidos en Mesa — Sushi de Maksim Madrid"
                description="Accede a nuestra carta digital, consulta todos los platos y haz tu pedido directamente desde la mesa. La forma más rápida y cómoda de disfrutar del mejor sushi en nuestro restaurante."
                keywords="carta digital sushi madrid, menu qr madrid, pedir en mesa sushi, sushi de maksim madrid carta"
                url={`${SITE_URL}/table`}
            />

            <TableNav
                activeType={activeType}
                onTypeChange={type => {
                    setActiveType(type);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                activeCategory={activeCategory}
                onCategoryClick={scrollToSection}
                categories={activeCategories}
            />

            <main className="relative z-10 pt-40 px-4 max-w-2xl mx-auto">
                {/* Partners / Franchise Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => (window.location.href = '/partners')}
                        className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 p-5 text-left active:scale-[0.98] transition-transform"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1 block">
                                    {t('collab' as any) || 'Socio & Expansión'}
                                </span>
                                <h3 className="text-xl font-black text-white italic tracking-tight">
                                    {t('partners_franchise' as any) || 'Partners / Franquicias'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 font-medium max-w-[200px]">
                                    {t('open_business' as any) ||
                                        'Únete a la familia de Sushi de Maksim'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-orange-600 group-hover:border-orange-500 transition-all duration-300">
                                <ChevronRight
                                    size={20}
                                    className="text-gray-400 group-hover:text-white transition-colors"
                                />
                            </div>
                        </div>
                    </button>
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeType}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeCategories.map(cat => (
                            <section
                                key={cat.id}
                                id={cat.id}
                                ref={el => (sectionRefs.current[cat.id] = el)}
                                className="mb-12 scroll-mt-56"
                            >
                                <div className="mb-8 flex flex-col">
                                    <span className="text-[10px] md:text-xs font-black text-orange-600 uppercase tracking-[0.3em] mb-1">
                                        {t('selection')}
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic leading-none">
                                        {t(`cat_${cat.id}` as any)}
                                    </h2>
                                    <div className="h-[2px] w-full max-w-[100px] bg-gradient-to-r from-orange-500 to-transparent mt-6 md:mt-8"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    {activeItems
                                        .filter(item => item.category === cat.id)
                                        .map(item => (
                                            <TableProductCard
                                                key={item.id}
                                                item={item}
                                                onAddToCart={handleAddToCart}
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsSheetOpen(true);
                                                }}
                                            />
                                        ))}
                                </div>
                            </section>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Floating Order Bar */}
            <AnimatePresence>
                {itemCount > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-4 right-4 z-50"
                    >
                        <button
                            onClick={() => setIsCartDrawerOpen(true)}
                            className="w-full h-16 bg-black border-2 border-white/10 text-white rounded-3xl flex items-center justify-between px-6 active:scale-95 transition-transform overflow-hidden relative shadow-2xl shadow-black/50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <ShoppingBag size={24} />
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-gray-900">
                                        {itemCount}
                                    </span>
                                </div>
                                <div className="flex flex-col items-start leading-none gap-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {t('your_order')}
                                    </span>
                                    <span className="text-lg font-black tracking-tight">
                                        {t('view_cart')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-orange-500">
                                    {total.toFixed(2)}€
                                </span>
                                <ChevronRight className="text-gray-600" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <TableBottomSheet
                item={selectedItem}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onAddToCart={handleAddToCart}
            />

            <TableCartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
            <Newsletter />
            <TableFooter />
        </div>
    );
}
