import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Tag, Plus, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../utils/api';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { PromoSkeleton } from '../components/skeletons/PromoSkeleton';
import { useQuery } from '@tanstack/react-query';
import { getOptimizedImageUrl } from '../utils/images';
import { SITE_URL } from '../constants/config';
import SafeImage from '../components/common/SafeImage';
import BrandedPlaceholder from '../components/common/BrandedPlaceholder';

interface PromoItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

export default function PromoPage() {
    const { addItem } = useCart();
    const { user } = useAuth();
    const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

    // Use React Query for consolidated fetching and caching
    const { data: menuData, isLoading: menuLoading } = useQuery({
        queryKey: ['menu', 'promo'],
        queryFn: () => api.get('/menu?is_promo=true'),
        staleTime: 1000 * 60 * 5,
    });

    const { data: promosData, isLoading: promosLoading } = useQuery({
        queryKey: ['promos'],
        queryFn: () => api.get('/promos'),
        staleTime: 1000 * 60 * 5,
    });

    const promoItems = (menuData?.items ?? []) as PromoItem[];
    const staticPromos = (promosData?.promos ?? []) as any[];

    // Filter out TEST10 and ensure we only show active ones (backend already filters active, but double safety)
    const activePromos = staticPromos.filter(
        p => p.is_active && p.code !== 'TEST10' && p.title !== 'TEST10'
    );

    // Separate banners from cards for layout
    const banners = activePromos.filter(p => p.type === 'banner');
    const cards = activePromos.filter(p => p.type === 'card');

    const isLoading = menuLoading || promosLoading;

    if (isLoading) return <PromoSkeleton />;

    const handleAdd = (item: PromoItem) => {
        addItem({
            id: String(item.id),
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            category: item.category as any,
            isPromo: true,
        });

        // Temporary feedback state
        const idStr = String(item.id);
        setAddedItems(prev => new Set([...prev, idStr]));
        setTimeout(() => {
            setAddedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(idStr);
                return newSet;
            });
        }, 2000);

        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    const formatDiscount = (discount: string) => {
        if (!discount) return '';
        // Change "10% OFF" -> "-10%" or similar
        return discount.replace(/(\d+%) OFF/gi, '-$1').replace(/OFF/gi, '');
    };

    return (
        <div className="flex-1 bg-transparent">
            <SEO
                title="Ofertas y Promociones"
                description="Descubre nuestras promociones exclusivas, combos especiales de sushi con descuentos y ofertas limitadas. ¡Pide online ahora!"
                keywords="ofertas sushi, promos sushi, combos sushi madrid, descuento sushi"
                schema={[
                    {
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
                                name: 'Promociones',
                                item: `${SITE_URL}/promos`,
                            },
                        ],
                    },
                ]}
                url={`${SITE_URL}/promos`}
            />

            {/* Hero Header */}
            <section className="relative h-72 md:h-80 flex items-center justify-center overflow-hidden pt-12">
                <SafeImage
                    src="/images/promos/promo_hero_bg.webp"
                    alt="Ofertas y Promociones background"
                    className="absolute inset-0 w-full h-full object-cover"
                    getOptimizedUrl={(url: string) => getOptimizedImageUrl(url, 1080)}
                    {...({ fetchpriority: 'high' } as any)}
                />
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">
                        Promociones y Ofertas
                    </h1>
                    <p className="text-gray-200 text-base md:text-xl font-medium max-w-xl mx-auto">
                        Delicias exclusivas diseñadas para momentos inolvidables
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-3 sm:px-4 -mt-8 md:-mt-16 mb-12 md:mb-16 relative z-20">
                {/* Standard Promo Cards Grid */}
                {cards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                        {cards.map(promo => {
                            const mainImage = promo.image_url;
                            return (
                                <div
                                    key={promo.id}
                                    className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden hover:-translate-y-1.5 transition-all duration-500 flex flex-col group"
                                >
                                    {/* Image Header wrapper */}
                                    <div className="h-44 sm:h-52 md:h-60 w-full relative overflow-hidden flex flex-col items-center justify-end pb-4 sm:pb-5">
                                        <SafeImage
                                            src={mainImage}
                                            alt={promo.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            getOptimizedUrl={(url: string) =>
                                                getOptimizedImageUrl(url, 800)
                                            }
                                            fallbackContent={
                                                <BrandedPlaceholder
                                                    icon={promo.icon}
                                                    color={promo.color}
                                                />
                                            }
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                                        <div className="relative z-10 text-center px-4 sm:px-6 w-full flex flex-col items-center">
                                            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-2 sm:mb-3 drop-shadow-2xl tracking-tight leading-tight">
                                                {promo.title}
                                            </h3>
                                            <div
                                                className="inline-block px-3 py-1.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest border border-white/30 backdrop-blur-md shadow-lg"
                                                style={{
                                                    backgroundColor: `${promo.color}40`,
                                                    color: 'white',
                                                }}
                                            >
                                                {formatDiscount(promo.discount)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 sm:p-6 md:p-7 flex flex-col flex-1">
                                        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 flex-1">
                                            {promo.description}
                                        </p>

                                        <div className="flex items-center gap-2.5 text-[10px] sm:text-xs text-gray-400 mb-4 sm:mb-6 font-black bg-gray-50/60 px-3.5 py-2.5 rounded-xl sm:rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                            <Clock
                                                size={16}
                                                strokeWidth={2.5}
                                                className="text-orange-500"
                                            />
                                            <span className="uppercase tracking-widest italic">
                                                {promo.valid_until}
                                            </span>
                                        </div>

                                        <Link
                                            to={promo.cta_link || '/menu'}
                                            className="flex items-center justify-center gap-2.5 w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm text-white transition-all active:scale-95 shadow-md group-hover:shadow-lg"
                                            style={{
                                                backgroundColor:
                                                    promo.color?.toLowerCase() === '#dc2626'
                                                        ? '#F26522'
                                                        : promo.color,
                                            }}
                                        >
                                            {promo.cta_text || 'Ver carta'}{' '}
                                            <ArrowRight
                                                size={18}
                                                strokeWidth={2.5}
                                                className="group-hover:translate-x-1 transition-transform"
                                            />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Referral Static Banner */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 mb-6 md:mb-10 relative overflow-hidden shadow-xl flex flex-col lg:flex-row items-center gap-6 lg:gap-10 group isolate">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>

                    <div className="flex-1 relative z-10 w-full text-center lg:text-left">
                        <div className="inline-block bg-white/20 backdrop-blur-md px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black mb-3 sm:mb-4 border border-white/30 uppercase tracking-[0.2em] text-white shadow-sm">
                            PROGRAMA DE REFERIDOS
                        </div>
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-3 tracking-tighter leading-tight sm:leading-[0.95] text-white drop-shadow-xl">
                            Invita a un amigo y Gana
                        </h2>
                        <p className="text-xs sm:text-sm md:text-base font-medium mb-5 sm:mb-8 text-white/90 leading-relaxed max-w-xl mx-auto lg:mx-0 drop-shadow-sm">
                            Regala un <strong className="text-white">15% de descuento</strong> a tus
                            amigos en su primer pedido. Cuando lo reciban, ¡tú ganarás{' '}
                            <strong className="text-white">5 Maksim Coins</strong> (5€)
                            automáticamente!
                        </p>
                        <Link
                            to={user ? '/profile' : '/profile'}
                            className="inline-flex items-center justify-center gap-2.5 bg-white text-purple-700 px-6 py-3 md:px-8 md:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase transition-all active:scale-95 shadow-lg hover:bg-gray-50 hover:shadow-white/20 w-full sm:w-auto tracking-wider"
                        >
                            {user ? 'OBTENER MI CÓDIGO' : 'INICIAR SESIÓN'}{' '}
                            <ArrowRight size={18} strokeWidth={2.5} />
                        </Link>
                    </div>

                    <div className="w-full max-w-[240px] sm:max-w-[280px] shrink-0 relative z-10 mx-auto aspect-square bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-white/20 flex flex-col items-center justify-center shadow-xl p-4 group-hover:scale-105 transition-transform duration-700">
                        <div className="text-4xl sm:text-5xl mb-2 drop-shadow-xl">🤝</div>
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-1">
                            5 COINS
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-white/80 uppercase font-black tracking-widest">
                            Para ti
                        </div>
                        <div className="w-12 h-0.5 bg-white/20 my-2.5 sm:my-3 rounded-full"></div>
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-1">
                            -15%
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-white/80 uppercase font-black tracking-widest">
                            Para tu amigo
                        </div>
                    </div>
                </div>

                {/* Maksim Coins Info Banner */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 md:mb-10 shadow-lg border border-orange-100 flex flex-col lg:flex-row gap-5 lg:gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:bg-orange-500/10 transition-colors"></div>

                    <div className="lg:w-1/3 flex flex-col justify-center relative z-10 text-center lg:text-left border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-6">
                        <div className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black mb-2.5 sm:mb-3 uppercase tracking-[0.2em] shadow-sm self-center lg:self-start">
                            SISTEMA DE PUNTOS
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-2 sm:mb-3">
                            Maksim Coins
                        </h2>
                        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
                            Tu saldo virtual. Gana monedas y úsalas para obtener hasta un 20% de
                            descuento en tus próximos pedidos.
                        </p>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 mt-2 sm:mt-3 uppercase tracking-widest">
                            1 Coin = 1€
                        </p>
                    </div>

                    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
                        <div className="bg-orange-50/50 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-orange-100 flex flex-col hover:bg-orange-50 transition-colors">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg sm:text-xl mb-2 sm:mb-3 border border-orange-100">
                                📥
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight mb-1.5">
                                Cómo ganar
                            </h3>
                            <ul className="space-y-2 text-gray-600 text-xs sm:text-sm font-medium mt-1">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-orange-500 mt-0.5 text-base leading-none">
                                        •
                                    </span>
                                    <span>
                                        Gana <strong className="text-gray-900">5 Coins</strong> por
                                        cada amigo que haga su primer pedido con tu código de
                                        invitación.
                                    </span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-orange-500 mt-0.5 text-base leading-none">
                                        •
                                    </span>
                                    <span>
                                        A través de regalos sorpresa en tus próximos pedidos.
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-emerald-50/50 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-100 flex flex-col hover:bg-emerald-50 transition-colors">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg sm:text-xl mb-2 sm:mb-3 border border-emerald-100">
                                🛒
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight mb-1.5">
                                Cómo gastar
                            </h3>
                            <ul className="space-y-2 text-gray-600 text-xs sm:text-sm font-medium mt-1">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 mt-0.5 text-base leading-none">
                                        •
                                    </span>
                                    <span>
                                        Al procesar tu pedido, en el carrito verás la opción{' '}
                                        <strong className="text-gray-900">
                                            "Usar mis Coins para pagar"
                                        </strong>
                                        .
                                    </span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 mt-0.5 text-base leading-none">
                                        •
                                    </span>
                                    <span>
                                        Puedes usar tus Coins para pagar hasta el{' '}
                                        <strong className="text-gray-900">
                                            20% del valor total
                                        </strong>{' '}
                                        de tu pedido.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Dynamic Banners */}
                {banners.map(banner => {
                    const secondaryImages = banner.metadata?.images || [];
                    const hasGallery = secondaryImages.length >= 3;

                    return (
                        <div
                            key={banner.id}
                            className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 mb-6 md:mb-10 relative overflow-hidden shadow-xl flex flex-col lg:flex-row items-center gap-6 lg:gap-10 group isolate bg-orange-500 shadow-orange-500/20"
                        >
                            {/* Text Content */}
                            <div className="flex-1 relative z-10 w-full text-center lg:text-left">
                                {banner.subtitle && (
                                    <div className="inline-block bg-white/20 backdrop-blur-md px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black mb-3 sm:mb-4 border border-white/30 uppercase tracking-[0.2em] text-white shadow-sm">
                                        {banner.subtitle}
                                    </div>
                                )}
                                <h2 className="text-2xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4 tracking-tighter leading-tight sm:leading-[0.95] text-white drop-shadow-xl">
                                    {banner.title}
                                </h2>
                                <p className="text-xs sm:text-base md:text-xl font-medium mb-5 sm:mb-8 text-white/90 leading-relaxed max-w-xl mx-auto lg:mx-0 drop-shadow-sm">
                                    {banner.description}
                                </p>
                                <Link
                                    to={banner.cta_link || '/menu'}
                                    className="inline-flex items-center justify-center gap-2.5 bg-gray-900 text-white px-6 py-3 md:px-8 md:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase transition-all active:scale-95 shadow-lg hover:bg-black hover:shadow-black/20 w-full sm:w-auto tracking-wider"
                                >
                                    {banner.cta_text || 'PEDIR AHORA'}{' '}
                                    <ArrowRight size={18} strokeWidth={2.5} />
                                </Link>
                            </div>

                            {/* Images Visuals */}
                            <div className="w-full max-w-[360px] shrink-0 relative z-10 mx-auto">
                                {hasGallery ? (
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        {secondaryImages
                                            .slice(0, 3)
                                            .map((imgUrl: string, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border-2 sm:border-4 border-white/20 bg-white group-hover:-translate-y-1 transition-all duration-700"
                                                >
                                                    <SafeImage
                                                        src={imgUrl}
                                                        alt={`Visual ${idx}`}
                                                        className="w-full h-full object-cover"
                                                        getOptimizedUrl={(url: string) =>
                                                            getOptimizedImageUrl(url, 400)
                                                        }
                                                        fallbackContent={
                                                            <BrandedPlaceholder
                                                                icon={banner.icon}
                                                                color="#ffffff"
                                                                className="scale-50"
                                                            />
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border-2 sm:border-4 border-white bg-white/10 backdrop-blur-md flex flex-col items-center justify-center text-white group-hover:scale-105 transition-transform duration-500 px-3 text-center">
                                            <span className="text-xl sm:text-3xl md:text-4xl font-black drop-shadow-xl leading-none whitespace-nowrap">
                                                {formatDiscount(banner.discount)}
                                            </span>
                                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">
                                                PROMO
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-video lg:aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-4 sm:border-8 border-white/10 relative group-hover:scale-[1.02] transition-transform duration-700">
                                        <SafeImage
                                            src={banner.image_url || '/logo.svg'}
                                            alt={banner.title}
                                            className="w-full h-full object-cover"
                                            getOptimizedUrl={(url: string) =>
                                                getOptimizedImageUrl(url, 800)
                                            }
                                            fallbackContent={
                                                <BrandedPlaceholder icon="🍱" color="#ffffff" />
                                            }
                                        />
                                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-2xl sm:text-3xl font-black text-white">
                                                {formatDiscount(banner.discount)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Background Decorations */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-[0.02] pointer-events-none"></div>
                            <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-200/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
                            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-200/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
                        </div>
                    );
                })}

                {/* Fallback Loyalty Section if no banners */}
                {banners.length === 0 && (
                    <div className="bg-orange-500 rounded-2xl sm:rounded-3xl px-4 py-8 md:p-12 text-center text-white mb-10 md:mb-16 relative overflow-hidden shadow-xl shadow-orange-500/20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10"></div>
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-2xl md:text-4xl font-black mb-3 tracking-tight leading-tight text-white">
                                ¡Premio a tu lealtad!
                            </h2>
                            <p className="text-sm md:text-xl font-medium mb-6 md:mb-8 text-white/90">
                                ¡Tras completar 4 pedidos recibirás un{' '}
                                <span className="text-gray-900 font-bold">5%</span> de descuento
                                para tu 5º pedido!
                            </p>
                            <Link
                                to={user ? '/menu' : '/profile'}
                                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 md:px-10 md:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase transition-all active:scale-95 shadow-lg hover:bg-black"
                            >
                                {user ? 'HACER UN PEDIDO' : 'REGISTRARSE'}{' '}
                                <ArrowRight size={18} strokeWidth={2} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Special Menus section */}
                <div className="mb-12 md:mb-16 max-w-6xl mx-auto">
                    <div className="flex flex-col items-center gap-2.5 mb-6 md:mb-8">
                        <Tag size={28} strokeWidth={2} className="text-orange-600" />
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 m-0 tracking-tight uppercase text-center">
                            Menús Especiales
                        </h2>
                        <div className="h-1.5 w-20 bg-orange-600 rounded-full"></div>
                    </div>

                    {promoItems.length === 0 ? (
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-gray-100 shadow-inner">
                            <div className="text-5xl mb-4 grayscale opacity-20">🍱</div>
                            <p className="text-gray-400 text-base sm:text-lg font-bold uppercase tracking-widest">
                                Próximamente nuevos menús
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                            {promoItems.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-gray-200/40 overflow-hidden hover:-translate-y-1.5 transition-all duration-500 flex flex-col group border border-gray-50"
                                >
                                    <div className="h-40 md:h-64 bg-gray-50 overflow-hidden relative flex items-center justify-center">
                                        <SafeImage
                                            src={item.image}
                                            alt={`Oferta ${item.name}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            getOptimizedUrl={(url: string) =>
                                                getOptimizedImageUrl(url, 640)
                                            }
                                            fallbackContent={
                                                <BrandedPlaceholder icon="🍱" color="#F26522" />
                                            }
                                        />
                                        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9px] md:text-xs uppercase tracking-[0.2em] font-black px-4 py-2 rounded-full shadow-2xl">
                                            Special
                                        </div>
                                    </div>
                                    <div className="p-3.5 sm:p-5 md:p-6 flex flex-col flex-1">
                                        <h3 className="font-black text-gray-900 text-base sm:text-lg md:text-xl mb-1 md:mb-2 line-clamp-1 tracking-tight">
                                            {item.name}
                                        </h3>
                                        <p className="text-gray-400 font-medium text-[10px] sm:text-xs md:text-sm leading-relaxed mb-3 md:mb-5 line-clamp-2 md:line-clamp-3">
                                            {item.description}
                                        </p>
                                        <div className="flex flex-row items-center justify-between gap-2 mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-xs sm:text-sm font-bold text-gray-300 line-through decoration-orange-500/30 -mb-0.5">
                                                    {Math.round(item.price * 1.11)} €
                                                </span>
                                                <span className="text-lg sm:text-xl font-black text-orange-600 leading-none">
                                                    {item.price.toFixed(2).replace('.', ',')}€
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleAdd(item)}
                                                className={`flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl sm:rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex-shrink-0 ${
                                                    addedItems.has(String(item.id))
                                                        ? 'bg-green-500 text-white shadow-lg translate-y-[-2px]'
                                                        : 'bg-gray-900 text-white hover:bg-orange-600 shadow-lg active:scale-90 hover:shadow-orange-200'
                                                }`}
                                            >
                                                <AnimatePresence mode="wait" initial={false}>
                                                    {addedItems.has(String(item.id)) ? (
                                                        <motion.div
                                                            key="added"
                                                            initial={{ opacity: 0, y: 15 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -15 }}
                                                            transition={{
                                                                duration: 0.3,
                                                                ease: 'easeOut',
                                                            }}
                                                            className="flex items-center justify-center gap-2"
                                                        >
                                                            <Check size={20} strokeWidth={3} />
                                                            <span className="hidden md:inline">
                                                                Listo
                                                            </span>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="add"
                                                            initial={{ opacity: 0, y: 15 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -15 }}
                                                            transition={{
                                                                duration: 0.3,
                                                                ease: 'easeOut',
                                                            }}
                                                            className="flex items-center justify-center gap-2"
                                                        >
                                                            <Plus size={20} strokeWidth={3} />
                                                            <span className="hidden md:inline">
                                                                Pedir
                                                            </span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
