import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SwipeNavigationHint from './SwipeNavigationHint';

let mockPathname = '/';

vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: mockPathname }),
}));

describe('SwipeNavigationHint Component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockPathname = '/';
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the dimmed overlay with "Para moverte por el menú, usa el swipe" on cycle route after delay', () => {
        mockPathname = '/';
        render(<SwipeNavigationHint />);

        // Advances timer by 650ms to trigger appearance
        act(() => {
            vi.advanceTimersByTime(650);
        });

        expect(screen.getByText(/para moverte por el menú, usa el swipe/i)).toBeInTheDocument();
    });

    it('dismisses when clicked and stores flag in localStorage', () => {
        mockPathname = '/menu';
        render(<SwipeNavigationHint />);

        act(() => {
            vi.advanceTimersByTime(650);
        });

        const overlay = screen.getByRole('dialog');
        expect(overlay).toBeInTheDocument();

        act(() => {
            fireEvent.click(overlay);
        });

        expect(localStorage.getItem('sushi_swipe_intro_seen_v1')).toBe('true');
    });

    it('dismisses when sushi:swiped event is dispatched', () => {
        mockPathname = '/';
        render(<SwipeNavigationHint />);

        act(() => {
            vi.advanceTimersByTime(650);
        });

        expect(screen.getByText(/para moverte por el menú, usa el swipe/i)).toBeInTheDocument();

        act(() => {
            window.dispatchEvent(new CustomEvent('sushi:swiped'));
        });

        expect(
            screen.queryByText(/para moverte por el menú, usa el swipe/i)
        ).not.toBeInTheDocument();
    });

    it('does not render on non-cycle route', () => {
        mockPathname = '/admin';
        render(<SwipeNavigationHint />);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(
            screen.queryByText(/para moverte por el menú, usa el swipe/i)
        ).not.toBeInTheDocument();
    });
});
