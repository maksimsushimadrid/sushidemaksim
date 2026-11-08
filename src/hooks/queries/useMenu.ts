import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../../utils/api';

export interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    weight?: string | number;
    pieces?: number;
    spicy?: boolean;
    vegetarian?: boolean;
    isPromo?: boolean;
    isPopular?: boolean;
    isChefChoice?: boolean;
    isNew?: boolean;
    allergens?: string[];
    video?: { mp4?: string; webm?: string } | string;
    likesCount?: number;
}

export const useMenu = (category: string, search: string) => {
    return useQuery({
        queryKey: ['menu', category, search],
        queryFn: async () => {
            const qs = new URLSearchParams();
            if (category && category !== 'all') {
                qs.append('category', category);
            }
            if (search) {
                qs.append('search', search);
            }
            const data = await api.get(`/menu?${qs.toString()}`);
            return (data.items || []).map((item: any) => ({
                ...item,
                isPromo: item.isPromo ?? item.is_promo,
                isPopular: item.isPopular ?? item.is_popular,
                isChefChoice: item.isChefChoice ?? item.is_chef_choice,
                isNew: item.isNew ?? item.is_new,
                ...(item.likesCount !== undefined || item.likes_count !== undefined
                    ? { likesCount: Number(item.likesCount ?? item.likes_count ?? 0) }
                    : {}),
            })) as MenuItem[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        placeholderData: keepPreviousData,
    });
};

export const useFavorites = (user: any) => {
    return useQuery({
        queryKey: ['favorites', user?.id || 'guest'],
        queryFn: async () => {
            if (!user) {
                return new Set<number>();
            }
            const favData = await api.get('/user/favorites');
            return new Set<number>(favData.favorites.map((f: any) => Number(f.id)));
        },
        enabled: !!user,
        initialData: () => new Set<number>(),
    });
};

const inFlightFavorites = new Set<number>();

export const useToggleFavorite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (itemId: number) => {
            if (inFlightFavorites.has(itemId)) {
                return { itemId, skipped: true };
            }
            inFlightFavorites.add(itemId);
            try {
                const data = await api.post('/user/favorites', { menuItemId: itemId });
                return { itemId, isFavorite: data.isFavorite, likesCount: data.likesCount };
            } finally {
                inFlightFavorites.delete(itemId);
            }
        },
        onMutate: async itemId => {
            if (inFlightFavorites.has(itemId)) {
                return { skipped: true };
            }
            await queryClient.cancelQueries({ queryKey: ['favorites'] });
            await queryClient.cancelQueries({ queryKey: ['menu'] });

            const favQueries = queryClient.getQueriesData<Set<number>>({ queryKey: ['favorites'] });
            let wasFavorite = false;
            for (const [, setVal] of favQueries) {
                if (setVal instanceof Set && setVal.has(itemId)) {
                    wasFavorite = true;
                    break;
                }
            }
            const delta = wasFavorite ? -1 : 1;

            queryClient.setQueriesData<Set<number>>({ queryKey: ['favorites'] }, old => {
                const next = new Set(old);
                if (next.has(itemId)) {
                    next.delete(itemId);
                } else {
                    next.add(itemId);
                }
                return next;
            });

            queryClient.setQueriesData<MenuItem[]>({ queryKey: ['menu'] }, oldItems => {
                if (!Array.isArray(oldItems)) return oldItems;
                return oldItems.map(item =>
                    item.id === itemId
                        ? {
                              ...item,
                              likesCount: Math.max(0, Number(item.likesCount || 0) + delta),
                          }
                        : item
                );
            });

            return { favQueries };
        },
        onSuccess: ({ itemId, likesCount, skipped }: any) => {
            if (skipped) return;
            if (typeof likesCount === 'number') {
                queryClient.setQueriesData<MenuItem[]>({ queryKey: ['menu'] }, oldItems => {
                    if (!Array.isArray(oldItems)) return oldItems;
                    return oldItems.map(item =>
                        item.id === itemId ? { ...item, likesCount } : item
                    );
                });
            }
        },
        onError: (_err, _itemId, context: any) => {
            if (context?.favQueries) {
                for (const [key, val] of context.favQueries) {
                    queryClient.setQueryData(key, val);
                }
            }
            queryClient.invalidateQueries({ queryKey: ['menu'] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
};
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const data = await api.get('/menu/info/categories');
            return data.categories || [];
        },
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const usePopularItems = (limit: number = 8) => {
    return useQuery({
        queryKey: ['menu', 'popular', limit],
        queryFn: async () => {
            const data = await api.get(`/menu?is_popular=true&limit=${limit}`);
            return (data.items || []).map((item: any) => ({
                ...item,
                isPromo: item.isPromo ?? item.is_promo,
                isPopular: item.isPopular ?? item.is_popular,
                isChefChoice: item.isChefChoice ?? item.is_chef_choice,
                isNew: item.isNew ?? item.is_new,
                ...(item.likesCount !== undefined || item.likes_count !== undefined
                    ? { likesCount: Number(item.likesCount ?? item.likes_count ?? 0) }
                    : {}),
            })) as MenuItem[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
