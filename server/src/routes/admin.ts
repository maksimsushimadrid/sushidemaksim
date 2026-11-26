import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase } from '../db/supabase.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateResource } from '../middleware/validateResource.js';
import {
    createMenuItemSchema,
    updateMenuItemSchema,
    menuIdParamSchema,
} from '../schemas/menu.schema.js';
import { updateSettingsSchema } from '../schemas/settings.schema.js';
import { formatAdminMenuItem } from '../utils/helpers.js';
import { processImage } from '../utils/imageProcessor.js';
import { invalidateMenuCache } from './menu.js';
import adminOrdersRouter from './admin/orders.js';
import adminUsersRouter from './admin/users.js';
import adminStatsRouter from './admin/stats.js';
import adminPromosRouter from './admin/promos.js';
import adminOperationsRouter from './admin/operations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage for Multer (Vercel has read-only filesystem)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|jpg|png|webp|gif|avif)$/i.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de imagen no válido'));
        }
    },
});

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/tablon-categories — List unapproved categories for moderation
router.get(
    '/tablon-categories',
    asyncHandler(async (req: Request, res: Response) => {
        const approved = req.query.approved === 'true';
        const { data: categories, error } = await supabase
            .from('tablon_categories')
            .select('id, name, emoji, created_by, is_approved, created_at')
            .eq('is_approved', approved)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ categories: categories || [] });
    })
);

// GET /api/admin/newsletter/subscribers
router.get(
    '/newsletter/subscribers',
    asyncHandler(async (req: Request, res: Response) => {
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ subscribers: data || [] });
    })
);

// POST /api/admin/menu/upload-image (to Supabase Storage)
router.post(
    '/menu/upload-image',
    upload.single('image'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        try {
            const file = req.file;
            // Standardize image: Convert to WebP and Resize
            const optimizedBuffer = await processImage(file.buffer, { type: 'menu' });

            const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
            const filePath = `menu/${fileName}`;

            // Upload to Supabase Storage 'images' bucket
            const { error } = await supabase.storage
                .from('images')
                .upload(filePath, optimizedBuffer, {
                    contentType: 'image/webp',
                    upsert: true,
                });

            if (error) {
                console.error('❌ Supabase storage error:', error);
                return res.status(500).json({
                    error: 'Error al subir la imagen a Supabase Storage',
                    details: error.message || JSON.stringify(error),
                });
            }

            // Get Public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from('images').getPublicUrl(filePath);

            res.json({ url: publicUrl });
        } catch (procError: any) {
            console.error('❌ Image processing error:', procError);
            res.status(500).json({
                error: 'Error al procesar la imagen',
                details: procError.message,
            });
        }
    })
);

// POST /api/admin/promos/upload-image (to Supabase Storage)
router.post(
    '/promos/upload-image',
    upload.single('image'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        try {
            const file = req.file;
            // Optimized for Promos (WebP conversion)
            const optimizedBuffer = await processImage(file.buffer, { type: 'promo' });

            const fileName = `promo-${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
            const filePath = `menu/${fileName}`;

            const { error } = await supabase.storage
                .from('images')
                .upload(filePath, optimizedBuffer, {
                    contentType: 'image/webp',
                    upsert: true,
                });

            if (error) {
                console.error('❌ Supabase storage error:', error);
                return res.status(500).json({
                    error: 'Error al subir la imagen a Supabase Storage',
                    details: error.message || JSON.stringify(error),
                });
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from('images').getPublicUrl(filePath);

            res.json({ imageUrl: publicUrl });
        } catch (err: any) {
            console.error('❌ Promo upload error:', err);
            res.status(500).json({ error: 'Error procesando la imagen', details: err.message });
        }
    })
);

// GET /api/admin/settings
router.get(
    '/settings',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data, error } = await supabase.from('site_settings').select('key, value');
        if (error) throw error;

        const settings = (data || []).reduce((acc: any, item) => {
            // Try to parse JSON values (arrays/objects)
            try {
                const val = item.value;
                acc[item.key] =
                    typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))
                        ? JSON.parse(val)
                        : val;
            } catch {
                acc[item.key] = item.value;
            }
            return acc;
        }, {});

        res.json(settings);
    })
);

// PUT /api/admin/settings
router.put(
    '/settings',
    validateResource(updateSettingsSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const settings = req.body;

        const entries = Object.entries(settings).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        }));

        const { error } = await supabase
            .from('site_settings')
            .upsert(entries, { onConflict: 'key' });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: 'Settings updated successfully' });
    })
);

// ─── MENU MANAGEMENT ──────────────────────────────────────────────────────────

// GET /api/admin/menu
router.get(
    '/menu',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data: items, error } = await supabase
            .from('menu_items')
            .select('*')
            .order('category')
            .order('id');

        if (error) throw error;
        const formatted = (items || []).map(formatAdminMenuItem);
        res.json({ items: formatted, total: formatted.length });
    })
);

// POST /api/admin/menu
router.post(
    '/menu',
    validateResource(createMenuItemSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const {
            name,
            description,
            price,
            image,
            category,
            weight,
            pieces,
            spicy,
            vegetarian,
            isPromo,
            isPopular,
            isChefChoice,
            isNew,
            allergens,
            costPrice,
        } = req.body;

        const { data: item, error } = await supabase
            .from('menu_items')
            .insert({
                name: name.trim(),
                description: description?.trim() || '',
                price,
                image: image?.trim() || '',
                category,
                weight: weight?.trim() || null,
                pieces: pieces || null,
                spicy: !!spicy,
                vegetarian: !!vegetarian,
                is_promo: !!isPromo,
                is_popular: !!isPopular,
                is_chef_choice: !!isChefChoice,
                is_new: !!isNew,
                allergens: allergens || [],
                cost_price: costPrice || 0,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase error inserting item:', error);
            throw error;
        }
        res.status(201).json({ item: formatAdminMenuItem(item) });
        invalidateMenuCache();
    })
);

// PUT /api/admin/menu/:id
router.put(
    '/menu/:id',
    validateResource(updateMenuItemSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const {
            name,
            description,
            price,
            image,
            category,
            weight,
            pieces,
            spicy,
            vegetarian,
            isPromo,
            isPopular,
            isChefChoice,
            isNew,
            allergens,
            costPrice,
        } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (price !== undefined) updateData.price = price;
        if (image !== undefined) updateData.image = image.trim();
        if (category !== undefined) updateData.category = category;
        if (weight !== undefined) updateData.weight = weight?.trim() || null;
        if (pieces !== undefined) updateData.pieces = pieces || null;

        // Ensure boolean values for Supabase
        if (spicy !== undefined) updateData.spicy = Boolean(spicy);
        if (vegetarian !== undefined) updateData.vegetarian = Boolean(vegetarian);
        if (isPromo !== undefined) updateData.is_promo = Boolean(isPromo);
        if (isPopular !== undefined) updateData.is_popular = Boolean(isPopular);
        if (isChefChoice !== undefined) updateData.is_chef_choice = Boolean(isChefChoice);
        if (isNew !== undefined) updateData.is_new = Boolean(isNew);
        if (allergens !== undefined) updateData.allergens = allergens;
        if (costPrice !== undefined) updateData.cost_price = Number(costPrice);

        const { data: item, error } = await supabase
            .from('menu_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase error updating item:', error);
            if (error.code === 'PGRST116')
                return res.status(404).json({ error: 'Producto no encontrado' });
            throw error;
        }

        res.json({ item: formatAdminMenuItem(item) });
        invalidateMenuCache();
    })
);

// DELETE /api/admin/menu/:id
router.delete(
    '/menu/:id',
    validateResource(menuIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // 1. Handle dependencies before deletion to avoid FK constraint errors (23503)
        // Order history is preserved because order_items stores name/price/image strings
        await Promise.all([
            // Clear from carts and favorites
            supabase.from('cart_items').delete().eq('menu_item_id', id),
            supabase.from('user_favorites').delete().eq('menu_item_id', id),
            // Nullify reference in orders but keep the data records
            supabase.from('order_items').update({ menu_item_id: null }).eq('menu_item_id', id),
        ]);

        const { error } = await supabase.from('menu_items').delete().eq('id', id);

        if (error) {
            console.error('❌ Error deleting menu item:', error);
            throw error;
        }
        res.json({ success: true, message: `Producto ${id} eliminado` });
        invalidateMenuCache();
    })
);

// ─── MODULARIZED SUB-ROUTERS ──────────────────────────────────────────────────
router.use(adminOrdersRouter);
router.use(adminUsersRouter);
router.use(adminStatsRouter);
router.use(adminPromosRouter);
router.use(adminOperationsRouter);

export default router;
