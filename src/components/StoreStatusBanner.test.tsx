import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StoreStatusBanner from './StoreStatusBanner';

vi.mock('../hooks/queries/useSettings', () => ({
    useSettings: () => ({
        data: {
            isStoreClosed: false,
            isTodayClosed: false,
            isPickupOnly: true,
            customClosures: [],
        },
    }),
}));

describe('StoreStatusBanner', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('renders Pickup Only curtain and collapses into non-overlapping top tab on close', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <StoreStatusBanner />
            </MemoryRouter>
        );

        expect(screen.getByText(/Solo Recogida/i)).toBeInTheDocument();
        expect(
            screen.getByText(
                /Aceptamos pedidos para hoy, pero no podemos realizar entregas a domicilio/i
            )
        ).toBeInTheDocument();

        const closeBtn = screen.getByRole('button', { name: /Cerrar aviso/i });
        fireEvent.click(closeBtn);

        const reopenBtn = await screen.findByRole('button', { name: /Mostrar aviso de horario/i });
        expect(reopenBtn).toBeInTheDocument();
    });

    it('remembers closed state across navigation and only reopens when button is clicked', async () => {
        const { unmount } = render(
            <MemoryRouter initialEntries={['/']}>
                <StoreStatusBanner />
            </MemoryRouter>
        );

        const closeBtn = screen.getByRole('button', { name: /Cerrar aviso/i });
        fireEvent.click(closeBtn);

        unmount();

        // Simulate navigating to another page (new component mount)
        render(
            <MemoryRouter initialEntries={['/menu']}>
                <StoreStatusBanner />
            </MemoryRouter>
        );

        // Curtain notice body should NOT be open
        expect(
            screen.queryByText(/Aceptamos pedidos para hoy, но podemos/i)
        ).not.toBeInTheDocument();

        // But the collapsed top tab button should be visible
        const reopenBtn = screen.getByRole('button', { name: /Mostrar aviso de horario/i });
        expect(reopenBtn).toBeInTheDocument();

        // Clicking the top tab button opens the curtain
        fireEvent.click(reopenBtn);
        expect(
            await screen.findByText(
                /Aceptamos pedidos para hoy, pero no podemos realizar entregas a domicilio/i
            )
        ).toBeInTheDocument();
    });
});
