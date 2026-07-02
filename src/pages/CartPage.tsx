import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import SEO from '../components/SEO';
import { useSettings } from '../hooks/queries/useSettings';
import {
    isStoreOpen,
    isTimeWithinBusinessHours,
    BUSINESS_HOURS,
    getDayOfWeekFromDateString,
} from '../utils/storeStatus';
import { detectZone } from '../utils/delivery';
import { CartSkeleton } from '../components/skeletons/CartSkeleton';
import AddressModal from '../components/AddressModal';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, type CheckoutInput } from '../schemas/checkout.schema';

// Modular Components
import CartItemList from '../components/cart/CartItemList';
import DeliveryForm from '../components/cart/DeliveryForm';
import CartSummary from '../components/cart/CartSummary';
import OrderSuccessModal from '../components/cart/OrderSuccessModal';
import CartSuggestions from '../components/cart/CartSuggestions';
import CartEmptyView from '../components/cart/CartEmptyView';
import { useScrollLock } from '../hooks/useScrollLock';
import { tracker } from '../analytics/tracker';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

export default function CartPage() {
    const {
        items,
        isLoading: cartLoading,
        updateQuantity,
        removeItem,
        clearCart,
        addItem,
        deliveryDetails,
        updateDeliveryDetails,
        resetDeliveryDetails,
    } = useCart();

    const navigate = useNavigate();
    const { isAuthenticated, user, updateProfile } = useAuth();
    const { success: showSuccess, error: showError } = useToast();

    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
    const [promoError, setPromoError] = useState<string | null>(null);

    const [isOrderingState, setIsOrdering] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
    const [orderWhatsappUrl, setOrderWhatsappUrl] = useState<string | null>(null);
    const [isLoadingZones, setIsLoadingZones] = useState(true);
    const [tipAmount, setTipAmount] = useState<number>(0);
    const [coinsSpent, setCoinsSpent] = useState<number>(0);
    const [lastOrderSummary, setLastOrderSummary] = useState<{
        total: number;
        deliveryCost: number;
        address: string;
        house: string;
        apartment: string;
        phone: string;
    } | null>(null);

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [deliveryZones, setDeliveryZones] = useState<any[]>([]);

    const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

    const [suggestions, setSuggestions] = useState<MenuItem[]>([]);
    const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isLoadingPopular, setIsLoadingPopular] = useState(false);
    const { data: siteSettings, isLoading: settingsLoading } = useSettings();
    const isLoadingSettings = settingsLoading || isLoadingZones;

    const [isApplyingPromo, setIsApplyingPromo] = useState(false);

    // Form Refs for reliable Safari capture
    const customerNameRef = useRef<HTMLInputElement>(null);
    const guestEmailRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const addressRef = useRef<HTMLInputElement>(null);
    const houseRef = useRef<HTMLInputElement>(null);
    const apartmentRef = useRef<HTMLInputElement>(null);
    const customNoteRef = useRef<HTMLTextAreaElement>(null);
    const isSubmittingRef = useRef(false);

    const todayStr = new Date().toLocaleDateString('sv-SE'); // Local date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('sv-SE');

    const isManualClosed = siteSettings?.isStoreClosed === true;
    const isTodayClosed = siteSettings?.isTodayClosed === true;
    const isPickupOnly = siteSettings?.isPickupOnly === true;
    const isOpenNow = isStoreOpen();

    const madridParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());
    const h = madridParts.find(p => p.type === 'hour')?.value || '00';
    const m = madridParts.find(p => p.type === 'minute')?.value || '00';
    const timeStr = `${h}:${m}`;

    // Check if current date and time falls within any custom closure period
    const activeClosure = (siteSettings?.customClosures || []).find((c: any) => {
        const { startDate, endDate, startTime, endTime } = c;
        if (!startDate || !endDate || !startTime || !endTime) return false;
        if (todayStr < startDate || todayStr > endDate) return false;
        if (todayStr > startDate && todayStr < endDate) return true;
        if (startDate === endDate) return timeStr >= startTime && timeStr <= endTime;
        if (todayStr === startDate) return timeStr >= startTime;
        if (todayStr === endDate) return timeStr <= endTime;
        return false;
    });

    const isStoreClosed = isManualClosed || !isOpenNow || isTodayClosed || !!activeClosure;

    const methods = useForm<CheckoutInput>({
        resolver: zodResolver(checkoutSchema) as any,
        defaultValues: deliveryDetails as any,
        mode: 'onTouched',
    });

    const {
        handleSubmit,
        watch,
        reset,
        formState: { isSubmitting: isOrderingForm },
    } = methods;

    const cartSubtotal = items.reduce((sum, i) => sum + (i.isGift ? 0 : i.price * i.quantity), 0);
    const discountAmount = promoDiscount ? (cartSubtotal * promoDiscount) / 100 : 0;

    const { deliveryType, selectedZone, isScheduled, scheduledDate } = watch();

    const MIN_ORDER =
        deliveryType === 'delivery'
            ? selectedZone
                ? (selectedZone.minOrder ?? 0)
                : (siteSettings?.minOrder ?? 15)
            : 0;

    const deliveryCost =
        deliveryType === 'delivery' ? (selectedZone ? (selectedZone.cost ?? 0) : 0) : 0;

    // Sync form changes back to deliveryDetails in useCart for persistence
    const watchedFields = watch();

    useEffect(() => {
        const hasChanged = JSON.stringify(watchedFields) !== JSON.stringify(deliveryDetails);
        if (hasChanged) {
            updateDeliveryDetails(watchedFields as any);
        }
    }, [watchedFields, deliveryDetails, updateDeliveryDetails]);

    // Handle initial state sync if user logs in
    useEffect(() => {
        if (user && !methods.getValues('customerName')) {
            methods.setValue('customerName', user.name || '');
            if (customerNameRef.current) customerNameRef.current.value = user.name || '';
        }
        if (user && !methods.getValues('guestEmail')) {
            methods.setValue('guestEmail', user.email || '');
            if (guestEmailRef.current) guestEmailRef.current.value = user.email || '';
        }
    }, [user, methods]);

    useScrollLock(isAddressModalOpen || !!orderSuccess);

    const handleCloseAddressModal = useCallback(() => {
        setIsAddressModalOpen(false);
    }, []);

    const recoverCoordinates = useCallback(async (addr: any) => {
        try {
            const query = `${addr.street || addr.address} ${addr.house || ''}, Madrid`.trim();
            const data = await api.get(`/delivery-zones/search?q=${encodeURIComponent(query)}`);
            if (data && data.length > 0) {
                const best = data[0];
                const rLat = Number(best.lat);
                const rLon = Number(best.lon);
                if (!isNaN(rLat) && !isNaN(rLon)) {
                    return { lat: rLat, lon: rLon };
                }
            }
        } catch (e) {
            console.error('Failed to recover coordinates:', e);
        }
        return null;
    }, []);

    const handleAddressSelect = useCallback(
        async (res: any) => {
            let finalLat = res.coordinates?.[0] ?? res.lat;
            let finalLon = res.coordinates?.[1] ?? res.lon;
            const pCode = res.postalCode || res.postal_code || '';

            // RECOVERY: If coords are missing (legacy or manual entry), try to geocode
            if (!finalLat || !finalLon) {
                const recovered = await recoverCoordinates(res);
                if (recovered) {
                    finalLat = recovered.lat;
                    finalLon = recovered.lon;
                }
            }

            const computedZone = res.zone || detectZone(finalLat, finalLon, deliveryZones, pCode);

            methods.setValue('address', res.address || res.street || '');
            methods.setValue('house', res.house || '');
            methods.setValue('apartment', res.apartment || '');
            methods.setValue('postalCode', pCode);
            methods.setValue('selectedZone', computedZone);
            methods.setValue('lat', finalLat ? Number(finalLat) : undefined);
            methods.setValue('lon', finalLon ? Number(finalLon) : undefined);

            // Sync refs
            if (addressRef.current) addressRef.current.value = res.address || res.street || '';
            if (houseRef.current) houseRef.current.value = res.house || '';
            if (apartmentRef.current) apartmentRef.current.value = res.apartment || '';
        },
        [methods, deliveryZones, recoverCoordinates]
    );

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const zonesData = await api.get('/delivery-zones');
                setDeliveryZones(zonesData.zones || []);
            } catch (err) {
                console.error('Failed to load initial data', err);
            } finally {
                setIsLoadingZones(false);
            }
        };
        loadInitialData();
        window.scrollTo(0, 0);
    }, []);

    // Sync selectedZone with latest data from DB when zones are loaded
    useEffect(() => {
        if (deliveryZones.length > 0 && deliveryDetails.selectedZone) {
            const freshZone = deliveryZones.find(
                z =>
                    z.id === deliveryDetails.selectedZone.id ||
                    z.name === deliveryDetails.selectedZone.name
            );
            if (freshZone) {
                const current = JSON.stringify(deliveryDetails.selectedZone);
                const latest = JSON.stringify(freshZone);
                if (current !== latest) {
                    methods.setValue('selectedZone', freshZone);
                }
            }
        }
    }, [deliveryZones, deliveryDetails.selectedZone, methods]);

    // Schedule integrity sync
    useEffect(() => {
        const isSelectedToday = scheduledDate === todayStr;
        if (
            isScheduled &&
            scheduledDate &&
            (scheduledDate < todayStr || (isTodayClosed && isSelectedToday))
        ) {
            methods.setValue('scheduledDate', isTodayClosed ? tomorrowStr : todayStr);
            methods.setValue('scheduledTime', '');
        }
    }, [todayStr, tomorrowStr, isScheduled, scheduledDate, isTodayClosed, methods]);

    const loadSuggestions = useCallback(async () => {
        if (suggestions.length > 0) return;

        setIsLoadingSuggestions(true);
        try {
            const data = await api.get('/menu?category=postre');
            setSuggestions(data.items || []);
        } catch (err) {
            console.error('Failed to load suggestions', err);
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, [suggestions.length]);

    const filteredSuggestions = useMemo(() => {
        return suggestions.filter(
            suggestion => !items.find(cartItem => String(cartItem.id) === String(suggestion.id))
        );
    }, [suggestions, items]);

    const loadPopularItems = useCallback(async () => {
        setIsLoadingPopular(true);
        try {
            const data = await api.get('/menu/popular');
            setPopularItems(data.items || []);
        } catch (err) {
            console.error('Failed to load recommended items', err);
        } finally {
            setIsLoadingPopular(false);
        }
    }, []);

    useEffect(() => {
        if (items.length === 0 && popularItems.length === 0 && !isLoadingPopular) {
            loadPopularItems();
        } else if (items.length > 0 && suggestions.length === 0 && !isLoadingSuggestions) {
            loadSuggestions();
        }
    }, [
        items.length,
        popularItems.length,
        suggestions.length,
        loadSuggestions,
        loadPopularItems,
        isLoadingPopular,
        isLoadingSuggestions,
    ]);

    const saveCurrentAddress = async () => {
        if (!isAuthenticated || !deliveryDetails.saveAddress || deliveryType !== 'delivery') return;

        try {
            const streetVal = (methods.getValues('address') || '').trim();
            const houseVal = (methods.getValues('house') || '').trim();
            const aptVal = (methods.getValues('apartment') || '').trim();
            const deliveryPhone = methods.getValues('phone') || user?.phone || '';

            if (!streetVal) return;

            const isDuplicate = (user?.addresses || []).some((addr: any) => {
                const s = (addr.street || '').trim().toLowerCase();
                const h = (addr.house || '').trim().toLowerCase();
                const a = (addr.apartment || '').trim().toLowerCase();

                const targetS = streetVal.trim().toLowerCase();
                const targetH = houseVal.trim().toLowerCase();
                const targetA = aptVal.trim().toLowerCase();

                return s === targetS && h === targetH && a === targetA;
            });

            if (isDuplicate) return;

            const { lat, lon } = deliveryDetails;

            await api.post('/user/addresses', {
                street: streetVal,
                house: houseVal,
                apartment: aptVal,
                postalCode:
                    methods.getValues('postalCode') ||
                    (selectedZone ? selectedZone.postalCodes?.[0] : ''),
                phone: deliveryPhone,
                label: 'Dirección reciente',
                lat,
                lon,
                isDefault: true,
            });
        } catch (saveErr: any) {
            // Silently handle address limit reached error as it's a common business logic limit
            const errorMsg = saveErr?.message || '';
            if (errorMsg.includes('límite máximo de 5')) {
                console.warn('Address not saved: profile address limit reached (5)');
            } else {
                console.error('Failed to save address to profile', saveErr);
            }
        }
    };

    const hasItems = items.length > 0;

    useEffect(() => {
        if (!cartLoading && hasItems) {
            tracker.track('page_view', {
                metadata: { title: 'Carrito y Finalización', path: '/cart' },
                userId: user?.id,
            });

            tracker.track('checkout_start', {
                metadata: {
                    totalValue: cartSubtotal,
                    itemsCount: items.reduce((s, i) => s + i.quantity, 0),
                    items: items.map(i => ({
                        id: i.id,
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                    })),
                },
                userId: user?.id,
            });
        }
    }, [cartLoading, hasItems, user?.id, cartSubtotal, items]);

    const handleAddToCart = async (item: MenuItem, quantity: number = 1, isSuggestion = false) => {
        try {
            const sushiItem = {
                id: String(item.id),
                name: item.name,
                description: item.description || '',
                price: item.price,
                image: item.image,
                category: item.category as any,
            };

            await addItem(sushiItem, quantity);

            setAddedItems(prev => new Set(prev).add(item.id));
            if (isSuggestion) {
                setSuggestions(prev => prev.filter(p => p.id !== item.id));
            }
            if ('vibrate' in navigator) navigator.vibrate(15);

            setTimeout(() => {
                setAddedItems(prev => {
                    const n = new Set(prev);
                    n.delete(item.id);
                    return n;
                });
            }, 1600);
        } catch (err) {
            showError('No se pudo añadir el producto al carrito');
        }
    };

    const handleApplyPromo = async (code: string) => {
        if (!code.trim()) return;
        setIsApplyingPromo(true);
        setPromoError(null);
        try {
            const data = await api.post('/promo/validate', {
                code: code.trim().toUpperCase(),
                subtotal: cartSubtotal,
            });
            setPromoDiscount(data.percentage);
            setPromoCode(code.trim().toUpperCase());
            showSuccess(`¡Código aplicado! -${data.percentage}%`);

            // Handle Gift Addition
            if (data.gift) {
                try {
                    // Fetch desserts to find the Roll Dolce
                    const menuRes = await api.get('/menu?category=postre');
                    const rollDulce = (menuRes.items || []).find((i: any) =>
                        i.name.toLowerCase().includes('roll dulce')
                    );

                    if (rollDulce) {
                        const sushiItem = {
                            id: String(rollDulce.id),
                            name: rollDulce.name,
                            description: rollDulce.description || '',
                            price: rollDulce.price,
                            image: rollDulce.image,
                            category: rollDulce.category as any,
                        };
                        // Add as gift
                        await addItem(sushiItem, 1, '', true, data.gift.label);
                        showSuccess(`¡Regalo añadido: ${rollDulce.name}! 🍣`);
                    }
                } catch (giftErr) {
                    console.error('Failed to add gift item:', giftErr);
                }
            }

            tracker.track('promo_apply', {
                metadata: {
                    code: code.trim().toUpperCase(),
                    discount: data.percentage,
                    subtotal: cartSubtotal,
                },
                userId: user?.id,
            });
        } catch (err: any) {
            setPromoError(err.message || 'Código inválido');
            setPromoDiscount(null);
            showError(err.message || 'Código inválido o requisitos no cumplidos');

            tracker.track('promo_code_error', {
                metadata: {
                    code: code.trim().toUpperCase(),
                    error: err.message || 'Invalid code',
                    subtotal: cartSubtotal,
                },
                userId: user?.id,
            });
        } finally {
            setIsApplyingPromo(false);
        }
    };

    const handleRemovePromo = () => {
        setPromoCode('');
        setPromoDiscount(null);
        setPromoError(null);
    };

    useEffect(() => {
        const isWelcomePromo = promoCode.startsWith('NUEVO') || promoCode.startsWith('NEW');
        if (promoDiscount && isWelcomePromo && cartSubtotal < 20) {
            handleRemovePromo();
            setPromoError('El código de bienvenida requiere un pedido mínimo de 20,00€');
        }
    }, [cartSubtotal, promoCode, promoDiscount]);

    // Auto-apply pending promo code from magic link (welcome email)
    useEffect(() => {
        const pendingPromo = localStorage.getItem('sushi_pending_promo');
        if (pendingPromo && !promoCode && !promoDiscount && isAuthenticated) {
            localStorage.removeItem('sushi_pending_promo');
            handleApplyPromo(pendingPromo);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const onSubmit = async (data: CheckoutInput) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsOrdering(true);

        try {
            const {
                deliveryType,
                address: streetVal = '',
                house: houseVal = '',
                apartment: aptVal = '',
                phone,
                customerName: customerNameVal,
                guestEmail: guestEmailVal,
                paymentMethod,
                guestsCount,
                isScheduled,
                scheduledDate,
                scheduledTime,
                noCall,
                noBuzzer,
                customNote = '',
            } = data;

            if (isStoreClosed && !isScheduled) {
                return showError(
                    'Nuestra cocina está descansando en este momento, ¡pero estaremos encantados de preparar tu pedido anticipado! Por favor, selecciona "Entrega programada".'
                );
            }

            if (isTodayClosed && (!isScheduled || scheduledDate === todayStr)) {
                return showError(
                    'Lo sentimos, ya no aceptamos más pedidos para hoy. ¡Pero puedes programar tu pedido para mañana o cualquier otro día!'
                );
            }

            if (
                isPickupOnly &&
                deliveryType === 'delivery' &&
                (!isScheduled || scheduledDate === todayStr)
            ) {
                return showError(
                    'Lo sentimos, actualmente no disponemos de reparto a domicilio. ¡Pero puedes hacer tu pedido para recoger en nuestro local!'
                );
            }

            if (isScheduled && scheduledDate && scheduledTime) {
                if (scheduledDate < todayStr) {
                    return showError('Por favor, selecciona una fecha a partir de hoy.');
                }

                if (scheduledDate === todayStr) {
                    const now = new Date();
                    const nowMinutes = now.getHours() * 60 + now.getMinutes();
                    const [h, m] = scheduledTime.split(':').map(Number);
                    const scheduledMinutes = h * 60 + m;

                    if (scheduledMinutes < nowMinutes + 15) {
                        return showError(
                            'La hora seleccionada ya ha pasado o es demasiado cercana. Elige una hora posterior.'
                        );
                    }
                }

                if (!isTimeWithinBusinessHours(scheduledDate, scheduledTime)) {
                    return showError(
                        'La hora seleccionada está fuera de nuestro horario de servicio. ¡Por favor, elige un momento en el que nuestros chefs estén en la cocina!'
                    );
                }

                // Explicit safety check for closed days (e.g. Tuesday)
                const dayOfWeek = getDayOfWeekFromDateString(scheduledDate);
                if (BUSINESS_HOURS[dayOfWeek].length === 0) {
                    return showError(
                        'Lo sentimos, estamos cerrados el día seleccionado. Por favor, elige otro día.'
                    );
                }
            }

            // Safari Sync Hack
            [customerNameRef, guestEmailRef, phoneRef, customNoteRef].forEach(ref => {
                if (ref.current) {
                    ref.current.focus();
                    ref.current.blur();
                }
            });

            // Capture values from Refs instead of only trusting state/data
            // (Only needed for actual text inputs subject to Safari autofill)
            const finalCustomerName = (customerNameRef.current?.value || '').trim();
            const finalGuestEmail = (guestEmailRef.current?.value || '').trim();
            const finalPhone = (phoneRef.current?.value || '').trim();
            const finalCustomNote = (customNoteRef.current?.value || '').trim();

            // Address is managed via modal/React state, not direct input, so data is reliable
            const finalAddress = streetVal;
            const finalHouse = houseVal;
            const finalApartment = aptVal;

            // Validate captured values if they were meant to be present
            if (!isAuthenticated && !finalCustomerName) {
                return showError('Por favor, introduce tu nombre');
            }
            if (!finalPhone) {
                return showError('Por favor, introduce tu teléfono de contacto');
            }
            if (deliveryType === 'delivery' && !finalAddress) {
                return showError('Por favor, indica tu calle para el envío');
            }

            tracker.track('checkout_start', {
                metadata: {
                    totalValue: cartSubtotal,
                    itemsCount: items.reduce((s, i) => s + i.quantity, 0),
                    deliveryType,
                    paymentMethod,
                },
                userId: user?.id,
            });

            const notesArray = [];
            const typeLabel =
                deliveryType === 'pickup'
                    ? 'RECOGIDA'
                    : deliveryType === 'reservation'
                      ? 'RESERVA'
                      : 'DOMICILIO';
            notesArray.push(`[TIPO: ${typeLabel}]`);
            if (deliveryType === 'reservation') {
                notesArray.push(`[PERSONAS: ${Number(guestsCount) || 2}]`);
            }
            notesArray.push(
                `[MÉTODO DE PAGO: ${paymentMethod ? (paymentMethod === 'card' ? 'TARJETA' : 'EFECTIVO') : 'SIN ESPECIFICAR'}]`
            );
            if (isStoreClosed) notesArray.push('[PRE-ORDEN: Restaurante cerrado]');
            if (isScheduled && scheduledDate && scheduledTime) {
                const [y, m, d] = scheduledDate.split('-');
                notesArray.push(`[PROGRAMADO: ${d}-${m}-${y} ${scheduledTime}]`);
            }
            if (noCall) notesArray.push('[SIN CONFIRMACIÓN LLAMADA]');
            if (noBuzzer) notesArray.push('[NO LLAMAR TIMBRE]');
            const actualChopsticks =
                data.chopsticksCount ??
                methods.getValues('chopsticksCount') ??
                deliveryDetails.chopsticksCount ??
                1;
            if (actualChopsticks > 0) notesArray.push(`[PERSONAS: ${actualChopsticks}]`);

            // Add beverage options to notes
            items.forEach(item => {
                if (item.selectedOption) {
                    notesArray.push(`[${item.name}: ${item.selectedOption}]`);
                }
            });

            if (finalCustomNote || customNote.trim()) {
                notesArray.push((finalCustomNote || customNote).trim());
            }

            const { lat, lon } = data;
            const payload: any = {
                deliveryType,
                address: finalAddress || streetVal,
                house: finalHouse || houseVal,
                apartment: finalApartment || aptVal,
                postalCode: data.postalCode || (selectedZone ? selectedZone.postalCodes?.[0] : ''),
                phone: `+34${finalPhone || phone}`,
                customerName: isAuthenticated
                    ? user?.name || ''
                    : finalCustomerName || customerNameVal,
                guestEmail: isAuthenticated ? user?.email || '' : finalGuestEmail || guestEmailVal,
                paymentMethod,
                guestsCount:
                    data.guestsCount ??
                    methods.getValues('guestsCount') ??
                    deliveryDetails.guestsCount ??
                    2,
                chopsticksCount: actualChopsticks,
                isScheduled: data.isScheduled,
                scheduledDate: data.scheduledDate,
                scheduledTime: data.scheduledTime,
                noCall: data.noCall,
                noBuzzer: data.noBuzzer,
                customNote: finalCustomNote || data.customNote,
                deliveryAddress:
                    deliveryType === 'pickup'
                        ? 'RECOGIDA'
                        : `${finalAddress || streetVal}, ${finalHouse || houseVal}, ${finalApartment || aptVal}, CP: ${data.postalCode || ''}`,
                phoneNumber: `+34${finalPhone || phone}`,
                notes: notesArray.join(' | '),
                deliveryZoneId: selectedZone?.id,
                promoCode: promoDiscount ? promoCode : undefined,
                tipAmount,
                coinsSpent,
                lat,
                lon,
            };

            payload.guestItems = items.map(i => ({
                menuItemId: parseInt(i.id),
                quantity: i.quantity,
                selectedOption: i.selectedOption || '',
                isGift: !!i.isGift,
                giftLabel: i.giftLabel || null,
            }));

            const dataRes = await api.post('/orders', payload);

            await saveCurrentAddress();

            if (isAuthenticated && data.saveProfile) {
                const finalPhoneInput = (phoneRef.current?.value || '').trim();
                const cleanPhone = finalPhoneInput.replace(/\D/g, '').slice(0, 9);
                const formattedPhone = cleanPhone ? `+34${cleanPhone}` : '';

                if (formattedPhone && formattedPhone !== user?.phone) {
                    try {
                        await updateProfile({ phone: formattedPhone });
                    } catch (updateErr) {
                        console.error('Failed to auto-save phone number on checkout:', updateErr);
                    }
                }
            }

            tracker.track('order_placed', {
                metadata: {
                    totalValue: cartSubtotal,
                    itemsCount: items.reduce((s, i) => s + i.quantity, 0),
                    orderId: dataRes.order.id,
                },
                userId: user?.id,
            });

            setLastOrderSummary({
                total: cartSubtotal - discountAmount,
                deliveryCost: deliveryType === 'delivery' ? deliveryCost : 0,
                address:
                    deliveryType === 'pickup'
                        ? 'RECOGIDA'
                        : deliveryType === 'reservation'
                          ? 'RESERVA'
                          : streetVal,
                house: houseVal,
                apartment: aptVal,
                phone: phone,
            });

            setOrderSuccess(dataRes.order.id);
            setOrderWhatsappUrl(dataRes.whatsappUrl || null);
            clearCart();
            reset();
            resetDeliveryDetails();
            handleRemovePromo();

            tracker.resetSession();

            showSuccess('¡Pedido realizado! 🍣');
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);

            // Google Ads Conversion Event
            if (typeof window !== 'undefined' && (window as any).gtag) {
                const finalTotal =
                    cartSubtotal -
                    discountAmount +
                    (deliveryType === 'delivery' ? deliveryCost : 0) +
                    tipAmount;
                (window as any).gtag('event', 'conversion', {
                    send_to: 'AW-18177084522/Ih_mCNHA4rUCEOGYwdTD',
                    value: finalTotal,
                    currency: 'EUR',
                    transaction_id: dataRes.order.id,
                });
            }
        } catch (err: any) {
            tracker.track('error_notice', {
                metadata: {
                    errorSource: 'handleOrder',
                    errorMessage: err.message,
                    errorCode: err.errorCode || err.code,
                },
                userId: user?.id,
            });
            showError(err.message || 'Error al realizar el pedido');
        } finally {
            setIsOrdering(false);
            isSubmittingRef.current = false;
        }
    };

    const isOrdering = isOrderingState || isOrderingForm;

    const EMOJI: Record<string, string> = {
        rolls: '🍣',
        'rollos-grandes': '🍣',
        'rolls-calientes': '🍘',
        sets: '🍱',
        classic: '🍙',
        baked: '🍘',
        sweet: '🍥',
        sauces: '🥢',
        extras: '🥢',
        entrantes: '🥟',
        postre: '🍰',
        bebidas: '🥤',
    };

    const getCategoryEmoji = (category: string) => EMOJI[category] || '🍱';

    if ((cartLoading && items.length === 0) || (items.length > 0 && isLoadingSettings)) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col">
                <SEO title="Tu Cesta" description="Finaliza tu pedido de sushi." />
                <CartSkeleton />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            <SEO title="Tu Cesta" description="Finaliza tu pedido de sushi." />

            {items.length === 0 ? (
                <CartEmptyView
                    popularItems={popularItems}
                    isLoadingPopular={isLoadingPopular}
                    handleAddToCart={handleAddToCart}
                    getCategoryEmoji={getCategoryEmoji}
                    addedItems={addedItems}
                />
            ) : (
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-4 sm:py-8">
                    <FormProvider {...methods}>
                        {isStoreClosed && (
                            <div className="mb-6">
                                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 md:p-5 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <h3 className="font-black text-orange-900 leading-none mb-1.5 text-[15px] uppercase tracking-wider">
                                                {activeClosure
                                                    ? activeClosure.reason ||
                                                      'Cerrado Temporalmente'
                                                    : 'Restaurante Cerrado'}
                                            </h3>
                                            <p className="text-[13px] text-orange-800/80 whitespace-pre-line leading-snug">
                                                {activeClosure
                                                    ? activeClosure.startDate ===
                                                      activeClosure.endDate
                                                        ? `Estaremos cerrados hoy desde las ${activeClosure.startTime} hasta las ${activeClosure.endTime}.`
                                                        : `Estaremos cerrados por vacaciones desde el ${(() => {
                                                              const [y, m, d] =
                                                                  activeClosure.startDate.split(
                                                                      '-'
                                                                  );
                                                              return `${d}/${m}/${y}`;
                                                          })()} (${activeClosure.startTime}) hasta el ${(() => {
                                                              const [y, m, d] =
                                                                  activeClosure.endDate.split('-');
                                                              return `${d}/${m}/${y}`;
                                                          })()} (${activeClosure.endTime}) inclusive.`
                                                    : isManualClosed
                                                      ? siteSettings?.closedMessage ||
                                                        'Nuestra cocina está tomando un breve descanso.'
                                                      : 'Actualmente nuestra cocina está fuera de servicio.'}
                                            </p>
                                            <div className="mt-3 pt-3 border-t border-orange-200/50">
                                                <p className="text-[11px] font-bold text-orange-900/40 uppercase tracking-widest mb-1.5">
                                                    Horario de Servicio:
                                                </p>
                                                <div className="flex flex-col gap-1.5 text-[12px] text-orange-800/80 font-medium max-w-[280px]">
                                                    <div className="flex justify-between items-center bg-orange-50/50 px-3 py-1.5 rounded-xl border border-orange-100/30">
                                                        <span className="opacity-60">
                                                            Miércoles – Viernes
                                                        </span>
                                                        <span className="font-black text-orange-950">
                                                            19:00 – 22:30
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-orange-50/50 px-3 py-1.5 rounded-xl border border-orange-100/30">
                                                        <span className="opacity-60">
                                                            Sábado – Domingo
                                                        </span>
                                                        <span className="font-black text-orange-950 text-right">
                                                            14:00 – 16:00, 19:00 – 22:30
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-orange-950/5 px-3 py-1.5 rounded-xl border border-orange-950/5">
                                                        <span className="opacity-40 uppercase text-[10px] tracking-wider">
                                                            Lunes – Martes
                                                        </span>
                                                        <span className="font-black text-orange-950/30 uppercase text-[10px]">
                                                            Cerrado
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 text-center">
                                                    <p className="text-[13px] bg-orange-100/50 px-4 py-2 rounded-xl text-orange-900 font-bold inline-block m-0">
                                                        🚀 Aceptamos pedidos programados
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAuthenticated && user && !user.phone && (
                            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-4 md:p-5 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-black text-amber-900 leading-none mb-1.5 text-[15px] uppercase tracking-wider">
                                                Perfil incompleto
                                            </h3>
                                            <p className="text-[13px] text-amber-800/80 leading-snug m-0 font-medium">
                                                Necesitamos tu número de teléfono para enviarte
                                                actualizaciones del pedido. ¡Añádelo en tu perfil!
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/profile?tab=profile')}
                                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-200 border-none cursor-pointer self-start sm:self-center"
                                        >
                                            Ir al perfil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAuthenticated && user && !user.birthDate && (
                            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="bg-orange-550/10 bg-orange-50 border border-orange-100 rounded-[24px] p-4 md:p-5 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-black text-orange-950 leading-none mb-1.5 text-[15px] uppercase tracking-wider">
                                                Consigue un regalo en tu cumpleaños
                                            </h3>
                                            <p className="text-[13px] text-orange-900/85 leading-snug m-0 font-medium">
                                                Añade tu fecha de nacimiento en tu perfil para
                                                recibir un cupón especial en tu día.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/profile?tab=profile')}
                                            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-200 border-none cursor-pointer self-start sm:self-center"
                                        >
                                            Añadir fecha
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h1 className="text-lg font-black text-gray-900 mb-2 px-2 md:px-0 uppercase tracking-[0.2em] opacity-30">
                            Tu cesta
                        </h1>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Hidden trigger for AddressModal since it's controlled by CartPage but triggered by DeliveryForm */}
                            <button
                                type="button"
                                data-testid="address-modal-trigger"
                                className="hidden"
                                onClick={() => setIsAddressModalOpen(true)}
                            />
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                <CartItemList
                                    items={items}
                                    updateQuantity={updateQuantity}
                                    removeItem={removeItem}
                                    clearCart={clearCart}
                                    getCategoryEmoji={getCategoryEmoji}
                                    chopsticksCount={deliveryDetails.chopsticksCount}
                                    updateChopsticks={val =>
                                        methods.setValue('chopsticksCount', val)
                                    }
                                    deliveryType={deliveryType}
                                    deliveryCost={deliveryCost}
                                    selectedZone={selectedZone}
                                    promoDiscount={promoDiscount}
                                    tipAmount={tipAmount}
                                    coinsSpent={coinsSpent}
                                />

                                <DeliveryForm
                                    onSavedAddressSelect={handleAddressSelect}
                                    user={user}
                                    deliveryZones={deliveryZones}
                                    isAuthenticated={isAuthenticated}
                                    todayStr={todayStr}
                                    tomorrowStr={tomorrowStr}
                                    isStoreClosed={isStoreClosed}
                                    isTodayClosed={isTodayClosed}
                                    isPickupOnly={isPickupOnly}
                                    refs={{
                                        customerName: customerNameRef,
                                        guestEmail: guestEmailRef,
                                        phone: phoneRef,
                                        address: addressRef,
                                        house: houseRef,
                                        apartment: apartmentRef,
                                        customNote: customNoteRef,
                                    }}
                                />

                                <CartSuggestions
                                    suggestions={filteredSuggestions}
                                    isLoadingSuggestions={isLoadingSuggestions}
                                    handleAddToCart={handleAddToCart}
                                    getCategoryEmoji={getCategoryEmoji}
                                />
                            </div>

                            <div className="lg:col-span-1">
                                <div className="sticky top-24">
                                    <CartSummary
                                        total={cartSubtotal}
                                        deliveryCost={deliveryCost}
                                        promoCode={promoCode}
                                        promoDiscount={promoDiscount}
                                        promoError={promoError}
                                        isStoreClosed={isStoreClosed}
                                        isScheduled={isScheduled}
                                        tipAmount={tipAmount}
                                        onTipChange={setTipAmount}
                                        coinsSpent={coinsSpent}
                                        onCoinsChange={setCoinsSpent}
                                        userCoinsBalance={user?.coinsBalance || 0}
                                        onOrder={() =>
                                            (
                                                handleSubmit(onSubmit as any, errs => {
                                                    const firstError = Object.values(errs)[0];
                                                    if (firstError?.message) {
                                                        showError(firstError.message as string);
                                                    }
                                                }) as any
                                            )()
                                        }
                                        onApplyPromo={handleApplyPromo}
                                        onRemovePromo={handleRemovePromo}
                                        isOrdering={isOrdering}
                                        isApplyingPromo={isApplyingPromo}
                                        setPromoCode={setPromoCode}
                                        minOrder={MIN_ORDER}
                                        deliveryDetails={watchedFields as any}
                                    />
                                </div>
                            </div>
                        </div>
                    </FormProvider>
                </main>
            )}

            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={handleCloseAddressModal}
                onSelect={handleAddressSelect}
                deliveryZones={deliveryZones}
            />

            <OrderSuccessModal
                isOpen={!!orderSuccess}
                orderId={orderSuccess || 0}
                summary={lastOrderSummary}
                whatsappUrl={orderWhatsappUrl}
                onClose={() => setOrderSuccess(null)}
            />
        </div>
    );
}
