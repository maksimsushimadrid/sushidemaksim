import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/test-utils';
import MenuPage from '../../pages/MenuPage';
import { api } from '../../utils/api';
import React from 'react';

// Mock API
vi.mock('../../utils/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

// Mock useCart hook
const mockAddItem = vi.fn();
vi.mock('../../hooks/useCart', () => ({
    useCart: () => ({
        addItem: mockAddItem,
    }),
    CartProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: null,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockItems = [
    {
        id: 1,
        name: 'Salmon Roll',
        description: 'Delicious',
        price: 10,
        category: 'rollos-grandes',
        image: '',
    },
    {
        id: 2,
        name: 'Tuna Roll',
        description: 'Fresh',
        price: 12,
        category: 'rollos-grandes',
        image: '',
    },
];

describe('MenuPage (Integration)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/settings')) {
                return Promise.resolve({});
            }
            return Promise.resolve({ items: mockItems });
        });
    });

    const renderMenu = () => renderWithProviders(<MenuPage />);

    it('renders the menu items', async () => {
        renderMenu();

        await waitFor(() => {
            expect(screen.getByText('Salmon Roll')).toBeInTheDocument();
            expect(screen.getByText('Tuna Roll')).toBeInTheDocument();
        });
    });

    it('scrolls to category section on click', async () => {
        const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        renderMenu();

        // Wait for items to be loaded and section rendered
        await screen.findByText('Salmon Roll');

        // Use findByAll to get both sidebar and main content buttons
        const categoryBtns = await screen.findAllByText('Rollos Grandes');
        fireEvent.click(categoryBtns[0]);

        await waitFor(() => {
            expect(scrollToSpy).toHaveBeenCalled();
        });
        scrollToSpy.mockRestore();
    });

    it('searches for a dish with debounce', async () => {
        renderMenu();

        const searchInput = await screen.findByPlaceholderText(/hoy/i);
        fireEvent.change(searchInput, { target: { value: 'Salmon' } });

        // Wait for debounce (350ms)
        await waitFor(
            () => {
                expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=Salmon'));
            },
            { timeout: 2000 }
        );
    });

    it('displays empty state when no matches found', async () => {
        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/settings')) {
                return Promise.resolve({});
            }
            return Promise.resolve({ items: [] });
        });
        renderMenu();

        const searchInput = await screen.findByPlaceholderText(/hoy/i);
        fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

        await waitFor(() => {
            expect(screen.getByText(/No hay resultados para/i)).toBeInTheDocument();
        });
    });

    it('handles api failure gracefully', async () => {
        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/settings')) {
                return Promise.resolve({});
            }
            return Promise.reject(new Error('Network Error'));
        });
        renderMenu();

        await waitFor(() => {
            // It should show a message if initial load fails
            expect(screen.getByText(/Algo salió mal/i)).toBeInTheDocument();
        });
    });

    it('adds an item to cart when clicking the add button', async () => {
        renderMenu();

        const addBtn = await screen.findAllByLabelText(/Añadir/i);
        fireEvent.click(addBtn[0]);

        expect(mockAddItem).toHaveBeenCalledWith(
            expect.objectContaining({
                id: '1',
                name: 'Salmon Roll',
            }),
            1
        );
    });
});
