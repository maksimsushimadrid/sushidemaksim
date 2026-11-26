import { Router, Request, Response } from 'express';
import { supabase } from '../../db/supabase.js';
import { AuthRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validateResource } from '../../middleware/validateResource.js';
import {
    updateUserRoleSchema,
    verifyEmailSchema,
    verifyBirthdaySchema,
    getUsersQuerySchema,
    userIdParamSchema,
} from '../../schemas/user.schema.js';
import { toStr } from '../../utils/queryHelpers.js';
import { formatUser, calculateUserStats } from '../../utils/helpers.js';

const router = Router();

// GET /api/admin/users
router.get(
    '/users',
    validateResource(getUsersQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const sortBy = toStr(req.query.sortBy) || 'lastSeenAt';
        const order = toStr(req.query.order) || 'desc';
        const search = toStr(req.query.search);
        const ascending = order === 'asc';
        const filter = toStr(req.query.filter) || 'active';

        const sortMap: Record<string, string> = {
            id: 'id',
            name: 'name',
            email: 'email',
            createdAt: 'created_at',
            lastSeenAt: 'last_seen_at',
            role: 'role',
        };
        const dbSortBy = sortMap[sortBy] || 'last_seen_at';

        let usersWithStats: any[] = [];
        let totalCount = 0;

        // Base query for sorting & counts
        const getBaseQuery = (options = {}) => {
            let q = supabase
                .from('users')
                .select('*, orders(total, created_at, items:order_items(name, quantity))', options);

            if (filter === 'active') {
                q = q.is('deleted_at', null);
            } else if (filter === 'archived') {
                q = q.not('deleted_at', 'is', null);
            }

            return q;
        };

        if (sortBy === 'orderCount' || sortBy === 'totalSpent') {
            // Complex sort: Fetch all users and their order totals, then sort and paginate in memory
            let query = getBaseQuery();

            if (search) {
                const sanitizedSearch = search.replace(/[,()]/g, ' ').trim();
                const isUUID = sanitizedSearch.includes('-') && sanitizedSearch.length > 20;

                if (isUUID) {
                    query = query.eq('id', sanitizedSearch);
                } else {
                    query = query.or(
                        `email.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%`
                    );
                }
            }

            const { data: allUsers, error: allUsersError } = await query;

            if (allUsersError) throw allUsersError;

            const allUsersWithStats = (allUsers || []).map((u: any) => ({
                ...u,
                orderCount: u.orders?.length || 0,
                totalSpent:
                    Math.round(
                        (u.orders?.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0) ||
                            0) * 100
                    ) / 100,
            }));

            // In-memory sort
            allUsersWithStats.sort((a, b) => {
                const valA = a[sortBy];
                const valB = b[sortBy];
                if (valA === valB) return 0;
                return ascending ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
            });

            totalCount = allUsersWithStats.length;
            usersWithStats = allUsersWithStats.slice(offset, offset + limit).map(u => {
                const stats = calculateUserStats(u.orders || []);
                return formatUser(
                    u,
                    stats.orderCount,
                    u.addresses,
                    stats.totalSpent,
                    stats.avgCheck,
                    stats.frequency,
                    stats.favoriteDish,
                    [],
                    stats.favoriteDishCount
                );
            });
        } else {
            // Direct sort via Supabase
            let query = getBaseQuery({ count: 'exact' });

            if (search) {
                const sanitizedSearch = search.replace(/[,()]/g, ' ').trim();
                const isUUID = sanitizedSearch.includes('-') && sanitizedSearch.length > 20;

                if (isUUID) {
                    query = query.eq('id', sanitizedSearch);
                } else {
                    query = query.or(
                        `email.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%`
                    );
                }
            }

            if (sortBy === 'role') {
                // Roles sort: superadmin -> admin -> user
                query = query
                    .order('is_superadmin', { ascending: ascending })
                    .order('role', { ascending: !ascending });
            } else {
                query = query.order(dbSortBy, { ascending: ascending, nullsFirst: false });
            }

            const { data: users, count, error } = await query.range(offset, offset + limit - 1);
            if (error) throw error;

            totalCount = count || 0;
            usersWithStats = (users || []).map((u: any) => {
                const stats = calculateUserStats(u.orders || []);
                return formatUser(
                    u,
                    stats.orderCount,
                    u.addresses,
                    stats.totalSpent,
                    stats.avgCheck,
                    stats.frequency,
                    stats.favoriteDish,
                    [],
                    stats.favoriteDishCount
                );
            });
        }

        res.json({
            users: usersWithStats,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1,
            },
        });
    })
);

// PATCH /api/admin/users/:id/role
router.patch(
    '/users/:id/role',
    validateResource(updateUserRoleSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);

        const { data: currentUser } = await supabase
            .from('users')
            .select('is_superadmin')
            .eq('id', req.userId)
            .single();

        if (!currentUser || !currentUser.is_superadmin) {
            return res.status(403).json({ error: 'Solo el propietario can change roles' });
        }

        if (id === req.userId) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }

        const { role } = req.body;
        const { data: user, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', req.params.id)
            .select('id, name, email, role, is_superadmin')
            .single();

        if (error) throw error;
        res.json({ user });
    })
);

// PATCH /api/admin/users/:id/verify-email
router.patch(
    '/users/:id/verify-email',
    validateResource(verifyEmailSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { isVerified } = req.body;

        const { error } = await supabase
            .from('users')
            .update({ is_verified: isVerified })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    })
);

// DELETE /api/admin/users/:id — Permanent hard delete (Admin only)
router.delete(
    '/users/:id',
    validateResource(userIdParamSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);

        if (id === req.userId) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        // Check current status
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('deleted_at')
            .eq('id', id)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (user.deleted_at) {
            // Already archived -> Perform HARD DELETE
            console.log(`⚠️  [ADMIN] Hard deleting user #${id} and all related data...`);

            // 1. Get all order IDs to delete order items
            const { data: orders } = await supabase.from('orders').select('id').eq('user_id', id);
            const orderIds = (orders || []).map(o => o.id);

            // 2. Cascade deletion (in order of dependencies)
            const cascadePromises = [
                // Delete order items first
                orderIds.length > 0
                    ? supabase.from('order_items').delete().in('order_id', orderIds)
                    : Promise.resolve(),
                // Delete other direct dependencies
                supabase.from('orders').delete().eq('user_id', id),
                supabase.from('user_addresses').delete().eq('user_id', id),
                supabase.from('promo_codes').delete().eq('user_id', id),
                supabase.from('cart_items').delete().eq('user_id', id),
                supabase.from('user_favorites').delete().eq('user_id', id),
                supabase.from('password_resets').delete().eq('user_id', id),
            ];

            await Promise.all(cascadePromises);

            // 3. Delete the user itself from public schema
            const { error: finalError } = await supabase.from('users').delete().eq('id', id);
            if (finalError) throw finalError;

            // 4. Delete from auth.users (so they can register again)
            const { error: authError } = await supabase.auth.admin.deleteUser(id);
            if (authError) {
                console.warn(
                    `[ADMIN] Could not delete user #${id} from Auth (maybe already gone):`,
                    authError.message
                );
            } else {
                console.log(`✅ [ADMIN] User #${id} fully removed from Auth.`);
            }

            return res.json({
                success: true,
                message: `Usuario #${id} y todos los datos relacionados han sido eliminados permanentemente`,
            });
        }

        // Soft Delete (Archive)
        const { error } = await supabase
            .from('users')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: `Usuario #${id} archivado correctamente` });
    })
);

// PATCH /api/admin/users/:id/restore — Restore archived user
router.patch(
    '/users/:id/restore',
    validateResource(userIdParamSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);
        const { error } = await supabase.from('users').update({ deleted_at: null }).eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: `Usuario #${id} restaurado correctamente` });
    })
);

// PATCH /api/admin/users/:id/verify-birthday
router.patch(
    '/users/:id/verify-birthday',
    validateResource(verifyBirthdaySchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);
        const { verified } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .update({ birth_date_verified: verified })
            .eq('id', id)
            .select('id, name, email, birth_date, birth_date_verified')
            .single();

        if (error) throw error;
        res.json({ user });
    })
);

export default router;
