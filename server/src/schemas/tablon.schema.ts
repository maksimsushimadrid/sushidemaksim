import { z } from 'zod';

/**
 * Schema for creating a Tablón post.
 */
export const createTablonPostSchema = z.object({
    body: z.object({
        categoryId: z.number({
            required_error: 'La categoría es obligatoria',
            invalid_type_error: 'ID de categoría inválido',
        }),
        tags: z
            .array(z.string().max(30, 'Cada etiqueta puede tener máximo 30 caracteres'))
            .max(3, 'Máximo 3 etiquetas')
            .default([]),
        message: z
            .string()
            .min(25, 'El mensaje debe tener al menos 25 caracteres')
            .max(2000, 'El mensaje no puede superar los 2000 caracteres'),
        whatsappPhone: z
            .string()
            .min(6, 'El teléfono debe tener al menos 6 dígitos')
            .max(20, 'El teléfono es demasiado largo'),
        images: z
            .array(z.string().url('URL de imagen inválida'))
            .max(9, 'Máximo 9 imágenes')
            .default([]),
    }),
});

/**
 * Schema for updating a Tablón post (within 20-min window or moderator).
 */
export const updateTablonPostSchema = z.object({
    body: z.object({
        tags: z.array(z.string().max(30)).max(3).optional(),
        message: z
            .string()
            .min(25, 'El mensaje debe tener al menos 25 caracteres')
            .max(2000, 'El mensaje no puede superar los 2000 caracteres')
            .optional(),
        whatsappPhone: z.string().min(6).max(20).optional(),
        images: z.array(z.string().url()).max(9).optional(),
        categoryId: z.number().optional(),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID de publicación inválido'),
    }),
});

/**
 * Schema for creating a comment.
 */
export const createTablonCommentSchema = z.object({
    body: z.object({
        message: z
            .string()
            .min(1, 'El comentario no puede estar vacío')
            .max(500, 'El comentario no puede superar los 500 caracteres'),
        parentId: z.number().nullable().optional(),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID de publicación inválido'),
    }),
});

/**
 * Schema for listing posts (query params).
 */
export const getTablonPostsSchema = z.object({
    query: z.object({
        page: z
            .string()
            .optional()
            .transform(val => {
                const parsed = val ? parseInt(val, 10) : 1;
                return isNaN(parsed) ? 1 : Math.max(1, parsed);
            }),
        limit: z
            .string()
            .optional()
            .transform(val => {
                const parsed = val ? parseInt(val, 10) : 10;
                return isNaN(parsed) ? 10 : Math.min(50, Math.max(1, parsed));
            }),
        category: z.string().optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(['newest', 'oldest', 'popular']).optional().default('newest'),
    }),
});

/**
 * Schema for moderating a post (approve/reject).
 */
export const moderateTablonPostSchema = z.object({
    body: z.object({
        approved: z.boolean({
            required_error: 'El estado de aprobación es obligatorio',
        }),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID de publicación inválido'),
    }),
});

/**
 * Schema for suggesting a new category.
 */
export const suggestCategorySchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, 'El nombre debe tener al menos 2 caracteres')
            .max(40, 'El nombre no puede superar los 40 caracteres'),
        emoji: z.string().max(4).optional().default('📌'),
    }),
});

export type CreateTablonPostInput = z.infer<typeof createTablonPostSchema>['body'];
export type UpdateTablonPostInput = z.infer<typeof updateTablonPostSchema>['body'];
export type CreateTablonCommentInput = z.infer<typeof createTablonCommentSchema>['body'];
