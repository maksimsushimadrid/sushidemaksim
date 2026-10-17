/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BASE_URL = 'https://www.sushidemaksim.com';
const BRAND = 'Sushi de Maksim';
const DEFAULT_IMAGE = `${BASE_URL}/og-image-v20.jpg`;
const RESTAURANT_PHONE = '+34 631 920 312';
const RESTAURANT_ADDRESS = 'C. de Barrilero, 20, 28007 Madrid España';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Organization & Restaurant JSON-LD base
const restaurantSchema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: BRAND,
    image: DEFAULT_IMAGE,
    url: BASE_URL,
    telephone: RESTAURANT_PHONE,
    servesCuisine: ['Japanese', 'Sushi', 'Asian'],
    priceRange: '€€',
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'C. de Barrilero, 20',
        addressLocality: 'Madrid',
        postalCode: '28007',
        addressRegion: 'Madrid',
        addressCountry: 'ES',
    },
    geo: {
        '@type': 'GeoCoordinates',
        latitude: 40.4034,
        longitude: -3.6766,
    },
    openingHoursSpecification: [
        {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Wednesday', 'Thursday', 'Friday'],
            opens: '19:00',
            closes: '22:30',
        },
        {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday', 'Sunday'],
            opens: '14:00',
            closes: '16:00',
        },
        {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday', 'Sunday'],
            opens: '19:00',
            closes: '22:30',
        },
    ],
    hasMenu: `${BASE_URL}/menu`,
    acceptsReservations: 'True',
};

async function fetchMenuData() {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { data: items } = await supabase
            .from('menu_items')
            .select('id, name, description, price, category')
            .limit(40);
        return items || [];
    } catch (err) {
        console.warn('⚠️ Could not fetch menu items for pre-rendering:', err.message);
        return null;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function generateRoutePages(menuItems) {
    return [
        {
            path: '',
            title: 'Sushi a domicilio en Madrid — Sushi de Maksim | Calidad Premium',
            description:
                'El mejor sushi artesanal de Madrid con entrega a domicilio. Pide online rolls, nigiri y sashimi frescos con ingredientes de máxima calidad. ¡Haz tu pedido ahora!',
            keywords:
                'sushi a domicilio madrid, sushi madrid, pedir sushi online madrid, sushi artesanal, restaurante japones madrid',
            image: DEFAULT_IMAGE,
            schema: [
                restaurantSchema,
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: BRAND,
                    url: BASE_URL,
                },
            ],
            bodyHtml: `
                <main style="max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
                    <header style="text-align: center; margin-bottom: 40px;">
                        <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Sushi de Maksim — Auténtico Sushi Artesanal en Madrid</h1>
                        <p style="font-size: 1.15rem; color: #475569; max-width: 680px; margin: 0 auto 24px;">Disfruta de la mejor experiencia gastronómica japonesa con entrega rápida a domicilio en Madrid y recogida en local.</p>
                        <nav style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                            <a href="/menu" style="background: #ea580c; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Ver Menú Completo</a>
                            <a href="/reservar" style="background: #f1f5f9; color: #0f172a; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Reservar Mesa</a>
                            <a href="/contacts" style="background: #f1f5f9; color: #0f172a; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Contacto</a>
                        </nav>
                    </header>
                    <section style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                        <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a;">Especialidades destacadas</h2>
                        <p style="color: #64748b; margin-bottom: 24px;">Rolls artesanales, ingredientes frescos y recetas exclusivas preparadas al momento por el sushiman Maksim.</p>
                    </section>
                </main>
            `,
        },
        {
            path: 'menu',
            title: 'Menú de Sushi a Domicilio en Madrid | Carta Completa — Sushi de Maksim',
            description:
                'Descubre nuestra carta de sushi en Madrid: rolls clásicos, rollos grandes, rollos fritos, entrantes, sopas y postres. Pide online con entrega a domicilio rápida.',
            keywords:
                'menu sushi madrid, carta sushi maksim, rolls sushi madrid, sushi delivery madrid, nigiri sashimi madrid',
            image: DEFAULT_IMAGE,
            schema: [
                {
                    '@context': 'https://schema.org',
                    '@type': 'Menu',
                    name: `Menú de ${BRAND}`,
                    url: `${BASE_URL}/menu`,
                    hasMenuItem: (menuItems || []).slice(0, 15).map(item => ({
                        '@type': 'MenuItem',
                        name: item.name,
                        description: item.description || '',
                        offers: {
                            '@type': 'Offer',
                            price: String(item.price || 0),
                            priceCurrency: 'EUR',
                        },
                    })),
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Menú',
                            item: `${BASE_URL}/menu`,
                        },
                    ],
                },
            ],
            bodyHtml: `
                <main style="max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
                    <header style="margin-bottom: 32px;">
                        <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 8px; color: #0f172a;">Menú y Carta de Sushi de Maksim</h1>
                        <p style="font-size: 1.1rem; color: #475569;">Rolls artesanales, sopas, entrantes y combos premium preparados al momento en Madrid.</p>
                    </header>
                    <nav style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 16px; margin-bottom: 24px;">
                        <a href="/menu" style="padding: 8px 16px; background: #ea580c; color: white; border-radius: 9999px; text-decoration: none; font-size: 0.9rem; font-weight: 600;">Todos</a>
                        <a href="/menu?category=entrantes" style="padding: 8px 16px; background: #f1f5f9; color: #334155; border-radius: 9999px; text-decoration: none; font-size: 0.9rem;">Entrantes</a>
                        <a href="/menu?category=rollos-grandes" style="padding: 8px 16px; background: #f1f5f9; color: #334155; border-radius: 9999px; text-decoration: none; font-size: 0.9rem;">Rollos Grandes</a>
                        <a href="/menu?category=rollos-clasicos" style="padding: 8px 16px; background: #f1f5f9; color: #334155; border-radius: 9999px; text-decoration: none; font-size: 0.9rem;">Rollos Clásicos</a>
                        <a href="/menu?category=rollos-fritos" style="padding: 8px 16px; background: #f1f5f9; color: #334155; border-radius: 9999px; text-decoration: none; font-size: 0.9rem;">Rollos Fritos</a>
                        <a href="/menu?category=sopas" style="padding: 8px 16px; background: #f1f5f9; color: #334155; border-radius: 9999px; text-decoration: none; font-size: 0.9rem;">Sopas</a>
                    </nav>
                    <section style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                        ${
                            menuItems && menuItems.length > 0
                                ? menuItems
                                      .slice(0, 16)
                                      .map(
                                          item => `
                                <article style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: white;">
                                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px; color: #0f172a;">${escapeHtml(item.name)}</h3>
                                    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 12px; line-height: 1.4;">${escapeHtml(item.description || '')}</p>
                                    <strong style="font-size: 1.1rem; color: #ea580c;">${Number(item.price || 0).toFixed(2)}€</strong>
                                </article>
                            `
                                      )
                                      .join('')
                                : '<p style="color: #64748b;">Cargando carta de productos...</p>'
                        }
                    </section>
                </main>
            `,
        },
        {
            path: 'contacts',
            title: 'Contacto y Ubicación — Sushi de Maksim Madrid',
            description: `Visítanos en Madrid o haz tu pedido de sushi a domicilio. Dirección: ${RESTAURANT_ADDRESS}. Teléfono: ${RESTAURANT_PHONE}. ¡Te esperamos para ofrecerte el mejor sushi artesanal!`,
            keywords:
                'contacto sushi madrid, direccion sushi de maksim, telefono sushi maksim, restaurante japones madrid barrilero',
            image: DEFAULT_IMAGE,
            schema: [
                restaurantSchema,
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Contacto',
                            item: `${BASE_URL}/contacts`,
                        },
                    ],
                },
            ],
            bodyHtml: `
                <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Contacto y Ubicación — Sushi de Maksim</h1>
                    <p style="font-size: 1.1rem; color: #475569; margin-bottom: 32px;">Estamos a tu disposición para pedidos a domicilio, recogida en local y reservas de mesa en Madrid.</p>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 24px;">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px;">Información del Restaurante</h2>
                        <p style="margin-bottom: 10px;"><strong>📍 Dirección:</strong> ${RESTAURANT_ADDRESS}</p>
                        <p style="margin-bottom: 10px;"><strong>📞 Teléfono:</strong> <a href="tel:+34631920312" style="color: #ea580c; text-decoration: none;">${RESTAURANT_PHONE}</a></p>
                        <p style="margin-bottom: 10px;"><strong>💬 WhatsApp:</strong> <a href="https://wa.me/34631920312" style="color: #ea580c; text-decoration: none;">+34 631 920 312</a></p>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px;">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px;">Horario de Apertura</h2>
                        <ul style="list-style: none; padding: 0; margin: 0; color: #475569;">
                            <li style="margin-bottom: 8px;"><strong>Miércoles - Viernes:</strong> 19:00 - 22:30</li>
                            <li style="margin-bottom: 8px;"><strong>Sábado - Domingo:</strong> 14:00 - 16:00, 19:00 - 22:30</li>
                            <li style="margin-bottom: 8px; color: #94a3b8;"><strong>Lunes - Martes:</strong> Cerrado</li>
                        </ul>
                    </div>
                </main>
            `,
        },
        {
            path: 'promo',
            title: 'Ofertas y Promociones de Sushi | Sushi de Maksim Madrid',
            description:
                'Descubre nuestras promociones exclusivas, combos especiales de sushi con descuentos y ofertas limitadas. ¡Pide online con entrega a domicilio en Madrid!',
            keywords:
                'ofertas sushi madrid, descuentos sushi, promociones sushi maksim, cupones sushi madrid',
            image: DEFAULT_IMAGE,
            schema: [
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Promociones',
                            item: `${BASE_URL}/promo`,
                        },
                    ],
                },
            ],
            bodyHtml: `
                <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Ofertas y Promociones de Sushi de Maksim</h1>
                    <p style="font-size: 1.1rem; color: #475569; margin-bottom: 24px;">Disfruta de nuestros combos exclusivos, descuentos de bienvenida y programas de fidelización Maksim Coins.</p>
                    <a href="/menu" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Ver Promociones en Carta</a>
                </main>
            `,
        },
        {
            path: 'reservar',
            title: 'Reservar Mesa — Sushi de Maksim Madrid',
            description:
                'Reserva tu mesa en Sushi de Maksim. Disfruta del mejor sushi de Madrid en un ambiente exclusivo. Reservas online fáciles y rápidas.',
            keywords:
                'reservar mesa sushi madrid, reserva restaurante japones madrid, sushi maksim reservas',
            image: DEFAULT_IMAGE,
            schema: [
                restaurantSchema,
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Reservar',
                            item: `${BASE_URL}/reservar`,
                        },
                    ],
                },
            ],
            bodyHtml: `
                <main style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Reserva tu Mesa en Sushi de Maksim</h1>
                    <p style="font-size: 1.1rem; color: #475569; margin-bottom: 24px;">Vive una experiencia gastronómica auténtica en nuestro local en Madrid. Reserva online en pocos clics.</p>
                </main>
            `,
        },
        {
            path: 'alergenos',
            title: 'Información de Alérgenos e Ingredientes | Sushi de Maksim',
            description:
                'Consulta la guía completa de alérgenos de nuestra carta: gluten, crustáceos, pescado, soja, sésamo. Información transparente para tu tranquilidad.',
            keywords:
                'alergenos sushi, carta alergenos sushi madrid, sin gluten sushi madrid, informacion nutricional sushi',
            image: DEFAULT_IMAGE,
            schema: [
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Alérgenos',
                            item: `${BASE_URL}/alergenos`,
                        },
                    ],
                },
            ],
            bodyHtml: `
                <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Información de Alérgenos</h1>
                    <p style="font-size: 1.1rem; color: #475569; margin-bottom: 24px;">Cumplimiento del Reglamento (UE) nº 1169/2011 sobre información alimentaria facilitada al consumidor. Si tienes alguna alergia o intolerancia, consúltanos antes de realizar tu pedido.</p>
                </main>
            `,
        },
        {
            path: 'tablon',
            title: 'Tablón — Comunidad y Novedades | Sushi de Maksim',
            description:
                'Espacio de la comunidad de Sushi de Maksim. Novedades, recetas, cultura japonesa y opiniones de nuestros clientes.',
            keywords:
                'blog sushi madrid, novedades sushi maksim, comunidad sushi madrid, cultura gastronomica japonesa',
            image: DEFAULT_IMAGE,
            schema: [
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Tablón',
                            item: `${BASE_URL}/tablon`,
                        },
                    ],
                },
            ],
            bodyHtml: `
                <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Tablón de la Comunidad — Sushi de Maksim</h1>
                    <p style="font-size: 1.1rem; color: #475569;">Descubre las últimas publicaciones, eventos y notas de nuestro equipo de cocina.</p>
                </main>
            `,
        },
        {
            path: 'partners',
            title: 'Partners y Franquicias | Sushi de Maksim',
            description:
                'Únete a nuestra red de éxito. Información para socios comerciales y franquiciados de Sushi de Maksim.',
            keywords:
                'franquicia sushi espana, franquicia sushi madrid, partners sushi maksim, abrir negocio sushi',
            image: DEFAULT_IMAGE,
            schema: [
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            name: 'Partners',
                            item: `${BASE_URL}/partners`,
                        },
                    ],
                },
            ],
            bodyHtml: `
                <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Partners y Franquicias — Sushi de Maksim</h1>
                    <p style="font-size: 1.1rem; color: #475569;">Crecimiento, calidad artesanal y modelo de negocio rentable en el sector de sushi premium.</p>
                </main>
            `,
        },
        {
            path: 'privacy',
            title: 'Política de Privacidad | Sushi de Maksim',
            description:
                'Política de Privacidad y protección de datos personales de los clientes de Sushi de Maksim conforme al RGPD.',
            keywords: 'politica privacidad sushi maksim, proteccion datos',
            image: DEFAULT_IMAGE,
            schema: [],
            bodyHtml: `
                <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Política de Privacidad</h1>
                    <p style="font-size: 1.1rem; color: #475569;">Información sobre el tratamiento de tus datos personales conforme al Reglamento General de Protección de Datos (RGPD) y la LOPDGDD.</p>
                </main>
            `,
        },
        {
            path: 'refund-policy',
            title: 'Política de Reembolsos y Devoluciones | Sushi de Maksim',
            description:
                'Condiciones de cancelación, devolución y reembolso de pedidos en Sushi de Maksim.',
            keywords: 'politica reembolsos sushi maksim, cancelacion pedidos',
            image: DEFAULT_IMAGE,
            schema: [],
            bodyHtml: `
                <main style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Política de Reembolsos y Devoluciones</h1>
                    <p style="font-size: 1.1rem; color: #475569;">Condiciones aplicables a la compra de productos y servicios en Sushi de Maksim.</p>
                </main>
            `,
        },
    ];
}

function injectMetaAndBody(templateHtml, page) {
    const canonicalUrl = page.path ? `${BASE_URL}/${page.path}` : BASE_URL;

    // 1. Replace or insert <title>
    let html = templateHtml;
    if (html.includes('<title>')) {
        html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(page.title)}</title>`);
    } else {
        html = html.replace('</head>', `    <title>${escapeHtml(page.title)}</title>\n</head>`);
    }

    // 2. Replace or insert <meta name="description">
    if (html.includes('name="description"')) {
        html = html.replace(
            /<meta\s+name="description"\s+content=".*?"\s*\/?>/s,
            `<meta name="description" content="${escapeHtml(page.description)}" />`
        );
    } else {
        html = html.replace(
            '</head>',
            `    <meta name="description" content="${escapeHtml(page.description)}" />\n</head>`
        );
    }

    // 3. Canonical tag
    if (html.includes('rel="canonical"')) {
        html = html.replace(
            /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/s,
            `<link rel="canonical" href="${canonicalUrl}" />`
        );
    } else {
        html = html.replace(
            '</head>',
            `    <link rel="canonical" href="${canonicalUrl}" />\n</head>`
        );
    }

    // 4. Update OpenGraph tags
    const ogTags = `
    <!-- Pre-rendered Social Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:image" content="${page.image || DEFAULT_IMAGE}" />
    <meta property="og:site_name" content="${BRAND}" />
    <meta property="og:locale" content="es_ES" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${page.image || DEFAULT_IMAGE}" />
`;

    // Remove old duplicate OG tags if already present
    html = html.replace(/<meta\s+property="og:title"[\s\S]*?>/gi, '');
    html = html.replace(/<meta\s+property="og:description"[\s\S]*?>/gi, '');
    html = html.replace(/<meta\s+property="og:url"[\s\S]*?>/gi, '');
    html = html.replace('</head>', `${ogTags}\n</head>`);

    // 5. JSON-LD Schemas
    if (page.schema && page.schema.length > 0) {
        const schemaTags = page.schema
            .map(s => `    <script type="application/ld+json">${JSON.stringify(s)}</script>`)
            .join('\n');
        html = html.replace('</head>', `${schemaTags}\n</head>`);
    }

    // 6. Inject fallback semantic content inside <div id="root">
    // We preserve the lcp placeholder if present on homepage
    if (page.bodyHtml) {
        if (page.path === '') {
            // Homepage: keep the lcp placeholder and append initial semantic markup
            html = html.replace(
                /(<div id="root">[\s\S]*?)(<\/div>\s*<script)/,
                `$1\n<div id="seo-prerender-content" style="position: relative; z-index: 1;">${page.bodyHtml}</div>\n$2`
            );
        } else {
            // Other pages: replace empty root with semantic shell
            html = html.replace(
                /<div id="root">[\s\S]*?<\/div>/,
                `<div id="root">\n<div id="seo-prerender-content">${page.bodyHtml}</div>\n</div>`
            );
        }
    }

    return html;
}

async function runPrerender() {
    console.log('🍣 Starting Static SEO Pre-rendering...');

    const templatePath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(templatePath)) {
        console.error('❌ dist/index.html not found. Please run "vite build" first.');
        process.exit(1);
    }

    const templateHtml = fs.readFileSync(templatePath, 'utf-8');
    const menuItems = await fetchMenuData();
    const pages = generateRoutePages(menuItems);

    let count = 0;
    for (const page of pages) {
        const pageHtml = injectMetaAndBody(templateHtml, page);

        if (page.path === '') {
            // Root homepage
            fs.writeFileSync(templatePath, pageHtml, 'utf-8');
            count++;
        } else {
            // Directory for clean URLs / trailing-slash: dist/[path]/index.html
            const pageDir = path.join(DIST_DIR, page.path);
            if (!fs.existsSync(pageDir)) {
                fs.mkdirSync(pageDir, { recursive: true });
            }
            fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf-8');

            // Also dist/[path].html for Vercel cleanUrls
            fs.writeFileSync(path.join(DIST_DIR, `${page.path}.html`), pageHtml, 'utf-8');
            count++;
        }
    }

    console.log(
        `✨ Successfully pre-rendered ${count} key pages with rich SEO meta tags & schemas.`
    );
}

runPrerender().catch(err => {
    console.error('❌ Error during pre-rendering:', err);
    process.exit(1);
});
