import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { SushiItem } from '../../types';
import { TABLE_IMAGE_OVERRIDES } from '../../constants/tableOverrides';
import { cn } from '../../utils/cn';
import SafeImage from '../common/SafeImage';

interface TableProductCardProps {
    item: SushiItem;
    onAddToCart: (item: SushiItem, e: React.MouseEvent, selectedOption?: string) => void;
    onClick?: () => void;
}

const ITEM_OPTIONS: Record<string, string[]> = {
    '113': ['Mahou', 'El Águila', 'Amstel Oro 0,0', 'Ladrón de Tinto', 'Amstel Radler'],
    '116': ['Coca-Cola', 'Coca-Cola Zero', 'Fanta Naranja', 'Fanta Limón', 'Sprite'],
};

// Removed local IMAGE_OVERRIDES in favor of centralized src/constants/tableOverrides.ts

export const TableProductCard: React.FC<TableProductCardProps> = ({
    item,
    onAddToCart,
    onClick,
}) => {
    const [showCheck, setShowCheck] = React.useState(false);
    const options = ITEM_OPTIONS[item.id];
    const [selectedOption, setSelectedOption] = React.useState(options ? options[0] : '');

    // Use the new centralized overrides from public/sushidemaksim_black_style_photos
    const overrideUrl = TABLE_IMAGE_OVERRIDES[String(item.id)];
    const displayImage = overrideUrl || item.image;

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToCart(item, e, selectedOption);
        setShowCheck(true);
        setTimeout(() => setShowCheck(false), 800);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            data-item-id={item.id}
            className="group relative bg-[#1F1F1F] rounded-3xl overflow-hidden border border-white/5 shadow-2xl shadow-black transition-shadow cursor-default"
            onClick={onClick}
        >
            {/* Image Container - 1:1 Aspect Ratio with Spotlight Effect */}
            <div className="relative aspect-square overflow-hidden bg-black">
                {/* Spotlight Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15)_0%,transparent_70%)] z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent z-10 pointer-events-none" />

                <div className="absolute inset-0 flex items-center justify-center p-0">
                    <SafeImage
                        src={displayImage}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 filter brightness-[1.05] contrast-[1.1] scale-[1.12]"
                        style={{}}
                        loading="lazy"
                    />
                </div>

                {/* Labels (Promo, New, etc) */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
                    {item.isPromo && (
                        <span className="px-2 py-1 bg-red-600/90 backdrop-blur-md text-white text-[9px] font-black rounded-lg tracking-wider uppercase border border-white/10 shadow-lg">
                            OFFER
                        </span>
                    )}
                    {item.isNew && (
                        <span className="px-2 py-1 bg-green-600/90 backdrop-blur-md text-white text-[9px] font-black rounded-lg tracking-wider uppercase border border-white/10 shadow-lg">
                            NEW
                        </span>
                    )}
                </div>

                {/* Bottom Shadow Overlay for better text legibility */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
            </div>

            {/* Content Container */}
            <div className="p-3 pb-2">
                <h3 className="text-sm font-black text-white line-clamp-2 italic leading-tight uppercase">
                    {item.name}
                </h3>
                {item.description && (
                    <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-normal font-medium">
                        {item.description}
                    </p>
                )}
            </div>

            {/* Options Dropdown if applicable */}
            {options && (
                <div className="px-3 pb-3">
                    <select
                        value={selectedOption}
                        onChange={e => setSelectedOption(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full bg-[#282828] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black text-white uppercase tracking-tighter outline-none focus:border-orange-600 transition-colors cursor-pointer appearance-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1rem',
                        }}
                    >
                        {options.map(opt => (
                            <option key={opt} value={opt} className="bg-black">
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="h-16"></div>

            {/* Bottom Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between bg-[#282828] border-t border-white/5">
                <span className="text-sm font-black text-white pl-1">{item.price.toFixed(2)}€</span>

                <button
                    onClick={handleAdd}
                    className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90',
                        showCheck
                            ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                    )}
                >
                    <AnimatePresence mode="wait">
                        {showCheck ? (
                            <motion.div
                                key="check"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Check size={18} strokeWidth={3} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="plus"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Plus size={18} strokeWidth={3} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
};
