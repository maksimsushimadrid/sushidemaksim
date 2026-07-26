import { useEffect } from 'react';

/**
 * Bulletproof Scroll Lock for iOS Safari, Android, and Desktop.
 * Prevents background scrolling when modals / overlays are open
 * WITHOUT mutating body position or pushing headers off-screen.
 */
export const useScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        const lenis = (window as any).lenis;

        if (isLocked) {
            // Stop Lenis smooth scrolling engine immediately
            if (lenis && typeof lenis.stop === 'function') {
                lenis.stop();
            }

            // Standard overflow lock
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
            document.documentElement.style.overflow = 'hidden';

            // Prevent touch dragging background on iOS Safari
            const preventTouchMove = (e: TouchEvent) => {
                const target = e.target as HTMLElement | null;
                if (target && target.closest('.allow-modal-scroll')) {
                    return; // Allow scroll inside modal scrollable container
                }
                if (e.cancelable) {
                    e.preventDefault();
                }
            };

            document.addEventListener('touchmove', preventTouchMove, { passive: false });

            return () => {
                document.removeEventListener('touchmove', preventTouchMove);

                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                document.documentElement.style.overflow = '';

                if (lenis && typeof lenis.start === 'function') {
                    lenis.start();
                }
            };
        } else {
            // Ensure locks are released
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.documentElement.style.overflow = '';

            if (lenis && typeof lenis.start === 'function') {
                lenis.start();
            }
        }
    }, [isLocked]);
};
