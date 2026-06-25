import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { CartItem, SushiItem } from '../../types';

export const CART_QUERY_KEY = ['cart'];
const CART_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours TTL for guest cart

export function useCartQuery(user: any, isAuthLoading: boolean = false) {
    return useQuery({
        queryKey: [...CART_QUERY_KEY, user?.id || 'guest'],
        enabled: !isAuthLoading,
        queryFn: async () => {
            if (!user) {
                const localCart = localStorage.getItem('guest_cart');
                if (!localCart) return { items: [], total: 0 };
                try {
                    const parsed = JSON.parse(localCart);
                    const items = Array.isArray(parsed) ? parsed : parsed.items || [];
                    const lastUpdated = parsed.updatedAt || 0;

                    // If cart is older than 24 hours, clear it
                    if (lastUpdated > 0 && Date.now() - lastUpdated > CART_EXPIRATION_MS) {
                        localStorage.removeItem('guest_cart');
                        return { items: [], total: 0 };
                    }

                    const formattedItems = items.map((item: any, index: number) => ({
                        ...item,
                        selectedOption: item.selectedOption || '',
                        cartItemId: item.cartItemId || 1000000 + index,
                    }));

                    const total = formattedItems.reduce(
                        (sum: number, item: any) =>
                            sum + (item.isGift ? 0 : item.price * item.quantity),
                        0
                    );
                    return { items: formattedItems, total };
                } catch (e) {
                    return { items: [], total: 0 };
                }
            }

            const data = await api.get('/cart');
            const mappedItems = data.items.map((item: any) => ({
                id: item.menuItemId.toString(),
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                category: item.category,
                quantity: item.quantity,
                selectedOption: item.selectedOption || '',
                cartItemId: item.id, // ID from the cart join table
                isGift: item.isGift,
                giftLabel: item.giftLabel,
            }));

            return { items: mappedItems, total: data.total };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useAddToCartMutation(user: any) {
    const queryClient = useQueryClient();
    const queryKey = [...CART_QUERY_KEY, user?.id || 'guest'];

    return useMutation({
        mutationFn: async ({
            item,
            quantity = 1,
            selectedOption = '',
            isGift = false,
            giftLabel = '',
        }: {
            item: SushiItem;
            quantity?: number;
            selectedOption?: string;
            isGift?: boolean;
            giftLabel?: string;
        }) => {
            if (!user) {
                const localCart = localStorage.getItem('guest_cart');
                const parsed = localCart ? JSON.parse(localCart) : null;
                const items = (Array.isArray(parsed) ? parsed : parsed?.items) || [];

                // For guest, merge if same ID AND same option
                const existingIndex = items.findIndex(
                    (i: any) => i.id === item.id && (i.selectedOption || '') === selectedOption
                );

                let newItems;
                if (existingIndex !== -1) {
                    newItems = [...items];
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        quantity: newItems[existingIndex].quantity + quantity,
                    };
                } else {
                    newItems = [
                        ...items,
                        {
                            ...item,
                            quantity,
                            selectedOption,
                            isGift,
                            giftLabel,
                            cartItemId: Date.now() + Math.floor(Math.random() * 1000),
                        },
                    ];
                }

                localStorage.setItem(
                    'guest_cart',
                    JSON.stringify({
                        items: newItems,
                        updatedAt: Date.now(),
                    })
                );
                return { items: newItems };
            }

            return api.post('/cart', {
                menuItemId: parseInt(item.id),
                quantity,
                selectedOption,
                isGift,
                giftLabel,
            });
        },
        onMutate: async ({
            item: newItem,
            quantity = 1,
            selectedOption = '',
            isGift = false,
            giftLabel = '',
        }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousCart = queryClient.getQueryData<{ items: CartItem[]; total: number }>(
                queryKey
            );

            if (previousCart) {
                const existingIndex = previousCart.items.findIndex(
                    i =>
                        i.id === newItem.id &&
                        (i.selectedOption || '') === selectedOption &&
                        !!i.isGift === !!isGift
                );

                let updatedItems;
                if (existingIndex !== -1) {
                    updatedItems = [...previousCart.items];
                    updatedItems[existingIndex] = {
                        ...updatedItems[existingIndex],
                        quantity: updatedItems[existingIndex].quantity + quantity,
                    };
                } else {
                    updatedItems = [
                        ...previousCart.items,
                        { ...newItem, quantity, selectedOption, isGift, giftLabel } as CartItem,
                    ];
                }

                const updatedTotal = updatedItems.reduce(
                    (sum, i) => sum + (i.isGift ? 0 : i.price * i.quantity),
                    0
                );

                queryClient.setQueryData(queryKey, { items: updatedItems, total: updatedTotal });
            }

            return { previousCart };
        },
        onError: (_err, _newItem, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(queryKey, context.previousCart);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

export function useUpdateQuantityMutation(user: any) {
    const queryClient = useQueryClient();
    const queryKey = [...CART_QUERY_KEY, user?.id || 'guest'];

    return useMutation({
        mutationFn: async ({
            id,
            quantity,
            selectedOption,
            cartItemId,
        }: {
            id: string;
            quantity: number;
            selectedOption?: string;
            cartItemId?: number;
        }) => {
            if (!user) {
                const localCart = localStorage.getItem('guest_cart');
                const parsed = localCart ? JSON.parse(localCart) : null;
                const items = (Array.isArray(parsed) ? parsed : parsed?.items) || [];
                const newItems = items.map((i: any) => {
                    const match = cartItemId ? i.cartItemId === cartItemId : i.id === id;
                    return match
                        ? { ...i, quantity, selectedOption: selectedOption ?? i.selectedOption }
                        : i;
                });

                localStorage.setItem(
                    'guest_cart',
                    JSON.stringify({
                        items: newItems,
                        updatedAt: Date.now(),
                    })
                );
                return;
            }

            if (!cartItemId) {
                const data = await api.get('/cart');
                const realItem = data.items.find((i: any) => i.menuItemId.toString() === id);
                if (realItem) return api.put(`/cart/${realItem.id}`, { quantity, selectedOption });
                return;
            }
            return api.put(`/cart/${cartItemId}`, { quantity, selectedOption });
        },
        onMutate: async ({ id, quantity, selectedOption, cartItemId }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousCart = queryClient.getQueryData<{ items: CartItem[]; total: number }>(
                queryKey
            );

            if (previousCart) {
                const updatedItems = previousCart.items.map(i => {
                    const match = cartItemId
                        ? i.cartItemId === cartItemId
                        : i.id === id && (i.selectedOption || '') === (selectedOption || '');
                    return match
                        ? { ...i, quantity, selectedOption: selectedOption ?? i.selectedOption }
                        : i;
                });
                const updatedTotal = updatedItems.reduce(
                    (sum, i) => sum + (i.isGift ? 0 : i.price * i.quantity),
                    0
                );
                queryClient.setQueryData(queryKey, { items: updatedItems, total: updatedTotal });
            }

            return { previousCart };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(queryKey, context.previousCart);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

export function useRemoveItemMutation(user: any) {
    const queryClient = useQueryClient();
    const queryKey = [...CART_QUERY_KEY, user?.id || 'guest'];

    return useMutation({
        mutationFn: async ({ id, cartItemId }: { id: string; cartItemId?: number }) => {
            if (!user) {
                const localCart = localStorage.getItem('guest_cart');
                const parsed = localCart ? JSON.parse(localCart) : null;
                const items = (Array.isArray(parsed) ? parsed : parsed?.items) || [];
                const newItems = items.filter((i: any) =>
                    cartItemId ? i.cartItemId !== cartItemId : i.id !== id
                );

                localStorage.setItem(
                    'guest_cart',
                    JSON.stringify({
                        items: newItems,
                        updatedAt: Date.now(),
                    })
                );
                return;
            }

            if (!cartItemId) {
                const data = await api.get('/cart');
                const realItem = data.items.find((i: any) => i.menuItemId.toString() === id);
                if (realItem) return api.delete(`/cart/${realItem.id}`);
                return;
            }
            return api.delete(`/cart/${cartItemId}`);
        },
        onMutate: async ({ id, cartItemId }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousCart = queryClient.getQueryData<{ items: CartItem[]; total: number }>(
                queryKey
            );

            if (previousCart) {
                const updatedItems = previousCart.items.filter(i =>
                    cartItemId ? i.cartItemId !== cartItemId : i.id !== id
                );
                const updatedTotal = updatedItems.reduce(
                    (sum, i) => sum + (i.isGift ? 0 : i.price * i.quantity),
                    0
                );
                queryClient.setQueryData(queryKey, { items: updatedItems, total: updatedTotal });
            }

            return { previousCart };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(queryKey, context.previousCart);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

export function useClearCartMutation(user: any) {
    const queryClient = useQueryClient();
    const queryKey = [...CART_QUERY_KEY, user?.id || 'guest'];

    return useMutation({
        mutationFn: async () => {
            if (!user) {
                localStorage.removeItem('guest_cart');
                return;
            }
            return api.delete('/cart');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}
