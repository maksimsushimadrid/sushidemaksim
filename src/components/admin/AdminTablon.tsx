import { useState, useCallback } from 'react';
import {
    useTablonPending,
    useTablonApproved,
    useModerateTablonPost,
    useApproveCategory,
    useSyncThreads,
    useThreadsStatus,
    useDisconnectThreads,
} from '../../hooks/queries/useTablon';
import { ConfirmModal } from '../common/ConfirmModal';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { AdminLanguage } from '../../constants/admin';
import { RefreshCw, CheckCircle, Clock, Trash2, Globe, MessageSquare } from 'lucide-react';

interface AdminTablonProps {
    language: AdminLanguage;
}

const t: Record<AdminLanguage, any> = {
    ru: {
        title: 'Модерация Tablón',
        pending: 'Ожидают',
        approved: 'Опубликовано',
        empty: 'Нет публикаций на модерации 🎉',
        emptyPublished: 'Нет опубликованных постов',
        approve: 'Одобрить',
        reject: 'Отклонить',
        unpublish: 'Снять с публикации',
        categories: 'Категории',
        suggestedCategories: 'Категории',
        noSuggested: 'Нет предложений',
        approveCategory: 'Одобрить',
        by: 'от',
        tags: 'Теги',
        whatsapp: 'WhatsApp',
        syncThreads: 'Синхронизация Threads',
        connectThreads: 'Подключить Threads',
        disconnectThreads: 'Отключить Threads',
        confirmDisconnect: 'Вы уверены, что хотите отключить Threads?',
    },
    es: {
        title: 'Moderación Tablón',
        pending: 'Pendientes',
        approved: 'Publicados',
        empty: 'No hay publicaciones pendientes 🎉',
        emptyPublished: 'No hay publicaciones activas',
        approve: 'Aprobar',
        reject: 'Rechazar',
        unpublish: 'Despublicar',
        categories: 'Categorías',
        suggestedCategories: 'Categorías',
        noSuggested: 'Sin sugerencias',
        approveCategory: 'Aprobar',
        by: 'de',
        tags: 'Etiquetas',
        whatsapp: 'WhatsApp',
        syncThreads: 'Sincronizar Threads',
        connectThreads: 'Conectar Threads',
        disconnectThreads: 'Desconectar Threads',
        confirmDisconnect: '¿Estás seguro de que deseas desconectar Threads?',
    },
};

export default function AdminTablon({ language }: AdminTablonProps) {
    const labels = t[language];
    const [tab, setTab] = useState<'pending' | 'approved' | 'categories'>('pending');
    const [postToReject, setPostToReject] = useState<string | null>(null);
    const { success, error } = useToast();

    const { data: pendingData, isLoading: pendingLoading } = useTablonPending();

    const { data: approvedData, isLoading: approvedLoading } = useTablonApproved();

    const moderatePost = useModerateTablonPost();
    const approveCategory = useApproveCategory();
    const syncThreadsMutation = useSyncThreads();
    const { data: threadsStatus } = useThreadsStatus();
    const disconnectThreadsMutation = useDisconnectThreads();
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

    // Fetch unapproved categories
    const { data: suggestedData } = useQuery({
        queryKey: ['tablon', 'suggested-categories'],
        queryFn: () => api.get('/admin/tablon-categories?approved=false'),
        staleTime: 30 * 1000,
    });

    const handleSyncThreads = async () => {
        try {
            const res = await syncThreadsMutation.mutateAsync();
            const insertedCount = res.stats?.insertedCount || 0;
            const skippedCount = res.stats?.skippedCount || 0;
            success(
                language === 'ru'
                    ? `Синхронизация Threads завершена: ${insertedCount} новых, ${skippedCount} пропущено.`
                    : `Sincronización de Threads completada: ${insertedCount} nuevos, ${skippedCount} omitidos.`
            );
        } catch (err: any) {
            console.error('Threads sync failed:', err);
            error('Error al sincronizar Threads. Revisa los credenciales.');
        }
    };

    const handleConnectThreads = () => {
        const adminUrl =
            window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : window.location.origin;
        window.open(`${adminUrl}/api/threads/auth`, '_blank');
    };

    const handleDisconnectThreads = async () => {
        try {
            await disconnectThreadsMutation.mutateAsync();
            success(language === 'ru' ? 'Threads отключен' : 'Threads desconectado');
            setShowDisconnectConfirm(false);
        } catch (err) {
            error('Error al desconectar Threads');
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
            success('Post actualizado correctamente');
        } catch (err) {
            console.error('Error moderating post:', err);
            error('Error al actualizar el post');
        }
    }, [postToReject, moderatePost, success, error]);

    const pendingPosts = pendingData?.posts || [];
    const approvedPosts = approvedData?.posts || [];
    const suggestedCategories = suggestedData?.categories || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tab Switcher */}
                <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl w-fit">
                    {[
                        {
                            id: 'pending',
                            label: labels.pending,
                            count: pendingPosts.length,
                            icon: Clock,
                        },
                        {
                            id: 'approved',
                            label: labels.approved,
                            count: approvedPosts.length,
                            icon: CheckCircle,
                        },
                        {
                            id: 'categories',
                            label: labels.suggestedCategories,
                            count: suggestedCategories.length,
                            icon: Globe,
                        },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                tab === t.id
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <t.icon size={14} />
                            {t.label}
                            {t.count > 0 && (
                                <span
                                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${
                                        tab === t.id
                                            ? 'bg-orange-100 text-orange-600'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}
                                >
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {threadsStatus?.connected ? (
                        <>
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                                    Connected as
                                </span>
                                <span className="text-xs font-black text-orange-600 tracking-tight">
                                    @{threadsStatus?.username || 'unknown'}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowDisconnectConfirm(true)}
                                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 border border-red-100/50"
                            >
                                {labels.disconnectThreads}
                            </button>
                            <button
                                onClick={handleSyncThreads}
                                disabled={syncThreadsMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                            >
                                <RefreshCw
                                    size={14}
                                    className={syncThreadsMutation.isPending ? 'animate-spin' : ''}
                                />
                                {syncThreadsMutation.isPending ? '⌛ ...' : labels.syncThreads}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleConnectThreads}
                            className="px-4 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-sm active:scale-95"
                        >
                            🔗 {labels.connectThreads}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {/* Pending Moderation */}
                {tab === 'pending' && (
                    <div className="space-y-4">
                        {pendingLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse h-48"
                                    />
                                ))}
                            </div>
                        ) : pendingPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <MessageSquare size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">
                                    {labels.empty}
                                </p>
                            </div>
                        ) : (
                            pendingPosts.map(post => (
                                <div
                                    key={post.id}
                                    className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                                                {post.author.avatar ? (
                                                    <img
                                                        src={post.author.avatar}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg">
                                                        👤
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                                    {post.author.name || 'Usuario'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                    {new Date(post.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        {post.category && (
                                            <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                                                {post.category.emoji} {post.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                                        {post.message}
                                    </p>

                                    {post.images.length > 0 && (
                                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                            {post.images.map((img, idx) => (
                                                <a
                                                    key={idx}
                                                    href={img}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm"
                                                >
                                                    <img
                                                        src={img}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 flex-wrap mb-6">
                                        {post.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="text-[9px] px-2 py-1 bg-gray-50 text-gray-500 rounded-lg font-bold uppercase tracking-widest border border-gray-100"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() =>
                                                moderatePost.mutateAsync({
                                                    id: post.id,
                                                    approved: true,
                                                })
                                            }
                                            className="flex-1 py-3 bg-green-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-md active:scale-[0.98]"
                                        >
                                            ✅ {labels.approve}
                                        </button>
                                        <button
                                            onClick={() => setPostToReject(post.id)}
                                            className="flex-1 py-3 bg-white text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-red-50 hover:bg-red-50 transition-all active:scale-[0.98]"
                                        >
                                            ❌ {labels.reject}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Approved / Published */}
                {tab === 'approved' && (
                    <div className="space-y-4">
                        {approvedLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse h-48"
                                    />
                                ))}
                            </div>
                        ) : approvedPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <CheckCircle size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">
                                    {labels.emptyPublished}
                                </p>
                            </div>
                        ) : (
                            approvedPosts.map(post => (
                                <div
                                    key={post.id}
                                    className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm opacity-90 grayscale-[0.3] hover:grayscale-0 hover:opacity-100 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 overflow-hidden opacity-80">
                                                {post.author.avatar ? (
                                                    <img
                                                        src={post.author.avatar}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg">
                                                        👤
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-600 uppercase tracking-tight">
                                                    {post.author.name || 'Usuario'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPostToReject(post.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title={labels.unpublish}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="text-gray-500 text-sm italic mb-4">
                                        {post.message}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Categories */}
                {tab === 'categories' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestedCategories.length === 0 ? (
                            <div className="md:col-span-2 flex flex-col items-center justify-center py-20 text-gray-400">
                                <Globe size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">
                                    {labels.noSuggested}
                                </p>
                            </div>
                        ) : (
                            suggestedCategories.map((cat: any) => (
                                <div
                                    key={cat.id}
                                    className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-orange-100/50">
                                            {cat.emoji || '📌'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                                {cat.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                {labels.by} {cat.created_by_name || 'System'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => approveCategory.mutateAsync(cat.id)}
                                        className="px-4 py-2.5 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md active:scale-95"
                                    >
                                        {labels.approveCategory}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Reject Modal */}
            <ConfirmModal
                isOpen={!!postToReject}
                title="¿Rechazar publicación?"
                message="El anuncio se moverá al archivo de rechazados o se quitará de la vista pública."
                confirmText="Confirmar"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={confirmRejectPost}
                onCancel={() => setPostToReject(null)}
            />

            <ConfirmModal
                isOpen={showDisconnectConfirm}
                title={language === 'ru' ? 'Отключить Threads?' : '¿Desconectar Threads?'}
                message={labels.confirmDisconnect}
                confirmText={language === 'ru' ? 'Отключить' : 'Desconectar'}
                cancelText={language === 'ru' ? 'Отмена' : 'Cancelar'}
                isDanger={true}
                onConfirm={handleDisconnectThreads}
                onCancel={() => setShowDisconnectConfirm(false)}
            />
        </div>
    );
}
