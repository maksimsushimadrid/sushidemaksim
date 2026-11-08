import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils/images';
import SafeImage from '../common/SafeImage';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

interface CartSuggestionsProps {
    suggestions: MenuItem[];
    isLoadingSuggestions: boolean;
    handleAddToCart: (item: MenuItem, quantity: number, isSuggestion?: boolean) => void;
    getCategoryEmoji: (category: string) => string;
}

export default function CartSuggestions({
    suggestions,
    isLoadingSuggestions,
    handleAddToCart,
    getCategoryEmoji,
}: CartSuggestionsProps) {
    const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});

    const getQuantity = (id: number) => localQuantities[id] || 1;

    const updateQuantity = (id: number, delta: number) => {
        setLocalQuantities(prev => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) + delta),
        }));
    };

    if (isLoadingSuggestions) {
        return (
            <div className="bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] p-6">
                <div className="h-6 w-32 bg-gray-100 animate-pulse rounded mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 items-center">
                            <div className="w-12 h-12 bg-gray-100 animate-pulse rounded"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-3/4 bg-gray-100 animate-pulse rounded"></div>
                                <div className="h-3 w-1/4 bg-gray-100 animate-pulse rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-xl shadow-gray-900/5 p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 border border-white/50">
            <h3 className="text-[13px] md:text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-[0.15em] text-gray-800">
                Completa tu pedido
            </h3>
            <div className="flex flex-col gap-3">
                {suggestions.map(item => (
                    <div
                        key={String(item.id)}
                        className="group flex items-center gap-2 p-1.5 bg-white/40 hover:bg-white rounded-xl transition-all duration-300 border border-transparent hover:border-gray-100 hover:shadow-lg hover:shadow-gray-200/40"
                    >
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100/50">
                            <SafeImage
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                getOptimizedUrl={(url: string) => getOptimizedImageUrl(url, 256)}
                                fallbackContent={
                                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-700">
                                        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                                        <span className="text-xl md:text-2xl relative z-10 drop-shadow-sm">
                                            {getCategoryEmoji(item.category)}
                                        </span>
                                    </div>
                                }
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] md:text-[13px] font-black text-gray-900 line-clamp-2 m-0 leading-none uppercase tracking-tight">
                                {item.name}
                            </p>
                            <p className="text-[10px] md:text-[12px] text-orange-600 font-bold mt-0.5 leading-none">
                                {item.price.toFixed(2).replace('.', ',')}€
                            </p>
                        </div>

                        {/* Quantity Selector - More Compact for Mobile */}
                        <div className="flex items-center bg-gray-50 rounded-full p-0.5 md:p-1 border border-gray-100">
                            <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-gray-400 hover:text-orange-600 transition-colors"
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="w-4 md:w-5 text-center text-[11px] md:text-[12px] font-black text-gray-900">
                                {getQuantity(item.id)}
                            </span>
                            <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-gray-400 hover:text-orange-600 transition-colors"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        </div>

                        <button
                            onClick={() => handleAddToCart(item, getQuantity(item.id), true)}
                            className="bg-gray-900 text-white rounded-xl w-9 h-9 md:w-10 md:h-10 hover:bg-orange-600 active:scale-90 transition-all duration-300 shadow-md flex items-center justify-center border-none cursor-pointer"
                            title="Añadir al pedido"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
