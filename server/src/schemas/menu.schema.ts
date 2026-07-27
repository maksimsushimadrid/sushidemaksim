import { z } from 'zod';

/**
 * Valid categories for menu items
 */
export const menuItemCategorySchema = z.enum([
    'entrantes',
    'rollos-grandes',
    'rollos-clasicos',
    'rollos-fritos',
    'sopas',
    'menus',
    'extras',
    'postre',
    'bebidas', // Added common category just in case
]);

/**
 * Base schema for a menu item
 */
const menuItemBase = {
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
    description: z.string().max(1000).optional().nullable(),
    price: z.number().positive('El precio debe ser mayor que 0'),
    category: menuItemCategorySchema,
    image: z.string().max(500).optional().nullable(),
    weight: z
        .union([z.string(), z.number()])
        .transform(val => (val !== undefined && val !== null ? String(val) : null))
        .optional()
        .nullable(),
    pieces: z.number().int().positive().max(999).optional().nullable(),
    spicy: z.boolean().optional().default(false),
    vegetarian: z.boolean().optional().default(false),
    isPromo: z.boolean().optional().default(false),
    isPopular: z.boolean().optional().default(false),
    isChefChoice: z.boolean().optional().default(false),
    isNew: z.boolean().optional().default(false),
    allergens: z.array(z.string()).optional().default([]),
    costPrice: z.number().nonnegative().optional().default(0),
};

export const createMenuItemSchema = z.object({
    body: z.object(menuItemBase),
});

export const updateMenuItemSchema = z.object({
    body: z.object(menuItemBase).partial(),
    params: z.object({
        id: z.string().transform(val => parseInt(val, 10)),
    }),
});

/**
 * Common ID parameter schema
 */
export const menuIdParamSchema = z.object({
    params: z.object({
        id: z.string().transform(val => parseInt(val, 10)),
    }),
});

/**
 * Filter query parameters for the public menu
 */
export const getMenuQuerySchema = z.object({
    query: z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        is_promo: z
            .string()
            .optional()
            .transform(val => val === 'true'),
        is_popular: z
            .string()
            .optional()
            .transform(val => val === 'true'),
        is_chef_choice: z
            .string()
            .optional()
            .transform(val => val === 'true'),
        is_new: z
            .string()
            .optional()
            .transform(val => val === 'true'),
        limit: z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : undefined))
            .refine(val => val === undefined || (!isNaN(val) && val > 0), {
                message: 'Limit must be a positive number',
            }),
    }),
});
