import { useState, useMemo, useEffect } from 'react';
import { useMenu } from '../hooks/queries/useMenu';
import {
    Plus,
    Minus,
    Check,
    ShoppingBag,
    Loader2,
    LogOut,
    MessageSquare,
    X,
    ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { EMOJI } from '../constants/menu';

// Map of item name patterns → available options
const ITEM_OPTIONS: Record<string, string[]> = {
    cerveza: ['Mahou', 'Águila', 'De grifo', 'Tostada 0,0', 'Radler'],
    agua: ['Sin gas', 'Con gas'],
    'coca-cola': ['Coca-Cola', 'Fanta', 'Sprite'],
    limonada: ['Aquarius Limón', 'Aquarius Naranja'],
};

// Exclude false positives (e.g. "aguacate" should NOT match "agua")
const OPTION_EXCLUDES: Record<string, string[]> = {
    agua: ['aguacate'],
};

function getItemOptions(name: string): string[] | null {
    const lower = name.toLowerCase();
    for (const [key, options] of Object.entries(ITEM_OPTIONS)) {
        if (!lower.includes(key)) continue;
        // Check exclusion list
        const excludes = OPTION_EXCLUDES[key];
        if (excludes && excludes.some(ex => lower.includes(ex))) continue;
        return options;
    }
    return null;
}

export default function WaiterOrderPage() {
    const [orderComment, setOrderComment] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    // Composite key: "itemId" for plain items, "itemId:option" for items with variants
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTable, setSelectedTable] = useState('S/N');
    const [showTableDrawer, setShowTableDrawer] = useState(false);
    const [customTable, setCustomTable] = useState('');

    const makeKey = (itemId: number, option?: string) =>
        option ? `${itemId}:${option}` : `${itemId}`;
    const parseKey = (key: string) => {
        const idx = key.indexOf(':');
        if (idx === -1) return { itemId: Number(key), option: '' };
        return { itemId: Number(key.slice(0, idx)), option: key.slice(idx + 1) };
    };
    // Total quantity for a given itemId across all options
    const getItemTotal = (itemId: number) =>
        Object.entries(selectedItems)
            .filter(([k]) => parseKey(k).itemId === itemId)
            .reduce((sum, [, q]) => sum + q, 0);
    const toast = useToast();
    const { user, isLoading: authLoading, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && (!user || (user.role !== 'waiter' && user.role !== 'admin'))) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const { data: menuItems = [], isLoading: menuLoading } = useMenu('all', '');

    const isBeverage = (category: string) =>
        category === 'bebidas' || category === 'drink' || category === 'drinks';

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            if (selectedCategory === 'all') {
                // Exclude beverages from "Todos" — they only appear in "Bebidas"
                return !isBeverage(item.category);
            }
            return isBeverage(item.category);
        });
    }, [menuItems, selectedCategory]);

    if (authLoading || !user || (user.role !== 'waiter' && user.role !== 'admin')) {
        return (
            <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-600" size={32} />
            </div>
        );
    }

    const handleQuantityChange = (key: string, delta: number) => {
        setSelectedItems(prev => {
            const current = prev[key] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            }
            return { ...prev, [key]: next };
        });
    };

    const totalCount = Object.values(selectedItems).reduce((a, b) => a + b, 0);
    const totalPrice = Object.entries(selectedItems).reduce((sum, [key, qty]) => {
        const { itemId } = parseKey(key);
        const item = menuItems.find(i => i.id === itemId);
        return sum + (item?.price || 0) * qty;
    }, 0);

    const handleConfirmOrder = () => {
        if (totalCount === 0) return;
        setShowConfirmModal(true);
    };

    const finalizeOrder = async () => {
        setIsSubmitting(true);
        try {
            const orderData = {
                items: Object.entries(selectedItems).map(([key, qty]) => {
                    const { itemId, option } = parseKey(key);
                    const item = menuItems.find(i => i.id === itemId);
                    return {
                        id: itemId,
                        name: item?.name || 'Producto',
                        price: item?.price || 0,
                        quantity: qty,
                        image: item?.image || '',
                        ...(option ? { selected_option: option } : {}),
                    };
                }),
                totalValue: totalPrice,
                itemsCount: totalCount,
                waiterId: user?.name || 'Camarero',
                metadata: {
                    table: selectedTable,
                    comment: orderComment, // Comment passed within metadata
                },
            };

            await api.post('/analytics/waiter-order', orderData);

            toast.success('¡Pedido enviado a cocina!');

            if (navigator.vibrate) navigator.vibrate([40, 40, 40]);

            setSelectedItems({});
            setOrderComment('');
            setShowConfirmModal(false);
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Error al enviar el pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#FBF7F0] pb-24 w-full overflow-x-hidden overflow-y-auto"
            style={{ overscrollBehaviorX: 'none' }}
        >
            <SEO title="Panel de Camarero" description="Gestión rápida de pedidos en sala" />

            {/* Minimal Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-100">
                            <ShoppingBag size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 leading-none mb-1">
                                Nueva Comanda
                            </h1>
                            <div className="flex items-center gap-1.5 leading-none">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    {user?.name || 'Camarero'}
                                </span>
                                <span className="text-[9px] text-gray-300">•</span>
                                <button
                                    onClick={() => setShowTableDrawer(true)}
                                    className="text-[10px] font-black text-orange-600 hover:text-orange-700 bg-orange-50 active:bg-orange-100 px-2 py-0.5 rounded-full transition-colors flex items-center gap-0.5 cursor-pointer"
                                >
                                    <span>Mesa: {selectedTable}</span>
                                    <ChevronDown size={10} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-3 text-gray-400" size={16} />
                    <textarea
                        placeholder="Instrucciones o cambios en el pedido... (Ej: Sin cebolla, extra picante)"
                        value={orderComment}
                        onChange={e => setOrderComment(e.target.value)}
                        rows={2}
                        className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 ring-orange-500/20 transition-all outline-none resize-none"
                    />
                </div>
            </div>

            {/* Horizontal Category Bar */}
            <div className="sticky top-[108px] z-20 bg-white/50 backdrop-blur-sm border-b border-gray-100/50 py-2 mb-1 overflow-x-auto scrollbar-hide">
                <div className="flex px-3 gap-2 whitespace-nowrap">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                            selectedCategory === 'all'
                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                                : 'bg-white text-gray-500 border border-gray-100'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setSelectedCategory('bebidas')}
                        className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                            selectedCategory === 'bebidas'
                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                                : 'bg-white text-gray-500 border border-gray-100'
                        }`}
                    >
                        Bebidas
                    </button>
                </div>
            </div>

            {/* Product List */}
            <div className="px-3 space-y-1.5 mt-2">
                {menuLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-orange-600 mb-4" size={32} />
                        <p className="text-xs font-bold text-gray-500">Cargando menú...</p>
                    </div>
                ) : filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <motion.div
                            layout
                            key={item.id}
                            className={`bg-white p-2 rounded-2xl border transition-all ${
                                getItemTotal(item.id) > 0
                                    ? 'border-orange-100 bg-orange-50/10'
                                    : 'border-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => {
                                        const options = getItemOptions(item.name);
                                        if (!options) {
                                            // No options — use plain key
                                            const key = makeKey(item.id);
                                            handleQuantityChange(key, 1);
                                        }
                                        // Items with options — do nothing on image tap, use option buttons
                                    }}
                                    className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-50 flex items-center justify-center cursor-pointer"
                                >
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={e => {
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `<span class="text-2xl grayscale opacity-30">${EMOJI[item.category as keyof typeof EMOJI] || '🍱'}</span>`;
                                                }
                                            }}
                                        />
                                    ) : (
                                        <span className="text-2xl grayscale opacity-30">
                                            {EMOJI[item.category as keyof typeof EMOJI] || '🍱'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-black text-gray-900 leading-tight mb-0.5 truncate">
                                        {item.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-orange-600 leading-none">
                                        {item.price.toFixed(2)} €
                                    </p>
                                </div>

                                {/* Quantity controls for items WITHOUT options */}
                                {!getItemOptions(item.name) && (
                                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                        {(selectedItems[makeKey(item.id)] || 0) > 0 && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleQuantityChange(makeKey(item.id), -1)
                                                    }
                                                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-900 active:bg-gray-50 transition"
                                                >
                                                    <Minus size={12} strokeWidth={3} />
                                                </button>
                                                <div className="w-6 text-center text-[10px] font-black text-gray-900">
                                                    {selectedItems[makeKey(item.id)]}
                                                </div>
                                            </>
                                        )}
                                        <button
                                            onClick={() =>
                                                handleQuantityChange(makeKey(item.id), 1)
                                            }
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-95 ${
                                                selectedItems[makeKey(item.id)]
                                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                                                    : 'bg-white border border-gray-200 text-gray-900'
                                            }`}
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Per-option quantity rows for items WITH options */}
                            {getItemOptions(item.name) && (
                                <div className="mt-2 space-y-1.5 pl-[60px]">
                                    {getItemOptions(item.name)!.map(opt => {
                                        const key = makeKey(item.id, opt);
                                        const qty = selectedItems[key] || 0;
                                        return (
                                            <div
                                                key={opt}
                                                className="flex items-center justify-between"
                                            >
                                                <span
                                                    className={`text-[10px] font-black uppercase tracking-wider ${
                                                        qty > 0
                                                            ? 'text-orange-600'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    {opt}
                                                </span>
                                                <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                                                    {qty > 0 && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    handleQuantityChange(key, -1)
                                                                }
                                                                className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-900 active:bg-gray-50 transition"
                                                            >
                                                                <Minus size={10} strokeWidth={3} />
                                                            </button>
                                                            <div className="w-5 text-center text-[10px] font-black text-gray-900">
                                                                {qty}
                                                            </div>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleQuantityChange(key, 1)}
                                                        className={`w-6 h-6 rounded-md flex items-center justify-center transition active:scale-95 ${
                                                            qty > 0
                                                                ? 'bg-orange-600 text-white shadow-sm'
                                                                : 'bg-white border border-gray-200 text-gray-900'
                                                        }`}
                                                    >
                                                        <Plus size={10} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-sm font-bold text-gray-500">
                            No se encontraron productos
                        </p>
                    </div>
                )}
            </div>

            {/* Sticky Action Footer */}
            <AnimatePresence>
                {totalCount > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-4 left-3 right-3 z-50"
                    >
                        <div className="bg-gray-900 rounded-2xl p-3 shadow-2xl shadow-gray-900/40 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative">
                                    <ShoppingBag size={18} className="text-white" />
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 border border-gray-900 text-[8px] font-black rounded-full flex items-center justify-center text-white">
                                        {totalCount}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest leading-none mb-0.5">
                                        Comanda
                                    </p>
                                    <p className="text-lg font-black text-white leading-none">
                                        {totalPrice.toFixed(2)}
                                        <span className="text-xs text-orange-500 ml-0.5">€</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmOrder}
                                disabled={isSubmitting}
                                className={`h-10 px-4 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                                    isSubmitting
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95 shadow-lg shadow-orange-500/20'
                                }`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={14} />
                                ) : (
                                    <>
                                        Confirmar
                                        <Check size={16} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirmModal(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-gray-100"
                        >
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-sm font-black text-gray-900">
                                        Revisar Comanda
                                    </h2>
                                    {selectedTable === 'S/N' ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
                                                ⚠️ Не выбран столик
                                            </span>
                                            <button
                                                onClick={() => setShowTableDrawer(true)}
                                                className="text-[10px] font-black text-orange-600 underline cursor-pointer"
                                            >
                                                Seleccionar
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            Mesa {selectedTable}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-5 max-h-[60vh] overflow-y-auto no-scrollbar">
                                <div className="space-y-3 mb-6">
                                    {Object.entries(selectedItems).map(([key, qty]) => {
                                        const { itemId, option } = parseKey(key);
                                        const item = menuItems.find(i => i.id === itemId);
                                        return (
                                            <div
                                                key={key}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black">
                                                        {qty}x
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-gray-800">
                                                            {item?.name}
                                                        </span>
                                                        {option && (
                                                            <span className="ml-1.5 text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full uppercase">
                                                                {option}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-gray-900">
                                                    {((item?.price || 0) * qty).toFixed(2)}€
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {orderComment && (
                                    <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-2xl mb-6">
                                        <p className="text-[10px] font-black text-orange-800 uppercase tracking-wider mb-1">
                                            Instrucciones especialies:
                                        </p>
                                        <p className="text-xs font-bold text-orange-900 italic">
                                            "{orderComment}"
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center py-3 border-t border-gray-100">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        Total a pagar
                                    </span>
                                    <span className="text-2xl font-black text-gray-900">
                                        {totalPrice.toFixed(2)}€
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 bg-gray-50/50 border-t border-gray-100">
                                {selectedTable === 'S/N' && (
                                    <div className="text-center mb-3">
                                        <p className="text-[11px] font-bold text-red-500">
                                            ⚠️ Por favor, seleccione una mesa (Не выбран столик)
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowTableDrawer(true)}
                                            className="text-[11px] font-black text-orange-600 underline mt-0.5 cursor-pointer inline-block"
                                        >
                                            Seleccionar Mesa ahora
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={finalizeOrder}
                                    disabled={isSubmitting || selectedTable === 'S/N'}
                                    className="w-full h-12 bg-orange-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-95 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            Aceptar Pedido
                                            <Check size={18} strokeWidth={3} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Table Selection Bottom Sheet/Drawer */}
            <AnimatePresence>
                {showTableDrawer && (
                    <div className="fixed inset-0 z-[110] flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTableDrawer(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        {/* Sheet Content */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="bg-white w-full max-w-md rounded-t-[32px] overflow-hidden shadow-2xl relative z-10 border-t border-gray-100 pb-8"
                        >
                            {/* Drag/Visual Handle */}
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3" />

                            <div className="px-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black text-gray-900">
                                        Seleccionar Mesa
                                    </h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Mesa actual: {selectedTable}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowTableDrawer(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 max-h-[60vh] overflow-y-auto no-scrollbar space-y-5">
                                {/* Mesas Grid */}
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">
                                        Mesas
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Array.from({ length: 12 }, (_, i) => `Mesa ${i + 1}`).map(
                                            table => {
                                                const isSelected = selectedTable === table;
                                                return (
                                                    <button
                                                        key={table}
                                                        onClick={() => {
                                                            setSelectedTable(table);
                                                            setCustomTable('');
                                                            setShowTableDrawer(false);
                                                        }}
                                                        className={`py-3 rounded-xl text-xs font-black transition-all active:scale-95 ${
                                                            isSelected
                                                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                                                                : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {table.replace('Mesa ', '')}
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>

                                {/* Barra & Other Grid */}
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">
                                        Barra y Otros
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            'Barra 1',
                                            'Barra 2',
                                            'Barra 3',
                                            'Barra 4',
                                            'Para Llevar',
                                            'S/N',
                                        ].map(table => {
                                            const isSelected = selectedTable === table;
                                            return (
                                                <button
                                                    key={table}
                                                    onClick={() => {
                                                        setSelectedTable(table);
                                                        setCustomTable('');
                                                        setShowTableDrawer(false);
                                                    }}
                                                    className={`py-3 rounded-xl text-xs font-black transition-all active:scale-95 whitespace-nowrap px-2 ${
                                                        isSelected
                                                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                                                            : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {table}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Custom Table Number */}
                                <div className="border-t border-gray-50 pt-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">
                                        Mesa Personalizada
                                    </h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ej: Mesa 15, Terraza 3..."
                                            value={customTable}
                                            onChange={e => setCustomTable(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && customTable.trim()) {
                                                    setSelectedTable(customTable.trim());
                                                    setShowTableDrawer(false);
                                                }
                                            }}
                                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 ring-orange-500/20 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (customTable.trim()) {
                                                    setSelectedTable(customTable.trim());
                                                    setShowTableDrawer(false);
                                                }
                                            }}
                                            disabled={!customTable.trim()}
                                            className="px-5 bg-gray-900 text-white font-black text-xs rounded-xl hover:bg-gray-800 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
