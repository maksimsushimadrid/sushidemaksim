import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOBILE_NAV_CYCLE, getCycleIndexForPath } from '../constants/navigation';
import { triggerHaptic } from '../utils/haptics';

interface TouchPoint {
    x: number;
    y: number;
    time: number;
}

/**
 * Enables smooth screen-wide swipe navigation between main top-level pages
 * on mobile touch devices.
 *
 * Swipe Left (finger moves right to left): advances to the next menu item.
 * Swipe Right (finger moves left to right): returns to the previous menu item.
 *
 * Automatically guards against:
 * - Vertical page scrolls (reading through menu/articles)
 * - Open modals, drawers, or dialogs
 * - Interactive elements (buttons, links, inputs, sliders)
 * - Maps (Leaflet/Google Maps)
 * - Horizontally scrollable sub-components (category carousels, tabs)
 * - iOS Safari edge navigation gestures (within 24px of screen edges)
 */
export function useScreenSwipeNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const startTouchRef = useRef<TouchPoint | null>(null);
    const isVerticalScrollRef = useRef<boolean>(false);
    const isIgnoredRef = useRef<boolean>(false);

    // Keep location path in ref for instant access inside window touch events
    const currentPathRef = useRef<string>(location.pathname);
    useEffect(() => {
        currentPathRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onTouchStart = (e: TouchEvent) => {
            startTouchRef.current = null;
            isVerticalScrollRef.current = false;
            isIgnoredRef.current = false;

            // Only track single-finger gestures
            if (e.touches.length !== 1) {
                isIgnoredRef.current = true;
                return;
            }

            // Only active on top-level cycle pages
            const activeIndex = getCycleIndexForPath(currentPathRef.current);
            if (activeIndex === -1) {
                isIgnoredRef.current = true;
                return;
            }

            // Guard against open modals, sheets, or mobile drawer
            const isModalOpen =
                document.body.style.overflow === 'hidden' ||
                document.body.classList.contains('overflow-hidden') ||
                Boolean(
                    document.querySelector(
                        '[role="dialog"], [data-modal="true"], [data-menu-drawer="true"], .fixed.inset-0.z-modal, .fixed.inset-0.z-50'
                    )
                );

            if (isModalOpen) {
                isIgnoredRef.current = true;
                return;
            }

            const touch = e.touches[0];
            const screenWidth = window.innerWidth;

            // Avoid conflicting with iOS Safari edge-swipe back/forward gestures
            if (touch.clientX < 24 || touch.clientX > screenWidth - 24) {
                isIgnoredRef.current = true;
                return;
            }

            const target = e.target as HTMLElement | null;
            if (!target || typeof target.closest !== 'function') return;

            // Guard against interactive elements
            if (
                target.closest(
                    'button, a, input, textarea, select, [role="button"], [role="slider"], [role="combobox"], [contenteditable="true"], [data-no-swipe]'
                )
            ) {
                isIgnoredRef.current = true;
                return;
            }

            // Guard against maps, canvas, iframe
            if (
                target.closest(
                    '.leaflet-container, .leaflet-control-container, .gm-style, iframe, canvas'
                )
            ) {
                isIgnoredRef.current = true;
                return;
            }

            // Guard against horizontally scrollable containers (category bars, chips, carousels)
            let currentEl: HTMLElement | null = target;
            while (
                currentEl &&
                currentEl !== document.body &&
                currentEl !== document.documentElement
            ) {
                try {
                    const style = window.getComputedStyle(currentEl);
                    const overflowX = style.overflowX;
                    if (
                        (overflowX === 'auto' || overflowX === 'scroll') &&
                        currentEl.scrollWidth > currentEl.clientWidth + 8
                    ) {
                        isIgnoredRef.current = true;
                        return;
                    }
                } catch {
                    // ignore computed style failures
                }
                currentEl = currentEl.parentElement;
            }

            startTouchRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
            };
        };

        const onTouchMove = (e: TouchEvent) => {
            if (isIgnoredRef.current || isVerticalScrollRef.current || !startTouchRef.current) {
                return;
            }

            if (e.touches.length !== 1) {
                isIgnoredRef.current = true;
                return;
            }

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - startTouchRef.current.x;
            const deltaY = currentY - startTouchRef.current.y;

            // If the gesture moved vertically first, lock it as a normal page scroll
            if (Math.abs(deltaY) > 18 && Math.abs(deltaY) > Math.abs(deltaX)) {
                isVerticalScrollRef.current = true;
            }
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (isIgnoredRef.current || isVerticalScrollRef.current || !startTouchRef.current) {
                startTouchRef.current = null;
                return;
            }

            const touch = e.changedTouches[0];
            if (!touch) {
                startTouchRef.current = null;
                return;
            }

            const deltaX = touch.clientX - startTouchRef.current.x;
            const deltaY = touch.clientY - startTouchRef.current.y;
            const elapsed = Date.now() - startTouchRef.current.time;

            startTouchRef.current = null;

            // Threshold requirements for intentional horizontal swipe:
            // 1. Min horizontal distance of 55px
            // 2. Clear horizontal dominance: |deltaX| > |deltaY| * 1.5
            // 3. Completed in under 600ms
            if (
                Math.abs(deltaX) >= 55 &&
                Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
                elapsed < 600
            ) {
                const activeIndex = getCycleIndexForPath(currentPathRef.current);
                if (activeIndex === -1) return;

                const targetIndex =
                    deltaX < 0
                        ? (activeIndex + 1) % MOBILE_NAV_CYCLE.length
                        : (activeIndex - 1 + MOBILE_NAV_CYCLE.length) % MOBILE_NAV_CYCLE.length;

                const targetPage = MOBILE_NAV_CYCLE[targetIndex];
                if (!targetPage) return;

                triggerHaptic(15);

                try {
                    window.dispatchEvent(new CustomEvent('sushi:swiped'));
                    localStorage.setItem('sushi_swipe_hint_seen_v3', 'true');
                } catch {
                    // ignore
                }

                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                if ((window as any).lenis) {
                    try {
                        (window as any).lenis.scrollTo(0, { immediate: true });
                    } catch {
                        // ignore
                    }
                }

                navigate(targetPage.path);

                requestAnimationFrame(() => {
                    window.scrollTo(0, 0);
                });
            }
        };

        const onTouchCancel = () => {
            startTouchRef.current = null;
            isVerticalScrollRef.current = false;
            isIgnoredRef.current = false;
        };

        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('touchcancel', onTouchCancel, { passive: true });

        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchCancel);
        };
    }, [navigate]);
}
