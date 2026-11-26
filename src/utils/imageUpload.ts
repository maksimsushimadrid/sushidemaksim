const MAX_RAW_FILE_BYTES = 25 * 1024 * 1024; // 25MB raw phone photo limit
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Stay safely under Vercel 4.5MB serverless body limit
const DEFAULT_MAX_DIMENSION = 1400;

function loadImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo leer la imagen'));
        };
        img.src = url;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
    });
}

/**
 * Validates, auto-orients (via browser EXIF handling), resizes, and compresses
 * a user-selected photo so large phone images (e.g. 6-20MB iPhone/Android photos)
 * upload quickly without hitting size limits or ending up rotated sideways.
 */
export async function prepareAvatarForUpload(
    file: File,
    maxDimension = DEFAULT_MAX_DIMENSION
): Promise<File> {
    if (!file.type.startsWith('image/')) {
        throw new Error('Formato no permitido. Selecciona una imagen.');
    }

    if (file.size > MAX_RAW_FILE_BYTES) {
        throw new Error('La imagen es demasiado grande (máximo 25MB)');
    }

    try {
        let source: CanvasImageSource;
        let width: number;
        let height: number;
        let bitmap: ImageBitmap | null = null;

        if (typeof createImageBitmap === 'function') {
            try {
                bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
                source = bitmap;
                width = bitmap.width;
                height = bitmap.height;
            } catch {
                const img = await loadImageElement(file);
                source = img;
                width = img.naturalWidth || img.width;
                height = img.naturalHeight || img.height;
            }
        } else {
            const img = await loadImageElement(file);
            source = img;
            width = img.naturalWidth || img.width;
            height = img.naturalHeight || img.height;
        }

        const scale = Math.min(1, maxDimension / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bitmap?.close();
            throw new Error('Canvas no disponible');
        }

        ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
        bitmap?.close();

        let blob = await canvasToBlob(canvas, 0.86);
        if (blob && blob.size > MAX_UPLOAD_BYTES) {
            blob = await canvasToBlob(canvas, 0.72);
        }

        if (!blob) {
            throw new Error('No se pudo procesar la imagen');
        }

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
        return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
    } catch (err) {
        // Fallback: if the original file is already small and a supported format, upload as-is
        // (server-side sharp().rotate() will still fix EXIF orientation).
        if (
            file.size <= MAX_UPLOAD_BYTES &&
            ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        ) {
            return file;
        }
        throw err instanceof Error
            ? err
            : new Error('No se pudo procesar la imagen. Prueba con otro archivo.');
    }
}
