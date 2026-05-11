import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { tracker } from '../analytics/tracker';
import { MenuItemsSkeleton } from '../components/skeletons/MenuSkeleton';
import { CATEGORIES, EMOJI } from '../constants/menu';
import { MenuItem, useMenu, useFavorites, useToggleFavorite } from '../hooks/queries/useMenu';
import { SITE_URL } from '../constants/config';
import MenuCategoryBar from '../components/menu/MenuCategoryBar';
import MenuSearch from '../components/menu/MenuSearch';
import ShareModal from '../components/menu/ShareModal';
import ProductGrid from '../components/menu/ProductGrid';
import FlyToCart, { FlyingItem } from '../components/menu/FlyToCart';

export default function MenuPage() {
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';
    const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const { addItem } = useCart();
    const { user } = useAuth();
    const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
    const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
    const [sharingItem, setSharingItem] = useState<MenuItem | null>(null);
    const [copying, setCopying] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Queries: Always fetch all items to allow scrolling through sections
    const { data: items = [], isLoading, isError, isFetching } = useMenu('all', debouncedSearch);
    const { data: favorites } = useFavorites(user);
    const { mutate: toggleFavorite } = useToggleFavorite();
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            if (search.trim().length > 2) {
                tracker.track('search', {
                    metadata: { query: search },
                    userId: user?.id,
                });
            }
        }, 350);
        return () => clearTimeout(handler);
    }, [search, user?.id]);

    const isScrollingProgrammatically = useRef(false);
    const [initialScrollDone, setInitialScrollDone] = useState(initialCategory === 'all');

    // Scroll Spy implementation
    useEffect(() => {
        if (isLoading || isError || items.length === 0 || debouncedSearch) return;

        // Don't start scroll spy until the initial category scroll has completed
        if (!initialScrollDone) return;

        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -60% 0px', // Trigger slightly below the sticky header
            threshold: 0,
        };

        const observerCallback: IntersectionObserverCallback = entries => {
            if (isScrollingProgrammatically.current) return;

            const intersectingEntry = entries.find(entry => entry.isIntersecting);
            if (intersectingEntry) {
                const id = intersectingEntry.target.id.replace('section-', '');
                setActiveCategory(id);
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        CATEGORIES.forEach(cat => {
            const el = document.getElementById(`section-${cat.id}`);
            if (el) observer.observe(el);
        });

        const menuTop = document.getElementById('menu-top-sentinel');
        if (menuTop) observer.observe(menuTop);

        return () => observer.disconnect();
    }, [isLoading, isError, items.length, debouncedSearch, initialScrollDone]);

    const handleCategoryClick = (id: string) => {
        setActiveCategory(id);
        isScrollingProgrammatically.current = true;

        const offset = window.innerWidth < 1024 ? 130 : 80;

        if (id === 'all') {
            const el = document.getElementById('menu-content');
            if (el) {
                const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
                window.scrollTo({ top, behavior: 'smooth' });
            }
        } else {
            const el = document.getElementById(`section-${id}`);
            if (el) {
                const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }

        // Re-enable scroll spy after scrolling finishes
        setTimeout(() => {
            isScrollingProgrammatically.current = false;
        }, 800);
    };

    const initialSearchMount = useRef(true);

    useEffect(() => {
        if (debouncedSearch && !isLoading && items.length > 0) {
            if (initialSearchMount.current) {
                initialSearchMount.current = false;
                return;
            }
            const menuTop = document.getElementById('menu-content');
            if (menuTop) {
                const offset = window.innerWidth < 1024 ? 130 : 80;
                requestAnimationFrame(() => {
                    const top = Math.max(
                        0,
                        menuTop.getBoundingClientRect().top + window.scrollY - offset
                    );
                    window.scrollTo({ top, behavior: 'instant' });
                });
            }
        }
    }, [debouncedSearch, isLoading, items.length]);

    const hasScrolledToHash = useRef(false);

    // Handle initial hash scroll and highlight
    useEffect(() => {
        if (!isLoading && items.length > 0 && !hasScrolledToHash.current) {
            const hash = window.location.hash;
            if (hash) {
                const id = hash.replace('#', '');
                hasScrolledToHash.current = true;

                // If it's a specific product link (item-ID), highlight it
                if (id.startsWith('item-')) {
                    const itemId = id.replace('item-', '');
                    setHighlightedItemId(itemId);
                    setTimeout(() => setHighlightedItemId(null), 3000);
                }

                setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        const headerHeight =
                            parseInt(
                                getComputedStyle(document.documentElement).getPropertyValue(
                                    '--header-height'
                                )
                            ) || 80;

                        const offset = headerHeight + 16;
                        const top = el.getBoundingClientRect().top + window.scrollY - offset;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }
                }, 400); // Slightly more delay for better stability
            }
        }
    }, [isLoading, items.length]);

    // Handle initial category scroll from query param
    useEffect(() => {
        if (!isLoading && items.length > 0 && !initialScrollDone && initialCategory !== 'all') {
            setInitialScrollDone(true);

            // Block scroll spy during programmatic scroll
            isScrollingProgrammatically.current = true;

            // Wait for React to render the ProductGrid sections into the DOM
            // before scrolling. A short timeout is more reliable than rAF here
            // because items are available but sections need a full render cycle.
            setTimeout(() => {
                const el = document.getElementById(`section-${initialCategory}`);
                if (el) {
                    const offset = window.innerWidth < 1024 ? 130 : 80;
                    const top = el.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
                }

                // Re-enable scroll spy after the scroll is settled
                setTimeout(() => {
                    isScrollingProgrammatically.current = false;
                }, 300);
            }, 150);
        }
    }, [isLoading, items.length, initialCategory, initialScrollDone]);

    const handleShare = (item: MenuItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setSharingItem(item);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopying(true);
            setTimeout(() => setCopying(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleAddToCart = (
        item: MenuItem,
        e: React.MouseEvent<HTMLButtonElement>,
        quantity: number = 1
    ) => {
        try {
            // Determine start and end coordinates for animation
            const cartIcon = document.getElementById('cart-icon');
            let endX = window.innerWidth - 40; // Fallback x
            let endY = 40; // Fallback y

            if (cartIcon) {
                const rect = cartIcon.getBoundingClientRect();
                endX = rect.left + rect.width / 2;
                endY = rect.top + rect.height / 2;
            }

            const startX = e.clientX || 0;
            const startY = e.clientY || 0;

            const animId = Date.now().toString() + Math.random().toString();
            const hasImage = !!item.image;

            // Spawn the flying element
            setFlyingItems(prev => [
                ...prev,
                {
                    id: animId,
                    startX,
                    startY,
                    endX,
                    endY,
                    image: hasImage ? item.image : undefined,
                    emoji: hasImage ? undefined : EMOJI[item.category] || '🍱',
                },
            ]);

            // Remove flying element after animation finishes
            setTimeout(() => {
                setFlyingItems(prev => prev.filter(f => f.id !== animId));
            }, 1000);
        } catch (err) {
            console.error('Animation error:', err);
        }

        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }

        // Add to real cart
        addItem(
            {
                id: String(item.id),
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                category: item.category as any,
                pieces: item.pieces,
                spicy: item.spicy,
                vegetarian: item.vegetarian,
                isPromo: item.isPromo,
            },
            quantity
        );

        tracker.track('add_to_cart', {
            metadata: {
                productId: item.id,
                productName: item.name,
                category: item.category,
                price: item.price,
                quantity,
            },
            userId: user?.id,
        });

        const itemId = item.id;
        setAddedItems(prev => new Set(prev).add(itemId));

        // Use a unique timeout per item to avoid race conditions
        setTimeout(() => {
            setAddedItems(prev => {
                const n = new Set(prev);
                n.delete(itemId);
                return n;
            });
        }, 1600);
    };

    const menuSchema = {
        '@context': 'https://schema.org',
        '@type': 'Menu',
        name: 'Menú Sushi de Maksim',
        description:
            'Auténtica comida japonesa y sushi fresco con entrega a domicilio en Madrid. Rolls, nigiris, gyozas y más.',
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/menu`,
        },
        hasMenuSection: CATEGORIES.filter(cat =>
            activeCategory === 'all' ? true : cat.id === activeCategory
        ).map(cat => ({
            '@type': 'MenuSection',
            name: cat.name,
            description: cat.description,
            hasMenuItem: items
                .filter(item => item.category === cat.id)
                .map(item => ({
                    '@type': 'MenuItem',
                    name: item.name,
                    description: item.description,
                    offers: {
                        '@type': 'Offer',
                        price: item.price,
                        priceCurrency: 'EUR',
                        itemCondition: 'https://schema.org/NewCondition',
                        availability: 'https://schema.org/InStock',
                        url: `${SITE_URL}/menu?category=${cat.id}#item-${item.id}`,
                    },
                    image: item.image,
                })),
        })),
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Inicio',
                item: `${SITE_URL}/`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Carta',
                item: `${SITE_URL}/menu`,
            },
        ],
    };

    const isLoadingInitial = isLoading && items.length === 0;

    return (
        <div className="min-h-screen bg-transparent pb-0 pt-0 flex flex-col">
            <SEO
                title={
                    activeCategory === 'all'
                        ? 'Menú de Sushi a Domicilio en Madrid | Carta Completa'
                        : `${Array.isArray(CATEGORIES) ? CATEGORIES.find(c => c.id === activeCategory)?.name || 'Sushi' : 'Sushi'} en Madrid — Menú de Sushi de Maksim`
                }
                description={
                    activeCategory === 'all'
                        ? 'Descubre el mejor menú de sushi en Madrid. Rolls artesanales, nigiri, sashimi y combos premium con entrega rápida a domicilio. ¡Calidad superior en cada bocado!'
                        : `${Array.isArray(CATEGORIES) ? CATEGORIES.find(c => c.id === activeCategory)?.description || '' : ''} Pide online con entrega rápida a domicilio en Madrid.`
                }
                keywords={`menu sushi madrid, carta sushi, sushi a domicilio madrid, ${activeCategory === 'all' ? '' : activeCategory + ' madrid,'} pedir sushi online`}
                schema={[menuSchema, breadcrumbSchema]}
                url={`${SITE_URL}/menu${activeCategory !== 'all' ? `?category=${activeCategory}` : ''}`}
            />
            <h1 className="sr-only">
                {activeCategory === 'all'
                    ? 'Menú de Sushi a Domicilio en Madrid — Sushi de Maksim'
                    : `Menú de ${Array.isArray(CATEGORIES) ? CATEGORIES.find(c => c.id === activeCategory)?.name || 'Sushi' : 'Sushi'} en Madrid`}
            </h1>
            <div className="max-w-[1440px] mx-auto flex-1 md:flex px-3 md:px-6 w-full">
                {/* Desktop Sidebar Sidebar */}
                <MenuCategoryBar
                    activeCategory={activeCategory}
                    onCategoryClick={handleCategoryClick}
                />

                <div
                    className="flex-1 min-w-0 md:pl-8 pt-20 md:pt-4 min-h-[70vh] relative"
                    id="menu-content"
                >
                    <div
                        id="menu-top-sentinel"
                        className="absolute top-0 left-0 w-full h-[10px] pointer-events-none"
                    />

                    {/* Search Section - Absolute when collapsed to align with title, Relative when expanded to push content */}
                    <div
                        className={`${isSearchExpanded ? 'relative w-full mb-6' : 'absolute top-[68px] right-0 w-auto'} md:relative md:top-0 md:right-0 md:w-full md:mb-4 z-10 transition-all duration-300`}
                    >
                        <MenuSearch
                            search={search}
                            setSearch={setSearch}
                            isSearchExpanded={isSearchExpanded}
                            setIsSearchExpanded={setIsSearchExpanded}
                        />
                    </div>

                    {/* Fixed category bar on mobile */}
                    <MenuCategoryBar
                        activeCategory={activeCategory}
                        onCategoryClick={handleCategoryClick}
                        isMobile
                    />

                    {/* Items Section */}
                    {isLoadingInitial ? (
                        <div className="pt-4 animate-in fade-in duration-300">
                            <MenuItemsSkeleton showHeader />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100 animate-in fade-in zoom-in-95 duration-500">
                            <span className="text-5xl mb-6 drop-shadow-lg">🍱</span>
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                                Algo salió mal
                            </h3>
                            <p className="text-gray-500 font-medium text-center max-w-sm px-6">
                                No pudimos cargar el menú en este momento. Por favor, revisa tu
                                conexión e inténtalo de nuevo.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-8 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
                            >
                                REINTENTAR
                            </button>
                        </div>
                    ) : (
                        <div
                            className={`transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}
                        >
                            <ProductGrid
                                items={items}
                                selectedCategory="all"
                                search={search}
                                setSearch={setSearch}
                                setSelectedCategory={handleCategoryClick}
                                user={user}
                                favorites={favorites as Set<number>}
                                onToggleFavorite={toggleFavorite}
                                onShare={handleShare}
                                onAddToCart={handleAddToCart}
                                addedItems={addedItems}
                                highlightedItemId={highlightedItemId}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                item={sharingItem}
                onClose={() => setSharingItem(null)}
                onCopy={copyToClipboard}
                copying={copying}
            />

            {/* Fly-to-Cart Animation */}
            <FlyToCart items={flyingItems} />
        </div>
    );
}
