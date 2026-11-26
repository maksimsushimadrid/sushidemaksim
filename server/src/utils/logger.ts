import { config } from '../config.js';

/**
 * Lightweight structured logger.
 * - `debug`: silent in production (`NODE_ENV === 'production'`) to keep Vercel logs clean.
 * - `info` / `warn` / `error`: always emitted with consistent level prefixes.
 */
export const logger = {
    debug(message: string, ...args: unknown[]) {
        if (!config.isProd) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },
    info(message: string, ...args: unknown[]) {
        console.info(`[INFO] ${message}`, ...args);
    },
    warn(message: string, ...args: unknown[]) {
        console.warn(`[WARN] ${message}`, ...args);
    },
    error(message: string, ...args: unknown[]) {
        console.error(`[ERROR] ${message}`, ...args);
    },
};
