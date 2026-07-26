import { useEffect, useRef } from 'react';

/**
 * Bulletproof Scroll Lock for iOS Safari, Android, and Desktop.
 * Prevents background scrolling when modals / overlays are open.
 */
export const useScrollLock = (isLocked: boolean) => {
    const scrollYRef = useRef(0);

    useEffect(() => {
        const lenis = (window as any).lenis;

        if (isLocked) {
            // Save current scroll position
            scrollYRef.current = window.scrollY || window.pageYOffset || 0;

            // Prevent Lenis smooth scroll
            if (lenis && typeof lenis.stop === 'function') {
                lenis.stop();
            }

            // Bulletproof iOS + Desktop CSS lock
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollYRef.current}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
            document.documentElement.style.overflow = 'hidden';

            // iOS Touchmove prevention on document level
            const preventTouchMove = (e: TouchEvent) => {
                const target = e.target as HTMLElement | null;
                // Allow scrolling ONLY if inside a scrollable container within modal
                if (target && target.closest('.allow-modal-scroll')) {
                    return;
                }
                if (e.cancelable) {
                    e.preventDefault();
                }
            };

            document.addEventListener('touchmove', preventTouchMove, { passive: false });

            return () => {
                document.removeEventListener('touchmove', preventTouchMove);

                // Restore styles
                const scrollY =
                    Math.abs(parseInt(document.body.style.top || '0', 10)) || scrollYRef.current;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                document.documentElement.style.overflow = '';

                // Restore scroll position
                window.scrollTo(0, scrollY);

                if (lenis && typeof lenis.start === 'function') {
                    lenis.start();
                }
            };
        } else {
            // Release locks if not locked
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.documentElement.style.overflow = '';

            if (lenis && typeof lenis.start === 'function') {
                lenis.start();
            }
        }
    }, [isLocked]);
};
