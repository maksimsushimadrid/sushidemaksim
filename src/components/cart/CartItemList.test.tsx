import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CartItemList from './CartItemList';
import { CartItem } from '../../types';

const mockItems: CartItem[] = [
    {
        id: '1',
        name: 'Gyoza',
        price: 6.9,
        quantity: 1,
        category: 'rollos-grandes',
        image: 'gyoza.jpg',
        description: 'Mock description',
    },
];

describe('CartItemList', () => {
    const defaultProps = {
        items: mockItems,
        updateQuantity: vi.fn(),
        removeItem: vi.fn(),
        clearCart: vi.fn(),
        getCategoryEmoji: vi.fn(() => '🍣'),
        chopsticksCount: 1,
        updateChopsticks: vi.fn(),
    };

    it('renders products and quantities correctly', () => {
        render(<CartItemList {...defaultProps} />);
        expect(screen.getByText('Gyoza')).toBeInTheDocument();
        expect(screen.getAllByText('1').length).toBeGreaterThan(0);
        expect(screen.getByText('6,90 €')).toBeInTheDocument();
    });

    it('renders the soy sauce notice', () => {
        render(<CartItemList {...defaultProps} />);
        expect(
            screen.getByText(/Salsa de soja, wasabi y jengibre están incluidos en su pedido/i)
        ).toBeInTheDocument();
    });

    it('renders the guests/persons question and count', () => {
        render(<CartItemList {...defaultProps} />);
        expect(screen.getByText(/Número de personas/i)).toBeInTheDocument();
        expect(screen.getByText('1', { selector: 'span.w-10' })).toBeInTheDocument();
    });

    it('calls updateChopsticks when clicking buttons', () => {
        render(<CartItemList {...defaultProps} chopsticksCount={2} />);

        const buttons = screen.getAllByRole('button');

        const minusChopsticks = buttons[4];
        const plusChopsticks = buttons[5];

        fireEvent.click(plusChopsticks);
        expect(defaultProps.updateChopsticks).toHaveBeenCalledWith(3);

        fireEvent.click(minusChopsticks);
        expect(defaultProps.updateChopsticks).toHaveBeenCalledWith(1);
    });

    it('disables minus button when count is 1', () => {
        render(<CartItemList {...defaultProps} chopsticksCount={1} />);
        const buttons = screen.getAllByRole('button');
        const minusChopsticks = buttons[4];
        expect(minusChopsticks).toBeDisabled();
    });

    it('disables plus button when count is 10', () => {
        render(<CartItemList {...defaultProps} chopsticksCount={10} />);
        const buttons = screen.getAllByRole('button');
        const plusChopsticks = buttons[5];
        expect(plusChopsticks).toBeDisabled();
    });

    it('calls clearCart when clicking the empty button', () => {
        render(<CartItemList {...defaultProps} />);
        const emptyButton = screen.getByText(/Vaciar/i);
        fireEvent.click(emptyButton);
        expect(defaultProps.clearCart).toHaveBeenCalled();
    });

    it('calls updateQuantity or removeItem when clicking item quantity buttons', () => {
        render(<CartItemList {...defaultProps} />);
        const buttons = screen.getAllByRole('button');
        const minusItem = buttons[1];
        const plusItem = buttons[2];

        fireEvent.click(plusItem);
        expect(defaultProps.updateQuantity).toHaveBeenCalledWith('1', 2);

        fireEvent.click(minusItem);
        expect(defaultProps.removeItem).toHaveBeenCalledWith('1');
    });

    it('calls updateQuantity when item quantity > 1', () => {
        const manyItems = [{ ...mockItems[0], quantity: 5 }];
        render(<CartItemList {...defaultProps} items={manyItems} />);
        const buttons = screen.getAllByRole('button');
        const minusItem = buttons[1];

        fireEvent.click(minusItem);
        expect(defaultProps.updateQuantity).toHaveBeenCalledWith('1', 4);
    });

    it('calls removeItem when clicking the X button', () => {
        render(<CartItemList {...defaultProps} />);
        const removeButton = screen.getByLabelText(/Eliminar/i);
        fireEvent.click(removeButton);
        expect(defaultProps.removeItem).toHaveBeenCalledWith('1');
    });

    it('handles image load error', () => {
        render(<CartItemList {...defaultProps} />);
        const img = screen.getByAltText('Producto Gyoza');
        fireEvent.error(img);
        // SafeImage handles this internally - it should stay resilient
    });

    it('renders the flavor selector for beverages (ID 116)', () => {
        const beverageItem = {
            id: '116',
            name: 'Coca-Cola',
            price: 2.5,
            quantity: 1,
            category: 'bebidas' as any,
            image: '',
            description: '',
        };
        render(<CartItemList {...defaultProps} items={[beverageItem]} />);

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        expect(screen.getByText(/Elegir sabor/i)).toBeInTheDocument();

        fireEvent.change(select, { target: { value: 'Sprite' } });
        expect(defaultProps.updateQuantity).toHaveBeenCalledWith('116', 1, undefined, 'Sprite');
    });

    it('renders the beer selector for beer items (ID 113)', () => {
        const beerItem = {
            id: '113',
            name: 'Cerveza 0,33l',
            price: 2.5,
            quantity: 1,
            category: 'bebidas' as any,
            image: '',
            description: '',
        };
        render(<CartItemList {...defaultProps} items={[beerItem]} />);

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        expect(screen.getByText(/Elegir cerveza/i)).toBeInTheDocument();

        fireEvent.change(select, { target: { value: 'Amstel Radler' } });
        expect(defaultProps.updateQuantity).toHaveBeenCalledWith(
            '113',
            1,
            undefined,
            'Amstel Radler'
        );
    });
});
