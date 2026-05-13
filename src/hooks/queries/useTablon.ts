import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useAuth } from '../useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TablonCategory {
    id: number;
    name: string;
    emoji: string;
}

export interface TablonAuthor {
    id: string | null;
    name: string | null;
    avatar: string | null;
}

export interface TablonPost {
    id: string;
    userId: string;
    category: TablonCategory | null;
    tags: string[];
    message: string;
    whatsappPhone: string | null;
    images: string[];
    isApproved: boolean;
    moderationStatus: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    commentCount: number;
    author: TablonAuthor;
    reactions: Record<string, number>; // e.g. { "❤️": 5, "👍": 2 }
    userReaction: string | null; // e.g. "❤️" or null
}

export interface TablonComment {
    id: string;
    postId: string;
    userId: string;
    parentId: string | null;
    message: string;
    createdAt: string;
    author: TablonAuthor;
    reactions: Record<string, number>;
    userReaction: string | null;
}

export interface TablonPostsResponse {
    posts: TablonPost[];
    pagination: {
        totalPosts: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

export interface TablonPostDetailResponse {
    post: TablonPost;
    comments: TablonComment[];
}

export interface TablonFilters {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    search?: string;
    sort?: 'newest' | 'oldest' | 'popular';
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

const TABLON_KEYS = {
    all: ['tablon'] as const,
    posts: (filters: TablonFilters, auth: boolean) => ['tablon', 'posts', filters, auth] as const,
    post: (id: string, auth: boolean) => ['tablon', 'post', id, auth] as const,
    categories: ['tablon', 'categories'] as const,
    pending: ['tablon', 'pending'] as const,
    approved: ['tablon', 'approved'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch approved posts (moderators only) */
export const useTablonApproved = () => {
    return useQuery<{ posts: TablonPost[] }>({
        queryKey: TABLON_KEYS.approved,
        queryFn: () => api.get('/tablon/moderation/approved'),
        staleTime: 30 * 1000,
    });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Sync posts from Threads (admin only) */
export const useSyncThreads = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/admin/threads/sync', {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['threads-status'] });
        },
    });
};

/** Get Threads connection status (admin only) */
export const useThreadsStatus = () => {
    return useQuery({
        queryKey: ['threads-status'],
        queryFn: () => api.get('/admin/threads/status'),
        staleTime: 5 * 60 * 1000,
    });
};

/** Disconnect Threads (admin only) */
export const useDisconnectThreads = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/admin/threads/disconnect', {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['threads-status'] });
        },
    });
};

/** Fetch paginated & filtered posts */
export const useTablonPosts = (filters: TablonFilters = {}) => {
    const { isAuthenticated } = useAuth();
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.category) params.set('category', filters.category);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.sort) params.set('sort', filters.sort);

    const qs = params.toString();

    return useQuery<TablonPostsResponse>({
        queryKey: TABLON_KEYS.posts(filters, isAuthenticated),
        queryFn: () => api.get(`/tablon${qs ? `?${qs}` : ''}`),
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
};

/** Fetch a single post with comments */
export const useTablonPost = (id: string) => {
    const { isAuthenticated } = useAuth();
    return useQuery<TablonPostDetailResponse>({
        queryKey: TABLON_KEYS.post(id, isAuthenticated),
        queryFn: () => api.get(`/tablon/${id}`),
        enabled: !!id,
    });
};

/** Fetch approved categories */
export const useTablonCategories = () => {
    return useQuery<{ categories: TablonCategory[] }>({
        queryKey: TABLON_KEYS.categories,
        queryFn: () => api.get('/tablon/categories'),
        staleTime: 10 * 60 * 1000,
    });
};

/** Fetch pending posts (moderators only) */
export const useTablonPending = () => {
    return useQuery<{ posts: TablonPost[] }>({
        queryKey: TABLON_KEYS.pending,
        queryFn: () => api.get('/tablon/moderation/pending'),
        staleTime: 30 * 1000,
    });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Create a new post */
export const useCreateTablonPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            categoryId: number;
            tags: string[];
            message: string;
            whatsappPhone: string;
            images: string[];
        }) => api.post('/tablon', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
        },
    });
};

/** Edit a post */
export const useEditTablonPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...data
        }: {
            id: string;
            tags?: string[];
            message?: string;
            whatsappPhone?: string;
            images?: string[];
            categoryId?: number;
        }) => api.put(`/tablon/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
        },
    });
};

/** Delete a post */
export const useDeleteTablonPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/tablon/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
        },
    });
};

/** Add a comment */
export const useCreateTablonComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            postId,
            message,
            parentId,
        }: {
            postId: string;
            message: string;
            parentId?: string | null;
        }) => api.post(`/tablon/${postId}/comments`, { message, parentId }),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tablon', 'post', variables.postId] });
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
        },
    });
};

/** Toggle a reaction (like) on a post */
export const useToggleReaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ postId, reactionType }: { postId: string; reactionType: string }) =>
            api.post(`/tablon/${postId}/react`, { reactionType: reactionType.toLowerCase() }),
        onMutate: async variables => {
            // We don't know the exact filters, so we invalidate all posts queries
            // but for a smooth animation we can try to update all active posts queries
            const queryCache = queryClient.getQueryCache();
            const queries = queryCache.findAll({ queryKey: ['tablon', 'posts'] });

            const previousQueriesData = queries.map(query => ({
                queryKey: query.queryKey,
                data: query.state.data,
            }));

            // Optimistically update all matching queries
            queries.forEach(query => {
                const queryKey = query.queryKey;
                queryClient.setQueryData(queryKey, (old: any) => {
                    if (!old || !old.posts) return old;

                    const updatedPosts = old.posts.map((p: any) => {
                        if (String(p.id) === String(variables.postId)) {
                            const newReactions = { ...(p.reactions || {}) };
                            const oldReaction = p.userReaction;
                            const newReaction = variables.reactionType.toLowerCase();

                            // Remove old
                            if (oldReaction && newReactions[oldReaction]) {
                                newReactions[oldReaction] = Math.max(
                                    0,
                                    newReactions[oldReaction] - 1
                                );
                            }

                            // Add new
                            let finalUserReaction: string | null = newReaction;
                            if (oldReaction === newReaction) {
                                finalUserReaction = null;
                            } else {
                                newReactions[newReaction] = (newReactions[newReaction] || 0) + 1;
                            }

                            return {
                                ...p,
                                reactions: newReactions,
                                userReaction: finalUserReaction,
                            };
                        }
                        return p;
                    });

                    // Sort if needed (if sort is 'popular')
                    // The filters are in the queryKey[2]
                    const filters = queryKey[2] as any;
                    if (filters?.sort === 'popular') {
                        updatedPosts.sort((a: any, b: any) => {
                            const getScore = (post: any) => {
                                const likes = post.reactions?.['like'] || 0;
                                const dislikes = post.reactions?.['dislike'] || 0;
                                return likes - dislikes;
                            };
                            return getScore(b) - getScore(a);
                        });
                    }

                    return { ...old, posts: updatedPosts };
                });
            });

            return { previousQueriesData };
        },
        onError: (_err, _variables, context) => {
            context?.previousQueriesData?.forEach(item => {
                queryClient.setQueryData(item.queryKey, item.data);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tablon', 'posts'] });
            queryClient.invalidateQueries({ queryKey: ['tablon', 'post'] });
        },
    });
};

/** Toggle a reaction (like) on a comment */
export const useToggleCommentReaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            postId: _postId,
            commentId,
            reactionType,
        }: {
            postId: string;
            commentId: string;
            reactionType: string;
        }) =>
            api
                .post(`/tablon/comments/${commentId}/react`, {
                    reactionType: reactionType.toLowerCase(),
                })
                .then(res => res.data),
        onMutate: async variables => {
            const queryKey = ['tablon', 'post', String(variables.postId)];
            await queryClient.cancelQueries({ queryKey });

            const previousData = queryClient.getQueryData<any>(queryKey);

            if (previousData) {
                const updatedComments = previousData.comments.map((c: any) => {
                    if (String(c.id) === String(variables.commentId)) {
                        const newReactions = { ...(c.reactions || {}) };
                        const oldReaction = c.userReaction;
                        const newReaction = variables.reactionType.toLowerCase();

                        // Remove old reaction
                        if (oldReaction && newReactions[oldReaction]) {
                            newReactions[oldReaction] = Math.max(0, newReactions[oldReaction] - 1);
                        }

                        // Add new reaction (unless it's a toggle off)
                        let finalUserReaction: string | null = newReaction;
                        if (oldReaction === newReaction) {
                            finalUserReaction = null;
                        } else {
                            newReactions[newReaction] = (newReactions[newReaction] || 0) + 1;
                        }

                        return {
                            ...c,
                            reactions: newReactions,
                            userReaction: finalUserReaction,
                        };
                    }
                    return c;
                });

                // Sort comments by (likes - dislikes)
                updatedComments.sort((a: any, b: any) => {
                    const getScore = (comment: any) => {
                        const likes = comment.reactions?.['like'] || 0;
                        const dislikes = comment.reactions?.['dislike'] || 0;
                        return likes - dislikes;
                    };
                    return getScore(b) - getScore(a);
                });

                queryClient.setQueryData(queryKey, {
                    ...previousData,
                    comments: updatedComments,
                });
            }

            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['tablon', 'post', String(variables.postId)],
                    context.previousData
                );
            }
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['tablon', 'post', String(variables.postId)],
            });
        },
    });
};

/** Delete a comment */
export const useDeleteTablonComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (commentId: string) => api.delete(`/tablon/comments/${commentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
        },
    });
};

/** Upload an image (returns URL) */
export const useUploadTablonImage = () => {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);
            return api.formData('/tablon/upload-image', formData);
        },
    });
};

/** Suggest a new category */
export const useSuggestCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; emoji?: string }) =>
            api.post('/tablon/categories/suggest', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
        },
    });
};

/** Moderate a post (approve/reject) */
export const useModerateTablonPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
            api.patch(`/tablon/${id}/moderate`, { approved }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
        },
    });
};

/** Approve a suggested category */
export const useApproveCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => api.patch(`/tablon/categories/${id}/approve`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
        },
    });
};
