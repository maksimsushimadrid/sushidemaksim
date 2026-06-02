import { z } from 'zod';

export const phoneRegex =
    /^(?:\+34|0034|34)?[6-9]\d{8}$|^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}$/;

/**
 * Shared base rules to maintain consistency across Auth and User modules.
 */
export const emailSchema = z
    .string({ required_error: 'El email es obligatorio' })
    .min(1, 'El email es obligatorio')
    .email('Email inválido')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido')
    .max(100, 'El email es demasiado largo');

export const passwordSchema = z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria')
    .min(9, 'La contraseña debe tener al menos 9 caracteres')
    .max(100, 'La contraseña no puede exceder los 100 caracteres')
    .regex(
        /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>_+-])/,
        'La contraseña debe tener al menos un número y un símbolo especial'
    );

/**
 * --- AUTH SCHEMAS ---
 */

export const registerSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: 'El nombre es obligatorio' })
            .min(2, 'El nombre debe tener al menos 2 caracteres')
            .max(80, 'El nombre es demasiado largo'),
        email: emailSchema,
        password: passwordSchema,
        phone: z
            .string()
            .regex(phoneRegex, 'Formato de teléfono inválido')
            .optional()
            .or(z.literal('')),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: z
            .string({ required_error: 'La contraseña es obligatoria' })
            .min(1, 'La contraseña es obligatoria'),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: emailSchema,
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        email: emailSchema,
        code: z.string().length(6, 'El código debe tener 6 caracteres'),
        newPassword: passwordSchema,
    }),
});

export const googleAuthSchema = z.object({
    body: z.object({
        access_token: z.string().min(1, 'Token de Google obligatorio'),
    }),
});

/**
 * --- USER SCHEMAS ---
 */

export const updateProfileSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, 'El nombre debe tener al menos 2 caracteres')
            .max(80, 'El nombre es demasiado largo')
            .optional(),
        phone: z
            .string()
            .regex(phoneRegex, 'Formato de teléfono inválido')
            .optional()
            .or(z.literal('')),
        avatar: z.string().max(2048, 'El avatar es demasiado largo').optional().or(z.literal('')),
        birthDate: z.string().optional().nullable(),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
        newPassword: passwordSchema,
    }),
});

export const addressSchema = z.object({
    body: z.object({
        label: z.string().max(50).optional(),
        street: z.string().min(3, 'La calle es obligatoria').max(200),
        house: z.string().max(50).optional(),
        apartment: z.string().max(100).optional(),
        city: z.string().max(100).optional(),
        postalCode: z.string().max(20).optional(),
        phone: z.string().max(30).optional(),
        isDefault: z.boolean().optional(),
        lat: z.number().optional(),
        lon: z.number().optional(),
    }),
});

export const updateAddressSchema = z.object({
    body: addressSchema.shape.body.partial(),
    params: z.object({
        id: z.string().min(1, 'ID de dirección obligatorio'),
    }),
});

export const favoriteSchema = z.object({
    body: z.object({
        menuItemId: z.number({
            required_error: 'El ID del producto es obligatorio',
            invalid_type_error: 'El ID del producto debe ser un número',
        }),
    }),
});

/**
 * --- ADMIN USER SCHEMAS ---
 */

export const updateUserRoleSchema = z.object({
    body: z.object({
        role: z.enum(['user', 'admin', 'waiter', 'moderator'], {
            errorMap: () => ({
                message: 'Rol inválido. Debe ser: user, admin, waiter o moderator',
            }),
        }),
    }),
    params: z.object({
        id: z.string().min(1, 'ID de usuario obligatorio'),
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        isVerified: z.boolean({
            required_error: 'El estado de verificación es obligatorio',
        }),
    }),
    params: z.object({
        id: z.string().min(1, 'ID de usuario obligatorio'),
    }),
});

export const verifyBirthdaySchema = z.object({
    body: z.object({
        verified: z.boolean({
            required_error: 'El estado de verificación es obligatorio',
        }),
    }),
    params: z.object({
        id: z.string().min(1, 'ID de usuario obligatorio'),
    }),
});
