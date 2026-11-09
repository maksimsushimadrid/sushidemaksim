export interface NavCycleItem {
    path: string;
    label: string;
    icon: 'torii' | 'ramen' | 'fan' | 'koi' | 'temple' | 'origami';
}

export const MOBILE_NAV_CYCLE: readonly NavCycleItem[] = [
    { path: '/', label: 'Inicio', icon: 'torii' },
    { path: '/menu', label: 'Carta', icon: 'ramen' },
    { path: '/promo', label: 'Promo', icon: 'fan' },
    { path: '/tablon', label: 'Tablón', icon: 'koi' },
    { path: '/reservar', label: 'Reserva', icon: 'temple' },
    { path: '/contacts', label: 'Contacto', icon: 'origami' },
] as const;

/**
 * Returns the index in MOBILE_NAV_CYCLE for a given path.
 * Only exact matches for top-level pages are returned to avoid hijacking
 * subpages like /tablon/:id or checkout pages.
 */
export function getCycleIndexForPath(pathname: string): number {
    if (!pathname) return -1;
    // Normalize path by stripping trailing slash (except root '/')
    const normalized =
        pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    if (normalized === '/') return 0;
    if (normalized === '/menu') return 1;
    if (normalized === '/promo') return 2;
    if (normalized === '/tablon') return 3;
    if (normalized === '/reservar' || normalized === '/reserva') return 4;
    if (normalized === '/contacts') return 5;

    return -1;
}
