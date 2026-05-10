/**
 * Compresses an image file on the client side using Canvas API.
 * This helps avoid server-side payload limits (e.g., Vercel's 4.5MB limit)
 * and speeds up the upload process.
 */
export async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    // If it's not an image, return as is
    if (!file.type.startsWith('image/')) return file;

    // Don't compress small files
    if (file.size < 200 * 1024) return file;

    return new Promise((resolve, _reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    blob => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        // Create a new file from the blob
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}
