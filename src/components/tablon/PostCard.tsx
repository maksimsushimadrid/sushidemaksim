import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, User, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryIcon } from '../../utils/tablonIcons';
import type { TablonPost } from '../../hooks/queries/useTablon';
import { TranslateMessage } from './TranslateMessage';

interface PostCardProps {
    post: TablonPost;
    isAuthenticated: boolean;
}

export function PostCard({ post, isAuthenticated }: PostCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const timeAgo = getTimeAgo(post.createdAt);

    const handlePrevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev === 0 ? post.images.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev === post.images.length - 1 ? 0 : prev + 1));
    };

    return (
        <Link
            to={`/tablon/${post.id}`}
            data-testid={`tablon-post-${post.id}`}
            className="group flex flex-col h-full bg-transparent border-none md:bg-gray-900/50 md:backdrop-blur-sm md:border md:border-white/10 rounded-none md:rounded-2xl overflow-visible md:overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5"
        >
            {/* Images slider */}
            {post.images.length > 0 ? (
                <div className="relative h-64 md:h-48 overflow-hidden rounded-2xl md:rounded-none group/slider bg-black">
                    <AnimatePresence initial={false}>
                        <motion.img
                            key={currentImageIndex}
                            src={post.images[currentImageIndex]}
                            initial={{ x: 200 }}
                            animate={{ x: 0 }}
                            exit={{ x: -200 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </AnimatePresence>

                    {post.images.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover/slider:opacity-100 transition-opacity z-10"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover/slider:opacity-100 transition-opacity z-10"
                            >
                                <ChevronRight size={16} />
                            </button>

                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                {post.images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-1 h-1 rounded-full transition-all ${
                                            idx === currentImageIndex
                                                ? 'bg-orange-500 w-3'
                                                : 'bg-white/40'
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-white/10 uppercase tracking-widest z-10">
                                {currentImageIndex + 1} / {post.images.length}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="relative h-64 md:h-48 overflow-hidden rounded-2xl md:rounded-none bg-white/5 flex flex-col items-center justify-center gap-3 border-b border-white/5 group-hover:bg-white/[0.07] transition-colors duration-300">
                    <Camera
                        size={32}
                        strokeWidth={1}
                        className="text-gray-700 group-hover:text-gray-600 transition-colors"
                    />
                    <span className="text-[10px] font-black text-gray-700 group-hover:text-gray-600 uppercase tracking-[0.2em] transition-colors">
                        Sin fotos
                    </span>
                </div>
            )}

            <div className="py-5 px-0 md:p-5 flex flex-col flex-grow">
                {/* Category badge + time */}
                <div className="flex items-center justify-between mb-3">
                    {post.category &&
                        (() => {
                            const Icon = getCategoryIcon(post.category.name);
                            return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                                    <Icon size={10} strokeWidth={3} />
                                    {post.category.name}
                                </span>
                            );
                        })()}
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                        {timeAgo}
                    </span>
                </div>

                {/* Message */}
                <TranslateMessage
                    originalText={post.message}
                    className="mb-4"
                    textClassName="text-gray-200 text-sm leading-relaxed line-clamp-3"
                    shareUrl={`${window.location.origin}/tablon/${post.id}`}
                />

                {/* Tags */}
                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.map(tag => (
                            <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded-md"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer: Author + Comment count */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-2">
                        {isAuthenticated && post.author.avatar ? (
                            <img
                                src={post.author.avatar}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                                width={24}
                                height={24}
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
                                <User size={12} strokeWidth={2.5} />
                            </div>
                        )}
                        <span className="text-xs text-gray-400">
                            {isAuthenticated && post.author.name
                                ? post.author.name
                                : 'Alguien escribió'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {Object.values(post.reactions || {}).reduce((a, b) => a + b, 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-orange-500">
                                <Heart size={12} fill="currentColor" />
                                <span>
                                    {Object.values(post.reactions || {}).reduce((a, b) => a + b, 0)}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <MessageSquare size={12} />
                            <span>{post.commentCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

/** Simple relative time formatter */
function getTimeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
