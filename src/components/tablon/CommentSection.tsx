import { useState, useCallback, useMemo, useRef } from 'react';
import { X, CornerDownRight, Trash2, Send, User } from 'lucide-react';
import type { TablonComment } from '../../hooks/queries/useTablon';
import { useCreateTablonComment, useDeleteTablonComment } from '../../hooks/queries/useTablon';
import { useAuth } from '../../hooks/useAuth';
import { TranslateMessage } from './TranslateMessage';
import { ConfirmModal } from '../common/ConfirmModal';

interface CommentSectionProps {
    postId: string;
    comments: TablonComment[];
    isAuthenticated: boolean;
    onLoginPrompt: () => void;
}

export function CommentSection({
    postId,
    comments,
    isAuthenticated,
    onLoginPrompt,
}: CommentSectionProps) {
    const { user } = useAuth();
    const createComment = useCreateTablonComment();
    const deleteComment = useDeleteTablonComment();
    const [message, setMessage] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const replyingToName = useMemo(() => {
        if (!replyTo) return null;
        return comments.find(c => c.id === replyTo)?.author.name || 'Alguien';
    }, [replyTo, comments]);

    // Build threaded comments
    const threadedComments = useMemo(() => {
        const topLevel: TablonComment[] = [];
        const childMap: Record<string, TablonComment[]> = {};

        comments.forEach(c => {
            if (c.parentId) {
                if (!childMap[c.parentId]) childMap[c.parentId] = [];
                childMap[c.parentId].push(c);
            } else {
                topLevel.push(c);
            }
        });

        return { topLevel, childMap };
    }, [comments]);

    const handleSubmit = useCallback(async () => {
        if (!isAuthenticated) {
            onLoginPrompt();
            return;
        }

        const text = message.trim();
        if (!text) return;

        try {
            await createComment.mutateAsync({
                postId,
                message: text,
                parentId: replyTo,
            });
            setMessage('');
            setReplyTo(null);
        } catch {
            // Error handled by mutation
        }
    }, [isAuthenticated, message, postId, replyTo, createComment, onLoginPrompt]);

    const handleReply = useCallback((commentId: string) => {
        setReplyTo(commentId);
        setTimeout(() => {
            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputRef.current?.focus();
        }, 100);
    }, []);

    const handleDelete = useCallback((commentId: string) => {
        setCommentToDelete(commentId);
    }, []);

    const confirmDeleteComment = useCallback(async () => {
        if (!commentToDelete) return;
        const id = commentToDelete;
        setCommentToDelete(null);
        await deleteComment.mutateAsync(id);
    }, [commentToDelete, deleteComment]);

    const isModerator = user?.role === 'moderator' || user?.role === 'admin' || user?.isSuperadmin;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">💬 Comentarios ({comments.length})</h3>

            {/* Comment input */}
            <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                    {isAuthenticated && user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                            width={32}
                            height={32}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                            <User size={16} strokeWidth={2.5} />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    {replyTo && (
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>
                                Respondiendo a{' '}
                                <span className="text-orange-500">{replyingToName}</span>
                            </span>
                            <button
                                onClick={() => setReplyTo(null)}
                                className="text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                            >
                                <X size={10} strokeWidth={3} />
                                <span>Cancelar</span>
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            onFocus={() => {
                                if (!isAuthenticated) {
                                    onLoginPrompt();
                                }
                            }}
                            placeholder={
                                isAuthenticated
                                    ? 'Escribe un comentario...'
                                    : 'Inicia sesión para comentar'
                            }
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                            maxLength={500}
                            data-testid="comment-input"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!message.trim() || createComment.isPending}
                            className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 disabled:opacity-30 transition-all flex items-center justify-center min-w-[50px]"
                            data-testid="comment-submit"
                        >
                            {createComment.isPending ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={16} strokeWidth={2.5} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments list */}
            {comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                    No hay comentarios aún. ¡Sé el primero!
                </p>
            ) : (
                <div className="space-y-4">
                    {threadedComments.topLevel.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            childMap={threadedComments.childMap}
                            isAuthenticated={isAuthenticated}
                            currentUserId={user?.id}
                            isModerator={!!isModerator}
                            onReply={handleReply}
                            onDelete={handleDelete}
                            onLoginPrompt={onLoginPrompt}
                            depth={0}
                        />
                    ))}
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!commentToDelete}
                title="¿Eliminar comentario?"
                message="Tu comentario desaparecerá permanentemente. ¿Estás seguro?"
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={confirmDeleteComment}
                onCancel={() => setCommentToDelete(null)}
            />
        </div>
    );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

interface CommentItemProps {
    comment: TablonComment;
    childMap: Record<string, TablonComment[]>;
    isAuthenticated: boolean;
    currentUserId?: string;
    isModerator: boolean;
    onReply: (id: string) => void;
    onDelete: (id: string) => void;
    onLoginPrompt: () => void;
    depth: number;
}

function CommentItem({
    comment,
    childMap,
    isAuthenticated,
    currentUserId,
    isModerator,
    onReply,
    onDelete,
    onLoginPrompt,
    depth,
}: CommentItemProps) {
    const replies = childMap[comment.id] || [];
    const timeAgo = getCommentTimeAgo(comment.createdAt);
    const canDelete = currentUserId === comment.userId || isModerator;

    return (
        <div data-testid={`comment-${comment.id}`}>
            <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 overflow-hidden border border-white/5">
                    {isAuthenticated && comment.author.avatar ? (
                        <img
                            src={comment.author.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                            width={32}
                            height={32}
                        />
                    ) : (
                        <User size={14} strokeWidth={2.5} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-white">
                            {isAuthenticated && comment.author.name
                                ? comment.author.name
                                : 'Alguien'}
                        </span>
                        <span className="text-xs text-gray-500">{timeAgo}</span>
                    </div>
                    <TranslateMessage
                        originalText={comment.message}
                        className="mt-1"
                        textClassName="text-sm text-gray-300 break-words whitespace-pre-wrap"
                    />
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    onLoginPrompt();
                                    return;
                                }
                                onReply(comment.id);
                            }}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-orange-400 transition-colors"
                        >
                            <CornerDownRight size={10} strokeWidth={3} />
                            Responder
                        </button>
                        {canDelete && (
                            <button
                                onClick={() => onDelete(comment.id)}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={10} strokeWidth={3} />
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Replies */}
            {replies.length > 0 && (
                <div
                    className={`${depth < 3 ? 'ml-6 md:ml-10' : 'ml-0'} mt-3 space-y-3 ${depth < 3 ? 'border-l border-white/5 pl-4' : 'pt-2'}`}
                >
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            childMap={childMap}
                            isAuthenticated={isAuthenticated}
                            currentUserId={currentUserId}
                            isModerator={isModerator}
                            onReply={onReply}
                            onDelete={onDelete}
                            onLoginPrompt={onLoginPrompt}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function getCommentTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `${m} min`;
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h`;
    const d = Math.floor(diff / 86400000);
    if (d < 7) return `${d}d`;
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
