import sharp from 'sharp';

interface ImageOptions {
    type: 'menu' | 'avatar' | 'blog' | 'promo' | 'tablon';
    quality?: number;
}

/**
 * Optimized image processor to standardize orientation, quality, dimensions, and format (WebP).
 * - Always calls `.rotate()` first so phone photos with EXIF Orientation tags are never sideways.
 * - Menu/Blog items: Max 800px width, aspect ratio preserved.
 * - Avatars: Up to 1000x1000px square crop (crisp for full-screen profile hero).
 * - Tablon (community posts): Max 1200px width, quality 75.
 */
export async function processImage(buffer: Buffer, options: ImageOptions): Promise<Buffer> {
    let pipeline = sharp(buffer).rotate();

    // Convert to WebP with sensible defaults
    pipeline = pipeline.webp({ quality: options.quality || 82 });

    if (options.type === 'avatar') {
        // High-res square crop for full-screen profile hero & crisp avatars
        pipeline = pipeline.resize(1000, 1000, {
            fit: 'cover',
            position: 'center',
            withoutEnlargement: true,
        });
    } else if (options.type === 'tablon') {
        // Tablon community posts: larger images, slightly lower quality
        pipeline = pipeline.webp({ quality: options.quality || 75 }).resize(1200, null, {
            withoutEnlargement: true,
            fit: 'inside',
        });
    } else {
        // Standard resizing for menu and blog images
        // Ensures images aren't excessively large while maintaining aspect ratio
        pipeline = pipeline.resize(800, null, {
            withoutEnlargement: true,
            fit: 'inside',
        });
    }

    return await pipeline.toBuffer();
}
