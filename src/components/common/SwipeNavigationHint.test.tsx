import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import SwipeNavigationHint from './SwipeNavigationHint';

let mockPathname = '/';

vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: mockPathname }),
}));

describe('SwipeNavigationHint Component', () => {
    beforeEach(() => {
        mockPathname = '/';
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders the hint with "Desliza para navegar" on cycle route', () => {
        mockPathname = '/';
        render(<SwipeNavigationHint />);

        expect(screen.getByText(/desliza para navegar/i)).toBeInTheDocument();
    });

    it('dismisses when clicked and stores flag in localStorage', async () => {
        mockPathname = '/menu';
        render(<SwipeNavigationHint />);

        const hint = screen.getByText(/desliza para navegar/i);
        expect(hint).toBeInTheDocument();

        fireEvent.click(hint);

        expect(localStorage.getItem('sushi_swipe_hint_seen_v3')).toBe('true');
        await waitFor(() => {
            expect(screen.queryByText(/desliza para navegar/i)).not.toBeInTheDocument();
        });
    });

    it('dismisses when sushi:swiped event is dispatched', async () => {
        mockPathname = '/';
        render(<SwipeNavigationHint />);

        expect(screen.getByText(/desliza para navegar/i)).toBeInTheDocument();

        act(() => {
            window.dispatchEvent(new CustomEvent('sushi:swiped'));
        });

        await waitFor(() => {
            expect(screen.queryByText(/desliza para navegar/i)).not.toBeInTheDocument();
        });
    });

    it('does not render on non-cycle route', () => {
        mockPathname = '/admin';
        render(<SwipeNavigationHint />);

        expect(screen.queryByText(/desliza para navegar/i)).not.toBeInTheDocument();
    });
});
