import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';

const appVersion = Date.now().toString();

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [
        react(),
        {
            name: 'generate-version-json',
            writeBundle() {
                fs.writeFileSync('dist/version.json', JSON.stringify({ version: appVersion }));
                console.log(`[VersionGen] Version ${appVersion} written to dist/version.json`);
            },
        },
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.ico',
                'logo.svg',
                'logo-icon.svg',
                'pwa-192.png',
                'pwa-512.png',
                'maskable-icon.png',
            ],
            manifest: {
                name: 'Sushi de Maksim',
                short_name: 'SushiMaksim',
                description: 'El mejor sushi artesanal a domicilio',
                theme_color: '#FDFBF7',
                background_color: '#FDFBF7',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                icons: [
                    {
                        src: 'pwa-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'maskable-icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                importScripts: ['/push-sw.js'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
                globPatterns: ['**/*.{js,css,html,ico,svg,webp}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // <--- 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // <--- 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': [
                        'react',
                        'react-dom',
                        'react-router-dom',
                        'react-helmet-async',
                    ],
                    'vendor-supabase': ['@supabase/supabase-js'],
                    'vendor-framer': ['framer-motion'],
                    'vendor-icons': ['lucide-react'],
                    'vendor-map': ['leaflet', 'react-leaflet', '@turf/turf'],
                    'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
                    'vendor-query': ['@tanstack/react-query'],
                    'vendor-charts': ['recharts'],
                },
            },
        },
        chunkSizeWarningLimit: 800,
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:3001',
                changeOrigin: true,
            },
            '/sitemap.xml': {
                target: 'http://127.0.0.1:3001',
                changeOrigin: true,
            },
            '/robots.txt': {
                target: 'http://127.0.0.1:3001',
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: '0.0.0.0',
        port: 5173,
    },
    // @ts-expect-error: Vitest types sometimes conflict with Vite types depending on exact versions
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
});
