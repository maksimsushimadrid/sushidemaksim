import { z } from 'zod';

/**
 * Valid order statuses across the system.
 */
export const orderStatusSchema = z.enum([
    'waiting_payment',
    'pending',
    'received',
    'confirmed',
    'preparing',
    'on_the_way',
    'delivered',
    'cancelled',
]);

/**
 * Valid payment methods.
 */
export const paymentMethodSchema = z
    .enum(['EFECTIVO', 'TARJETA', 'BIZUM', 'STRIPE', 'cash', 'card'])
    .default('EFECTIVO');

const phoneRegex = /^\+34[6789]\d{8}$/;

/**
 * Schema for creating an order.
 * Mirrors frontend checkoutSchema but adapted for backend request structure.
 */
export const createOrderSchema = z.object({
    body: z
        .object({
            deliveryType: z.enum(['delivery', 'pickup', 'reservation', 'table']),
            mesaNumber: z.number().min(1).max(100).optional().nullable(),

            // Address fields (now optional and validated via superRefine)
            address: z.string().max(400).optional().nullable(),
            house: z.string().max(50).optional().nullable(),
            apartment: z.string().max(50).optional().nullable(),
            postalCode: z.string().max(10).optional().nullable(),

            // Legacy support/DB fields
            deliveryAddress: z.string().max(400).optional().nullable(),
            phoneNumber: z.string().max(30).optional().nullable(),

            // New explicit fields
            phone: z
                .string()
                .regex(phoneRegex, 'Formato de teléfono inválido')
                .optional()
                .nullable(),
            customerName: z.string().max(100).optional().nullable(),
            email: z.string().email('Email inválido').max(100).optional().nullable(),
            guestEmail: z
                .string()
                .email('Email inválido')
                .max(100)
                .optional()
                .nullable()
                .or(z.literal('')),

            // Logistic preferences
            paymentMethod: paymentMethodSchema.optional().nullable(),
            guestsCount: z.number().min(1).max(50).optional().default(2),
            chopsticksCount: z.number().min(0).max(50).optional().default(0),

            // Scheduling
            isScheduled: z.boolean().optional().default(false),
            scheduledDate: z.string().optional().nullable(),
            scheduledTime: z.string().optional().nullable(),

            // Misc
            noCall: z.boolean().optional().default(false),
            noBuzzer: z.boolean().optional().default(false),
            notes: z.string().max(1000).optional().nullable(),
            customNote: z.string().max(1000).optional().nullable(),

            // External context
            deliveryZoneId: z.union([z.string(), z.number()]).optional().nullable(),
            lat: z.number().optional().nullable(),
            lon: z.number().optional().nullable(),
            promoCode: z.string().max(50).optional().nullable(),
            tipAmount: z.number().min(0).optional().nullable(),

            // Guest cart
            guestItems: z
                .array(
                    z.object({
                        menuItemId: z.union([z.number(), z.string()]).transform(v => Number(v)),
                        quantity: z.number().min(1),
                        selectedOption: z.string().optional().nullable(),
                    })
                )
                .optional(),
        })
        .superRefine((data, ctx) => {
            // 1. If delivery, address and house are mandatory
            if (data.deliveryType === 'delivery') {
                if (!data.address && !data.deliveryAddress) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'La dirección es obligatoria para el envío',
                        path: ['address'],
                    });
                }
                // If they sent house separately (modern way)
                if (!data.deliveryAddress && (!data.house || data.house.trim().length === 0)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'El número de casa es obligatorio',
                        path: ['house'],
                    });
                }
            }

            // 1.5 If table, mesaNumber is mandatory
            if (data.deliveryType === 'table' && !data.mesaNumber) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'El número de mesa es obligatorio',
                    path: ['mesaNumber'],
                });
            }

            // 2. Phone validation (prefer modern 'phone', fallback to 'phoneNumber')
            // Mandatory for delivery/pickup/reservation, optional for 'table'
            if (data.deliveryType !== 'table' && !data.phone && !data.phoneNumber) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'El teléfono es obligatorio',
                    path: ['phone'],
                });
            }

            // 3. Scheduling validation
            if (data.isScheduled) {
                if (!data.scheduledDate || data.scheduledDate.length === 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Selecciona una fecha para el pedido anticipado',
                        path: ['scheduledDate'],
                    });
                }
                if (!data.scheduledTime || data.scheduledTime.length === 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Selecciona una hora para el pedido anticipado',
                        path: ['scheduledTime'],
                    });
                }
            }
        }),
});

/**
 * Schema for creating an invitation to pay (friend payment).
 */
export const inviteOrderSchema = z.object({
    body: z
        .object({
            deliveryType: z
                .enum(['delivery', 'pickup', 'reservation', 'table'])
                .default('delivery'),
            mesaNumber: z.number().min(1).max(100).optional().nullable(),
            address: z.string().max(400).optional().nullable(),
            house: z.string().max(50).optional().nullable(),
            apartment: z.string().max(50).optional().nullable(),
            postalCode: z.string().max(10).optional().nullable(),

            phoneNumber: z.string().max(30).optional().nullable(),
            phone: z
                .string()
                .regex(phoneRegex, 'Formato de teléfono inválido')
                .optional()
                .nullable(),

            senderName: z.string().max(100).optional().nullable(),
            notes: z.string().max(1000).optional().nullable(),
            customNote: z.string().max(1000).optional().nullable(),

            isScheduled: z.boolean().optional().default(false),
            scheduledDate: z.string().optional().nullable(),
            scheduledTime: z.string().optional().nullable(),

            guestsCount: z.number().min(1).max(50).optional().default(2),
            chopsticksCount: z.number().min(0).max(50).optional().default(0),

            promoCode: z.string().max(50).optional().nullable(),
            deliveryZoneId: z.union([z.string(), z.number()]).optional().nullable(),
            lat: z.number().optional().nullable(),
            lon: z.number().optional().nullable(),

            // Items are passed for invitations because they are draft orders
            items: z.array(z.any()).optional(),
            deliveryAddress: z.string().max(400).optional().nullable(),
        })
        .superRefine((data, ctx) => {
            if (data.deliveryType === 'delivery') {
                if (!data.address && !data.deliveryAddress) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'La dirección es obligatoria para la invitación',
                        path: ['address'],
                    });
                }
            }
        }),
});

/**
 * Schema for updating order status (Admin).
 */
export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: orderStatusSchema,
    }),
    params: z.object({
        id: z.string().min(1, 'ID de pedido obligatorio'),
    }),
});

/**
 * Schema for order history query parameters.
 */
export const getOrdersSchema = z.object({
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
                const parsed = val ? parseInt(val, 10) : 20;
                return isNaN(parsed) ? 20 : Math.min(100, Math.max(1, parsed));
            }),
        status: z.string().optional(), // Can be single or comma-separated
        userId: z.string().optional(),
        search: z.string().optional(),
    }),
});
