import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Truck,
    Store,
    CreditCard,
    Wallet,
    Users,
    Minus,
    Plus,
    CheckCircle2,
    Search,
    Loader2,
    X,
} from 'lucide-react';
import { api } from '../../utils/api';
import { useCart } from '../../hooks/useCart';
import { triggerHaptic } from '../../utils/haptics';
import { tracker } from '../../analytics/tracker';
import { detectZone } from '../../utils/delivery';
import { BUSINESS_HOURS, getClosedDays } from '../../utils/storeStatus';
import CustomDatePicker from '../ui/CustomDatePicker';
import CustomTimePicker from '../ui/CustomTimePicker';
import { useFormContext, Controller } from 'react-hook-form';
import type { CheckoutInput } from '../../schemas/checkout.schema';

interface DeliveryFormProps {
    onSavedAddressSelect?: (addr: any) => void;
    user: any;
    deliveryZones: any[];
    isAuthenticated: boolean;
    todayStr: string;
    tomorrowStr: string;
    isStoreClosed: boolean;
    isTodayClosed: boolean;
    isPickupOnly: boolean;
    refs: {
        customerName: React.RefObject<HTMLInputElement>;
        guestEmail: React.RefObject<HTMLInputElement>;
        phone: React.RefObject<HTMLInputElement>;
        address: React.RefObject<HTMLInputElement>;
        house: React.RefObject<HTMLInputElement>;
        apartment: React.RefObject<HTMLInputElement>;
        customNote: React.RefObject<HTMLTextAreaElement>;
    };
}

export default function DeliveryForm({
    onSavedAddressSelect,
    user,
    deliveryZones,
    isAuthenticated,
    todayStr,
    tomorrowStr,
    isStoreClosed,
    isTodayClosed,
    isPickupOnly,
    refs,
}: DeliveryFormProps) {
    const {
        register,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useFormContext<CheckoutInput>();

    const { updateDeliveryDetails } = useCart();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);

    React.useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 3) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await api.get(
                    `/delivery-zones/search?q=${encodeURIComponent(searchQuery.trim())}`
                );
                setSearchResults(data || []);
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const selectAutocompleteResult = (res: any, queryHint: string) => {
        const lat = parseFloat(res.lat);
        const lon = parseFloat(res.lon);
        if (isNaN(lat) || isNaN(lon)) return;

        let street =
            res.address?.road || res.address?.pedestrian || res.display_name?.split(',')[0] || '';
        let houseNum = res.address?.house_number || '';

        if (!houseNum && res.display_name) {
            const displayNameParts = res.display_name.split(',');
            const firstPart = displayNameParts[0]?.trim() || '';

            if (/^\d+[a-zA-Z]?$/.test(firstPart)) {
                houseNum = firstPart;
                street = displayNameParts[1]?.trim() || street;
            } else {
                const match = firstPart.match(/(.+?)\s+(\d+[a-zA-Z]?)$/);
                if (match) {
                    street = match[1].trim();
                    houseNum = match[2];
                }
            }
        }

        const pc = res.address?.postcode || res.display_name?.match(/\b\d{5}\b/)?.[0] || '';

        if (queryHint) {
            const numInQuery = queryHint.match(/\b\d+[a-zA-Z]?\b/)?.[0];
            if (numInQuery && (!houseNum || houseNum !== numInQuery)) {
                houseNum = numInQuery;
            }
        }

        setValue('address', street, { shouldValidate: true });
        setValue('house', houseNum, { shouldValidate: true });
        setValue('postalCode', pc, { shouldValidate: true });
        setValue('apartment', '');

        const zone = detectZone(lat, lon, deliveryZones, pc);
        setValue('selectedZone', zone);

        // Also save coordinate details for precision
        setValue('lat', lat as any);
        setValue('lon', lon as any);

        updateDeliveryDetails({
            address: street,
            house: houseNum,
            postalCode: pc,
            apartment: '',
            selectedZone: zone,
            lat,
            lon,
        });

        if (onSavedAddressSelect) {
            onSavedAddressSelect({
                street,
                house: houseNum,
                postalCode: pc,
                lat,
                lon,
                label: 'Dirección seleccionada',
            });
        }

        setSearchQuery('');
        setSearchResults([]);
    };

    const closedDays = getClosedDays();

    const deliveryType = watch('deliveryType');
    const address = watch('address');
    const house = watch('house');
    const apartment = watch('apartment');
    const postalCode = watch('postalCode');
    const isScheduled = watch('isScheduled');
    const scheduledDate = watch('scheduledDate');
    const guestsCount = watch('guestsCount') || 2;
    const selectedZone = watch('selectedZone');

    // Effect to clear time if date changes or becomes invalid
    React.useEffect(() => {
        if (scheduledDate) {
            const [y, m, d] = scheduledDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const day = dateObj.getDay();
            const intervals = BUSINESS_HOURS[day] || [];
            if (intervals.length === 0) {
                setValue('scheduledTime', '');
            }
        }
    }, [scheduledDate, setValue]);

    const handleAddressClick = () => {
        triggerHaptic();
        // We find the button that triggers the modal in CartPage (passed via ref or just let it be)
        // Actually, CartPage handles the modal. We can just use a data attribute or trigger a custom event
        // But the previous implementation had setIsAddressModalOpen in props.
        // Let's use a simpler way: since they are in the same page, we can just click the hidden button or use a portal.
        // Actually, I'll just look for the modal trigger in CartPage.
        const modalTrigger = document.querySelector(
            '[data-testid="address-modal-trigger"]'
        ) as HTMLButtonElement;
        if (modalTrigger) modalTrigger.click();
    };

    const trackFormFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        tracker.track('form_focus', {
            metadata: { field: e.target.name },
        });
    };

    const getTimeSlots = () => {
        if (!scheduledDate) return [];
        const [y, m, d] = scheduledDate.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const day = dateObj.getDay();
        const intervals = BUSINESS_HOURS[day] || [];

        const slots: string[] = [];
        intervals.forEach(interval => {
            const [startH, startM] = interval.start.split(':').map(Number);
            const [endH, endM] = interval.end.split(':').map(Number);

            let currentMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            while (currentMinutes <= endMinutes) {
                const h = Math.floor(currentMinutes / 60);
                const min = currentMinutes % 60;
                slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
                currentMinutes += 30;
            }
        });
        return slots;
    };

    const availableSlots = getTimeSlots();
    const isDayClosedSelect = Boolean(scheduledDate && availableSlots.length === 0);
    const showStatusMessage =
        (isStoreClosed ||
            isTodayClosed ||
            (isPickupOnly && (!isScheduled || scheduledDate === todayStr))) &&
        deliveryType !== 'reservation' &&
        !isScheduled;

    const statusMessage = isTodayClosed
        ? '🏪 Hoy no aceptamos más pedidos. Por favor, selecciona la opción "Entrega programada" para mañana u otro día.'
        : isPickupOnly && (!isScheduled || scheduledDate === todayStr)
          ? '🏪 Hoy no disponemos de reparto a domicilio. ¡Pero puedes recoger tu pedido en nuestra dirección: C. de Barrilero, 20!'
          : '🏪 El restaurante está cerrado. Por favor, selecciona la opción "Entrega programada" para recibir tu pedido en el próximo horario de apertura.';

    const ErrorMessage = ({ name }: { name: keyof CheckoutInput }) => {
        const error = errors[name];
        if (!error) return null;
        return (
            <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase tracking-wider"
            >
                {error.message as string}
            </motion.p>
        );
    };

    return (
        <div className="bg-white md:rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.03)] md:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] px-3 py-5 md:p-6 mx-0 md:mx-0 rounded-[28px]">
            <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                    2
                </span>
                Entrega
            </h2>

            <div className="flex bg-gray-100/50 p-1.5 rounded-[22px] mb-6 border border-gray-100 relative">
                <button
                    type="button"
                    data-testid="delivery-type-delivery"
                    disabled={isPickupOnly && (!isScheduled || scheduledDate === todayStr)}
                    onClick={() => {
                        triggerHaptic();
                        setValue('deliveryType', 'delivery');
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-colors duration-300 border-none cursor-pointer relative z-10 ${
                        deliveryType === 'delivery'
                            ? 'text-orange-600'
                            : 'text-gray-400 hover:text-gray-500'
                    } ${
                        isPickupOnly && (!isScheduled || scheduledDate === todayStr)
                            ? 'opacity-30 grayscale cursor-not-allowed'
                            : ''
                    }`}
                >
                    {deliveryType === 'delivery' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white shadow-md shadow-gray-200/50 border border-gray-100 rounded-xl z-[-1]"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <Truck size={16} strokeWidth={2.5} />
                    Domicilio
                </button>
                <button
                    type="button"
                    data-testid="delivery-type-pickup"
                    onClick={() => {
                        triggerHaptic();
                        setValue('deliveryType', 'pickup');
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-colors duration-300 border-none cursor-pointer relative z-10 ${
                        deliveryType === 'pickup'
                            ? 'text-orange-600'
                            : 'text-gray-400 hover:text-gray-500'
                    }`}
                >
                    {deliveryType === 'pickup' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white shadow-md shadow-gray-200/50 border border-gray-100 rounded-xl z-[-1]"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <Store size={16} strokeWidth={2.5} />
                    Recogida
                </button>
                <button
                    type="button"
                    data-testid="delivery-type-reservation"
                    onClick={() => {
                        triggerHaptic();
                        setValue('deliveryType', 'reservation');
                        setValue('isScheduled', true);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-colors duration-300 border-none cursor-pointer relative z-10 ${
                        deliveryType === 'reservation'
                            ? 'text-orange-600'
                            : 'text-gray-400 hover:text-gray-500'
                    }`}
                >
                    {deliveryType === 'reservation' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white shadow-md shadow-gray-200/50 border border-gray-100 rounded-xl z-[-1]"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <Users size={16} strokeWidth={2.5} />
                    Reserva
                </button>
            </div>

            <AnimatePresence mode="wait">
                {deliveryType === 'pickup' && (
                    <motion.div
                        key="pickup-info"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                                    <Store size={20} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-amber-900 uppercase tracking-tight mb-1">
                                        Punto de Recogida
                                    </p>
                                    <p className="text-sm text-amber-800 font-medium">
                                        Calle Barrilero, 20, 28007 Madrid
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-amber-200/50">
                                        <p className="text-[10px] font-black text-amber-900/60 uppercase tracking-widest mb-2">
                                            Horario de servicio
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] font-medium text-amber-800">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="opacity-50 uppercase text-[9px] tracking-tight">
                                                    Mié – Vie
                                                </span>
                                                <span className="font-bold">19:00 – 22:30</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="opacity-50 uppercase text-[9px] tracking-tight">
                                                    Sáb – Dom
                                                </span>
                                                <span className="font-bold">
                                                    14:00–16:00, 19:00–22:30
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-amber-900/40 uppercase text-[9px] tracking-tight font-black">
                                                    Lun – Mar
                                                </span>
                                                <span className="text-amber-900/40 font-black uppercase">
                                                    Cerrado
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {deliveryType === 'reservation' && (
                    <motion.div
                        key="reservation-info"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                    <Users size={20} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-orange-900 uppercase tracking-tight mb-1">
                                        Reserva de Mesa
                                    </p>
                                    <p className="text-sm text-orange-800 font-medium">
                                        Prepararemos tu pedido para que esté listo cuando llegues a
                                        tu mesa.
                                    </p>
                                    <p className="text-[10px] text-orange-600 font-black uppercase mt-2">
                                        * Se requiere reserva previa confirmada
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {deliveryType === 'delivery' && (
                    <motion.div
                        key="delivery-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex flex-col gap-3">
                            {/* Hidden inputs to keep Refs attached even when visual inputs are not rendered */}
                            <div className="hidden" aria-hidden="true">
                                <input type="hidden" ref={refs.address} />
                                <input type="hidden" ref={refs.house} />
                                <input type="hidden" ref={refs.apartment} />
                            </div>

                            {user?.addresses && user.addresses.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                        Selección Rápida
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {user.addresses.map((addr: any) => {
                                            const zone = detectZone(
                                                addr.lat,
                                                addr.lon,
                                                deliveryZones,
                                                addr.postalCode
                                            );
                                            const isSelected =
                                                address === addr.street && house === addr.house;

                                            return (
                                                <button
                                                    key={addr.id}
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        if (onSavedAddressSelect) {
                                                            onSavedAddressSelect(addr);
                                                        }
                                                    }}
                                                    type="button"
                                                    className={`group relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                                                        isSelected
                                                            ? 'border-orange-600 bg-orange-50/30'
                                                            : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-gray-50/50'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-0 right-0 w-8 h-8 bg-orange-600 rounded-bl-2xl flex items-center justify-center text-white animate-in slide-in-from-top-2 slide-in-from-right-2 duration-300">
                                                            <CheckCircle2
                                                                size={12}
                                                                strokeWidth={3}
                                                            />
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                            isSelected
                                                                ? 'bg-orange-600 text-white'
                                                                : 'bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-600'
                                                        }`}
                                                    >
                                                        <MapPin size={18} strokeWidth={1.5} />
                                                    </div>

                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p
                                                            className={`text-xs font-black uppercase tracking-tight truncate ${
                                                                isSelected
                                                                    ? 'text-orange-900'
                                                                    : 'text-gray-900'
                                                            }`}
                                                        >
                                                            {addr.label || 'Dirección'}
                                                        </p>
                                                        <p className="text-[11px] font-medium text-gray-500 truncate leading-tight mt-0.5">
                                                            {addr.street} {addr.house}
                                                        </p>

                                                        {/* Zone Highlight Badge */}
                                                        {zone && (
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                <div
                                                                    className="w-1.5 h-1.5 rounded-full"
                                                                    style={{
                                                                        backgroundColor: zone.color,
                                                                    }}
                                                                />
                                                                <span className="text-[9px] font-black text-gray-800 uppercase tracking-tighter">
                                                                    {zone.name}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                    • {zone.cost.toFixed(2)}€
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="w-full">
                                {!address ? (
                                    <div className="space-y-4 mb-4">
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-10">
                                                {isSearching ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Search size={18} strokeWidth={2.5} />
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Introduce tu dirección (Calle y número)..."
                                                className="w-full bg-gray-50 border border-gray-200 rounded-[20px] pl-12 pr-12 py-3.5 text-sm font-bold outline-none focus:border-orange-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(242,101,34,0.1)] transition-all placeholder:text-gray-400 placeholder:font-normal"
                                            />
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setSearchResults([]);
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-500 transition-colors z-10 border-none cursor-pointer"
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Suggestions Dropdown */}
                                        <AnimatePresence>
                                            {searchResults.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="border border-gray-100 rounded-2xl bg-white shadow-xl overflow-hidden divide-y divide-gray-50 max-h-[220px] overflow-y-auto z-50 relative"
                                                >
                                                    {searchResults.map((res, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() =>
                                                                selectAutocompleteResult(
                                                                    res,
                                                                    searchQuery
                                                                )
                                                            }
                                                            className="w-full px-4 py-3 text-left hover:bg-orange-50 transition flex items-center gap-3 border-none bg-transparent cursor-pointer group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-orange-100 flex items-center justify-center shrink-0 transition-colors">
                                                                <MapPin
                                                                    size={16}
                                                                    className="text-gray-400 group-hover:text-orange-600"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0 text-left">
                                                                <p className="text-xs font-black text-gray-900 truncate">
                                                                    {
                                                                        res.display_name?.split(
                                                                            ','
                                                                        )[0]
                                                                    }
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 truncate mt-0.5 leading-tight">
                                                                    {res.display_name}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Map Fallback Button */}
                                        <button
                                            type="button"
                                            onClick={handleAddressClick}
                                            data-testid="address-input"
                                            className="w-full py-3.5 bg-white border-2 border-dashed border-gray-200 hover:border-orange-500 hover:bg-orange-50/10 text-gray-600 rounded-[20px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                                        >
                                            <MapPin size={14} className="text-orange-500" />O
                                            seleccionar en el mapa
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleAddressClick}
                                                data-testid="address-display"
                                                className="flex-1 bg-gray-50/80 backdrop-blur-sm rounded-[24px] md:rounded-[32px] p-3.5 md:p-6 border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500"
                                            >
                                                <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
                                                    <div className="shrink-0 group-hover:scale-110 transition-all duration-500">
                                                        <MapPin className="text-orange-500 w-6 h-6 md:w-10 md:h-10" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">
                                                            {address}
                                                            {house ? ` ${house}` : ''}
                                                            {apartment ? `, ${apartment}` : ''}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 md:gap-3 mt-1 md:mt-1.5">
                                                            <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 md:px-4 md:py-2 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 max-w-full">
                                                                <div
                                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                    style={{
                                                                        backgroundColor:
                                                                            selectedZone?.color ||
                                                                            '#EF4444',
                                                                    }}
                                                                />
                                                                <span className="text-[9px] md:text-xs font-black text-gray-900 uppercase tracking-widest whitespace-nowrap">
                                                                    {selectedZone?.name ||
                                                                        'Zona no detectada'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-gray-100/50 px-2 py-1 md:px-3 md:py-1.5 rounded-xl md:rounded-2xl border border-gray-100">
                                                                <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                                    CP {postalCode}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Clear / Edit Address Button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setValue('address', '', {
                                                        shouldValidate: true,
                                                    });
                                                    setValue('house', '', { shouldValidate: true });
                                                    setValue('postalCode', '', {
                                                        shouldValidate: true,
                                                    });
                                                    setValue('apartment', '', {
                                                        shouldValidate: true,
                                                    });
                                                    setValue('selectedZone', null);
                                                    updateDeliveryDetails({
                                                        address: '',
                                                        house: '',
                                                        postalCode: '',
                                                        apartment: '',
                                                        selectedZone: null,
                                                    });
                                                }}
                                                className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[28px] bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center shadow-sm hover:shadow transition-all shrink-0 cursor-pointer border-none"
                                                title="Cambiar dirección"
                                            >
                                                <X size={20} strokeWidth={2.5} />
                                            </button>
                                        </div>

                                        {isAuthenticated && (
                                            <div className="px-2 mt-2">
                                                <label className="flex items-center gap-3 p-3 bg-orange-50/20 rounded-2xl border border-orange-100/30 cursor-pointer group hover:bg-orange-50/40 transition-all select-none">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 accent-orange-600 rounded-md cursor-pointer border-2 border-orange-200"
                                                            {...register('saveAddress')}
                                                            onChange={e => {
                                                                triggerHaptic();
                                                                setValue(
                                                                    'saveAddress',
                                                                    e.target.checked
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-none mb-1">
                                                            Guardar dirección
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                                            Para tus futuros pedidos
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <ErrorMessage name="address" />
                                <ErrorMessage name="house" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                        3
                    </span>
                    Pago
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic();
                            setValue(
                                'paymentMethod',
                                watch('paymentMethod') === 'card' ? null : 'card'
                            );
                        }}
                        data-testid="payment-method-card"
                        className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                            watch('paymentMethod') === 'card'
                                ? 'border-orange-600 bg-orange-50/50 text-orange-600 shadow-sm'
                                : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                        }`}
                    >
                        <div
                            className={`p-2 rounded-lg transition-all ${watch('paymentMethod') === 'card' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                            <CreditCard size={18} strokeWidth={2} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight">Tarjeta</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic();
                            setValue(
                                'paymentMethod',
                                watch('paymentMethod') === 'cash' ? null : 'cash'
                            );
                        }}
                        data-testid="payment-method-cash"
                        className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                            watch('paymentMethod') === 'cash'
                                ? 'border-orange-600 bg-orange-50/50 text-orange-600 shadow-sm'
                                : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                        }`}
                    >
                        <div
                            className={`p-2 rounded-lg transition-all ${watch('paymentMethod') === 'cash' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                            <Wallet size={18} strokeWidth={2} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight">
                            Efectivo
                        </span>
                    </button>
                </div>
                <ErrorMessage name="paymentMethod" />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                        4
                    </span>
                    Contacto
                </h2>
                {!isAuthenticated && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">
                                Tu nombre *
                            </label>
                            <input
                                type="text"
                                {...register('customerName')}
                                ref={e => {
                                    register('customerName').ref(e);
                                    (refs.customerName as any).current = e;
                                }}
                                onFocus={trackFormFocus}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        refs.guestEmail.current?.focus();
                                    }
                                }}
                                placeholder="Ej: Juan Pérez"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(242,101,34,0.1)] transition bg-gray-50 focus:bg-white"
                            />
                            <ErrorMessage name="customerName" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">
                                Email (opcional)
                            </label>
                            <input
                                type="email"
                                {...register('guestEmail')}
                                ref={e => {
                                    register('guestEmail').ref(e);
                                    (refs.guestEmail as any).current = e;
                                }}
                                onFocus={trackFormFocus}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        refs.phone.current?.focus();
                                    }
                                }}
                                placeholder="tu@email.com"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(242,101,34,0.1)] transition bg-gray-50 focus:bg-white"
                            />
                            <ErrorMessage name="guestEmail" />
                        </div>
                    </div>
                )}
                <div className="mb-4">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:border-orange-400 focus-within:shadow-[0_0_0_3px_rgba(242,101,34,0.1)] transition-all overflow-hidden">
                        <div className="pl-3 pr-2 text-gray-400 font-bold text-base select-none border-r border-gray-100/50 h-full flex items-center bg-gray-50/50">
                            +34
                        </div>
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field: { value, onChange, onBlur } }) => (
                                <input
                                    type="tel"
                                    value={value || ''}
                                    ref={refs.phone}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                                        onChange(val);
                                    }}
                                    onBlur={onBlur}
                                    onFocus={trackFormFocus}
                                    placeholder="600 000 000"
                                    maxLength={9}
                                    data-testid="phone-input"
                                    className="flex-1 px-3 py-2.5 bg-transparent border-none text-base outline-none font-bold placeholder:font-normal placeholder:text-gray-400"
                                />
                            )}
                        />
                    </div>
                    <ErrorMessage name="phone" />
                    {isAuthenticated && (
                        <div className="px-1 mt-3">
                            <label className="flex items-center gap-3 p-3 bg-orange-50/20 rounded-2xl border border-orange-100/30 cursor-pointer group hover:bg-orange-50/40 transition-all select-none">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-orange-600 rounded-md cursor-pointer border-2 border-orange-200"
                                        {...register('saveProfile')}
                                        onChange={e => {
                                            triggerHaptic();
                                            setValue('saveProfile', e.target.checked);
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-none mb-1">
                                        Guardar teléfono en mi perfil
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                        Para tus futuros pedidos
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    {deliveryType === 'delivery' && (
                        <>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                                    {...register('noCall')}
                                    onChange={e => {
                                        triggerHaptic();
                                        setValue('noCall', e.target.checked);
                                    }}
                                />
                                Sin llamada de confirmación de pedido
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                                    {...register('noBuzzer')}
                                    onChange={e => {
                                        triggerHaptic();
                                        setValue('noBuzzer', e.target.checked);
                                    }}
                                />
                                No llamar al timbre / El repartidor llama al móvil
                            </label>
                        </>
                    )}

                    {deliveryType !== 'reservation' && (
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                                {...register('isScheduled')}
                                onChange={e => {
                                    triggerHaptic();
                                    setValue('isScheduled', e.target.checked);
                                }}
                            />
                            🔥 Entrega programada (Opcional)
                        </label>
                    )}

                    {showStatusMessage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 bg-orange-50 border border-orange-100 rounded-xl mt-2"
                        >
                            <p className="text-[11px] font-bold text-orange-600 m-0">
                                {statusMessage}
                            </p>
                        </motion.div>
                    )}

                    {(isScheduled || deliveryType === 'reservation') && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col gap-3 mt-2"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 ml-1 tracking-wider">
                                        Fecha
                                    </label>
                                    <Controller
                                        name="scheduledDate"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomDatePicker
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                min={isTodayClosed ? tomorrowStr : todayStr}
                                                disabledDays={closedDays}
                                                placeholder="dd/mm/aaaa"
                                            />
                                        )}
                                    />
                                    <ErrorMessage name="scheduledDate" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 ml-1 tracking-wider">
                                        Hora
                                    </label>
                                    <Controller
                                        name="scheduledTime"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTimePicker
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                slots={availableSlots}
                                                disabled={
                                                    isDayClosedSelect || availableSlots.length === 0
                                                }
                                                placeholder={isDayClosedSelect ? 'Cerrado' : 'Hora'}
                                            />
                                        )}
                                    />
                                    <ErrorMessage name="scheduledTime" />
                                </div>
                            </div>

                            {deliveryType === 'reservation' && (
                                <div className="mt-1">
                                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5 ml-1 tracking-wider">
                                        Número de personas
                                    </label>
                                    <div className="flex items-center justify-between bg-gray-50 p-1 rounded-xl border border-gray-100 h-11">
                                        <div className="pl-3">
                                            <span className="text-[12px] font-black text-gray-900 leading-none">
                                                {Number(guestsCount) || 2}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg shadow-sm border border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic();
                                                    const current = Number(guestsCount) || 2;
                                                    setValue(
                                                        'guestsCount',
                                                        Math.max(1, current - 1)
                                                    );
                                                }}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-all border-none bg-transparent cursor-pointer"
                                            >
                                                <Minus size={14} strokeWidth={3} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic();
                                                    const current = Number(guestsCount) || 2;
                                                    setValue('guestsCount', current + 1);
                                                }}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-all border-none bg-transparent cursor-pointer"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">
                                        Para grupos de más de 8 personas, por favor contáctanos por
                                        teléfono.
                                    </p>
                                </div>
                            )}

                            {isDayClosedSelect && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 bg-orange-50 border border-orange-100 rounded-xl"
                                >
                                    <p className="text-[10px] font-bold text-orange-600 m-0 text-center">
                                        ⚠️ El restaurante está cerrado este día. Por favor elige
                                        otra fecha.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Comentario para el pedido (Opcional)
                    </label>
                    <textarea
                        {...register('customNote')}
                        ref={e => {
                            register('customNote').ref(e);
                            (refs.customNote as any).current = e;
                        }}
                        placeholder="Ej. Quitar pepino del rollo California..."
                        rows={2}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(242,101,34,0.1)] transition bg-gray-50 focus:bg-white resize-none"
                    />
                    <ErrorMessage name="customNote" />
                </div>
            </div>
        </div>
    );
}
