import {
    createContext,
    useContext,
    ReactNode,
    useCallback,
    useMemo,
    useState,
    useEffect,
} from 'react';
import { CartItem, SushiItem } from '../types';
import { api } from '../utils/api';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
    useCartQuery,
    useAddToCartMutation,
    useUpdateQuantityMutation,
    useRemoveItemMutation,
    useClearCartMutation,
    CART_QUERY_KEY,
} from './queries/useCartQuery';

interface DeliveryDetails {
    address: string;
    house: string;
    apartment: string;
    phone: string;
    postalCode: string;
    customerName: string;
    guestEmail: string;
    paymentMethod: 'cash' | 'card' | null;
    deliveryType: 'delivery' | 'pickup' | 'reservation';
    selectedZone: any | null;
    noCall: boolean;
    noBuzzer: boolean;
    isScheduled: boolean;
    scheduledDate: string;
    scheduledTime: string;
    customNote: string;
    saveAddress: boolean;
    guestsCount: number;
    chopsticksCount: number;
    lat?: number;
    lon?: number;
}

interface CartContextType {
    items: CartItem[];
    total: number;
    isLoading: boolean;
    addItem: (
        item: SushiItem,
        quantity?: number,
        selectedOption?: string,
        isGift?: boolean,
        giftLabel?: string
    ) => Promise<void>;
    removeItem: (id: string, cartItemId?: number) => Promise<void>;
    updateQuantity: (
        id: string,
        quantity: number,
        cartItemId?: number,
        selectedOption?: string
    ) => Promise<void>;
    clearCart: () => Promise<void>;
    syncGuestItems: () => Promise<void>;
    itemCount: number;
    // Delivery Persistance
    deliveryDetails: DeliveryDetails;
    updateDeliveryDetails: (details: Partial<DeliveryDetails>) => void;
    resetDeliveryDetails: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>(() => {
        if (typeof window === 'undefined')
            return {
                address: '',
                house: '',
                apartment: '',
                phone: '',
                postalCode: '',
                customerName: '',
                guestEmail: '',
                paymentMethod: null,
                deliveryType: 'delivery',
                selectedZone: null,
                noCall: false,
                noBuzzer: false,
                isScheduled: false,
                scheduledDate: new Date().toISOString().split('T')[0],
                scheduledTime: '',
                customNote: '',
                saveAddress: true,
                guestsCount: 2,
                chopsticksCount: 1,
            };

        const saved = localStorage.getItem('delivery_details');
        const defaultDetails = {
            address: '',
            house: '',
            apartment: '',
            phone: '',
            postalCode: '',
            customerName: '',
            guestEmail: '',
            paymentMethod: null,
            deliveryType: 'delivery' as const,
            selectedZone: null,
            noCall: false,
            noBuzzer: false,
            isScheduled: false,
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '',
            customNote: '',
            saveAddress: true,
            guestsCount: 2,
            chopsticksCount: 1,
        };

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const lastUpdated = parsed.updatedAt || 0;
                const isTooOld = lastUpdated > 0 && Date.now() - lastUpdated > 12 * 60 * 60 * 1000;

                if (isTooOld) {
                    // Reset transient fields but keep permanent ones
                    return {
                        ...defaultDetails,
                        address: parsed.address || '',
                        house: parsed.house || '',
                        apartment: parsed.apartment || '',
                        phone: parsed.phone || '',
                        postalCode: parsed.postalCode || '',
                        customerName: parsed.customerName || '',
                        saveAddress: parsed.saveAddress ?? true,
                    };
                }
                // Merge with defaults to ensure new fields are present
                return { ...defaultDetails, ...parsed };
            } catch (e) {
                console.error('Failed to parse delivery details', e);
            }
        }
        return defaultDetails;
    });

    useEffect(() => {
        localStorage.setItem(
            'delivery_details',
            JSON.stringify({
                ...deliveryDetails,
                updatedAt: Date.now(),
            })
        );
    }, [deliveryDetails]);

    const updateDeliveryDetails = useCallback((details: Partial<DeliveryDetails>) => {
        setDeliveryDetails(prev => ({ ...prev, ...details }));
    }, []);

    const resetDeliveryDetails = useCallback(() => {
        setDeliveryDetails({
            address: '',
            house: '',
            apartment: '',
            phone: '',
            postalCode: '',
            customerName: '',
            guestEmail: '',
            paymentMethod: null,
            deliveryType: 'delivery',
            selectedZone: null,
            noCall: false,
            noBuzzer: false,
            isScheduled: false,
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '',
            customNote: '',
            saveAddress: true,
            guestsCount: 2,
            chopsticksCount: 1,
        });
    }, []);

    const { user, isLoading: isAuthLoading } = useAuth();
    const queryClient = useQueryClient();

    // Use Query
    const { data, isLoading: isCartLoading } = useCartQuery(user, isAuthLoading);
    const { mutateAsync: addToCart } = useAddToCartMutation(user);
    const { mutateAsync: updateQty } = useUpdateQuantityMutation(user);
    const { mutateAsync: removeCartItem } = useRemoveItemMutation(user);
    const { mutateAsync: clearCartQuery } = useClearCartMutation(user);

    const isLoading = isAuthLoading || isCartLoading;

    const items = useMemo(() => data?.items || [], [data]);
    const total = useMemo(() => data?.total || 0, [data]);

    const syncGuestItems = useCallback(async () => {
        const localCart = localStorage.getItem('guest_cart');
        if (!localCart || !user) return;

        try {
            const guestCart = JSON.parse(localCart);
            const guestItems = Array.isArray(guestCart) ? guestCart : guestCart.items || [];
            localStorage.removeItem('guest_cart');

            const itemsToSync = guestItems.map((item: any) => ({
                menuItemId: parseInt(item.id),
                quantity: item.quantity,
                selectedOption: item.selectedOption || '',
            }));

            await api.post('/cart/bulk', { items: itemsToSync });
            // Re-fetch and clear guest key
            queryClient.invalidateQueries({ queryKey: [...CART_QUERY_KEY, user.id] });
            queryClient.invalidateQueries({ queryKey: [...CART_QUERY_KEY, 'guest'] });
        } catch (e) {
            console.error('Failed to sync guest cart', e);
        }
    }, [user, queryClient]);

    useEffect(() => {
        if (user) {
            syncGuestItems();
        }
    }, [user, syncGuestItems]);

    const addItem = useCallback(
        async (
            item: SushiItem,
            quantity: number = 1,
            selectedOption: string = '',
            isGift: boolean = false,
            giftLabel: string = ''
        ) => {
            if ('vibrate' in navigator) navigator.vibrate(50);
            await addToCart({ item, quantity, selectedOption, isGift, giftLabel });
        },
        [addToCart]
    );

    const removeItem = useCallback(
        async (id: string, cartItemId?: number) => {
            await removeCartItem({ id, cartItemId });
        },
        [removeCartItem]
    );

    const updateQuantity = useCallback(
        async (id: string, quantity: number, cartItemId?: number, selectedOption?: string) => {
            await updateQty({ id, quantity, cartItemId, selectedOption });
        },
        [updateQty]
    );

    const clearCart = useCallback(async () => {
        await clearCartQuery();
    }, [clearCartQuery]);

    const itemCount = useMemo(
        () => items.reduce((count: number, item: CartItem) => count + item.quantity, 0),
        [items]
    );

    return (
        <CartContext.Provider
            value={{
                items,
                total,
                isLoading,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                syncGuestItems,
                itemCount,
                deliveryDetails,
                updateDeliveryDetails,
                resetDeliveryDetails,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
