import 'dotenv/config';
import { envSchema } from './schemas/config.schema.js';

const DEFAULT_JWT_SECRET = 'sushi-de-maksim-secret-key-2024-CHANGE-IN-PRODUCTION';

// Validate and parse environment variables
const env = envSchema.parse(process.env);

const jwtSecret = env.JWT_SECRET || DEFAULT_JWT_SECRET;
const nodeEnv = env.NODE_ENV;

if (nodeEnv === 'production' && jwtSecret === DEFAULT_JWT_SECRET) {
    console.warn(
        '⚠️ WARNING: JWT_SECRET should be set in production environment for better security.'
    );
}

export const config = {
    port: env.PORT,
    jwtSecret,
    jwtExpiresIn: '7d' as const,
    bcryptRounds: 10,
    corsOrigin: env.CORS_ORIGIN
        ? [
              ...new Set([
                  ...env.CORS_ORIGIN,
                  'http://localhost:5173',
                  'https://sushidemaksim.vercel.app',
                  'https://sushidemaksim.com',
                  'https://www.sushidemaksim.com',
              ]),
          ]
        : [
              'http://localhost:5173',
              'https://sushidemaksim.vercel.app',
              'https://sushidemaksim.com',
              'https://www.sushidemaksim.com',
          ],
    nodeEnv,
    isDev: nodeEnv === 'development',
    isProd: nodeEnv === 'production',
    smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        fromName: env.SMTP_FROM_NAME,
    },
    resendApiKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
    adminEmail: env.ADMIN_EMAIL,
    supabase: {
        url: env.SUPABASE_URL,
        key: env.SUPABASE_KEY || env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    frontendUrl:
        env.FRONTEND_URL ||
        env.VITE_FRONTEND_URL ||
        (nodeEnv === 'production' ? 'https://www.sushidemaksim.com' : 'http://localhost:5173'),
    threads: {
        appId: env.THREADS_APP_ID,
        appSecret: env.THREADS_APP_SECRET,
    },
    googleClientId: env.GOOGLE_CLIENT_ID,
};
