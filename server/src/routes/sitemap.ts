import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase.js';
import { config } from '../config.js';

const router = Router();

const STATIC_ROUTES = [
    { url: '', changefreq: 'daily', priority: '1.0' },
    { url: '/menu', changefreq: 'weekly', priority: '0.9' },
    { url: '/promo', changefreq: 'weekly', priority: '0.8' },
    { url: '/reservar', changefreq: 'monthly', priority: '0.8' },
    { url: '/contacts', changefreq: 'monthly', priority: '0.7' },
    { url: '/tablon', changefreq: 'daily', priority: '0.8' },
    { url: '/partners', changefreq: 'monthly', priority: '0.5' },
    { url: '/refund-policy', changefreq: 'monthly', priority: '0.3' },
    { url: '/privacy', changefreq: 'monthly', priority: '0.3' },
];

router.get('/', async (req: Request, res: Response) => {
    try {
        const baseUrl = config.frontendUrl || 'https://www.sushidemaksim.com';
        const today = new Date().toISOString().split('T')[0];

        // 1. Static Routes
        let xmlItems = STATIC_ROUTES.map(
            route => `    <url>
        <loc>${baseUrl}${route.url}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>${route.changefreq}</changefreq>
        <priority>${route.priority}</priority>
    </url>`
        ).join('\n');

        // 3. Dynamic Tablón Posts
        const { data: posts } = await supabase
            .from('tablon_posts')
            .select('id, updated_at')
            .eq('is_approved', true);

        if (posts && posts.length > 0) {
            const tablonItems = posts
                .map(post => {
                    return `    <url>
        <loc>${baseUrl}/tablon/${post.id}</loc>
        <lastmod>${post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>`;
                })
                .join('\n');
            xmlItems += '\n' + tablonItems;
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlItems}
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

export default router;
