import { motion, LayoutGroup } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { CATEGORIES } from '../../constants/menu';

interface MenuCategoryBarProps {
    activeCategory: string;
    onCategoryClick: (id: string) => void;
    isMobile?: boolean;
}

const KatanaUnderline = () => (
    <motion.div
        layoutId="katana-active"
        className="absolute -bottom-10 left-4 right-0 flex items-center justify-start pointer-events-none z-0"
        transition={{
            type: 'spring',
            stiffness: 400,
            damping: 35,
            mass: 0.5,
        }}
    >
        <img
            src="/katana.webp"
            alt="Katana"
            className="w-[240px] h-24 object-contain transform-gpu"
            style={{ willChange: 'transform' }}
        />
    </motion.div>
);

export default function MenuCategoryBar({
    activeCategory,
    onCategoryClick,
    isMobile = false,
}: MenuCategoryBarProps) {
    const scrollBarToCategory = useCallback(
        (id: string, behavior: ScrollBehavior = 'smooth') => {
            if (!isMobile) return;

            const btn = document.getElementById(`cat-btn-${id}`);
            const container = btn?.closest('.overflow-x-auto');

            if (btn && container) {
                const containerRect = container.getBoundingClientRect();
                const btnRect = btn.getBoundingClientRect();
                const scrollLeft =
                    container.scrollLeft +
                    btnRect.left -
                    containerRect.left -
                    containerRect.width / 2 +
                    btnRect.width / 2;

                if (container.scrollTo) {
                    container.scrollTo({
                        left: scrollLeft,
                        behavior,
                    });
                }
            }
        },
        [isMobile]
    );

    // Center category when it changes from scroll spy
    useEffect(() => {
        if (isMobile && activeCategory) {
            const timeoutId = setTimeout(() => {
                scrollBarToCategory(activeCategory, 'smooth');
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [activeCategory, isMobile, scrollBarToCategory]);

    if (isMobile) {
        return (
            <motion.div
                initial={false}
                className="fixed left-0 right-0 z-[40] bg-[#FBF7F0] border-b border-gray-200 md:hidden shadow-sm select-none pt-[1px]"
                style={{ top: 'calc(var(--header-height, 64px) - 1px)' }}
            >
                <div className="max-w-7xl mx-auto">
                    <LayoutGroup id="mobile-categories-new" inherit={false}>
                        <div
                            className="overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-proximity py-3 flex items-center overscroll-contain touch-pan-x"
                            data-lenis-prevent
                            data-lenis-prevent-touch
                        >
                            <div className="flex gap-2 flex-nowrap px-4 w-max relative">
                                {/* CATEGORY Buttons */}
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        id={`cat-btn-${cat.id}`}
                                        onClick={() => onCategoryClick(cat.id)}
                                        className={`relative transform-gpu backface-hidden whitespace-nowrap flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black cursor-pointer text-[12px] uppercase tracking-wider snap-center border transition-all duration-300 shadow-sm hover:shadow-md ${
                                            activeCategory === cat.id
                                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 border-transparent z-10'
                                                : 'bg-white text-gray-500 border-gray-100'
                                        }`}
                                    >
                                        <cat.icon
                                            size={16}
                                            strokeWidth={2.5}
                                            className="relative z-10"
                                        />
                                        <span className="relative z-10">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </LayoutGroup>
                </div>
            </motion.div>
        );
    }

    return (
        <aside className="hidden md:block w-[200px] flex-shrink-0 relative bg-orange-600">
            <div
                className="sticky flex flex-col items-stretch pb-10 overflow-visible no-scrollbar"
                style={{
                    top: 'var(--header-height, 80px)',
                    height: 'calc(100dvh - var(--header-height, 80px))',
                    willChange: 'transform',
                }}
                data-lenis-prevent
            >
                <LayoutGroup id="sidebar-katana">
                    <nav className="flex flex-col py-4 px-2 relative z-10">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => onCategoryClick(cat.id)}
                                className={`relative w-full text-left px-4 py-4 transition-all duration-300 flex items-center gap-3 border-none cursor-pointer group rounded-xl ${
                                    activeCategory === cat.id
                                        ? 'text-white'
                                        : 'text-white/40 hover:text-white'
                                }`}
                            >
                                <cat.icon
                                    size={20}
                                    strokeWidth={activeCategory === cat.id ? 2.5 : 2}
                                    className={`relative z-10 transition-transform duration-300 ${
                                        activeCategory === cat.id
                                            ? 'scale-110'
                                            : 'group-hover:scale-110'
                                    }`}
                                />
                                <span className="text-sm relative z-10 font-bold tracking-wide">
                                    {cat.name}
                                </span>
                                {activeCategory === cat.id && <KatanaUnderline />}
                            </button>
                        ))}
                    </nav>
                </LayoutGroup>

                <div className="mt-auto py-10 flex items-center justify-center pointer-events-none select-none opacity-40 relative z-10">
                    <span className="text-white text-7xl font-serif drop-shadow-[2px_5px_10px_rgba(0,0,0,0.3)]">
                        福
                    </span>
                </div>
            </div>
        </aside>
    );
}
