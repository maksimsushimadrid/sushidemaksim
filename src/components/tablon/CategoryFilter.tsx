import { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { getCategoryIcon } from '../../utils/tablonIcons';
import type { TablonCategory } from '../../hooks/queries/useTablon';

interface CategoryFilterProps {
    categories: TablonCategory[];
    selectedCategoryId: string | null;
    onSelect: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategoryId, onSelect }: CategoryFilterProps) {
    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'es')),
        [categories]
    );

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            <button
                data-testid="category-filter-all"
                onClick={() => onSelect(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border-2 ${
                    selectedCategoryId === null
                        ? 'bg-orange-500/10 border-orange-500/50 text-orange-500'
                        : 'bg-transparent border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                }`}
            >
                <LayoutGrid size={14} strokeWidth={2.5} />
                <span>Todos</span>
            </button>

            {sortedCategories.map(cat => {
                const Icon = getCategoryIcon(cat.name);
                const isActive = selectedCategoryId === cat.id.toString();

                return (
                    <button
                        key={cat.id}
                        data-testid={`category-filter-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => onSelect(isActive ? null : cat.id.toString())}
                        className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border-2 ${
                            isActive
                                ? 'bg-orange-500/10 border-orange-500/50 text-orange-500'
                                : 'bg-transparent border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                        }`}
                    >
                        <Icon size={14} strokeWidth={2.5} />
                        <span>{cat.name}</span>
                    </button>
                );
            })}
        </div>
    );
}
