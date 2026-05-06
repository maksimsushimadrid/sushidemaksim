import { Router, Response } from 'express';
import multer from 'multer';
import { supabase } from '../db/supabase.js';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateResource } from '../middleware/validateResource.js';
import {
    createTablonPostSchema,
    updateTablonPostSchema,
    createTablonCommentSchema,
    getTablonPostsSchema,
    moderateTablonPostSchema,
    suggestCategorySchema,
} from '../schemas/tablon.schema.js';
import { processImage } from '../utils/imageProcessor.js';
import { formatTablonPost, formatTablonComment } from '../utils/helpers.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// ─── PUBLIC (with optional auth) ──────────────────────────────────────────────

// GET /api/tablon — List approved posts with pagination & filters
router.get(
    '/',
    optionalAuthMiddleware,
    validateResource(getTablonPostsSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { page, limit, category, tag, sort, search } = req.query as any;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const isAuthenticated = !!req.userId;

        let query = supabase
            .from('tablon_posts')
            .select(
                `id, user_id, category_id, tags, message, whatsapp_phone, images, is_approved, created_at, updated_at,
                 users!tablon_posts_user_id_fkey(id, name, avatar),
                 tablon_categories!tablon_posts_category_id_fkey(id, name, emoji)`,
                { count: 'exact' }
            )
            .eq('moderation_status', 'approved');

        if (category) {
            query = query.eq('category_id', category);
        }

        if (tag) {
            query = query.contains('tags', [tag]);
        }
        if (search) {
            query = query.ilike('message', `%${search}%`);
        }

        let postsResult;
        if (sort === 'popular') {
            // Sorting by popularity requires a slightly different approach or a view
            // For now, we fetch them and we'll use reaction counts if we can
            // But Supabase doesn't easily allow ordering by a subquery count in one go
            // So we'll fallback to newest but we can improve this with a view later
            // Actually, we can fetch them and then we calculate counts
            postsResult = await query.order('created_at', { ascending: false }).range(from, to);
        } else {
            const ascending = sort === 'oldest';
            postsResult = await query.order('created_at', { ascending }).range(from, to);
        }

        const { data: posts, error: _error, count } = postsResult;

        // Count comments and reactions for each post
        const postIds = (posts || []).map((p: any) => p.id);
        const commentCounts: Record<string, number> = {};
        const postReactions: Record<string, any[]> = {};

        if (postIds.length > 0) {
            // Fetch comments count
            const { data: countData } = await supabase
                .from('tablon_comments')
                .select('post_id')
                .in('post_id', postIds);

            if (countData) {
                countData.forEach((c: any) => {
                    commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
                });
            }

            // Fetch reactions
            const { data: reactionsData } = await supabase
                .from('tablon_post_reactions')
                .select('post_id, user_id, reaction_type')
                .in('post_id', postIds);

            if (reactionsData) {
                reactionsData.forEach((r: any) => {
                    if (!postReactions[r.post_id]) postReactions[r.post_id] = [];
                    postReactions[r.post_id].push(r);
                });
            }
        }

        const totalPages = Math.ceil((count || 0) / limit);
        const formattedPosts = (posts || []).map((p: any) =>
            formatTablonPost(
                p,
                isAuthenticated,
                commentCounts[p.id] || 0,
                postReactions[p.id] || [],
                req.userId || null
            )
        );

        res.json({
            posts: formattedPosts,
            pagination: {
                totalPosts: count || 0,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    })
);

// GET /api/tablon/categories — List approved categories
router.get(
    '/categories',
    asyncHandler(async (_req: AuthRequest, res: Response) => {
        const { data: categories, error } = await supabase
            .from('tablon_categories')
            .select('id, name, emoji')
            .eq('is_approved', true)
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
            return res.status(500).json({ error: 'Error al obtener las categorías' });
        }

        res.json({ categories: categories || [] });
    })
);

// GET /api/tablon/:id — Single post with comments
router.get(
    '/:id',
    optionalAuthMiddleware,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const isAuthenticated = !!req.userId;

        const { data: post, error } = await supabase
            .from('tablon_posts')
            .select(
                `id, user_id, category_id, tags, message, whatsapp_phone, images, is_approved, created_at, updated_at,
                 users!tablon_posts_user_id_fkey(id, name, avatar),
                 tablon_categories!tablon_posts_category_id_fkey(id, name, emoji)`
            )
            .eq('id', id)
            .eq('moderation_status', 'approved')
            .single();

        if (error || !post) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }

        // Fetch comments with user info
        const { data: comments } = await supabase
            .from('tablon_comments')
            .select(
                `id, post_id, user_id, parent_id, message, created_at,
                 users!tablon_comments_user_id_fkey(id, name, avatar)`
            )
            .eq('post_id', id)
            .order('created_at', { ascending: true });

        // Fetch reactions
        const { data: reactionsData } = await supabase
            .from('tablon_post_reactions')
            .select('post_id, user_id, reaction_type')
            .eq('post_id', id);

        const formattedComments = (comments || []).map((c: any) =>
            formatTablonComment(c, isAuthenticated)
        );

        res.json({
            post: formatTablonPost(
                post,
                isAuthenticated,
                formattedComments.length,
                reactionsData || [],
                req.userId || null
            ),
            comments: formattedComments,
        });
    })
);

// ─── AUTHENTICATED ────────────────────────────────────────────────────────────

// POST /api/tablon — Create a new post (requires moderation)
router.post(
    '/',
    authMiddleware,
    validateResource(createTablonPostSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { categoryId, tags, message, whatsappPhone, images } = req.body;

        // Rate limit: max 3 posts per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentCount } = await supabase
            .from('tablon_posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', req.userId)
            .gte('created_at', oneHourAgo);

        if ((recentCount || 0) >= 3) {
            return res.status(429).json({
                error: 'Has alcanzado el límite de 3 anuncios por hora. Por favor, espera un momento.',
            });
        }

        // Validate category exists and is approved
        const { data: category } = await supabase
            .from('tablon_categories')
            .select('id')
            .eq('id', categoryId)
            .eq('is_approved', true)
            .single();

        if (!category) {
            return res.status(400).json({ error: 'Categoría no válida' });
        }

        // Clean tags: lowercase, trim, unique
        const cleanTags = [
            ...new Set(
                tags.map((t: string) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean)
            ),
        ].slice(0, 3);

        const { data: post, error } = await supabase
            .from('tablon_posts')
            .insert({
                user_id: req.userId,
                category_id: categoryId,
                tags: cleanTags,
                message: message.trim(),
                whatsapp_phone: whatsappPhone.trim(),
                images: images || [],
                is_approved: false, // Legacy field
                moderation_status: 'pending', // Requires moderation
            })
            .select(
                `id, user_id, category_id, tags, message, whatsapp_phone, images, is_approved, created_at, updated_at,
                 users!tablon_posts_user_id_fkey(id, name, avatar),
                 tablon_categories!tablon_posts_category_id_fkey(id, name, emoji)`
            )
            .single();

        if (error) {
            console.error('Error creating tablon post:', error);
            return res.status(500).json({ error: 'Error al crear la publicación' });
        }

        res.status(201).json({
            post: formatTablonPost(post, true, 0, [], req.userId || null),
            message: 'Tu publicación ha sido enviada y será revisada por un moderador.',
        });
    })
);

// PUT /api/tablon/:id — Edit post (20-min window for author, anytime for moderator)
router.put(
    '/:id',
    authMiddleware,
    validateResource(updateTablonPostSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;

        // Fetch the existing post
        const { data: existing, error: fetchErr } = await supabase
            .from('tablon_posts')
            .select('id, user_id, created_at')
            .eq('id', id)
            .single();

        if (fetchErr || !existing) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }

        // Check permissions
        const isOwner = existing.user_id === req.userId;

        // Check if user is moderator or admin
        const { data: currentUser } = await supabase
            .from('users')
            .select('role, is_superadmin')
            .eq('id', req.userId)
            .single();

        const isModerator =
            currentUser?.role === 'moderator' ||
            currentUser?.role === 'admin' ||
            !!currentUser?.is_superadmin;

        if (!isOwner && !isModerator) {
            return res
                .status(403)
                .json({ error: 'No tienes permiso para editar esta publicación' });
        }

        // No time window restriction anymore - owners can edit anytime

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        const { tags, message, whatsappPhone, images, categoryId } = req.body;

        if (tags !== undefined) {
            updateData.tags = [
                ...new Set(
                    tags
                        .map((t: string) => t.trim().toLowerCase().replace(/^#/, ''))
                        .filter(Boolean)
                ),
            ].slice(0, 3);
        }
        if (message !== undefined) updateData.message = message.trim();
        if (whatsappPhone !== undefined) updateData.whatsapp_phone = whatsappPhone.trim();
        if (images !== undefined) updateData.images = images;
        if (categoryId !== undefined) updateData.category_id = categoryId;

        const { data: updated, error: updateErr } = await supabase
            .from('tablon_posts')
            .update(updateData)
            .eq('id', id)
            .select(
                `id, user_id, category_id, tags, message, whatsapp_phone, images, is_approved, created_at, updated_at,
                 users!tablon_posts_user_id_fkey(id, name, avatar),
                 tablon_categories!tablon_posts_category_id_fkey(id, name, emoji)`
            )
            .single();

        if (updateErr) {
            console.error('Error updating tablon post:', updateErr);
            return res.status(500).json({ error: 'Error al actualizar la publicación' });
        }

        res.json({ post: formatTablonPost(updated, true, 0, [], req.userId || null) });
    })
);

// DELETE /api/tablon/:id — Delete post (owner or moderator)
router.delete(
    '/:id',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;

        const { data: post } = await supabase
            .from('tablon_posts')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!post) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }

        const isOwner = post.user_id === req.userId;

        const { data: currentUser } = await supabase
            .from('users')
            .select('role, is_superadmin')
            .eq('id', req.userId)
            .single();

        const isModerator =
            currentUser?.role === 'moderator' ||
            currentUser?.role === 'admin' ||
            !!currentUser?.is_superadmin;

        if (!isOwner && !isModerator) {
            return res
                .status(403)
                .json({ error: 'No tienes permiso para eliminar esta publicación' });
        }

        const { error } = await supabase.from('tablon_posts').delete().eq('id', id);
        if (error) {
            return res.status(500).json({ error: 'Error al eliminar la publicación' });
        }

        res.json({ success: true, message: 'Publicación eliminada' });
    })
);

// POST /api/tablon/:id/comments — Add a comment
router.post(
    '/:id/comments',
    authMiddleware,
    validateResource(createTablonCommentSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { message, parentId } = req.body;

        // Verify post exists and is approved
        const { data: post } = await supabase
            .from('tablon_posts')
            .select('id')
            .eq('id', id)
            .eq('moderation_status', 'approved')
            .single();

        if (!post) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }

        // If parentId provided, verify parent comment exists
        if (parentId) {
            const { data: parent } = await supabase
                .from('tablon_comments')
                .select('id')
                .eq('id', parentId)
                .eq('post_id', id)
                .single();

            if (!parent) {
                return res.status(400).json({ error: 'Comentario padre no encontrado' });
            }
        }

        const { data: comment, error } = await supabase
            .from('tablon_comments')
            .insert({
                post_id: id,
                user_id: req.userId,
                parent_id: parentId || null,
                message: message.trim(),
            })
            .select(
                `id, post_id, user_id, parent_id, message, created_at,
                 users!tablon_comments_user_id_fkey(id, name, avatar)`
            )
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return res.status(500).json({ error: 'Error al publicar el comentario' });
        }

        res.status(201).json({ comment: formatTablonComment(comment, true) });
    })
);

// DELETE /api/tablon/comments/:commentId — Delete a comment (owner or moderator)
router.delete(
    '/comments/:commentId',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { commentId } = req.params;

        const { data: comment } = await supabase
            .from('tablon_comments')
            .select('user_id')
            .eq('id', commentId)
            .single();

        if (!comment) {
            return res.status(404).json({ error: 'Comentario no encontrado' });
        }

        const isOwner = comment.user_id === req.userId;

        const { data: currentUser } = await supabase
            .from('users')
            .select('role, is_superadmin')
            .eq('id', req.userId)
            .single();

        const isModerator =
            currentUser?.role === 'moderator' ||
            currentUser?.role === 'admin' ||
            !!currentUser?.is_superadmin;

        if (!isOwner && !isModerator) {
            return res
                .status(403)
                .json({ error: 'No tienes permiso para eliminar este comentario' });
        }

        const { error } = await supabase.from('tablon_comments').delete().eq('id', commentId);
        if (error) {
            return res.status(500).json({ error: 'Error al eliminar el comentario' });
        }

        res.json({ success: true });
    })
);

// POST /api/tablon/upload-image — Upload image (converted to WebP)
router.post(
    '/upload-image',
    authMiddleware,
    upload.single('image'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        try {
            const optimizedBuffer = await processImage(req.file.buffer, { type: 'tablon' });

            const fileName = `${Date.now()}-${req.userId}-${Math.floor(Math.random() * 1000)}.webp`;
            const filePath = `tablon/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, optimizedBuffer, {
                    contentType: 'image/webp',
                    upsert: true,
                });

            if (uploadError) {
                console.error('❌ Supabase storage error:', uploadError);
                return res.status(500).json({
                    error: 'Error al subir la imagen',
                    details: uploadError.message,
                });
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from('images').getPublicUrl(filePath);

            res.json({ url: publicUrl });
        } catch (err: any) {
            console.error('❌ Tablon image processing error:', err);
            res.status(500).json({ error: 'Error al procesar la imagen', details: err.message });
        }
    })
);

// POST /api/tablon/categories/suggest — Suggest a new category
router.post(
    '/categories/suggest',
    authMiddleware,
    validateResource(suggestCategorySchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { name, emoji } = req.body;

        // Check if category already exists
        const { data: existing } = await supabase
            .from('tablon_categories')
            .select('id, name')
            .ilike('name', name.trim())
            .maybeSingle();

        if (existing) {
            return res.status(409).json({
                error: 'Esta categoría ya existe',
                category: existing,
            });
        }

        const { data: category, error } = await supabase
            .from('tablon_categories')
            .insert({
                name: name.trim(),
                emoji: emoji || '📌',
                is_approved: false, // Needs admin/moderator approval
                created_by: req.userId,
            })
            .select('id, name, emoji')
            .single();

        if (error) {
            console.error('Error suggesting category:', error);
            return res.status(500).json({ error: 'Error al sugerir la categoría' });
        }

        res.status(201).json({
            category,
            message: 'Tu sugerencia ha sido enviada. Un moderador la revisará pronto.',
        });
    })
);

// POST /api/tablon/:id/react — Toggle a reaction
router.post(
    '/:id/react',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { reactionType } = req.body;

        if (!reactionType) {
            return res.status(400).json({ error: 'Tipo de reacción es obligatorio' });
        }

        // Check if reaction already exists
        const { data: existing } = await supabase
            .from('tablon_post_reactions')
            .select('id')
            .eq('post_id', id)
            .eq('user_id', req.userId)
            .eq('reaction_type', reactionType)
            .maybeSingle();

        if (existing) {
            // Remove reaction (toggle off)
            const { error } = await supabase
                .from('tablon_post_reactions')
                .delete()
                .eq('id', existing.id);

            if (error) {
                return res.status(500).json({ error: 'Error al eliminar la reacción' });
            }
            res.json({ success: true, action: 'removed' });
        } else {
            // Remove any other reaction from this user on this post (optional: only one reaction per user)
            // For now, let's allow multiple reaction types but toggle each individually
            // Actually, usually users only give one reaction. Let's stick to one.
            await supabase
                .from('tablon_post_reactions')
                .delete()
                .eq('post_id', id)
                .eq('user_id', req.userId);

            const { error } = await supabase.from('tablon_post_reactions').insert({
                post_id: id,
                user_id: req.userId,
                reaction_type: reactionType,
            });

            if (error) {
                console.error('Error adding reaction:', error);
                return res.status(500).json({ error: 'Error al añadir la reacción' });
            }
            res.json({ success: true, action: 'added' });
        }
    })
);

// ─── MODERATION (moderator/admin only) ────────────────────────────────────────

// PATCH /api/tablon/:id/moderate — Approve/reject a post
router.patch(
    '/:id/moderate',
    authMiddleware,
    validateResource(moderateTablonPostSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Check moderator permissions
        const { data: currentUser } = await supabase
            .from('users')
            .select('role, is_superadmin')
            .eq('id', req.userId)
            .single();

        const isModerator =
            currentUser?.role === 'moderator' ||
            currentUser?.role === 'admin' ||
            !!currentUser?.is_superadmin;

        if (!isModerator) {
            return res
                .status(403)
                .json({ error: 'Solo los moderadores pueden aprobar publicaciones' });
        }

        const { approved } = req.body;
        const { id } = req.params;

        if (approved) {
            const { data: post, error } = await supabase
                .from('tablon_posts')
                .update({ is_approved: true, moderation_status: 'approved' })
                .eq('id', id)
                .select(
                    `id, user_id, category_id, tags, message, whatsapp_phone, images, is_approved, moderation_status, created_at, updated_at,
                     users!tablon_posts_user_id_fkey(id, name, avatar),
                     tablon_categories!tablon_posts_category_id_fkey(id, name, emoji)`
                )
                .single();

            if (error) {
                return res.status(500).json({ error: 'Error al moderar la publicación' });
            }

            res.json({
                post: formatTablonPost(post, true, 0, [], req.userId || null),
                message: 'Publicación aprobada',
            });
        } else {
            // Reject = update status to rejected
            const { data: post, error } = await supabase
                .from('tablon_posts')
                .update({ is_approved: false, moderation_status: 'rejected' })
                .eq('id', id)
                .select(
                    `id, user_id, category_id, tags, message, whatsapp_phone, images, is_approved, moderation_status, created_at, updated_at,
                     users!tablon_posts_user_id_fkey(id, name, avatar),
                     tablon_categories!tablon_posts_category_id_fkey(id, name, emoji)`
                )
                .single();

            if (error) {
                return res.status(500).json({ error: 'Error al rechazar la publicación' });
            }

            res.json({
                post: formatTablonPost(post, true, 0, [], req.userId || null),
                message: 'Publicación rechazada (archivada)',
            });
        }
    })
);

// GET /api/tablon/moderation/pending — List posts awaiting moderation
router.get(
    '/moderation/pending',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { data: currentUser } = await supabase
            .from('users')
            .select('role, is_superadmin')
            .eq('id', req.userId)
            .single();

        const isModerator =
            currentUser?.role === 'moderator' ||
            currentUser?.role === 'admin' ||
            !!currentUser?.is_superadmin;

        if (!isModerator) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const { data: posts, error } = await supabase
            .from('tablon_posts')
            .select(
                `id, user_id, category_id, tags, message, whatsapp_phone, images, is_approved, created_at, updated_at,
                 users!tablon_posts_user_id_fkey(id, name, avatar),
                 tablon_categories!tablon_posts_category_id_fkey(id, name, emoji)`
            )
            .eq('moderation_status', 'pending')
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'Error al obtener publicaciones pendientes' });
        }

        res.json({
            posts: (posts || []).map((p: any) =>
                formatTablonPost(p, true, 0, [], req.userId || null)
            ),
        });
    })
);

// PATCH /api/tablon/categories/:id/approve — Approve a suggested category
router.patch(
    '/categories/:id/approve',
    authMiddleware,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { data: currentUser } = await supabase
            .from('users')
            .select('role, is_superadmin')
            .eq('id', req.userId)
            .single();

        const isModerator =
            currentUser?.role === 'moderator' ||
            currentUser?.role === 'admin' ||
            !!currentUser?.is_superadmin;

        if (!isModerator) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const { data: category, error } = await supabase
            .from('tablon_categories')
            .update({ is_approved: true })
            .eq('id', req.params.id)
            .select('id, name, emoji')
            .single();

        if (error) {
            return res.status(500).json({ error: 'Error al aprobar la categoría' });
        }

        res.json({ category, message: 'Categoría aprobada' });
    })
);

export default router;
