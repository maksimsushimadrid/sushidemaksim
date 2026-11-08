import { describe, it, expect, vi } from 'vitest';
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
});
