import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { isValidUUID } from '../utils/helpers.js';

export interface AuthRequest extends Request {
    userId?: string;
}

function parseToken(req: Request): string {
    // 1. Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    // 2. Try Cookie header
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce(
            (acc, curr) => {
                const [key, val] = curr.split('=').map(c => c.trim());
                if (key) acc[key] = val;
                return acc;
            },
            {} as Record<string, string>
        );
        return cookies['sushi_token'] || '';
    }

    return '';
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = parseToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    try {
        const payload = jwt.verify(token, config.jwtSecret) as { userId: string };

        // 🚨 CRITICAL FIX: Validate UUID format to prevent "556" / integer ID syntax errors in Supabase
        if (!payload.userId || !isValidUUID(payload.userId)) {
            console.warn(`⚠️ Blocked request with invalid userId format: "${payload.userId}"`);
            return res.status(401).json({
                error: 'Sesión inválida (ID corrupto). Por favor, vuelve a iniciar sesión.',
            });
        }

        req.userId = payload.userId;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = parseToken(req);

    if (!token) {
        return next();
    }

    try {
        const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
        if (payload.userId && isValidUUID(payload.userId)) {
            req.userId = payload.userId;
        }
    } catch {
        return res
            .status(401)
            .json({ error: 'Sesión expirada. Por favor, vuelve a iniciar sesión.' });
    }

    next();
}
