import {
    Waves,
    Fish,
    Flame,
    Soup,
    Gift,
    Cake,
    Beer,
    Droplets,
    Utensils,
    Coffee,
    Pizza,
    Sparkles,
    Tag,
    Salad,
    Sandwich,
    type LucideIcon,
} from 'lucide-react';

export interface MenuCategory {
    id: string;
    name: string;
    icon: LucideIcon;
    iconName?: string;
    description: string;
    emoji?: string;
    isCustom?: boolean;
}

export const CATEGORIES: MenuCategory[] = [
    {
        id: 'entrantes',
        name: 'Entrantes',
        icon: Waves,
        iconName: 'Waves',
        description:
            'Nuestros entrantes japoneses más populares: gyozas, nigiri y rollitos de primera ideales para comenzar.',
        emoji: '🥟',
    },
    {
        id: 'rollos-grandes',
        name: 'Rollos Grandes',
        icon: Fish,
        iconName: 'Fish',
        description:
            'Famosos Rollos grandes elaborados con arroz premium y pescado de la más alta calidad',
        emoji: '🍣',
    },
    {
        id: 'rollos-clasicos',
        name: 'Rollos Clasicos',
        icon: Fish,
        iconName: 'Fish',
        description:
            'La esencia del sushi tradicional: Makis y Rollos clásicos para los paladares más puristas.',
        emoji: '🥢',
    },
    {
        id: 'rollos-fritos',
        name: 'Rollos Fritos',
        icon: Flame,
        iconName: 'Flame',
        description:
            'Crujientes por fuera y jugosos por dentro. Prueba nuestra selección de Hot Rolls fritos al momento.',
        emoji: '🔥',
    },
    {
        id: 'sopas',
        name: 'Sopas',
        icon: Soup,
        iconName: 'Soup',
        description: 'Sopas tradicionales japonesas para reconfortar el cuerpo',
        emoji: '🍜',
    },
    {
        id: 'menus',
        name: 'Set',
        icon: Gift,
        iconName: 'Gift',
        description:
            'Nuestras mejores combinaciones y sets variados de sushi ideales para compartir con amigos o en pareja.',
        emoji: '🎁',
    },
    {
        id: 'postre',
        name: 'Postre',
        icon: Cake,
        iconName: 'Cake',
        description:
            'El toque dulce final: Mochis artesanales y postres típicos para cerrar con broche de oro.',
        emoji: '🍰',
    },
    {
        id: 'bebidas',
        name: 'Bebidas',
        icon: Beer,
        iconName: 'Beer',
        description:
            'Nuestra selección de bebidas refrescantes, cervezas artesanas y vinos para acompañar tu sushi.',
        emoji: '🥤',
    },
    {
        id: 'extras',
        name: 'Extras',
        icon: Droplets,
        iconName: 'Droplets',
        description:
            'Salsas caseras (soja, teriyaki, picante) y complementos para personalizar tu pedido al máximo.',
        emoji: '🧴',
    },
];

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    Waves,
    Fish,
    Flame,
    Soup,
    Gift,
    Cake,
    Beer,
    Droplets,
    Utensils,
    Coffee,
    Pizza,
    Sparkles,
    Tag,
    Salad,
    Sandwich,
};

export const AVAILABLE_CATEGORY_ICONS = [
    { id: 'Waves', label: 'Olas / Gyozas', icon: Waves, emoji: '🥟' },
    { id: 'Fish', label: 'Pescado / Sushi', icon: Fish, emoji: '🍣' },
    { id: 'Flame', label: 'Fuego / Tempura', icon: Flame, emoji: '🔥' },
    { id: 'Soup', label: 'Sopa / Ramen', icon: Soup, emoji: '🍜' },
    { id: 'Gift', label: 'Regalo / Set', icon: Gift, emoji: '🎁' },
    { id: 'Cake', label: 'Postre / Dulce', icon: Cake, emoji: '🍰' },
    { id: 'Beer', label: 'Bebidas / Cerveza', icon: Beer, emoji: '🥤' },
    { id: 'Droplets', label: 'Salsas / Extras', icon: Droplets, emoji: '🧴' },
    { id: 'Utensils', label: 'Cubiertos / Plato', icon: Utensils, emoji: '🍽️' },
    { id: 'Salad', label: 'Ensalada / Poke', icon: Salad, emoji: '🥗' },
    { id: 'Sandwich', label: 'Bocadillo / Bao', icon: Sandwich, emoji: '🥪' },
    { id: 'Coffee', label: 'Café / Té', icon: Coffee, emoji: '☕' },
    { id: 'Pizza', label: 'Pizza / Fusión', icon: Pizza, emoji: '🍕' },
    { id: 'Sparkles', label: 'Especial / Premium', icon: Sparkles, emoji: '✨' },
    { id: 'Tag', label: 'Etiqueta / Promo', icon: Tag, emoji: '🏷️' },
];

export function getCategoryIcon(iconName?: string): LucideIcon {
    if (!iconName) return Utensils;
    return CATEGORY_ICON_MAP[iconName] || Utensils;
}

export const EMOJI: Record<string, string> = {
    entrantes: '🥟',
    'rollos-grandes': '🍣',
    'rollos-clasicos': '🥢',
    'rollos-fritos': '🔥',
    sopas: '🍜',
    menus: '🎁',
    postre: '🍰',
    bebidas: '🥤',
    extras: '🧴',
};

/**
 * Resolves active categories based on custom settings order or defaults
 */
export function resolveCategories(customCategories?: any[]): MenuCategory[] {
    if (!customCategories || !Array.isArray(customCategories) || customCategories.length === 0) {
        return CATEGORIES;
    }

    const defaultMap = new Map(CATEGORIES.map(c => [c.id, c]));
    const result: MenuCategory[] = [];
    const seenIds = new Set<string>();

    for (const item of customCategories) {
        if (!item?.id) continue;
        seenIds.add(item.id);
        const base = defaultMap.get(item.id);
        if (base) {
            result.push({
                ...base,
                name: item.name || base.name,
                description: item.description ?? base.description,
                icon: item.iconName ? getCategoryIcon(item.iconName) : base.icon,
                iconName: item.iconName || base.iconName,
                emoji: item.emoji || base.emoji,
                isCustom: item.isCustom ?? false,
            });
        } else {
            result.push({
                id: item.id,
                name: item.name || item.id,
                description: item.description || '',
                icon: getCategoryIcon(item.iconName),
                iconName: item.iconName || 'Utensils',
                emoji: item.emoji || '🍽️',
                isCustom: true,
            });
        }
    }

    // Append any default categories that were not in the custom list
    for (const defCat of CATEGORIES) {
        if (!seenIds.has(defCat.id)) {
            result.push(defCat);
        }
    }

    return result;
}
