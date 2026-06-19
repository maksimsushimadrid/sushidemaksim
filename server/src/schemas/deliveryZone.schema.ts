import { z } from 'zod';

/**
 * Coordinate pair [lat, lon] or [lon, lat] - usually [lat, lon] in this project
 */
const coordinateSchema = z.array(z.number());

/**
 * Base schema for a delivery zone
 */
const deliveryZoneBase = {
    name: z.string().min(1, 'El nombre es obligatorio'),
    cost: z.number().min(0, 'El coste no puede ser negativo'),
    minOrder: z.number().min(0).optional().default(0),
    freeThreshold: z.number().min(0).optional().nullable(),
    color: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hex inválido')
        .optional()
        .default('#EF4444'),
    opacity: z.number().min(0).max(1).optional().default(0.3),
    coordinates: z.array(coordinateSchema).optional().default([]),
    isActive: z.boolean().optional().default(true),
    type: z.enum(['polygon', 'radius']).optional(),
    minRadius: z.number().min(0).optional().default(0),
    maxRadius: z.number().min(0).optional().default(0),
};

export const createDeliveryZoneSchema = z.object({
    body: z.object(deliveryZoneBase),
});

export const updateDeliveryZoneSchema = z.object({
    params: z.object({
        id: z.string().uuid('ID de zona inválido'),
    }),
    body: z.object(deliveryZoneBase).partial(),
});

export const deliveryZoneIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('ID de zona inválido'),
    }),
});

/**
 * Schema for house numbers query
 */
export const houseNumbersQuerySchema = z.object({
    query: z.object({
        street: z.string().min(1),
        city: z.string().optional(),
        lat: z
            .string()
            .optional()
            .transform(val => (val ? parseFloat(val) : undefined)),
        lon: z
            .string()
            .optional()
            .transform(val => (val ? parseFloat(val) : undefined)),
    }),
});

/**
 * Schema for address search query
 */
export const addressSearchQuerySchema = z.object({
    query: z.object({
        q: z.string().min(1, 'La consulta de búsqueda es obligatoria'),
    }),
});

/**
 * Schema for reverse geocoding query
 */
export const reverseGeocodeQuerySchema = z.object({
    query: z.object({
        lat: z.string().transform(val => parseFloat(val)),
        lon: z.string().transform(val => parseFloat(val)),
    }),
});
