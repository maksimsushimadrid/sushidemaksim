import {
    createContext,
    useContext,
    useEffect,
    ReactNode,
    useMemo,
    useCallback,
    useRef,
} from 'react';
import { User, UserAddress, Order } from '../types';
import { api } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import {
    useUserQuery,
    useUpdateProfileMutation,
    useAddressMutations,
    useDeleteAccountMutation,
    USER_QUERY_KEY,
} from './queries/useUser';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (
        email: string,
        password: string
    ) => Promise<{ success: boolean; error?: string; wasReactivated?: boolean }>;
    register: (
        name: string,
        email: string,
        phone: string,
        password: string,
        redirectTo?: string
    ) => Promise<{ success: boolean; error?: string }>;
    logout: (redirectPath?: string) => void;
    updateProfile: (
        data: Partial<Pick<User, 'name' | 'email' | 'phone' | 'avatar' | 'birthDate'>>
    ) => Promise<void>;
    addAddress: (address: Omit<UserAddress, 'id'>) => Promise<void>;
    editAddress: (id: string, address: Partial<Omit<UserAddress, 'id'>>) => Promise<void>;
    removeAddress: (id: string) => Promise<void>;
    setDefaultAddress: (id: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    addOrder: (order: Order) => void;
    forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (
        email: string,
        code: string,
        newPassword: string
    ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { data: user, isLoading: isQueryLoading } = useUserQuery();

    const { mutateAsync: updateProfileMutation } = useUpdateProfileMutation();
    const {
        addAddress: addAddr,
        editAddress: editAddr,
        removeAddress: rmAddr,
        setDefaultAddress: setDefAddr,
    } = useAddressMutations();
    const { mutateAsync: delAcc } = useDeleteAccountMutation();

    const isAuthenticated = !!user;

    // Transition tracking for sync events
    const prevAuthRef = useRef(false);
    useEffect(() => {
        if (!prevAuthRef.current && isAuthenticated) {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('auth:login_success'));
            }, 100);
        }
        prevAuthRef.current = isAuthenticated;
    }, [isAuthenticated]);

    const login = useCallback(
        async (email: string, password: string) => {
            try {
                const data = await api.post('/auth/login', { email, password });
                localStorage.setItem('sushi_token', data.token);
                // invalidateQueries marks the cached null as stale so
                // refetchQueries actually re-runs the queryFn (v5 skips fresh queries)
                await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
                await queryClient.refetchQueries({ queryKey: USER_QUERY_KEY });
                return { success: true, wasReactivated: data.wasReactivated };
            } catch (error: unknown) {
                return {
                    success: false,
                    error:
                        error instanceof Error ? error.message : 'Ha ocurrido un error inesperado',
                };
            }
        },
        [queryClient]
    );

    const register = useCallback(
        async (
            name: string,
            email: string,
            phone: string,
            password: string,
            redirectTo?: string
        ) => {
            try {
                await api.post('/auth/register', { name, email, phone, password, redirectTo });
                return { success: true };
            } catch (error: unknown) {
                return {
                    success: false,
                    error:
                        error instanceof Error ? error.message : 'Ha ocurrido un error inesperado',
                };
            }
        },
        []
    );

    const logout = useCallback((redirectPath?: string) => {
        localStorage.removeItem('sushi_token');
        queryClient.setQueryData(USER_QUERY_KEY, null);
        queryClient.invalidateQueries();

        // If on /table, stay on /table after logout
        const currentPath = window.location.pathname;
        const targetPath = redirectPath || (currentPath === '/table' ? '/table' : '/');
        window.location.href = targetPath;
    }, [queryClient]);

    // Heartbeat
    useEffect(() => {
        if (!user) return;
        const sendHeartbeat = async () => {
            try {
                await api.put('/user/active');
            } catch (e: any) {
                // If unauthorized, the session is definitely dead. Logout immediately.
                if (e.status === 401) {
                    logout();
                }
            }
        };
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 180_000); // 3 min
        return () => clearInterval(interval);
    }, [user, logout]);

    const updateProfile = useCallback(
        async (data: Partial<Pick<User, 'name' | 'email' | 'phone' | 'avatar' | 'birthDate'>>) => {
            await updateProfileMutation(data);
        },
        [updateProfileMutation]
    );

    const addAddress = useCallback(
        async (address: Omit<UserAddress, 'id'>) => {
            await addAddr.mutateAsync(address);
        },
        [addAddr]
    );

    const editAddress = useCallback(
        async (id: string, data: Partial<Omit<UserAddress, 'id'>>) => {
            await editAddr.mutateAsync({ id, data });
        },
        [editAddr]
    );

    const removeAddress = useCallback(
        async (id: string) => {
            await rmAddr.mutateAsync(id);
        },
        [rmAddr]
    );

    const setDefaultAddress = useCallback(
        async (id: string) => {
            await setDefAddr.mutateAsync(id);
        },
        [setDefAddr]
    );

    const deleteAccount = useCallback(async () => {
        await delAcc();
        logout();
    }, [delAcc, logout]);

    const addOrder = useCallback(
        (order: Order) => {
            queryClient.setQueryData<User>(USER_QUERY_KEY, prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    orders: prev.orders ? [order, ...prev.orders] : [order],
                    orderCount: (prev.orderCount || 0) + 1,
                };
            });
        },
        [queryClient]
    );

    const forgotPassword = useCallback(async (email: string) => {
        try {
            await api.post('/auth/forgot-password', { email });
            return { success: true };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error al enviar el email',
            };
        }
    }, []);

    const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
        try {
            await api.post('/auth/reset-password', { email, code, newPassword });
            return { success: true };
        } catch (error: unknown) {
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : 'Error al restablecer la contraseña',
            };
        }
    }, []);

    const value = useMemo(
        () => ({
            user: user || null,
            isAuthenticated,
            isLoading: isQueryLoading,
            login,
            register,
            logout,
            updateProfile,
            addAddress,
            editAddress,
            removeAddress,
            setDefaultAddress,
            deleteAccount,
            addOrder,
            forgotPassword,
            resetPassword,
        }),
        [
            user,
            isAuthenticated,
            isQueryLoading,
            login,
            register,
            logout,
            updateProfile,
            addAddress,
            editAddress,
            removeAddress,
            setDefaultAddress,
            deleteAccount,
            addOrder,
            forgotPassword,
            resetPassword,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
