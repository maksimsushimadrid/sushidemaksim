import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Clock, Info } from 'lucide-react';
import { SushiItem } from '../../types';
import { TABLE_IMAGE_OVERRIDES } from '../../constants/tableOverrides';
import SafeImage from '../common/SafeImage';
import { cn } from '../../utils/cn';

interface TableBottomSheetProps {
    item: SushiItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (item: SushiItem, e?: React.MouseEvent, selectedOption?: string) => void;
}

const ITEM_OPTIONS: Record<string, string[]> = {
    '113': ['Mahou', 'El Águila', 'Amstel Oro 0,0', 'Ladrón de Tinto', 'Amstel Radler'],
    '116': ['Coca-Cola', 'Coca-Cola Zero', 'Fanta Naranja', 'Fanta Limón', 'Sprite'],
};

// Removed local IMAGE_OVERRIDES in favor of centralized src/constants/tableOverrides.ts

export const TableBottomSheet: React.FC<TableBottomSheetProps> = ({
    item,
    isOpen,
    onClose,
    onAddToCart,
}) => {
    // Use the new centralized overrides from public/sushidemaksim_black_style_photos
    const getDisplayImage = (itm: SushiItem) => {
        const override = TABLE_IMAGE_OVERRIDES[String(itm.id)];
        return override || itm.image;
    };

    const options = item ? ITEM_OPTIONS[item.id] : null;
    const [selectedOption, setSelectedOption] = React.useState('');

    // Reset selected option when item changes
    React.useEffect(() => {
        if (options) {
            setSelectedOption(options[0]);
        } else {
            setSelectedOption('');
        }
    }, [item, options]);

    // Lock body scroll when drawer is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[101] bg-[#0A0A0A] rounded-t-[40px] max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Drag Handle */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-10" />

                        {/* Banner Image */}
                        <div className="relative h-72 md:h-96 w-full bg-black overflow-hidden flex items-center justify-center p-0">
                            <SafeImage
                                src={getDisplayImage(item)}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-700 scale-[1.12]"
                            />
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2.5 bg-black rounded-full text-white shadow-2xl active:scale-95 transition-transform border border-white/10"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>

                            {/* Tags on Image */}
                            <div className="absolute bottom-6 left-6 flex gap-2">
                                {item.isPopular && (
                                    <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-[10px] font-black rounded-xl tracking-widest uppercase border border-white/10">
                                        🔥 POPULAR
                                    </span>
                                )}
                                {item.isChefChoice && (
                                    <span className="px-3 py-1.5 bg-orange-600 text-white text-[10px] font-black rounded-xl tracking-widest uppercase shadow-lg shadow-orange-200">
                                        👨‍🍳 CHEF CHOICE
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 pb-24 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">
                                        {item.name}
                                    </h2>
                                    <div className="flex items-center gap-4 text-gray-400 text-sm font-bold">
                                        {item.pieces && (
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={16} /> {item.pieces} PIECES
                                            </span>
                                        )}
                                        {item.vegetarian && (
                                            <span className="flex items-center gap-1.5 text-green-600">
                                                <Info size={16} /> VEGETARIAN
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-orange-600">
                                    {item.price.toFixed(2)}€
                                </div>
                            </div>

                            <p className="text-gray-400 text-lg leading-relaxed font-normal mb-8">
                                {item.description}
                            </p>

                            {/* Options Selector in Bottom Sheet */}
                            {options && (
                                <div className="mb-8">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                                        Selecciona sabor / marca
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {options.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setSelectedOption(opt)}
                                                className={cn(
                                                    'h-12 rounded-2xl border text-[10px] font-black uppercase tracking-tighter transition-all px-2',
                                                    selectedOption === opt
                                                        ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20'
                                                        : 'bg-white/5 border-white/10 text-gray-400'
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-8 border-t border-white/5 pt-6 mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                                        <Info size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                                            Category
                                        </span>
                                        <span className="text-[11px] font-black text-white uppercase leading-none">
                                            {item.category.replace('-', ' ')}
                                        </span>
                                    </div>
                                </div>
                                {item.category !== 'bebidas' &&
                                    item.category !== 'extras' &&
                                    item.spicy && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                <span className="text-sm">🌶️</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                                                    Spiciness
                                                </span>
                                                <span className="text-[11px] font-black text-white uppercase leading-none">
                                                    Spicy
                                                </span>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* Add to Order Button */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/5">
                            <button
                                onClick={() => {
                                    onAddToCart(item, undefined, selectedOption);
                                    onClose();
                                }}
                                className="w-full h-16 bg-orange-600 text-white rounded-[20px] font-black text-lg tracking-widest uppercase hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-950/20"
                            >
                                <Plus size={24} strokeWidth={3} />
                                ADD TO ORDER — {item.price.toFixed(2)}€
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
