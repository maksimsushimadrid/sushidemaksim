import { useEffect, useRef, RefObject } from 'react';

const FOCUSABLE =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

interface Options {
    /** Close handler invoked on Escape. Omit to disable Escape handling (e.g. if handled elsewhere). */
    onClose?: () => void;
    /** Whether the dialog is currently open. Defaults to true (for conditionally-rendered modals). */
    isOpen?: boolean;
}

/**
 * Accessible-dialog behaviour for modals:
 *  - moves focus into the dialog on open
 *  - traps Tab / Shift+Tab inside the dialog
 *  - closes on Escape (optional)
 *  - restores focus to the previously focused element on close
 *
 * Attach the returned ref to the dialog container and add
 * `role="dialog" aria-modal="true"` plus `aria-labelledby` / `aria-label`.
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>({
    onClose,
    isOpen = true,
}: Options = {}): RefObject<T> {
    const ref = useRef<T>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;

        const getFocusable = () =>
            ref.current
                ? Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
                      el => el.offsetParent !== null || el === document.activeElement
                  )
                : [];

        // Defer so animated (framer-motion) content is mounted.
        const focusTimer = window.setTimeout(() => {
            const node = ref.current;
            if (!node || node.contains(document.activeElement)) return;
            const autoFocus = node.querySelector<HTMLElement>('[autofocus], [data-autofocus]');
            const target = autoFocus || getFocusable()[0] || node;
            if (target === node && !node.hasAttribute('tabindex'))
                node.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        }, 50);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!ref.current) return;

            // Only the top-most dialog should react.
            const dialogs = document.querySelectorAll('[aria-modal="true"]');
            const isTopMost = dialogs[dialogs.length - 1] === ref.current;

            if (e.key === 'Escape' && onCloseRef.current) {
                if (!isTopMost) return;
                e.stopPropagation();
                onCloseRef.current();
                return;
            }

            if (e.key !== 'Tab' || !isTopMost) return;
            const focusable = getFocusable();
            if (focusable.length === 0) {
                e.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (e.shiftKey && (active === first || !ref.current.contains(active))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && (active === last || !ref.current.contains(active))) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', handleKeyDown);
            if (previouslyFocused && document.contains(previouslyFocused)) {
                previouslyFocused.focus({ preventScroll: true });
            }
        };
    }, [isOpen]);

    return ref;
}
