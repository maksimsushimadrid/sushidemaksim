import { memo } from 'react';

export type JapanesePageKey =
    | 'inicio'
    | 'carta'
    | 'promo'
    | 'tablon'
    | 'reserva'
    | 'contacto'
    | 'carrito'
    | 'perfil';

interface JapaneseNavIconProps {
    pageKey: JapanesePageKey | string;
    isScrolled: boolean;
    isHome: boolean;
    size?: number;
    className?: string;
}

export const JapaneseNavIcon = memo(function JapaneseNavIcon({
    pageKey,
    isScrolled,
    isHome,
    size = 18,
    className = 'shrink-0',
}: JapaneseNavIconProps) {
    const isDark = !isScrolled && isHome;
    const baseColor = isDark ? '#F4F4F5' : '#27272A';
    const accentColor = '#F26522'; // Sushi brand orange
    const cutoutColor = isDark ? '#121214' : '#FFFFFF';

    const normalizedKey = pageKey.toLowerCase();

    // 1. INICIO: Traditional Japanese Torii Gate
    if (normalizedKey === 'inicio' || normalizedKey === '/') {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                {/* Curved Upper Beam (Kasagi) */}
                <path
                    d="M 2 4.2 C 5 3.6, 15 3.6, 18 4.2 C 19 4.4, 19.3 3.4, 18.2 3.1 C 14 2.2, 6 2.2, 1.8 3.1 C 0.7 3.4, 1 4.4, 2 4.2 Z"
                    fill={accentColor}
                />
                {/* Secondary Horizontal Beam (Nuki) */}
                <rect x="3.5" y="6.2" width="13" height="1.4" rx="0.4" fill={baseColor} />
                {/* Central Gakuzuka Tablet */}
                <rect x="9.2" y="4" width="1.6" height="2.4" rx="0.3" fill={accentColor} />
                {/* Left & Right Main Pillars */}
                <path d="M 5.2 4 L 4.6 17 L 6.4 17 L 6.8 4 Z" fill={baseColor} />
                <path d="M 14.8 4 L 15.4 17 L 13.6 17 L 13.2 4 Z" fill={baseColor} />
                {/* Lacquered Pillar Pedestals */}
                <rect x="3.8" y="16" width="3.2" height="1.6" rx="0.5" fill={accentColor} />
                <rect x="13" y="16" width="3.2" height="1.6" rx="0.5" fill={accentColor} />
            </svg>
        );
    }

    // 2. CARTA: Gourmet Salmon Nigiri Sushi
    if (normalizedKey === 'carta' || normalizedKey.includes('menu')) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                {/* Shari (Rice bed) */}
                <path
                    d="M 4 10 C 4 13.5, 7 15, 10 15 C 13 15, 16 13.5, 16 10 C 16 9.5, 14 10, 10 10.5 C 6 10, 4 9.5, 4 10 Z"
                    fill={baseColor}
                />
                {/* Salmon Slice (Topping) */}
                <path
                    d="M 2.5 8 C 3.5 5.5, 12.5 4.8, 17.5 7.5 C 18.5 8, 18 9.5, 16.5 10 C 12.5 11.2, 5.5 11, 3 9.5 C 2.2 9, 2 8.3, 2.5 8 Z"
                    fill={accentColor}
                />
                {/* Texture lines on salmon */}
                <path
                    d="M 6.5 6.8 Q 8 8.2 7.5 9.4"
                    stroke={cutoutColor}
                    strokeWidth="0.8"
                    strokeLinecap="round"
                />
                <path
                    d="M 11.5 6.2 Q 13 7.8 12.5 9.2"
                    stroke={cutoutColor}
                    strokeWidth="0.8"
                    strokeLinecap="round"
                />
                {/* Nori Seaweed Band around center */}
                <rect x="9.1" y="5.8" width="1.8" height="9.2" rx="0.4" fill={cutoutColor} />
            </svg>
        );
    }

    // 3. PROMO: Traditional Japanese Sensu Folding Fan
    if (normalizedKey === 'promo') {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                {/* Fan Paper Leaf */}
                <path
                    d="M 2.5 12 C 3.5 4.5, 16.5 4.5, 17.5 12 C 14.8 10.5, 5.2 10.5, 2.5 12 Z"
                    fill={baseColor}
                />
                {/* Lacquered Rising Sun Crest */}
                <circle cx="10" cy="8.2" r="2.5" fill={accentColor} />
                {/* Fan Ribs Frame */}
                <path
                    d="M 2.5 12 L 10 16.5 L 17.5 12"
                    stroke={baseColor}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                <path d="M 6.5 11 L 10 16.5 L 13.5 11" stroke={baseColor} strokeWidth="0.8" />
                {/* Rivet with orange ring */}
                <circle cx="10" cy="16.5" r="1.3" fill={accentColor} />
            </svg>
        );
    }

    // 4. TABLÓN: Traditional Japanese Makimono Scroll
    if (
        normalizedKey === 'tablón' ||
        normalizedKey === 'tablon' ||
        normalizedKey.includes('blog')
    ) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                {/* Left wooden spindle */}
                <rect x="2.5" y="3.5" width="2" height="13" rx="1" fill={baseColor} />
                <circle cx="3.5" cy="3.5" r="1.3" fill={accentColor} />
                <circle cx="3.5" cy="16.5" r="1.3" fill={accentColor} />
                {/* Right wooden spindle */}
                <rect x="15.5" y="3.5" width="2" height="13" rx="1" fill={baseColor} />
                <circle cx="16.5" cy="3.5" r="1.3" fill={accentColor} />
                <circle cx="16.5" cy="16.5" r="1.3" fill={accentColor} />
                {/* Unrolled parchment body */}
                <path
                    d="M 4.5 5.5 C 8 5, 12 5.6, 15.5 5.2 L 15.5 14.8 C 12 15.2, 8 14.6, 4.5 15 Z"
                    fill={baseColor}
                    fillOpacity="0.3"
                    stroke={baseColor}
                    strokeWidth="1"
                />
                {/* Red/Orange Japanese Wax Seal */}
                <circle cx="10" cy="10" r="2.2" fill={accentColor} />
                <rect x="8.8" y="8.8" width="2.4" height="2.4" rx="0.4" fill={cutoutColor} />
            </svg>
        );
    }

    // 5. RESERVA: Ceramic Dining Bowl & Resting Chopsticks (Table Setting)
    if (normalizedKey === 'reserva' || normalizedKey.includes('reserv')) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                {/* Ceramic Bowl Body (Chawan) */}
                <path
                    d="M 3.8 9 C 3.8 13.8, 7 16, 10 16 C 13 16, 16.2 13.8, 16.2 9 Z"
                    fill={baseColor}
                />
                {/* Bowl Foot Ring (Kodai) */}
                <rect x="8.2" y="16" width="3.6" height="1.4" rx="0.5" fill={baseColor} />
                {/* Orange Lacquered Rim */}
                <ellipse cx="10" cy="9" rx="6.2" ry="1.4" fill={accentColor} />
                {/* Hashi Chopsticks Resting Across */}
                <path
                    d="M 2 7.2 L 18 6.4 C 18.5 6.4, 18.5 7, 18 7.1 L 2 8 C 1.5 8, 1.5 7.3, 2 7.2 Z"
                    fill={baseColor}
                />
                {/* Traditional Japanese lacquered orange handle */}
                <path
                    d="M 13.5 6.6 L 18 6.4 C 18.5 6.4, 18.5 7, 18 7.1 L 13.5 7.3 Z"
                    fill={accentColor}
                />
            </svg>
        );
    }

    // 6. CONTACTO: Traditional Japanese Hanging Lantern (Chōchin)
    if (normalizedKey === 'contacto' || normalizedKey.includes('contact')) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                {/* Hanging Wire Hook */}
                <path
                    d="M 10 2 L 10 4"
                    stroke={baseColor}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
                {/* Top Wooden Fitting */}
                <rect x="7" y="4" width="6" height="1.2" rx="0.4" fill={baseColor} />
                {/* Paper Lantern Body */}
                <path
                    d="M 6.2 5.2 C 4.5 8, 4.5 12, 6.2 14.8 L 13.8 14.8 C 15.5 12, 15.5 8, 13.8 5.2 Z"
                    fill={baseColor}
                />
                {/* Glowing Orange Central Band */}
                <rect x="5.2" y="8" width="9.6" height="4" rx="0.6" fill={accentColor} />
                {/* Subtle Phone receiver silhouette on lantern */}
                <path
                    d="M 8.2 9.2 C 8.2 9, 8.5 8.8, 8.8 8.8 L 9.4 8.8 C 9.6 8.8, 9.8 9, 9.8 9.2 L 10 9.8 C 10.1 10, 10 10.2, 9.8 10.3 L 9.5 10.5 C 9.8 11.1, 10.2 11.5, 10.8 11.8 L 11 11.5 C 11.1 11.3, 11.3 11.2, 11.5 11.3 L 12.1 11.5 C 12.3 11.6, 12.4 11.8, 12.4 12 L 12.4 12.6 C 12.4 12.8, 12.2 13.1, 12 13.1 C 9.8 13.1, 8.2 11.5, 8.2 9.2 Z"
                    fill={cutoutColor}
                />
                {/* Bottom Fitting & Tassel */}
                <rect x="7.5" y="14.8" width="5" height="1.2" rx="0.4" fill={baseColor} />
                <path
                    d="M 10 16 L 10 18.5"
                    stroke={accentColor}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            </svg>
        );
    }

    // 7. CARRITO: Japanese Bento Box with Nigiri Inside
    if (normalizedKey === 'carrito' || normalizedKey.includes('cart')) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                {/* Bento Box Outer Shell */}
                <rect
                    x="3"
                    y="6.5"
                    width="14"
                    height="10.5"
                    rx="1.8"
                    fill="none"
                    stroke={baseColor}
                    strokeWidth="1.4"
                />
                {/* Top Knot / Handle */}
                <path
                    d="M 7 6.5 C 7 4, 13 4, 13 6.5"
                    stroke={accentColor}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                />
                {/* Inner divider */}
                <line x1="10" y1="6.5" x2="10" y2="17" stroke={baseColor} strokeWidth="1" />
                {/* Mini Salmon Nigiri inside left compartment */}
                <ellipse cx="6.5" cy="11.8" rx="2.2" ry="1.2" fill={accentColor} />
                <rect x="6" y="10.8" width="1" height="2" rx="0.2" fill={baseColor} />
                {/* Mini Maki Roll inside right compartment */}
                <circle cx="13.5" cy="11.8" r="1.8" fill={baseColor} />
                <circle cx="13.5" cy="11.8" r="0.8" fill={accentColor} />
            </svg>
        );
    }

    // 8. PERFIL: Master Chef Silhouette with Tied Orange Headband (Hachimaki)
    if (normalizedKey === 'perfil' || normalizedKey.includes('profile')) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                {/* Kimono / Chef Collar */}
                <path
                    d="M 4 17.5 C 4 13.5, 7 13, 10 13 C 13 13, 16 13.5, 16 17.5 Z"
                    fill={baseColor}
                />
                {/* Chef Head */}
                <circle cx="10" cy="8.5" r="4.2" fill={baseColor} />
                {/* Traditional Orange Hachimaki (Tied Headband) */}
                <path
                    d="M 5.8 7.5 C 7 6.8, 13 6.8, 14.2 7.5 L 14.2 8.8 C 13 8.1, 7 8.1, 5.8 8.8 Z"
                    fill={accentColor}
                />
                {/* Hachimaki Knot Tails */}
                <path d="M 14.2 8 L 16.5 7 L 15.8 9.5 Z" fill={accentColor} />
            </svg>
        );
    }

    // Fallback: Japanese Katana / Crossed Chopsticks
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M 16.2 2.2 L 3.8 17.8 C 3.6 18.1 3.2 18.1 2.9 17.9 C 2.7 17.6 2.7 17.2 3.0 16.9 L 15.3 1.5 C 15.6 1.2 16.0 1.2 16.3 1.5 C 16.5 1.7 16.5 2.0 16.2 2.2 Z"
                fill={baseColor}
            />
            <path
                d="M 16.2 2.2 L 12.6 6.8 L 11.8 6.0 L 15.3 1.5 C 15.6 1.2 16.0 1.2 16.3 1.5 C 16.5 1.7 16.5 2.0 16.2 2.2 Z"
                fill={accentColor}
            />
            <path
                d="M 3.8 2.2 L 16.2 17.8 C 16.5 18.1 16.9 18.1 17.1 17.9 C 17.4 17.6 17.3 17.2 17.0 16.9 L 4.7 1.5 C 4.4 1.2 4.0 1.2 3.7 1.5 C 3.5 1.7 3.5 2.0 3.8 2.2 Z"
                stroke={cutoutColor}
                strokeWidth="1.6"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M 3.8 2.2 L 16.2 17.8 C 16.5 18.1 16.9 18.1 17.1 17.9 C 17.4 17.6 17.3 17.2 17.0 16.9 L 4.7 1.5 C 4.4 1.2 4.0 1.2 3.7 1.5 C 3.5 1.7 3.5 2.0 3.8 2.2 Z"
                fill={baseColor}
            />
            <path
                d="M 3.8 2.2 L 7.4 6.8 L 8.2 6.0 L 4.7 1.5 C 4.4 1.2 4.0 1.2 3.7 1.5 C 3.5 1.7 3.5 2.0 3.8 2.2 Z"
                fill={accentColor}
            />
        </svg>
    );
});
