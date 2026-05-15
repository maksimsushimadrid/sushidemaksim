import { MenuItem } from '../../hooks/queries/useMenu';
import { CATEGORIES } from '../../constants/menu';
import ProductCard from './ProductCard';
import React from 'react';

interface ProductGridProps {
    items: MenuItem[];
    selectedCategory: string;
    search: string;
    setSearch: (val: string) => void;
    setSelectedCategory: (val: string) => void;
    user: any;
    favorites: Set<number>;
    onToggleFavorite: (id: number) => void;
    onShare: (item: MenuItem, e: React.MouseEvent) => void;
    onAddToCart: (item: MenuItem, e: React.MouseEvent<HTMLButtonElement>, quantity: number) => void;
    addedItems: Set<number>;
    highlightedItemId?: string | null;
}

export default function ProductGrid({
    items,
    selectedCategory,
    search,
    setSearch,
    setSelectedCategory,
    user,
    favorites,
    onToggleFavorite,
    onShare,
    onAddToCart,
    addedItems,
    highlightedItemId,
}: ProductGridProps) {
    const [activeItemId, setActiveItemId] = React.useState<number | null>(null);

    if (items.length === 0) {
        return (
            <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 shadow-sm">
                <div className="text-6xl mb-6">🙊</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">
                    {search
                        ? `No hay resultados para "${search}"`
                        : 'No hay platos en esta categoría'}
                </h3>
                <p className="text-gray-500">Prueba a cambiar los filtros</p>
                <button
                    onClick={() => {
                        setSearch('');
                        setSelectedCategory('all');
                    }}
                    className="mt-8 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black border-none cursor-pointer hover:bg-orange-600 transition-colors shadow-lg"
                >
                    Ver Todo
                </button>
            </div>
        );
    }

    const categoriesToShow = search
        ? CATEGORIES.filter(cat => items.some(item => item.category === cat.id))
        : selectedCategory === 'all'
          ? CATEGORIES.filter(cat => items.some(item => item.category === cat.id))
          : CATEGORIES.filter(cat => cat.id === selectedCategory);

    return (
        <div className="space-y-12 pb-32">
            {categoriesToShow.map(cat => {
                const sectionItems =
                    selectedCategory === 'all' && !search
                        ? items.filter(item => item.category === cat.id)
                        : items;

                if (sectionItems.length === 0) return null;

                return (
                    <div
                        key={cat.id}
                        className="scroll-mt-32 md:scroll-mt-40"
                        id={`section-${cat.id}`}
                    >
                        {/* Always show header when single category is selected, or for each category in 'All' view */}
                        {(!search || selectedCategory === 'all') && (
                            <div className="mb-8 md:mb-12">
                                <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                                    <div className="hidden md:flex w-12 h-12 rounded-2xl bg-white shadow-sm items-center justify-center text-2xl border border-gray-100">
                                        {cat.icon && (
                                            <cat.icon
                                                size={24}
                                                strokeWidth={1.5}
                                                className="text-orange-600"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter italic leading-none">
                                            {cat.name ||
                                                (Array.isArray(CATEGORIES)
                                                    ? CATEGORIES.find(c => c.id === cat.id)?.name
                                                    : '')}
                                        </h2>
                                    </div>
                                </div>
                                {(cat as any).description && (
                                    <p className="text-gray-500 text-sm md:text-lg max-w-2xl leading-relaxed font-normal">
                                        {(cat as any).description}
                                    </p>
                                )}
                                <div className="h-[2px] w-full max-w-[100px] bg-gradient-to-r from-orange-500 to-transparent mt-6 md:mt-8"></div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                            {sectionItems.map(item => (
                                <ProductCard
                                    key={item.id}
                                    item={item}
                                    user={user}
                                    isFavorite={favorites.has(item.id)}
                                    onToggleFavorite={onToggleFavorite}
                                    onShare={onShare}
                                    onAddToCart={onAddToCart}
                                    isAdded={addedItems.has(item.id)}
                                    isHighlighted={String(item.id) === highlightedItemId}
                                    isZoomed={activeItemId === item.id}
                                    onZoom={() => setActiveItemId(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
