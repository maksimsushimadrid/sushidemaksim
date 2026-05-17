import { z } from 'zod';

/**
 * Schema for environment variables validation.
 * Ensures the server doesn't start with missing or malformed configuration.
 */
export const envSchema = z
    .object({
        PORT: z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : 3001)),
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
        JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
        CORS_ORIGIN: z
            .string()
            .optional()
            .transform(val => (val ? val.split(',') : undefined)),

        // SMTP - Gmail or other providers
        SMTP_HOST: z.string().default('smtp.gmail.com'),
        SMTP_PORT: z
            .string()
            .default('587')
            .transform(val => parseInt(val, 10)),
        SMTP_USER: z.string().optional().default(''),
        SMTP_PASS: z.string().optional().default(''),
        SMTP_FROM_NAME: z.string().default('Sushi de Maksim'),

        // External APIs
        RESEND_API_KEY: z.string().optional().default(''),
        EMAIL_FROM: z.string().default('Sushi de Maksim <info@sushidemaksim.com>'),
        ADMIN_EMAIL: z
            .string()
            .default('19fire43@gmail.com,maksimsushimadrid@gmail.com,alekseevpo@gmail.com'),

        // Supabase
        SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
        SUPABASE_KEY: z.string().optional(),
        SUPABASE_ANON_KEY: z.string().optional(),
        SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),

        // Frontend
        FRONTEND_URL: z.string().url().optional(),
        VITE_FRONTEND_URL: z.string().url().optional(),

        // Threads API
        THREADS_APP_ID: z.string().optional(),
        THREADS_APP_SECRET: z.string().optional(),
        GOOGLE_CLIENT_ID: z.string().optional(),
    })
    .refine(data => data.SUPABASE_KEY || data.SUPABASE_ANON_KEY, {
        message: 'Either SUPABASE_KEY or SUPABASE_ANON_KEY must be provided',
        path: ['SUPABASE_KEY'],
    });

export type EnvConfig = z.infer<typeof envSchema>;
