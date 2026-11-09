import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScreenSwipeNavigation } from './useScreenSwipeNavigation';
import { getCycleIndexForPath } from '../constants/navigation';

const mockNavigate = vi.fn();
let mockPathname = '/';

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname }),
}));

vi.mock('../utils/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

describe('getCycleIndexForPath', () => {
    it('returns correct index for top-level routes', () => {
        expect(getCycleIndexForPath('/')).toBe(0);
        expect(getCycleIndexForPath('/menu')).toBe(1);
        expect(getCycleIndexForPath('/promo')).toBe(2);
        expect(getCycleIndexForPath('/tablon')).toBe(3);
        expect(getCycleIndexForPath('/reservar')).toBe(4);
        expect(getCycleIndexForPath('/reserva')).toBe(4);
        expect(getCycleIndexForPath('/contacts')).toBe(5);
    });

    it('handles trailing slashes', () => {
        expect(getCycleIndexForPath('/menu/')).toBe(1);
        expect(getCycleIndexForPath('/promo/')).toBe(2);
    });

    it('returns -1 for non-cycle routes and detail views', () => {
        expect(getCycleIndexForPath('/admin')).toBe(-1);
        expect(getCycleIndexForPath('/cart')).toBe(-1);
        expect(getCycleIndexForPath('/profile')).toBe(-1);
        expect(getCycleIndexForPath('/tablon/my-post-123')).toBe(-1);
        expect(getCycleIndexForPath('')).toBe(-1);
    });
});

describe('useScreenSwipeNavigation Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPathname = '/';
        document.body.style.overflow = '';
        document.body.className = '';
    });

    it('swipes left from / to /menu (next page)', () => {
        mockPathname = '/';
        renderHook(() => useScreenSwipeNavigation());

        act(() => {
            // Touch start at x=200, y=300
            document.body.dispatchEvent(
                new TouchEvent('touchstart', {
                    bubbles: true,
                    touches: [
                        { clientX: 200, clientY: 300, target: document.body } as unknown as Touch,
                    ],
                })
            );

            // Move slightly horizontally
            document.body.dispatchEvent(
                new TouchEvent('touchmove', {
                    bubbles: true,
                    touches: [
                        { clientX: 160, clientY: 300, target: document.body } as unknown as Touch,
                    ],
                })
            );

            // Touch end at x=100 (deltaX = -100px, elapsed short)
            document.body.dispatchEvent(
                new TouchEvent('touchend', {
                    bubbles: true,
                    changedTouches: [{ clientX: 100, clientY: 302 } as unknown as Touch],
                })
            );
        });

        expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });

    it('swipes right from / to /contacts (previous page / wrap around)', () => {
        mockPathname = '/';
        renderHook(() => useScreenSwipeNavigation());

        act(() => {
            // Touch start at x=100
            document.body.dispatchEvent(
                new TouchEvent('touchstart', {
                    bubbles: true,
                    touches: [
                        { clientX: 100, clientY: 300, target: document.body } as unknown as Touch,
                    ],
                })
            );

            // Touch end at x=220 (deltaX = +120px)
            document.body.dispatchEvent(
                new TouchEvent('touchend', {
                    bubbles: true,
                    changedTouches: [{ clientX: 220, clientY: 305 } as unknown as Touch],
                })
            );
        });

        expect(mockNavigate).toHaveBeenCalledWith('/contacts');
    });

    it('ignores vertical scrolling', () => {
        mockPathname = '/menu';
        renderHook(() => useScreenSwipeNavigation());

        act(() => {
            document.body.dispatchEvent(
                new TouchEvent('touchstart', {
                    bubbles: true,
                    touches: [
                        { clientX: 150, clientY: 100, target: document.body } as unknown as Touch,
                    ],
                })
            );

            // Large vertical movement (scrolling the page)
            document.body.dispatchEvent(
                new TouchEvent('touchmove', {
                    bubbles: true,
                    touches: [
                        { clientX: 140, clientY: 250, target: document.body } as unknown as Touch,
                    ],
                })
            );

            document.body.dispatchEvent(
                new TouchEvent('touchend', {
                    bubbles: true,
                    changedTouches: [{ clientX: 80, clientY: 300 } as unknown as Touch],
                })
            );
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('ignores swipe when touch started inside button or input', () => {
        mockPathname = '/';
        renderHook(() => useScreenSwipeNavigation());

        const button = document.createElement('button');
        document.body.appendChild(button);

        act(() => {
            button.dispatchEvent(
                new TouchEvent('touchstart', {
                    bubbles: true,
                    touches: [{ clientX: 150, clientY: 200, target: button } as unknown as Touch],
                })
            );

            button.dispatchEvent(
                new TouchEvent('touchend', {
                    bubbles: true,
                    changedTouches: [{ clientX: 50, clientY: 200 } as unknown as Touch],
                })
            );
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        document.body.removeChild(button);
    });

    it('ignores swipe when modal is open (body overflow: hidden)', () => {
        mockPathname = '/';
        document.body.style.overflow = 'hidden';
        renderHook(() => useScreenSwipeNavigation());

        act(() => {
            document.body.dispatchEvent(
                new TouchEvent('touchstart', {
                    bubbles: true,
                    touches: [
                        { clientX: 200, clientY: 300, target: document.body } as unknown as Touch,
                    ],
                })
            );

            document.body.dispatchEvent(
                new TouchEvent('touchend', {
                    bubbles: true,
                    changedTouches: [{ clientX: 100, clientY: 300 } as unknown as Touch],
                })
            );
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
