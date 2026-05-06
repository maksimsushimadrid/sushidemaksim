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
};

// ─── Queries ──────────────────────────────────────────────────────────────────

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
            api.post(`/tablon/${postId}/react`, { reactionType }),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tablon', 'post', variables.postId] });
            queryClient.invalidateQueries({ queryKey: TABLON_KEYS.all });
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
