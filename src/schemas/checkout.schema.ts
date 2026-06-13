import { z } from 'zod';

/**
 * Validates Spanish and general international phone numbers
 */
const phoneRegex =
    /^(?:\+34|0034|34)?[6-9]\d{8}$|^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}$/;

/**
 * Comprehensive schema for the checkout form.
 * Uses superRefine for complex conditional validation:
 * - Address is required only for delivery
 * - Scheduled Date/Time are required only if isScheduled is true
 */
export const checkoutSchema = z
    .object({
        deliveryType: z.enum(['delivery', 'pickup', 'reservation']),

        // Address fields
        address: z.string().optional(),
        house: z.string().optional(),
        apartment: z.string().optional(),
        postalCode: z.string().optional(),

        // Customer info
        phone: z
            .string()
            .min(1, 'El teléfono es obligatorio')
            .regex(phoneRegex, 'Formato de teléfono inválido'),
        customerName: z
            .string()
            .min(1, 'El nombre es obligatorio')
            .min(2, 'El nombre debe tener al menos 2 caracteres'),
        guestEmail: z.string().email('Email inválido').optional().or(z.literal('')),

        // Logistic preferences
        paymentMethod: z
            .enum(['cash', 'card'])
            .nullable()
            .refine(val => val !== null, {
                message: 'Selecciona un método de pago',
            }),
        guestsCount: z.number().min(1).max(50),
        chopsticksCount: z.number().min(1, 'El número de personas debe ser al menos 1').max(50),

        // Scheduling
        isScheduled: z.boolean(),
        scheduledDate: z.string().optional(),
        scheduledTime: z.string().optional(),

        // Misc
        noCall: z.boolean().default(false),
        noBuzzer: z.boolean().default(false),
        customNote: z.string().max(500, 'El mensaje es demasiado largo').optional(),
        saveAddress: z.boolean().default(true),
        saveProfile: z.boolean().default(true),

        // Internal/Hidden
        selectedZone: z.any().optional().nullable(),
        lat: z.number().optional().nullable(),
        lon: z.number().optional().nullable(),
    })
    .superRefine((data, ctx) => {
        // 1. If delivery, address and house are mandatory
        if (data.deliveryType === 'delivery') {
            if (!data.address || data.address.trim().length < 5) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'La dirección es obligatoria para el envío',
                    path: ['address'],
                });
            }
            if (!data.house || data.house.trim().length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'El número de casa es obligatorio',
                    path: ['house'],
                });
            }
        }

        // 2. If isScheduled, date and time are mandatory
        if (data.isScheduled) {
            if (!data.scheduledDate || data.scheduledDate.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Selecciona una fecha para el pedido programado',
                    path: ['scheduledDate'],
                });
            }
            if (!data.scheduledTime || data.scheduledTime.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Selecciona una hora para el pedido programado',
                    path: ['scheduledTime'],
                });
            }
        }
    });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
