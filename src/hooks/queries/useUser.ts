import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { User, UserAddress } from '../../types';

export const USER_QUERY_KEY = ['user'];

export function useUserQuery() {
    return useQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: async () => {
            const hasSession =
                localStorage.getItem('sushi_logged_in') === 'true' ||
                localStorage.getItem('sushi_token');
            if (!hasSession) return null;
            try {
                const data = await api.get('/auth/me');
                localStorage.setItem('sushi_logged_in', 'true');
                return data.user as User;
            } catch (error) {
                // If it fails, clear tokens to avoid infinite retry/errors
                localStorage.removeItem('sushi_token');
                localStorage.removeItem('sushi_logged_in');
                return null;
            }
        },
        staleTime: 1000 * 60 * 15, // 15 minutes
        retry: false, // Don't retry auth errors
    });
}

export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (
            data: Partial<Pick<User, 'name' | 'email' | 'phone' | 'avatar' | 'birthDate'>>
        ) => {
            return api.put('/user/profile', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
        },
    });
}

export function useAddressMutations() {
    const queryClient = useQueryClient();

    const addAddress = useMutation({
        mutationFn: async (address: Omit<UserAddress, 'id'>) => {
            return api.post('/user/addresses', address);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
    });

    const editAddress = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Partial<Omit<UserAddress, 'id'>>;
        }) => {
            return api.put(`/user/addresses/${id}`, data);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
    });

    const removeAddress = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/user/addresses/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
    });

    const setDefaultAddress = useMutation({
        mutationFn: async (id: string) => {
            return api.put(`/user/addresses/${id}/default`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
    });

    return { addAddress, editAddress, removeAddress, setDefaultAddress };
}

export function useDeleteAccountMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            return api.delete('/user/profile');
        },
        onSuccess: () => {
            localStorage.removeItem('sushi_token');
            localStorage.removeItem('sushi_logged_in');
            queryClient.setQueryData(USER_QUERY_KEY, null);
            queryClient.invalidateQueries(); // Clear everything on account delete
        },
    });
}
