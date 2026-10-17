import { Trash2, Minus, Plus, X, Users, ChevronDown } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils/images';
import SafeImage from '../common/SafeImage';
import { CartItem } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface CartItemListProps {
    items: CartItem[];
    updateQuantity: (
        id: string,
        quantity: number,
        cartItemId?: number,
        selectedOption?: string
    ) => void;
    removeItem: (id: string, cartItemId?: number) => void;
    clearCart: () => void;
    getCategoryEmoji: (category: string) => string;
    chopsticksCount: number;
    updateChopsticks: (count: number) => void;
    deliveryType?: 'delivery' | 'pickup' | 'reservation';
    deliveryCost?: number;
    selectedZone?: any;
    promoDiscount?: number | null;
    tipAmount?: number;
    coinsSpent?: number;
}

export default function CartItemList({
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getCategoryEmoji,
    chopsticksCount,
    updateChopsticks,
    deliveryType,
    deliveryCost = 0,
    selectedZone,
    promoDiscount,
    tipAmount = 0,
    coinsSpent = 0,
}: CartItemListProps) {
    const subtotal = items.reduce(
        (sum, item) => sum + (item.isGift ? 0 : item.price * item.quantity),
        0
    );
    const effectiveDeliveryCost =
        deliveryType === 'delivery' && selectedZone && deliveryCost > 0 ? deliveryCost : 0;
    const promoDiscountAmount = promoDiscount ? (subtotal * promoDiscount) / 100 : 0;
    const coinsDiscountAmount = coinsSpent || 0;
    const totalDiscounts = promoDiscountAmount + coinsDiscountAmount;
    const hasDiscounts = totalDiscounts > 0;
    const grossTotal = subtotal + effectiveDeliveryCost + tipAmount;
    const netTotal = Math.max(0, grossTotal - totalDiscounts);
    return (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="flex items-center justify-between p-4 pb-2 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                        1
                    </span>
                    <h2 className="text-sm font-black m-0 uppercase tracking-widest text-gray-900">
                        Tu Pedido ({items.reduce((sum, item) => sum + item.quantity, 0)})
                    </h2>
                </div>
                <button
                    onClick={clearCart}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5"
                >
                    <Trash2 size={12} strokeWidth={2.5} /> Vaciar
                </button>
            </div>

            <div className="flex flex-col">
                {items.map(item => (
                    <div
                        key={item.cartItemId || `${item.id}-${item.selectedOption || 'default'}`}
                        className="relative flex items-center gap-3 px-3 py-3 bg-white border-b border-gray-50 last:border-none animate-in slide-in-from-left duration-300"
                    >
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100 relative group/img">
                            <SafeImage
                                src={item.image}
                                alt={`Producto ${item.name}`}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                                getOptimizedUrl={(url: string) => getOptimizedImageUrl(url, 256)}
                                fallbackContent={
                                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative overflow-hidden group-hover/img:scale-110 transition-transform duration-500">
                                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                                        <div className="absolute w-12 h-12 bg-orange-500/5 rounded-full blur-xl"></div>
                                        <span className="text-2xl relative z-10 drop-shadow-md">
                                            {getCategoryEmoji(item.category)}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                                    </div>
                                }
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="mb-1.5 pr-8">
                                <h3 className="font-bold text-gray-900 leading-tight text-[13px] md:text-sm truncate mb-0.5">
                                    {item.name}
                                </h3>
                                {item.description && (
                                    <p className="text-[10px] text-gray-400 font-medium leading-none truncate opacity-60">
                                        {item.description}
                                    </p>
                                )}
                            </div>

                            {item.selectedOption &&
                                item.id !== '116' &&
                                item.menuItemId !== 116 &&
                                item.id !== '113' &&
                                item.menuItemId !== 113 &&
                                item.id !== '115' &&
                                item.menuItemId !== 115 && (
                                    <div className="mb-2 max-w-full">
                                        <span className="inline-block px-2 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100 max-w-full truncate">
                                            {item.selectedOption}
                                        </span>
                                    </div>
                                )}

                            {/* Drink Option Selector */}
                            {(item.id === '116' || item.menuItemId === 116) && (
                                <div className="mb-2 w-full max-w-full">
                                    <div className="relative flex items-center w-full max-w-[220px]">
                                        <select
                                            value={item.selectedOption || ''}
                                            onChange={e => {
                                                triggerHaptic();
                                                updateQuantity(
                                                    item.id,
                                                    item.quantity,
                                                    item.cartItemId,
                                                    e.target.value
                                                );
                                            }}
                                            className="w-full text-[11px] font-bold bg-white border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 outline-none text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 shadow-xs transition-all cursor-pointer hover:bg-gray-50 active:scale-95 truncate appearance-none"
                                        >
                                            <option value="">Elegir sabor...</option>
                                            <option value="Coca-Cola">🥤 Coca-Cola</option>
                                            <option value="Fanta">🍊 Fanta</option>
                                            <option value="Sprite">🍋 Sprite</option>
                                        </select>
                                        <ChevronDown
                                            size={14}
                                            className="absolute right-2 text-gray-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {(item.id === '113' || item.menuItemId === 113) && (
                                <div className="mb-2 w-full max-w-full">
                                    <div className="relative flex items-center w-full max-w-[220px]">
                                        <select
                                            value={item.selectedOption || ''}
                                            onChange={e => {
                                                triggerHaptic();
                                                updateQuantity(
                                                    item.id,
                                                    item.quantity,
                                                    item.cartItemId,
                                                    e.target.value
                                                );
                                            }}
                                            className="w-full text-[11px] font-bold bg-white border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 outline-none text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 shadow-xs transition-all cursor-pointer hover:bg-gray-50 active:scale-95 truncate appearance-none"
                                        >
                                            <option value="">Elegir cerveza...</option>
                                            <option value="Mahou">🍺 Mahou</option>
                                            <option value="El Águila">🍺 El Águila</option>
                                            <option value="Amstel Oro 0,0">
                                                🍺 Amstel Oro 0,0
                                            </option>
                                            <option value="Ladrón de Tinto">
                                                🍷 Ladrón de Tinto
                                            </option>
                                            <option value="Amstel Radler">🍺 Amstel Radler</option>
                                        </select>
                                        <ChevronDown
                                            size={14}
                                            className="absolute right-2 text-gray-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {(item.id === '115' || item.menuItemId === 115) && (
                                <div className="mb-2 w-full max-w-full">
                                    <div className="relative flex items-center w-full max-w-[220px]">
                                        <select
                                            value={item.selectedOption || 'Cerveza de Calabaza'}
                                            onChange={e => {
                                                triggerHaptic();
                                                updateQuantity(
                                                    item.id,
                                                    item.quantity,
                                                    item.cartItemId,
                                                    e.target.value
                                                );
                                            }}
                                            className="w-full text-[11px] font-bold bg-white border border-gray-200 rounded-lg pl-2.5 pr-7 py-1.5 outline-none text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 shadow-xs transition-all cursor-pointer hover:bg-gray-50 active:scale-95 truncate appearance-none"
                                        >
                                            <option value="Cerveza de Calabaza">
                                                🎃 Cerveza de Calabaza (Pumpkin Ale)
                                            </option>
                                            <option value="Cerveza Artesana Clásica">
                                                🍺 Cerveza Artesana Clásica
                                            </option>
                                        </select>
                                        <ChevronDown
                                            size={14}
                                            className="absolute right-2 text-gray-400 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-1 md:gap-4 mt-1">
                                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            if (item.quantity > 1) {
                                                updateQuantity(
                                                    item.id,
                                                    item.quantity - 1,
                                                    item.cartItemId,
                                                    item.selectedOption
                                                );
                                            } else {
                                                removeItem(item.id, item.cartItemId);
                                            }
                                        }}
                                        className="w-11 h-11 md:w-8 md:h-8 rounded-md bg-white border-none shadow-sm cursor-pointer flex items-center justify-center hover:text-orange-600 active:scale-90 transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                        disabled={item.isGift}
                                    >
                                        <Minus size={14} strokeWidth={2.5} />
                                    </button>
                                    <span className="w-8 md:w-8 text-center font-black text-gray-900 text-sm md:text-xs">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            updateQuantity(
                                                item.id,
                                                item.quantity + 1,
                                                item.cartItemId,
                                                item.selectedOption
                                            );
                                        }}
                                        className="w-11 h-11 md:w-8 md:h-8 rounded-md bg-white border-none shadow-sm cursor-pointer flex items-center justify-center hover:text-orange-600 active:scale-90 transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                        disabled={item.isGift}
                                    >
                                        <Plus size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <div className="flex items-center">
                                    {item.isGift ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-tight leading-none mb-1">
                                                🎁 {item.giftLabel || 'Regalo'}
                                            </span>
                                            <span className="text-[15px] md:text-base font-black text-green-600 leading-none">
                                                GRATIS
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[15px] md:text-base font-black text-gray-900 whitespace-nowrap leading-none">
                                                {(item.price * item.quantity)
                                                    .toFixed(2)
                                                    .replace('.', ',')}{' '}
                                                €
                                            </span>
                                            {item.quantity > 1 && (
                                                <span className="text-[10px] text-gray-400 font-medium mt-1">
                                                    {item.price.toFixed(2).replace('.', ',')} € / ud
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Absolute Remove Button */}
                        <button
                            onClick={() => {
                                triggerHaptic(40); // HEAVY
                                removeItem(item.id, item.cartItemId);
                            }}
                            className="absolute top-1.5 right-1.5 text-gray-300 hover:text-orange-500 cursor-pointer w-10 h-10 transition-colors flex items-center justify-center border-none bg-transparent z-10"
                            aria-label="Eliminar"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer with Info and Chopsticks */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <div className="flex flex-col gap-4">
                    {/* Mobile Summary Breakdown */}
                    {(deliveryType === 'delivery' ||
                        deliveryType === 'pickup' ||
                        (promoDiscount && promoDiscount > 0) ||
                        tipAmount > 0 ||
                        coinsSpent > 0) && (
                        <div className="lg:hidden flex flex-col gap-2.5 pb-4 border-b border-gray-100/80">
                            {/* Products */}
                            <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                <span>
                                    Productos ({items.reduce((s, i) => s + i.quantity, 0)} uds.)
                                </span>
                                <span className="text-gray-900 font-black">
                                    {subtotal.toFixed(2).replace('.', ',')} €
                                </span>
                            </div>

                            {/* Delivery */}
                            {deliveryType === 'delivery' && (
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <span>
                                        Envío {selectedZone ? `(${selectedZone.name})` : ''}
                                    </span>
                                    {!selectedZone ? (
                                        <span className="text-[10px] text-gray-400 italic font-bold">
                                            A determinar
                                        </span>
                                    ) : (
                                        <span
                                            className={
                                                deliveryCost <= 0
                                                    ? 'text-green-600 font-black'
                                                    : 'text-gray-900 font-black'
                                            }
                                        >
                                            {deliveryCost <= 0
                                                ? 'Gratis'
                                                : `${deliveryCost.toFixed(2).replace('.', ',')} €`}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Pickup */}
                            {deliveryType === 'pickup' && (
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <span>Recogida en local</span>
                                    <span className="text-green-600 font-black">Gratis</span>
                                </div>
                            )}

                            {/* Tip */}
                            {tipAmount > 0 && (
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <span>Propina equipo</span>
                                    <span className="text-gray-900 font-black">
                                        {tipAmount.toFixed(2).replace('.', ',')} €
                                    </span>
                                </div>
                            )}

                            {/* Subtotal without discount (when discounts are present) */}
                            {hasDiscounts && (
                                <div className="flex justify-between items-center py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-100 text-[11px] font-bold text-gray-600 uppercase tracking-wider my-0.5">
                                    <span>Subtotal sin descuento</span>
                                    <span className="text-gray-900 font-black text-xs">
                                        {grossTotal.toFixed(2).replace('.', ',')} €
                                    </span>
                                </div>
                            )}

                            {/* Discounts */}
                            {hasDiscounts && (
                                <div className="flex flex-col gap-1.5">
                                    {promoDiscount && promoDiscount > 0 && (
                                        <div className="flex justify-between items-center text-xs font-bold text-green-600 uppercase tracking-widest">
                                            <span>Descuento ({promoDiscount}%)</span>
                                            <span>
                                                -{promoDiscountAmount.toFixed(2).replace('.', ',')}{' '}
                                                €
                                            </span>
                                        </div>
                                    )}

                                    {coinsSpent > 0 && (
                                        <div className="flex justify-between items-center text-xs font-bold text-green-600 uppercase tracking-widest">
                                            <span>Maksim Coins</span>
                                            <span>
                                                -{coinsDiscountAmount.toFixed(2).replace('.', ',')}{' '}
                                                €
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Total row */}
                            <div className="flex justify-between items-center text-xs font-black text-gray-900 uppercase tracking-widest pt-2.5 border-t border-dashed border-gray-200 mt-1">
                                <div className="flex flex-col">
                                    <span>Total</span>
                                    {hasDiscounts && (
                                        <span className="text-[9px] text-green-600 font-bold lowercase tracking-normal">
                                            ahorras {totalDiscounts.toFixed(2).replace('.', ',')} €
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    {hasDiscounts && (
                                        <span className="text-[10px] text-gray-400 line-through font-bold block leading-none mb-0.5">
                                            {grossTotal.toFixed(2).replace('.', ',')} €
                                        </span>
                                    )}
                                    <span className="text-orange-600 text-sm">
                                        {netTotal.toFixed(2).replace('.', ',')} €
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notice */}
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                        <p className="text-[12px] font-black text-orange-600 leading-tight m-0 uppercase tracking-widest">
                            Salsa de soja, wasabi y jengibre están incluidos en su pedido.
                        </p>
                    </div>

                    {/* Chopsticks Question */}
                    <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                                <Users size={16} strokeWidth={2.5} />
                            </div>
                            <p className="text-[10px] sm:text-[13px] font-black text-gray-900 m-0 uppercase tracking-wide sm:tracking-widest whitespace-nowrap">
                                Número de personas
                            </p>
                        </div>

                        <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                            <button
                                onClick={() => {
                                    triggerHaptic();
                                    updateChopsticks(Math.max(1, chopsticksCount - 1));
                                }}
                                className="w-11 h-11 md:w-8 md:h-8 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center hover:text-orange-600 active:scale-90 transition-all font-bold disabled:opacity-30"
                                disabled={chopsticksCount <= 1}
                            >
                                <Minus size={16} strokeWidth={2.5} />
                            </button>
                            <span className="w-10 text-center font-black text-gray-900 text-base md:text-[14px]">
                                {chopsticksCount}
                            </span>
                            <button
                                onClick={() => {
                                    triggerHaptic();
                                    updateChopsticks(Math.min(10, chopsticksCount + 1));
                                }}
                                className="w-11 h-11 md:w-8 md:h-8 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center hover:text-orange-600 active:scale-90 transition-all font-bold disabled:opacity-30"
                                disabled={chopsticksCount >= 10}
                            >
                                <Plus size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
