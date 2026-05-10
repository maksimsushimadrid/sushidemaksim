import { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Calendar, Flame, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTablonPosts, useTablonCategories } from '../hooks/queries/useTablon';
import type { TablonFilters } from '../hooks/queries/useTablon';
import { CategoryFilter } from '../components/tablon/CategoryFilter';
import { PostCard } from '../components/tablon/PostCard';
import { PostModal } from '../components/tablon/PostModal';
import { TablonSkeleton } from '../components/skeletons/TablonSkeleton';
import { useDebounce } from '../hooks/useDebounce';

export default function TablonPage() {
    const { isAuthenticated } = useAuth();
    const [filters, setFilters] = useState<TablonFilters>({
        page: 1,
        limit: 12,
        sort: 'newest',
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLoginToast, setShowLoginToast] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const debouncedSearch = useDebounce(searchInput, 500);

    const { data: categoriesData, isLoading: catsLoading } = useTablonCategories();
    const { data, isLoading } = useTablonPosts(filters);

    // Sync debounced search to filters
    useEffect(() => {
        setFilters(prev => ({ ...prev, search: debouncedSearch || undefined, page: 1 }));
    }, [debouncedSearch]);

    const categories = categoriesData?.categories || [];
    const posts = data?.posts || [];
    const pagination = data?.pagination;

    const handleCategorySelect = useCallback((catId: string | null) => {
        setFilters(prev => ({ ...prev, category: catId || undefined, page: 1 }));
    }, []);

    const handleSortChange = useCallback((sort: 'newest' | 'oldest' | 'popular') => {
        setFilters(prev => ({ ...prev, sort, page: 1 }));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleCreateClick = useCallback(() => {
        if (!isAuthenticated) {
            setShowLoginToast(true);
            setTimeout(() => setShowLoginToast(false), 3000);
            return;
        }
        setShowCreateModal(true);
    }, [isAuthenticated]);

    if (isLoading && !data) return <TablonSkeleton />;

    return (
        <>
            <Helmet>
                <title>Tablón — Comunidad | Sushi de Maksim</title>
                <meta
                    name="description"
                    content="Tablón de anuncios de la comunidad Sushi de Maksim. Publica, comparte, y descubre ofertas, eventos, ideas y más."
                />
                <link rel="canonical" href="https://sushidemaksim.vercel.app/tablon" />
            </Helmet>

            <div className="min-h-[100svh] bg-[#0d0d0d] pt-[var(--header-height,64px)] relative flex flex-col">
                {/* Ambient Background Glows */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-orange-900/15 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-orange-950/25 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[110vw] h-[70vw] bg-orange-900/20 rounded-full blur-[160px]" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20 flex-1 w-full pt-8 md:pt-12">
                    {/* Page Title */}
                    <div className="mb-10 md:mb-14">
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                            Tablón
                            <span className="text-orange-500 not-italic ml-1">.</span>
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base mt-2 font-medium max-w-lg">
                            Anuncios, ofertas y noticias de nuestra comunidad. ¡Comparte y descubre!
                        </p>
                    </div>

                    {/* Filters & Search Panel - Now scrolls with content */}
                    <div className="relative z-20 mb-8 md:mb-12">
                        <div className="flex flex-col gap-6">
                            {!catsLoading && (
                                <CategoryFilter
                                    categories={categories}
                                    selectedCategoryId={filters.category || null}
                                    onSelect={handleCategorySelect}
                                />
                            )}

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Search - Hidden on mobile, visible on desktop */}
                                <div className="hidden md:block w-full md:max-w-md relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                                        <Search size={16} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchInput}
                                        onChange={e => setSearchInput(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-all shadow-inner"
                                    />
                                    {searchInput && (
                                        <button
                                            onClick={() => setSearchInput('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Sort & Mobile Search Toggle */}
                                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 relative h-11 flex-shrink-0 w-full md:w-auto overflow-hidden">
                                    <AnimatePresence>
                                        {isSearchExpanded ? (
                                            <motion.div
                                                initial={{ x: 100, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: 100, opacity: 0 }}
                                                className="flex-1 flex items-center px-2 gap-2"
                                            >
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Buscar..."
                                                    value={searchInput}
                                                    onChange={e => setSearchInput(e.target.value)}
                                                    className="w-full bg-transparent border-none text-sm text-white placeholder:text-gray-600 focus:outline-none h-full"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setIsSearchExpanded(false);
                                                        setSearchInput('');
                                                    }}
                                                    className="text-gray-500 hover:text-white"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center w-full justify-between md:justify-start"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {[
                                                        { id: 'newest', icon: Clock },
                                                        { id: 'popular', icon: Flame },
                                                        { id: 'oldest', icon: Calendar },
                                                    ].map(item => {
                                                        const isActive = filters.sort === item.id;
                                                        const Icon = item.icon;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() =>
                                                                    handleSortChange(
                                                                        item.id as
                                                                            | 'newest'
                                                                            | 'oldest'
                                                                            | 'popular'
                                                                    )
                                                                }
                                                                className={`relative px-4 py-2 rounded-lg transition-colors duration-300 z-10 flex items-center gap-2 ${
                                                                    isActive
                                                                        ? 'text-white'
                                                                        : 'text-gray-500 hover:text-gray-300'
                                                                }`}
                                                                title={item.id}
                                                            >
                                                                <Icon size={16} strokeWidth={2.5} />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:block">
                                                                    {item.id === 'newest'
                                                                        ? 'Recientes'
                                                                        : item.id === 'popular'
                                                                          ? 'Populares'
                                                                          : 'Antiguos'}
                                                                </span>
                                                                {isActive && (
                                                                    <motion.div
                                                                        layoutId="activeTabHeader"
                                                                        className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20 z-[-1]"
                                                                        transition={{
                                                                            type: 'spring',
                                                                            stiffness: 400,
                                                                            damping: 30,
                                                                        }}
                                                                    />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Mobile Search Icon */}
                                                <button
                                                    onClick={() => setIsSearchExpanded(true)}
                                                    className="md:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white"
                                                >
                                                    <Search size={18} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Posts Grid */}
                    {posts.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-gray-400 text-lg">
                                {filters.category
                                    ? 'No hay anuncios en esta categoría'
                                    : 'Aún no hay anuncios. ¡Sé el primero!'}
                            </p>
                            <button
                                onClick={handleCreateClick}
                                className="mt-6 px-5 py-2.5 bg-orange-500/20 text-orange-400 rounded-xl text-sm font-medium hover:bg-orange-500/30 transition-all"
                            >
                                ✏️ Publicar ahora
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {posts.map(post => (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <PostCard
                                                post={post}
                                                isAuthenticated={isAuthenticated}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-12">
                                    {pagination.currentPage > 1 && (
                                        <button
                                            onClick={() =>
                                                handlePageChange(pagination.currentPage - 1)
                                            }
                                            className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-all"
                                            data-testid="pagination-prev"
                                        >
                                            ← Anterior
                                        </button>
                                    )}

                                    <span className="px-4 py-2 text-sm text-gray-500">
                                        {pagination.currentPage} / {pagination.totalPages}
                                    </span>

                                    {pagination.currentPage < pagination.totalPages && (
                                        <button
                                            onClick={() =>
                                                handlePageChange(pagination.currentPage + 1)
                                            }
                                            className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-all"
                                            data-testid="pagination-next"
                                        >
                                            Siguiente →
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* FAB (Floating Action Button) */}
                <button
                    onClick={handleCreateClick}
                    className="fixed bottom-24 right-4 md:bottom-10 md:right-10 w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-xl shadow-orange-500/30 flex items-center justify-center z-fixed active:scale-90 transition-transform hover:scale-105 active:rotate-12"
                    data-testid="create-post-fab"
                >
                    <Plus size={24} strokeWidth={3} />
                </button>

                {/* Login toast */}
                {showLoginToast && (
                    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-toast bg-gray-800 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium border border-white/10 animate-fade-in">
                        🔒 Inicia sesión para publicar un anuncio
                    </div>
                )}

                {/* Create Post Modal */}
                <PostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
            </div>
        </>
    );
}
