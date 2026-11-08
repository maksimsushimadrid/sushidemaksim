import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SpecialAnnouncements } from './SpecialAnnouncements';

const mockAddItem = vi.fn().mockResolvedValue(undefined);

vi.mock('../../hooks/useCart', () => ({
    useCart: () => ({
        addItem: mockAddItem,
    }),
}));

vi.mock('../../hooks/queries/useMenu', () => ({
    useMenu: () => ({
        data: [
            {
                id: 115,
                name: 'Cerveza Artesana (0.33L)',
                description:
                    'Cerveza artesana de elaboración propia (0.33L). Sabores diferentes para cada temporada.',
                price: 6,
                image: '/images/announcements/craft-beer-033.webp',
                category: 'bebidas',
            },
        ],
    }),
}));

describe('SpecialAnnouncements', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Cerveza Artesana with seasonal flavors notice and updated craft beer image', () => {
        render(
            <MemoryRouter>
                <SpecialAnnouncements />
            </MemoryRouter>
        );

        expect(screen.getAllByText(/Artesana/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText(/Pumpkin Ale/i)).not.toBeInTheDocument();
        expect(
            screen.getAllByText(/Sabores diferentes para cada temporada/i).length
        ).toBeGreaterThanOrEqual(1);

        const beerImage = screen.getByAltText(/Cerveza Artesana 0.33L/i);
        expect(beerImage).toHaveAttribute('src', '/images/announcements/craft-beer-033.webp');
    });

    it('adds Cerveza Artesana (item 115) to cart when clicking Pedir Botella', async () => {
        render(
            <MemoryRouter>
                <SpecialAnnouncements />
            </MemoryRouter>
        );

        const orderBtn = screen.getByRole('button', { name: /Pedir Botella/i });
        fireEvent.click(orderBtn);

        await waitFor(() => {
            expect(mockAddItem).toHaveBeenCalledTimes(1);
            expect(mockAddItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: '115',
                    name: 'Cerveza Artesana (0.33L)',
                    price: 6,
                }),
                1
            );
        });
    });
});
