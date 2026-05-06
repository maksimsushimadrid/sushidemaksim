import { useState, useCallback } from 'react';
import {
    useTablonPending,
    useModerateTablonPost,
    useApproveCategory,
} from '../../hooks/queries/useTablon';
import { ConfirmModal } from '../common/ConfirmModal';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { AdminLanguage } from '../../constants/admin';

interface AdminTablonProps {
    language: AdminLanguage;
}

const t: Record<AdminLanguage, any> = {
    ru: {
        title: 'Модерация Tablón',
        pending: 'Ожидают модерации',
        empty: 'Нет публикаций на модерации 🎉',
        approve: 'Одобрить',
        reject: 'Отклонить',
        categories: 'Категории',
        suggestedCategories: 'Предложенные категории',
        noSuggested: 'Нет предложенных категорий',
        approveCategory: 'Одобрить',
        by: 'от',
        tags: 'Теги',
        whatsapp: 'WhatsApp',
    },
    es: {
        title: 'Moderación Tablón',
        pending: 'Pendientes de moderación',
        empty: 'No hay publicaciones pendientes 🎉',
        approve: 'Aprobar',
        reject: 'Rechazar',
        categories: 'Categorías',
        suggestedCategories: 'Categorías sugeridas',
        noSuggested: 'No hay categorías sugeridas',
        approveCategory: 'Aprobar',
        by: 'de',
        tags: 'Etiquetas',
        whatsapp: 'WhatsApp',
    },
};

export default function AdminTablon({ language }: AdminTablonProps) {
    const labels = t[language];
    const [tab, setTab] = useState<'posts' | 'categories'>('posts');
    const [isSyncing, setIsSyncing] = useState(false);
    const [postToReject, setPostToReject] = useState<string | null>(null);
    const { success, error } = useToast();

    const {
        data: pendingData,
        isLoading: pendingLoading,
        refetch: refetchTablon,
    } = useTablonPending();
    const moderatePost = useModerateTablonPost();
    const approveCategory = useApproveCategory();

    // Fetch unapproved categories
    const { data: suggestedData } = useQuery({
        queryKey: ['tablon', 'suggested-categories'],
        queryFn: () => api.get('/admin/tablon-categories?approved=false'),
        staleTime: 30 * 1000,
    });

    const handleSyncThreads = async () => {
        setIsSyncing(true);
        try {
            const res = await api.post('/admin/threads/sync', {});
            success(
                `Threads sync completado: ${res.stats.insertedCount} nuevos, ${res.stats.skippedCount} omitidos.`
            );
            refetchTablon();
        } catch (err: any) {
            console.error('Threads sync failed:', err);
            error('Error al sincronizar Threads. Revisa los credenciales en el backend.');
        } finally {
            setIsSyncing(false);
        }
    };

    const confirmRejectPost = useCallback(async () => {
        if (!postToReject) return;
        const id = postToReject;
        setPostToReject(null);
        try {
            await moderatePost.mutateAsync({
                id: id,
                approved: false,
            });
        } catch (err) {
            console.error('Error rejecting post:', err);
        }
    }, [postToReject, moderatePost]);

    const pendingPosts = pendingData?.posts || [];
    const suggestedCategories = suggestedData?.categories || [];

    return (
        <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex gap-2">
                <button
                    onClick={() => setTab('posts')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        tab === 'posts'
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {labels.pending}
                    {pendingPosts.length > 0 && (
                        <span className="ml-2 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {pendingPosts.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab('categories')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        tab === 'categories'
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {labels.suggestedCategories}
                    {suggestedCategories.length > 0 && (
                        <span className="ml-2 bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {suggestedCategories.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Sync Action */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleSyncThreads}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-[#000000] text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                    🧵 {isSyncing ? 'Sincronizando...' : 'Sincronizar Threads'}
                </button>
            </div>

            {/* Posts Moderation */}
            {tab === 'posts' && (
                <div className="space-y-4">
                    {pendingLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-40"
                                />
                            ))}
                        </div>
                    ) : pendingPosts.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-lg font-medium">
                            {labels.empty}
                        </div>
                    ) : (
                        pendingPosts.map(post => (
                            <div
                                key={post.id}
                                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                                data-testid={`pending-post-${post.id}`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                            {post.author.avatar ? (
                                                <img
                                                    src={post.author.avatar}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    width={32}
                                                    height={32}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-sm">
                                                    👤
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {post.author.name || 'Usuario'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(post.createdAt).toLocaleString('es-ES')}
                                            </p>
                                        </div>
                                    </div>
                                    {post.category && (
                                        <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">
                                            {post.category.emoji} {post.category.name}
                                        </span>
                                    )}
                                </div>

                                {/* Message */}
                                <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                                    {post.message}
                                </p>

                                {/* Images */}
                                {post.images.length > 0 && (
                                    <div className="flex gap-2 mb-4">
                                        {post.images.map((img, idx) => (
                                            <a
                                                key={idx}
                                                href={img}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200"
                                            >
                                                <img
                                                    src={img}
                                                    alt={`Foto ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    width={80}
                                                    height={80}
                                                />
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Tags + WhatsApp */}
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                    {post.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                    {post.whatsappPhone && (
                                        <span className="text-[10px] text-green-600 font-medium">
                                            📱 {post.whatsappPhone}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() =>
                                            moderatePost.mutateAsync({
                                                id: post.id,
                                                approved: true,
                                            })
                                        }
                                        disabled={moderatePost.isPending}
                                        className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-50 transition-all active:scale-95"
                                        data-testid={`approve-${post.id}`}
                                    >
                                        ✅ {labels.approve}
                                    </button>
                                    <button
                                        onClick={() => setPostToReject(post.id)}
                                        disabled={moderatePost.isPending}
                                        className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-all active:scale-95 border border-red-100"
                                        data-testid={`reject-${post.id}`}
                                    >
                                        ❌ {labels.reject}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Categories Moderation */}
            {tab === 'categories' && (
                <div className="space-y-4">
                    {suggestedCategories.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-lg font-medium">
                            {labels.noSuggested}
                        </div>
                    ) : (
                        suggestedCategories.map((cat: any) => (
                            <div
                                key={cat.id}
                                className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{cat.emoji || '📌'}</span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {cat.name}
                                        </p>
                                        {cat.created_by_name && (
                                            <p className="text-xs text-gray-400">
                                                {labels.by} {cat.created_by_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => approveCategory.mutateAsync(cat.id)}
                                    disabled={approveCategory.isPending}
                                    className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-50 transition-all"
                                >
                                    ✅ {labels.approveCategory}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Confirm Reject Modal */}
            <ConfirmModal
                isOpen={!!postToReject}
                title="¿Rechazar publicación?"
                message="El anuncio se moverá al archivo de rechazados. Podrás volver a revisarlo más tarde si es necesario."
                confirmText="Sí, rechazar"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={confirmRejectPost}
                onCancel={() => setPostToReject(null)}
            />
        </div>
    );
}
