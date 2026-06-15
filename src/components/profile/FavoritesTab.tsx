import { useCart } from '../../hooks/useCart';
import ProductCard from '../menu/ProductCard';
import { MenuItem } from '../../hooks/queries/useMenu';
import { useAuth } from '../../hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function FavoritesTab() {
    const [favorites, setFavorites] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { addItem, items: cartItems } = useCart();
    const { user } = useAuth();
    const [activeItemId, setActiveItemId] = useState<number | null>(null);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            const data = await api.get('/user/favorites');
            // Normalize data if necessary (e.g., is_promo -> isPromo)
            const normalized = (data.favorites || []).map((item: any) => ({
                ...item,
                isPromo: item.isPromo ?? item.is_promo,
                isPopular: item.isPopular ?? item.is_popular,
                isChefChoice: item.isChefChoice ?? item.is_chef_choice,
                isNew: item.isNew ?? item.is_new,
            }));
            setFavorites(normalized);
        } catch (error) {
            console.error('Failed to load favorites', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (menuItemId: number) => {
        try {
            const data = await api.post('/user/favorites', { menuItemId });
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10);
            }
            if (!data.isFavorite) {
                setFavorites(prev => prev.filter(item => item.id !== menuItemId));
            }
        } catch (error) {
            console.error('Error toggling favorite', error);
        }
    };

    const handleAddToCart = (item: MenuItem, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
        addItem({ ...item, id: String(item.id) } as any);
    };

    const handleShare = (item: MenuItem, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: item.name,
                text: item.description,
                url: window.location.origin + '/menu?item=' + item.id,
            });
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-10 px-2 md:px-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                    <div className="h-8 w-48 skeleton rounded-xl" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div
                            key={i}
                            className="bg-white border border-gray-100 rounded-[32px] overflow-hidden space-y-4 shadow-sm pb-6"
                        >
                            <div className="h-[130px] md:h-[190px] skeleton rounded-none" />
                            <div className="px-6 space-y-3">
                                <div className="h-4 w-3/4 skeleton rounded" />
                                <div className="h-3 w-full skeleton rounded opacity-40" />
                                <div className="flex justify-between items-center pt-2">
                                    <div className="h-6 w-16 skeleton rounded" />
                                    <div className="h-10 w-10 skeleton rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight m-0">
                        Mis Favoritos
                    </h2>
                </div>
                <div className="bg-gray-50 rounded-[40px] p-16 text-center border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 text-3xl">
                        ❤️
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">
                        Aún no tienes favoritos
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                        Añade tus platos favoritos desde la carta para tenerlos siempre a mano y
                        realizar pedidos más rápido.
                    </p>
                    <button
                        onClick={() => (window.location.href = '/menu')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                    >
                        Nuestra Carta
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight m-0 flex items-center gap-2">
                        Mis Favoritos
                        <span className="w-5 h-5 md:w-6 md:h-6 bg-orange-600 text-white text-[10px] md:text-xs font-black rounded-full shadow-md shadow-orange-100 flex items-center justify-center shrink-0 not-italic">
                            {favorites.length}
                        </span>
                    </h2>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">
                        Tus platos preferidos listos para pedir
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {favorites.map(item => (
                    <ProductCard
                        key={item.id}
                        item={item}
                        user={user}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                        onShare={(item, e) => handleShare(item, e)}
                        onAddToCart={(item, e) => handleAddToCart(item, e)}
                        isAdded={cartItems.some(i => i.id === String(item.id))}
                        isZoomed={activeItemId === item.id}
                        onZoom={() => setActiveItemId(item.id)}
                    />
                ))}
            </div>
        </div>
    );
}
