import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import SEO from '../components/SEO';
import Newsletter from '../components/Newsletter';
import RatingsBanner from '../components/RatingsBanner';
import ReviewsSEO from '../components/ReviewsSEO';
import { useCart } from '../hooks/useCart';
import { usePopularItems, useCategories, MenuItem } from '../hooks/queries/useMenu';
import ShareModal from '../components/menu/ShareModal';
import { getOptimizedImageUrl } from '../utils/images';
import { useSettings } from '../hooks/queries/useSettings';
import { api } from '../utils/api';
import { SITE_URL } from '../constants/config';

// Home page sections
import { HeroSection } from '../components/home/HeroSection';
import { Marquee } from '../components/home/Marquee';
import { PressSection } from '../components/home/PressSection';
import { CategoriesGrid } from '../components/home/CategoriesGrid';
import { PromosSection } from '../components/home/PromosSection';
import { PopularItems } from '../components/home/PopularItems';
import { AboutSection } from '../components/home/AboutSection';

export default function HomePage() {
    const { items, addItem } = useCart();

    const [sharingItem, setSharingItem] = useState<MenuItem | null>(null);
    const [copying, setCopying] = useState(false);

    // Use TanStack Query — fetch only popular items instead of entire catalog
    const { data: popularItems = [], isLoading: itemsLoading } = usePopularItems(8);
    const { data: categoriesData = [], isLoading: catsLoading } = useCategories();
    const { data: settings } = useSettings();

    // Fetch active promo banners for dynamic display
    const { data: promosData } = useQuery({
        queryKey: ['promos'],
        queryFn: () => api.get('/promos'),
        staleTime: 5 * 60 * 1000,
    });

    const activePromos = ((promosData?.promos ?? []) as any[]).filter(
        p => p.code !== 'TEST10' && p.title !== 'TEST10'
    );

    const categoriesWithImages = useMemo(() => {
        // Hardcoded mapping for homepage to ensure premium look if DB fallback fails
        const TOP_CATEGORY_FALLBACKS: Record<string, string> = {
            postre: getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1772834659669-446.webp',
                640
            ),
            'rollos-clasicos': getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1773679824487-765.webp',
                640
            ),
            entrantes: getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1773469716444-139.webp',
                640
            ),
            'rollos-grandes': getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1773691339304-197.webp',
                640
            ),
            'rollos-fritos': getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1773682008412-27.webp',
                640
            ),
            'rollos-fritos-horneados': getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1773682008412-27.webp',
                640
            ),
            menus: getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1773689515418-937.webp',
                640
            ),
            extras: getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1773690670774-801.webp',
                640
            ),
            sopas: getOptimizedImageUrl(
                'https://dvsmzciknlfevgxpnefr.supabase.co/storage/v1/object/public/images/menu/1773688556688-515.webp',
                640
            ),
        };

        const CATEGORY_ORDER = [
            'entrantes',
            'rollos-grandes',
            'rollos-clasicos',
            'rollos-fritos-horneados',
            'rollos-fritos',
            'sopas',
            'menus',
            'extras',
            'postre',
        ];

        return categoriesData
            .map((cat: any) => {
                // Normalize ID: replace spaces/slashes with hyphens, remove special chars
                const catId = String(cat.id || cat.name || '')
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/\//g, '-')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove accents
                    .replace(/[^a-z0-9-]/g, '')
                    .replace(/-+/g, '-');

                // Category images come from the API or hardcoded fallbacks.
                // No need to scan full menu catalog.

                return {
                    ...cat,
                    catId, // Store normalized ID for sorting
                    image: cat.image || TOP_CATEGORY_FALLBACKS[catId] || null,
                };
            })
            .sort((a: any, b: any) => {
                const indexA = CATEGORY_ORDER.indexOf(a.catId);
                const indexB = CATEGORY_ORDER.indexOf(b.catId);

                // If both are in the list, sort by index
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                // If only one is in the list, prioritized identified one
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                // Fallback to alphabetical for unknown categories
                return String(a.name).localeCompare(String(b.name));
            });
    }, [categoriesData]);

    // 2. Pre-calculate the slice for rendering
    const categoryList = useMemo(() => {
        return categoriesWithImages.slice(0, 8);
    }, [categoriesWithImages]);

    // Remove full-page blocking render to improve LCP
    // removed isLoading check

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

    const handleAddToCart = (item: any, _e?: any, quantity: number = 1) => {
        addItem(
            {
                ...item,
                id: String(item.id),
                category: item.category as any,
            },
            quantity
        );

        // Haptic
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    // Pre-calculate cart item IDs for PopularItems
    const cartItemIds = new Set(items.map(cartItem => cartItem.id));

    return (
        <div className="overflow-hidden">
            <SEO
                title="Sushi a domicilio en Madrid — Sushi de Maksim | Calidad Premium"
                description={`El mejor sushi artesanal de Madrid con entrega a domicilio. Pide online rolls, nigiri y sashimi frescos. ⭐ ${settings?.ratingGoogle || '4.9'}/5 basado en ${settings?.ratingReviewsCount || '+500'} reseñas. ¡Pide ahora y disfruta de la experiencia japonesa!`}
                keywords="sushi madrid, sushi a domicilio madrid, pedir sushi online, mejor sushi madrid, sushi de maksim, comida japonesa madrid"
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'Restaurant',
                    name: 'Sushi de Maksim',
                    image: `${SITE_URL}/sushi-hero.webp`,
                    '@id': SITE_URL,
                    url: SITE_URL,
                    telephone: '+34 631 920 312',
                    priceRange: '$$',
                    servesCuisine: ['Japanese', 'Sushi'],
                    address: {
                        '@type': 'PostalAddress',
                        streetAddress: settings?.contactAddressLine1 || 'C. de Barrilero, 20',
                        addressLocality: 'Madrid',
                        postalCode: '28007',
                        addressCountry: 'ES',
                    },
                    geo: {
                        '@type': 'GeoCoordinates',
                        latitude: 40.397042,
                        longitude: -3.672449,
                    },
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: (settings?.ratingGoogle || 4.9).toString(),
                        reviewCount: (settings?.ratingReviewsCount || 524).toString(),
                        bestRating: '5',
                        worstRating: '1',
                    },
                    openingHoursSpecification: [
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: ['Wednesday', 'Thursday'],
                            opens: '19:00',
                            closes: '23:00',
                        },
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: ['Friday', 'Saturday', 'Sunday'],
                            opens: '14:00',
                            closes: '23:00',
                        },
                    ],
                    acceptsReservations: 'true',
                    potentialAction: {
                        '@type': 'OrderAction',
                        target: {
                            '@type': 'EntryPoint',
                            urlTemplate: `${SITE_URL}/menu`,
                            inLanguage: 'es',
                            actionPlatform: [
                                'http://schema.org/DesktopWebPlatform',
                                'http://schema.org/MobileWebPlatform',
                            ],
                        },
                        deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeOwnFleet'],
                    },
                }}
            />

            <div className="bg-black">
                <HeroSection />
                <Marquee />
            </div>

            <RatingsBanner />
            <PressSection />
            <CategoriesGrid
                categoryList={categoryList}
                hasCategories={categoriesWithImages.length > 0}
                isLoading={catsLoading}
            />
            <PromosSection activePromos={activePromos} />

            <PopularItems
                popularItems={popularItems}
                cartItemIds={cartItemIds}
                onShare={handleShare}
                onAddToCart={handleAddToCart}
                isLoading={itemsLoading}
            />

            <ReviewsSEO />
            <AboutSection />
            <Newsletter />

            {sharingItem && (
                <ShareModal
                    item={sharingItem}
                    onClose={() => setSharingItem(null)}
                    onCopy={copyToClipboard}
                    copying={copying}
                />
            )}
        </div>
    );
}
