export function getOptimizedImageUrl(
    url: string | null | undefined,
    width?: number,
    quality?: number,
    seoName?: string
): string {
    // We don't use seoName in the URL to avoid Vercel 1000 source images limit.
    void seoName;

    if (!url) return '';
    const baseUrl = String(url);

    // If it's a relative local path or already a vercel image path, return as is
    if (
        (baseUrl.startsWith('/') && !baseUrl.includes('supabase.co')) ||
        baseUrl.includes('/_vercel/image')
    ) {
        return baseUrl;
    }

    // In development environment, we return as-is
    if (import.meta.env.DEV) {
        return baseUrl.startsWith('http') || baseUrl.startsWith('/') ? baseUrl : '/' + baseUrl;
    }

    // Clean the URL from query params to ensure Vercel caches it properly and doesn't count it as a new source image
    const cleanUrl = baseUrl.split('?')[0];

    // Map width to one of the configured sizes: [256, 640, 1080, 1920]
    // This increases cache hit rate and reduces Vercel Image Optimization transformations.
    const requestedWidth = width || 640;
    let w = 640;
    if (requestedWidth <= 256) {
        w = 256;
    } else if (requestedWidth <= 640) {
        w = 640;
    } else if (requestedWidth <= 1080) {
        w = 1080;
    } else {
        w = 1920;
    }

    const q = quality || 80;
    return `/_vercel/image?url=${encodeURIComponent(cleanUrl)}&w=${w}&q=${q}`;
}
