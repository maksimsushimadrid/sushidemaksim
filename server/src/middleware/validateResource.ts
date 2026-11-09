import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const SENSITIVE_KEYS = new Set([
    'password',
    'currentpassword',
    'newpassword',
    'confirmpassword',
    'token',
    'refreshtoken',
    'accesstoken',
    'secret',
    'cvv',
    'cardnumber',
    'authorization',
]);

export function sanitizeForLogging(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForLogging);

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            sanitized[key] = '[REDACTED]';
        } else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeForLogging(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Middleware for validating request data using Zod schemas.
 *
 * Usage:
 * router.post('/path', validateResource(mySchema), handler)
 */
export const validateResource =
    (schema: z.ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
        const result = await schema.safeParseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (result.success) {
            req.body = result.data.body;
            req.query = result.data.query;
            req.params = result.data.params;
            return next();
        }

        const errors = result.error.issues.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message,
        }));

        // Log validation failures for diagnostics, ensuring sensitive credentials are redacted
        console.warn('⚠️ Validation Error for %s:', req.originalUrl, {
            errors,
            body: sanitizeForLogging(req.body),
        });

        return res.status(400).json({
            error: errors[0].message,
            errors: errors,
        });
    };
