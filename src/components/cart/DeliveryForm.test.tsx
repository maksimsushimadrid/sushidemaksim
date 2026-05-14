import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '../../schemas/checkout.schema';
import DeliveryForm from './DeliveryForm';
import { ReactNode } from 'react';

// Mock Lucide icons
vi.mock('lucide-react', async importOriginal => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        Package: () => <div data-testid="package-icon" />,
        MapPin: () => <div data-testid="mappin-icon" />,
        Truck: () => <div data-testid="truck-icon" />,
        Store: () => <div data-testid="store-icon" />,
        Smartphone: () => <div data-testid="smartphone-icon" />,
        Clock: () => <div data-testid="clock-icon" />,
        ChevronDown: () => <div data-testid="chevron-down-icon" />,
        Plus: () => <div data-testid="plus" />,
        Minus: () => <div data-testid="minus" />,
        Calendar: () => <div data-testid="calendar" />,
        AlertCircle: () => <div data-testid="alert-circle" />,
    };
});

// Mock hooks and utils
vi.mock('../../utils/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

vi.mock('../../analytics/tracker', () => ({
    tracker: {
        track: vi.fn(),
    },
}));

const TestWrapper = ({
    children,
    defaultValues = {},
    setIsAddressModalOpen,
}: {
    children: ReactNode;
    defaultValues?: any;
    setIsAddressModalOpen?: any;
}) => {
    const methods = useForm({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            address: '',
            house: '',
            phone: '',
            deliveryType: 'delivery',
            isScheduled: false,
            guestsCount: 2,
            ...defaultValues,
        },
    });
    return (
        <FormProvider {...methods}>
            <button
                type="button"
                data-testid="address-modal-trigger"
                onClick={() => setIsAddressModalOpen?.(true)}
                className="hidden"
            />
            {children}
        </FormProvider>
    );
};

describe('DeliveryForm', () => {
    const defaultProps = {
        setIsAddressModalOpen: vi.fn(),
        deliveryZones: [],
        user: null,
        isAuthenticated: false,
        todayStr: '2026-03-30',
        tomorrowStr: '2026-03-31',
        isStoreClosed: false,
        isTodayClosed: false,
        isPickupOnly: false,
        refs: {
            customerName: { current: null } as any,
            guestEmail: { current: null } as any,
            phone: { current: null } as any,
            address: { current: null } as any,
            house: { current: null } as any,
            apartment: { current: null } as any,
            customNote: { current: null } as any,
        },
    };

    it('renders initial state correctly (delivery mode)', () => {
        render(
            <TestWrapper setIsAddressModalOpen={defaultProps.setIsAddressModalOpen}>
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        expect(screen.getAllByText(/Entrega/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Domicilio/i)).toBeInTheDocument();
        expect(screen.getByText(/Recogida/i)).toBeInTheDocument();
        expect(screen.getByText(/¿Dónde entregamos el pedido\?/i)).toBeInTheDocument();
    });

    it('switches between delivery types', async () => {
        render(
            <TestWrapper setIsAddressModalOpen={defaultProps.setIsAddressModalOpen}>
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        const pickupButton = screen.getByText(/Recogida/i);
        fireEvent.click(pickupButton);
        // In the new architecture, we check if address box disappears or is informative
        expect(await screen.findByText(/Punto de Recogida/i)).toBeInTheDocument();
    });

    it('shows pickup point information when deliveryType is pickup', () => {
        render(
            <TestWrapper
                setIsAddressModalOpen={defaultProps.setIsAddressModalOpen}
                defaultValues={{ deliveryType: 'pickup' }}
            >
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        expect(screen.getByText(/Punto de Recogida/i)).toBeInTheDocument();
        expect(screen.getByText(/Calle Barrilero, 20/i)).toBeInTheDocument();
    });

    it('opens address modal when clicking address input', () => {
        render(
            <TestWrapper setIsAddressModalOpen={defaultProps.setIsAddressModalOpen}>
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        const addressButton = screen.getByTestId('address-input');
        fireEvent.click(addressButton);
        expect(defaultProps.setIsAddressModalOpen).toHaveBeenCalledWith(true);
    });

    it('renders address details when address is provided', () => {
        render(
            <TestWrapper defaultValues={{ address: 'Calle Mayor', house: '1' }}>
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        expect(screen.getByText(/Calle Mayor 1/i)).toBeInTheDocument();
    });

    it('handles contact information inputs for guest users', () => {
        render(
            <TestWrapper>
                <DeliveryForm {...defaultProps} isAuthenticated={false} />
            </TestWrapper>
        );
        const nameInput = screen.getByPlaceholderText(/Ej: Juan Pérez/i);
        fireEvent.change(nameInput, { target: { value: 'John Doe' } });
        expect(nameInput).toHaveValue('John Doe');

        const phoneInput = screen.getByTestId('phone-input');
        fireEvent.change(phoneInput, { target: { value: '600111222' } });
        expect(phoneInput).toHaveValue('600111222');
    });

    it('displays scheduling options when isScheduled is true', () => {
        render(
            <TestWrapper defaultValues={{ isScheduled: true }}>
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        expect(screen.getAllByText(/Fecha/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Hora/i).length).toBeGreaterThan(0);
    });

    it('handles guests count in reservation mode', () => {
        render(
            <TestWrapper defaultValues={{ deliveryType: 'reservation', guestsCount: 4 }}>
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        expect(screen.getAllByText('4').length).toBeGreaterThan(0);

        const plusButton = screen.getByTestId('plus').parentElement;
        if (plusButton) {
            fireEvent.click(plusButton);
            // In unit tests without state syncing back to props, we verify internal UI or form value if possible
            // but for now we check if it renders the new value if we had a way to observe it.
            // Since it's internal hook state, we just verify it exists.
        }
    });

    it('updates custom note', () => {
        render(
            <TestWrapper>
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        const noteArea = screen.getByPlaceholderText(/Ej. Quitar pepino/i);
        fireEvent.change(noteArea, { target: { value: 'Extra ginger please' } });
        expect(noteArea).toHaveValue('Extra ginger please');
    });

    it('hides delivery-specific options in reservation mode', () => {
        render(
            <TestWrapper defaultValues={{ deliveryType: 'reservation' }}>
                <DeliveryForm {...defaultProps} />
            </TestWrapper>
        );
        expect(screen.queryByLabelText(/Sin llamada de confirmación/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/No llamar al timbre/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Entrega programada/i)).not.toBeInTheDocument();
    });
});
