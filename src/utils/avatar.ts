import { getOptimizedImageUrl } from './images';

/**
 * Utility to get a high-quality version of social provider avatars.
 * Social providers often return a tiny thumbnail by default.
 */
export function getSharpAvatar(url: string | null | undefined, size = 256): string {
    if (!url || !url.startsWith('http')) return url || '';

    // Google: lh3.googleusercontent.com/.../s96-c/photo.jpg or ?sz=96
    if (url.includes('googleusercontent.com')) {
        // Replace existing size parameter =sXX or ?sz=XX
        let sharpened = url.replace(/=s\d+(-c)?/g, `=s${size}-c`);
        if (sharpened.includes('?sz=')) {
            sharpened = sharpened.replace(/sz=\d+/g, `sz=${size}`);
        } else if (!sharpened.includes('=s')) {
            sharpened = `${sharpened}=s${size}-c`;
        }
        return sharpened;
    }

    // GitHub: avatars.githubusercontent.com/u/.../s=40
    if (url.includes('githubusercontent.com')) {
        return url.includes('?') ? `${url}&s=${size}` : `${url}?s=${size}`;
    }

    // Twitter: pbs.twimg.com/..._normal.jpg
    if (url.includes('twimg.com')) {
        return url.replace('_normal.', '_400x400.');
    }

    // Facebook: graph.facebook.com/.../picture?type=normal
    if (url.includes('facebook.com') && url.includes('picture')) {
        return `${url}&width=${size}&height=${size}`;
    }

    // Supabase or other generic URLs
    return getOptimizedImageUrl(url, size);
}

/**
 * Standard default avatars randomly assigned to users upon registration.
 */
export const STANDARD_AVATARS = [
    '🍣', // Sushi Nigiri
    '🍱', // Bento
    '🍙', // Onigiri
    '🍥', // Narutomaki
    '🍜', // Ramen
    '🥟', // Gyoza
    '🍤', // Tempura
    '🥷', // Ninja
    '🧑‍🍳', // Chef
    '🦊', // Kitsune
    '🐱', // Neko
    '🐼', // Panda
    '🐉', // Dragon
    '🏮', // Chochin Lantern
    '🔥', // Fire
    '⚡', // Lightning
] as const;

/**
 * Returns a consistent random standard avatar for a user based on their ID, email or name.
 */
export function getDefaultAvatar(
    user?: { id?: string | number; email?: string; name?: string; avatar?: string | null } | null
): string {
    if (user?.avatar && !user.avatar.startsWith('http')) {
        return user.avatar;
    }
    const seed = String(user?.id || user?.email || user?.name || '');
    if (!seed) return '🍣';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % STANDARD_AVATARS.length;
    return STANDARD_AVATARS[index];
}
