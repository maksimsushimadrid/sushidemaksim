import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { supabase } from './db/supabase.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import promoRoutes from './routes/promo.js';
import promosRoutes from './routes/promos.js';
import cronRoutes from './routes/cron.js';
import tablonRoutes from './routes/tablon.js';
import settingsRoutes from './routes/settings.js';
import newsletterRoutes from './routes/newsletter.js';
import contactRoutes from './routes/contact.js';
import deliveryZonesRoutes from './routes/deliveryZones.js';
import analyticsRoutes from './routes/analytics.js';
import reservationsRoutes from './routes/reservations.js';
import reportsRoutes from './routes/reports.js';
import sitemapRoutes from './routes/sitemap.js';
import merchantRoutes from './routes/merchant.js';

const app = express();
console.log('DEBUG: Express app initialized');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trust proxy for correct IP detection behind Vercel, Nginx, etc.
app.set('trust proxy', 1);

// ─── Global Middlewares ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: config.corsOrigin,
        credentials: true,
    })
);
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// ─── Static Files for Uploads ──────────────────────────────────────────────────
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/promos', promosRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/tablon', tablonRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/delivery-zones', deliveryZonesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/admin/reports', reportsRoutes);

// ─── Invitations Social Preview (Priority) ────────────────────────────────────
// Handles Telegram/WhatsApp link previews BEFORE the React frontend can override them
app.get('/invitacion/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: order } = await supabase
            .from('orders')
            .select('notes, total')
            .eq('id', id)
            .single();

        const senderMatch = order?.notes?.match(/\[De parte de: (.*?)\]/);
        const senderName = senderMatch ? senderMatch[1] : 'Tu amigo(a)';
        const fUrl = config.frontendUrl.replace(/\/$/, '');
        const pandaImg = `${fUrl}/hungry-panda.webp`;
        const finalDest = `${fUrl}/pay-for-friend/${id}`;

        const html = `<!DOCTYPE html>
<html lang="es" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Invita a ${senderName}! - Sushi de Maksim</title>
    <meta name="description" content="¿Te animas a invitar a ${senderName}? Su pedido favorito de Sushi de Maksim te espera.">
    
    <!-- WhatsApp / Telegram / Facebook Priority -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="¡Invita a ${senderName}!">
    <meta property="og:description" content="¿Te animas a invitar a ${senderName}? Su pedido favorito de Sushi de Maksim te espera.">
    <meta property="og:image" content="${pandaImg}">
    <meta property="og:image:secure_url" content="${pandaImg}">
    <meta property="og:image:type" content="image/webp">
    <meta property="og:image:width" content="600">
    <meta property="og:image:height" content="600">
    <meta property="og:url" content="${finalDest}">
    
    <!-- Twitter / Telegram Card (Summary Large) -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${pandaImg}">
    <meta name="twitter:title" content="¡Invita a ${senderName}!">
    <meta name="twitter:description" content="Sorprende a tu amigo con el mejor sushi de Madrid.">
    <meta property="og:site_name" content="Sushi de Maksim">
    
    <!-- Redirect to React App -->
    <meta http-equiv="refresh" content="0; url=${finalDest}">
    <script>window.location.href = "${finalDest}";</script>
</head>
<body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fdfbf7;">
    <div style="text-align: center;">
        <p style="color: #666;">Redirigiendo a la sorpresa...</p>
    </div>
</body>
</html>`;

        res.set('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        // Fallback to home on error
        return res.redirect('/');
    }
});

app.get('/compartir/item/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: item } = await supabase.from('menu_items').select('*').eq('id', id).single();

        if (!item) return res.redirect('/menu');

        const fUrl = config.frontendUrl.replace(/\/$/, '');
        const finalDest = `${fUrl}/menu#item-${id}`;

        // Format image URL
        let imageUrl = item.image;
        if (imageUrl && !imageUrl.startsWith('http')) {
            const STORAGE_BASE = `${config.supabase.url}/storage/v1/object/public/images`;
            // If the path already includes 'menu/', don't add it again
            const cleanPath = imageUrl.startsWith('menu/') ? imageUrl : `menu/${imageUrl}`;
            imageUrl = `${STORAGE_BASE}/${cleanPath}`;
        }
        if (!imageUrl) imageUrl = `${fUrl}/og-image-v18.jpg`;

        const html = `<!DOCTYPE html>
<html lang="es" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.name} — Sushi de Maksim</title>
    <meta name="description" content="${item.description}">
    
    <!-- WhatsApp / Telegram / Facebook Tags -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="¡Mira este ${item.name} en Sushi de Maksim!">
    <meta property="og:description" content="${item.description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${finalDest}">
    <meta property="og:site_name" content="Sushi de Maksim">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:title" content="¡Mira este ${item.name} en Sushi de Maksim!">
    <meta name="twitter:description" content="${item.description}">
    
    <!-- Redirect to React App -->
    <meta http-equiv="refresh" content="0; url=${finalDest}">
    <script>window.location.href = "${finalDest}";</script>
</head>
<body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #000;">
    <div style="text-align: center; color: white;">
        <p style="opacity: 0.6; font-weight: 500;">Cargando ${item.name}...</p>
    </div>
</body>
</html>`;

        res.set('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.redirect('/menu');
    }
});

// ─── Sitemap & Merchant Feed ───────────────────────────────────────────────────
app.use('/sitemap.xml', sitemapRoutes);
app.use('/api/merchant', merchantRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    console.log('DEBUG: /api/health requested');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
    });
});

app.get('/api/health/full', async (_req, res) => {
    try {
        const { data, error } = await supabase.from('menu_items').select('count').limit(1);
        if (error) throw error;
        res.json({
            status: 'ok',
            database: 'connected',
            count: data,
            config: {
                hasUrl: !!config.supabase.url,
                hasKey: !!config.supabase.key,
                nodeEnv: config.nodeEnv,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.get('/api/health/smtp', async (_req, res) => {
    try {
        const { transporter } = await import('./utils/email.js');
        await transporter.verify();
        res.json({
            status: 'ok',
            message: 'SMTP connection verified',
            user: config.smtp.user,
            host: config.smtp.host,
            port: config.smtp.port,
        });
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            error: err.message || err,
            config: {
                user: config.smtp.user,
                host: config.smtp.host,
                port: config.smtp.port,
                hasPass: !!config.smtp.pass,
            },
        });
    }
});

app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
// In CI/E2E environments, we need the server to listen even if NODE_ENV=test
if (!process.env.VERCEL) {
    app.listen(config.port, () => {
        console.log(`\n🍣 Sushi de Maksim API [${config.nodeEnv}]`);
        console.log(`   Server:  http://localhost:${config.port}`);
        console.log(`   Health:  http://localhost:${config.port}/api/health`);
        console.log(`   CORS:    ${config.corsOrigin}\n`);
    });
}

export default app;

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
function shutdown(signal: string) {
    console.log(`\n⚡ Received ${signal}. Shutting down gracefully...`);
    process.exit(0);
}

if (!process.env.VERCEL) {
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}
