import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    MessageCircle,
    Lock,
    Trash2,
    Edit3,
    User,
    Camera,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTablonPost, useDeleteTablonPost } from '../hooks/queries/useTablon';
import { CommentSection } from '../components/tablon/CommentSection';
import { PostModal } from '../components/tablon/PostModal';
import { PostReactions } from '../components/tablon/PostReactions';
import { TranslateMessage } from '../components/tablon/TranslateMessage';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { getCategoryIcon } from '../utils/tablonIcons';

export default function TablonPostPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { data, isLoading, error } = useTablonPost(id || '');
    const deletePost = useDeleteTablonPost();

    const [showLoginToast, setShowLoginToast] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleLoginPrompt = useCallback(() => {
        setShowLoginToast(true);
        setTimeout(() => setShowLoginToast(false), 3000);
    }, []);

    const handleDelete = useCallback(() => {
        setIsDeleteModalOpen(true);
    }, []);

    const confirmDeletePost = useCallback(async () => {
        if (!id) return;
        setIsDeleteModalOpen(false);
        await deletePost.mutateAsync(id);
        navigate('/tablon');
    }, [id, deletePost, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 pt-24 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data?.post) {
        return (
            <div className="min-h-screen bg-gray-950 pt-24 flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-gray-400">📭 Anuncio no encontrado</p>
                <Link
                    to="/tablon"
                    className="text-orange-400 hover:text-orange-300 text-sm underline"
                >
                    ← Volver al tablón
                </Link>
            </div>
        );
    }

    const { post, comments } = data;
    const isOwner = user?.id === post.userId;
    const isModerator = user?.role === 'moderator' || user?.role === 'admin' || user?.isSuperadmin;
    const canEdit = isOwner; // Owners can edit anytime now
    const canDelete = isOwner || isModerator;

    const whatsappLink = post.whatsappPhone
        ? `https://wa.me/${post.whatsappPhone.replace(/[^0-9]/g, '')}`
        : null;

    return (
        <>
            <Helmet>
                <title>
                    {post.category?.name
                        ? `${post.category.emoji} ${post.category.name}`
                        : 'Anuncio'}{' '}
                    — Tablón | Sushi de Maksim
                </title>
                <meta name="description" content={post.message.slice(0, 160)} />
                <link rel="canonical" href={`https://sushidemaksim.vercel.app/tablon/${post.id}`} />
            </Helmet>

            <div className="min-h-[100svh] bg-[#0d0d0d] pt-24 pb-20 relative">
                {/* Ambient Background Glows */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-orange-900/15 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-orange-950/25 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[110vw] h-[70vw] bg-orange-900/20 rounded-full blur-[160px]" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto px-4">
                    {/* Back link */}
                    <Link
                        to="/tablon"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors"
                        data-testid="back-to-tablon"
                    >
                        ← Volver al tablón
                    </Link>

                    {/* Post Card */}
                    <article className="bg-transparent border-none md:bg-gray-900/50 md:backdrop-blur-sm md:border md:border-white/10 rounded-none md:rounded-2xl overflow-visible md:overflow-hidden">
                        {/* Image Slider - Edge to Edge on mobile */}
                        {post.images.length > 0 ? (
                            <div className="relative group bg-black aspect-[4/3] md:aspect-[16/9] overflow-hidden -mx-4 md:mx-0 rounded-none md:rounded-none">
                                <AnimatePresence initial={false}>
                                    <motion.img
                                        key={currentImageIndex}
                                        src={post.images[currentImageIndex]}
                                        initial={{ x: 300 }}
                                        animate={{ x: 0 }}
                                        exit={{ x: -300 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        alt={`Imagen ${currentImageIndex + 1} del anuncio`}
                                    />
                                </AnimatePresence>

                                {/* Navigation Arrows */}
                                {post.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() =>
                                                setCurrentImageIndex(prev =>
                                                    prev === 0 ? post.images.length - 1 : prev - 1
                                                )
                                            }
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setCurrentImageIndex(prev =>
                                                    prev === post.images.length - 1 ? 0 : prev + 1
                                                )
                                            }
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                        >
                                            <ChevronRight size={24} />
                                        </button>

                                        {/* Pagination Dots */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                            {post.images.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                        idx === currentImageIndex
                                                            ? 'bg-orange-500 w-4'
                                                            : 'bg-white/40 hover:bg-white/60'
                                                    }`}
                                                />
                                            ))}
                                        </div>

                                        {/* Counter */}
                                        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-black/40 text-white text-[10px] font-bold backdrop-blur-md border border-white/10 z-20">
                                            {currentImageIndex + 1} / {post.images.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative h-64 md:h-80 bg-white/5 flex flex-col items-center justify-center gap-4 border-b border-white/5 -mx-4 md:mx-0">
                                <Camera size={48} strokeWidth={1} className="text-gray-800" />
                                <span className="text-xs font-black text-gray-800 uppercase tracking-[0.3em]">
                                    Sin fotos
                                </span>
                            </div>
                        )}

                        <div className="py-6 px-0 md:p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {/* Author */}
                                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                        {isAuthenticated && post.author.avatar ? (
                                            <img
                                                src={post.author.avatar}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                width={40}
                                                height={40}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                                                <User size={24} strokeWidth={2.5} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {isAuthenticated && post.author.name
                                                ? post.author.name
                                                : 'Alguien escribió'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(post.createdAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Category badge */}
                                {post.category &&
                                    (() => {
                                        const Icon = getCategoryIcon(post.category.name);
                                        return (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-500/20 shadow-lg shadow-orange-500/5">
                                                <Icon size={12} strokeWidth={2.5} />
                                                {post.category.name}
                                            </span>
                                        );
                                    })()}
                            </div>

                            {/* Message */}
                            <TranslateMessage
                                originalText={post.message}
                                className="mb-6"
                                textClassName="text-gray-200 leading-relaxed whitespace-pre-wrap"
                                shareUrl={window.location.href}
                            />

                            {/* Reactions */}
                            <div className="mb-8">
                                <PostReactions
                                    postId={post.id}
                                    reactions={post.reactions}
                                    userReaction={post.userReaction}
                                    isAuthenticated={isAuthenticated}
                                    onLoginPrompt={handleLoginPrompt}
                                />
                            </div>

                            {/* Tags */}
                            {post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {post.tags.map(tag => (
                                        <Link
                                            key={tag}
                                            to={`/tablon?tag=${encodeURIComponent(tag)}`}
                                            className="text-xs px-2.5 py-1 bg-white/5 text-gray-400 rounded-md hover:bg-white/10 transition-colors"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-6 border-t border-white/5 overflow-x-auto no-scrollbar">
                                {/* WhatsApp button (auth only) */}
                                {isAuthenticated && whatsappLink ? (
                                    <a
                                        href={whatsappLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-green-500 hover:text-green-400 bg-green-500/5 hover:bg-green-500/10 border border-green-500/20 rounded-xl transition-all whitespace-nowrap"
                                        data-testid="whatsapp-contact"
                                    >
                                        <MessageCircle size={12} strokeWidth={2.5} />
                                        WhatsApp
                                    </a>
                                ) : !isAuthenticated ? (
                                    <button
                                        onClick={handleLoginPrompt}
                                        className="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all whitespace-nowrap"
                                    >
                                        <Lock size={12} strokeWidth={2.5} />
                                        Contacto
                                    </button>
                                ) : null}

                                {/* Edit */}
                                {canEdit && (
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all whitespace-nowrap"
                                        data-testid="edit-post-btn"
                                    >
                                        <Edit3 size={12} strokeWidth={2.5} />
                                        Editar
                                    </button>
                                )}

                                {/* Delete */}
                                {canDelete && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={deletePost.isPending}
                                        className="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all whitespace-nowrap"
                                        data-testid="delete-post-btn"
                                    >
                                        <Trash2 size={12} strokeWidth={2.5} />
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    </article>

                    {/* Comments Section */}
                    <div className="mt-8">
                        <CommentSection
                            postId={post.id}
                            comments={comments}
                            isAuthenticated={isAuthenticated}
                            onLoginPrompt={handleLoginPrompt}
                        />
                    </div>
                </div>

                {/* Edit Modal */}
                <PostModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    post={post}
                />

                {/* Login toast */}
                {showLoginToast && (
                    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-toast bg-gray-800 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium border border-white/10 animate-fade-in">
                        🔒 Inicia sesión para ver el contacto y comentar
                    </div>
                )}

                {/* Confirm Delete Modal */}
                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    title="¿Eliminar anuncio?"
                    message="Esta acción no se puede deshacer. Tu anuncio desaparecerá del tablón permanentemente."
                    confirmText="Sí, eliminar"
                    cancelText="No, mantener"
                    isDanger={true}
                    onConfirm={confirmDeletePost}
                    onCancel={() => setIsDeleteModalOpen(false)}
                />
            </div>
        </>
    );
}
