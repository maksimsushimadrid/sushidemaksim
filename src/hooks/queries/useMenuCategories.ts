import { useMemo } from 'react';
import { useSettings } from './useSettings';
import { CATEGORIES, resolveCategories, type MenuCategory } from '../../constants/menu';

export function useMenuCategories() {
    const { data: settings, isLoading } = useSettings();

    const categories = useMemo<MenuCategory[]>(() => {
        if (!settings?.menuCategories || !Array.isArray(settings.menuCategories)) {
            return CATEGORIES;
        }
        return resolveCategories(settings.menuCategories);
    }, [settings?.menuCategories]);

    return {
        categories,
        isLoading,
        defaultCategories: CATEGORIES,
    };
}
