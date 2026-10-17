import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RegistrationDiscountModal from './RegistrationDiscountModal';

describe('RegistrationDiscountModal', () => {
    it('renders modal with Spanish discount message, question and continue button when open', () => {
        const onClose = vi.fn();
        const onContinue = vi.fn();

        render(
            <RegistrationDiscountModal isOpen={true} onClose={onClose} onContinue={onContinue} />
        );

        // Headline & discount
        expect(screen.getByRole('heading', { name: /10% de descuento/i })).toBeInTheDocument();

        // The question
        expect(screen.getByText('¿Quieres registrarte?')).toBeInTheDocument();

        // The continue button
        const continueBtn = screen.getByRole('button', { name: /continuar/i });
        expect(continueBtn).toBeInTheDocument();

        // Dismiss button
        expect(screen.getByText('Quizás más tarde')).toBeInTheDocument();
    });

    it('calls onContinue when user clicks Continuar', () => {
        const onClose = vi.fn();
        const onContinue = vi.fn();

        render(
            <RegistrationDiscountModal isOpen={true} onClose={onClose} onContinue={onContinue} />
        );

        const continueBtn = screen.getByRole('button', { name: /continuar/i });
        fireEvent.click(continueBtn);

        expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking close button or dismiss text', () => {
        const onClose = vi.fn();
        const onContinue = vi.fn();

        render(
            <RegistrationDiscountModal isOpen={true} onClose={onClose} onContinue={onContinue} />
        );

        const closeBtn = screen.getByLabelText('Cerrar modal');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);

        const laterBtn = screen.getByText('Quizás más tarde');
        fireEvent.click(laterBtn);
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('calls onClose on Escape key press', () => {
        const onClose = vi.fn();
        const onContinue = vi.fn();

        render(
            <RegistrationDiscountModal isOpen={true} onClose={onClose} onContinue={onContinue} />
        );

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render anything when isOpen is false', () => {
        const onClose = vi.fn();
        const onContinue = vi.fn();

        render(
            <RegistrationDiscountModal isOpen={false} onClose={onClose} onContinue={onContinue} />
        );

        expect(screen.queryByText('¿Quieres registrarte?')).not.toBeInTheDocument();
    });
});
