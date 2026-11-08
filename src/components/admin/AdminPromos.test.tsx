import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPromos from './AdminPromos';
import { api } from '../../utils/api';

vi.mock('../../utils/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('AdminPromos — Secret Permanent Promo Codes', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        (api.get as any).mockImplementation((url: string) => {
            if (url === '/admin/promos') return Promise.resolve({ promos: [] });
            if (url === '/admin/settings') return Promise.resolve({});
            if (url === '/admin/promo-codes') {
                return Promise.resolve({
                    promoCodes: [],
                    secretPromoCodes: [
                        {
                            code: 'WELOVEYOU15',
                            discountPercentage: 15,
                            active: true,
                            usageCount: 3,
                        },
                    ],
                });
            }
            return Promise.resolve({});
        });
    });

    it('displays WELOVEYOU15 in the Promo Codes tab and allows adding a new secret promo code', async () => {
        (api.post as any).mockResolvedValue({ secretPromoCodes: [] });

        render(
            <QueryClientProvider client={queryClient}>
                <AdminPromos language="ru" />
            </QueryClientProvider>
        );

        const promoCodesTabBtn = await screen.findByRole('button', { name: /Промокоды/i });
        fireEvent.click(promoCodesTabBtn);

        await waitFor(() => {
            expect(screen.getByText('WELOVEYOU15')).toBeInTheDocument();
            expect(screen.getByText('-15%')).toBeInTheDocument();
            expect(screen.getByText(/Заказов: 3/i)).toBeInTheDocument();
        });

        const codeInput = screen.getByPlaceholderText(/Например: VIP20/i);
        fireEvent.change(codeInput, { target: { value: 'blogger20' } });

        const addBtn = screen.getByRole('button', { name: /Добавить/i });
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/admin/promo-codes/secret', {
                code: 'BLOGGER20',
                discountPercentage: 15,
            });
        });
    });
});
