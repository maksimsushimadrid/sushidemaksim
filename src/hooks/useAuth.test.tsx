import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import { api } from '../utils/api';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API
vi.mock('../utils/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

describe('useAuth hook', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    gcTime: 0,
                },
            },
        });
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
    );

    it('should be unauthenticated by default', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        // Wait for loading to finish
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should login and set user state', async () => {
        const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
        vi.mocked(api.post).mockResolvedValue({ token: 'mock-token', user: mockUser });
        vi.mocked(api.get).mockResolvedValue({ user: mockUser });

        const { result } = renderHook(() => useAuth(), { wrapper });

        let loginRes: any;
        await act(async () => {
            loginRes = await result.current.login('test@test.com', 'password');
        });

        expect(loginRes.success).toBe(true);
        expect(localStorage.getItem('sushi_token')).toBe('mock-token');
    });

    it('should handle registration', async () => {
        const mockUser = { id: 2, name: 'New User' };
        vi.mocked(api.post).mockResolvedValue({ token: 'new-token', user: mockUser });
        vi.mocked(api.get).mockResolvedValue({ user: mockUser });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            const res = await result.current.register('New User', 'new@test.com', '123456', 'pass');
            expect(res.success).toBe(true);
        });

        expect(result.current.user).toBeNull();
        expect(localStorage.getItem('sushi_token')).toBeNull();
    });

    it('should logout and clear state', async () => {
        // Mock window.location.href
        const locationMock = { href: '', pathname: '/', assign: vi.fn() };
        vi.stubGlobal('location', locationMock);

        const { result } = renderHook(() => useAuth(), { wrapper });

        act(() => {
            result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(localStorage.getItem('sushi_token')).toBeNull();
        expect(window.location.href).toBe('/');

        vi.unstubAllGlobals();
    });

    it('should stay on /table after logout if currently on /table', async () => {
        // Mock window.location
        const locationMock = { href: '', pathname: '/table', assign: vi.fn() };
        vi.stubGlobal('location', locationMock);

        const { result } = renderHook(() => useAuth(), { wrapper });

        act(() => {
            result.current.logout();
        });

        expect(window.location.href).toBe('/table');

        vi.unstubAllGlobals();
    });
});
