import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase.js';
import { config } from '../config.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

/**
 * GET /api/merchant/feed.xml or /merchant-feed.xml
 * Generates a Google Shopping XML feed (RSS 2.0) for menu items.
 */
router.get(
    ['/', '/feed.xml'],
    asyncHandler(async (_req: Request, res: Response) => {
        try {
            const baseUrl = config.frontendUrl || 'https://www.sushidemaksim.com';
            const storageBase = `${config.supabase.url}/storage/v1/object/public/images/menu`;

            // 1. Fetch all active menu items
            const { data: items, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('category')
                .order('id');

            if (error) throw error;

            // 2. Map items to XML entries
            const xmlItems = (items || [])
                .map(item => {
                    const title = escapeXml(item.name);
                    const description = escapeXml(item.description || item.name);
                    const link = `${baseUrl}/menu?category=${item.category}`;
                    const imageLink = item.image
                        ? item.image.startsWith('http')
                            ? item.image
                            : `${storageBase}/${item.image}`
                        : `${baseUrl}/logo.svg`;
                    const price = `${Number(item.price).toFixed(2)} EUR`;

                    return `    <item>
      <g:id>${item.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${price}</g:price>
      <g:brand>Sushi de Maksim</g:brand>
      <g:google_product_category>Food, Beverages &amp; Tobacco &gt; Food Items &gt; Prepared Foods</g:google_product_category>
    </item>`;
                })
                .join('\n');

            // 3. Construct full RSS 2.0 Feed
            const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Sushi de Maksim - Menú Online</title>
    <link>${baseUrl}</link>
    <description>Auténtica experiencia japonesa en el corazón de Madrid. Frescura, tradición y calidad en cada pieza.</description>
${xmlItems}
  </channel>
</rss>`;

            res.header('Content-Type', 'application/xml');
            res.send(feed);
        } catch (err) {
            console.error('❌ Merchant Feed Error:', err);
            res.status(500).send('Error generating merchant feed');
        }
    })
);

/** Helper to escape XML special characters */
function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&"']/g, c => {
        switch (c) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            case '"':
                return '&quot;';
            case "'":
                return '&apos;';
            default:
                return c;
        }
    });
}

export default router;
