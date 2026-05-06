import { useState, useRef, useCallback, useEffect } from 'react';
import {
    X,
    Plus,
    Camera,
    Tag,
    MessageSquare,
    Trash2,
    LayoutGrid,
    CheckCircle2,
    Smartphone,
    AlertCircle,
    Megaphone,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
    useTablonCategories,
    useCreateTablonPost,
    useEditTablonPost,
    useUploadTablonImage,
    useSuggestCategory,
} from '../../hooks/queries/useTablon';
import { TablonPost } from '../../hooks/queries/useTablon';
import { TABLON_MAX_IMAGES, TABLON_MAX_TAGS } from '../../constants/tablon';
import { getCategoryIcon } from '../../utils/tablonIcons';

interface PostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post?: TablonPost; // New prop for editing
}

export function PostModal({ isOpen, onClose, post }: PostModalProps) {
    const { user } = useAuth();
    const { data: categoriesData } = useTablonCategories();
    const createPost = useCreateTablonPost();
    const editPost = useEditTablonPost();
    const uploadImage = useUploadTablonImage();
    const suggestCategory = useSuggestCategory();

    const [categoryId, setCategoryId] = useState<number | ''>(post?.category?.id || '');
    const [message, setMessage] = useState(post?.message || '');
    const [whatsappPhone, setWhatsappPhone] = useState(post?.whatsappPhone || user?.phone || '');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(post?.tags || []);
    const [images, setImages] = useState<string[]>(post?.images || []);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [hpValue, setHpValue] = useState(''); // Honeypot field
    const [openTime] = useState(Date.now()); // Time-to-submit check

    // Reset state and handle scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            (window as any).lenis?.stop();
            setCategoryId(post?.category?.id || '');
            setMessage(post?.message || '');
            setWhatsappPhone(post?.whatsappPhone || user?.phone || '');
            setTags(post?.tags || []);
            setImages(post?.images || []);
            setError('');
            setSuccess(false);
        } else {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        }

        return () => {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        };
    }, [isOpen, post, user?.phone]);

    // New category suggestion
    const [showSuggestCategory, setShowSuggestCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryEmoji, setNewCategoryEmoji] = useState('📌');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = categoriesData?.categories || [];

    const handleAddTag = useCallback(() => {
        const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
        if (!clean) return;
        if (tags.includes(clean)) return;
        if (tags.length >= TABLON_MAX_TAGS) return;
        setTags(prev => [...prev, clean]);
        setTagInput('');
    }, [tagInput, tags]);

    const handleRemoveTag = useCallback((tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    }, []);

    const handleImageUpload = useCallback(
        async (files: FileList | null) => {
            if (!files) return;
            if (images.length + files.length > TABLON_MAX_IMAGES) {
                setError(`Máximo ${TABLON_MAX_IMAGES} imágenes`);
                return;
            }

            setUploading(true);
            setError('');

            try {
                const remainingSlots = TABLON_MAX_IMAGES - images.length;
                const filesToUpload = Array.from(files).slice(0, remainingSlots);

                if (Array.from(files).length > remainingSlots) {
                    setError(`Solo se permite un máximo de ${TABLON_MAX_IMAGES} imágenes`);
                }

                for (const file of filesToUpload) {
                    if (file.size > 5 * 1024 * 1024) {
                        setError('Cada imagen debe pesar menos de 5MB');
                        continue;
                    }
                    const result = await uploadImage.mutateAsync(file);
                    setImages(prev => [...prev, result.url]);
                }
            } catch {
                setError('Error al subir las imágenes');
            } finally {
                setUploading(false);
            }
        },
        [images.length, uploadImage]
    );

    const handleRemoveImage = useCallback((idx: number) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const handleSuggestCategory = useCallback(async () => {
        if (!newCategoryName.trim()) return;
        try {
            await suggestCategory.mutateAsync({
                name: newCategoryName.trim(),
                emoji: newCategoryEmoji || '📌',
            });
            setShowSuggestCategory(false);
            setNewCategoryName('');
            setNewCategoryEmoji('📌');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al sugerir categoría');
        }
    }, [newCategoryName, newCategoryEmoji, suggestCategory]);

    const handleSubmit = useCallback(async () => {
        setError('');

        if (!categoryId) {
            setError('Selecciona una categoría');
            return;
        }
        if (message.trim().length < 10) {
            setError('El mensaje debe tener al menos 10 caracteres');
            return;
        }
        if (!whatsappPhone.trim()) {
            setError('Introduce tu número de WhatsApp');
            return;
        }

        // Anti-bot check: Honeypot
        if (hpValue) {
            console.warn('Bot detected via honeypot');
            return;
        }

        // Anti-bot check: Time-to-submit (min 3 seconds)
        if (Date.now() - openTime < 3000) {
            setError('Por favor, tómate un momento para revisar tu anuncio antes de enviar.');
            return;
        }

        try {
            if (post) {
                await editPost.mutateAsync({
                    id: post.id,
                    categoryId: categoryId as number,
                    tags,
                    message: message.trim(),
                    whatsappPhone: whatsappPhone.trim(),
                    images,
                });
            } else {
                await createPost.mutateAsync({
                    categoryId,
                    tags,
                    message: message.trim(),
                    whatsappPhone: whatsappPhone.trim(),
                    images,
                });
            }
            setSuccess(true);
            setTimeout(() => {
                onClose();
                if (!post) {
                    // Reset only if creating new
                    setCategoryId('');
                    setMessage('');
                    setTags([]);
                    setImages([]);
                }
                setSuccess(false);
            }, 2000);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al publicar');
        }
    }, [
        categoryId,
        message,
        whatsappPhone,
        tags,
        images,
        createPost,
        editPost,
        post,
        onClose,
        hpValue,
        openTime,
    ]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-end md:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                data-testid="create-post-backdrop"
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border border-white/10 rounded-t-3xl md:rounded-2xl p-6 animate-slide-up"
                data-testid="create-post-modal"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {post ? '✏️ Editar anuncio' : '📢 Publicar anuncio'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="create-post-close"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {success ? (
                    <div className="text-center py-10">
                        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} strokeWidth={2.5} />
                        </div>
                        <p className="text-xl font-black text-white uppercase tracking-tight">
                            ¡Enviado con éxito!
                        </p>
                        <p className="text-sm text-gray-400 mt-2 font-medium">
                            Un moderador revisará tu anuncio pronto.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Honeypot field (hidden from users) */}
                        <div className="absolute opacity-0 pointer-events-none -z-10 h-0 overflow-hidden">
                            <input
                                type="text"
                                value={hpValue}
                                onChange={e => setHpValue(e.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>
                        {/* Category Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                                <LayoutGrid size={14} className="text-orange-500" />
                                Categoría *
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categories.map(cat => {
                                    const Icon = getCategoryIcon(cat.name);
                                    const isSelected = categoryId === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            data-testid={`category-option-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                            onClick={() => setCategoryId(cat.id)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                                                isSelected
                                                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-500 shadow-lg shadow-orange-500/10'
                                                    : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300'
                                            }`}
                                        >
                                            <Icon size={14} strokeWidth={2.5} />
                                            <span className="truncate">{cat.name}</span>
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => setShowSuggestCategory(!showSuggestCategory)}
                                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 text-gray-500 hover:bg-white/10 transition-all border-2 border-dashed border-gray-700/50"
                                    data-testid="suggest-category-btn"
                                >
                                    <Plus size={14} strokeWidth={2.5} />
                                    <span>Otra</span>
                                </button>
                            </div>

                            {/* Suggest new category inline form */}
                            {showSuggestCategory && (
                                <div className="mt-3 flex gap-2 items-end">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        placeholder="Nombre de categoría"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50"
                                        maxLength={40}
                                        data-testid="suggest-category-name"
                                    />
                                    <input
                                        type="text"
                                        value={newCategoryEmoji}
                                        onChange={e => setNewCategoryEmoji(e.target.value)}
                                        className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-center text-white focus:outline-none focus:border-orange-500/50"
                                        maxLength={4}
                                        data-testid="suggest-category-emoji"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSuggestCategory}
                                        disabled={
                                            suggestCategory.isPending || !newCategoryName.trim()
                                        }
                                        className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-all"
                                        data-testid="suggest-category-submit"
                                    >
                                        {suggestCategory.isPending ? '...' : 'Enviar'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Message */}
                        <div>
                            <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                <MessageSquare size={14} className="text-orange-500" />
                                Mensaje *
                            </label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Escribe tu anuncio aquí..."
                                rows={4}
                                maxLength={500}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
                                data-testid="post-message"
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">
                                {message.length}/500
                            </p>
                        </div>

                        {/* WhatsApp phone */}
                        <div>
                            <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                <Smartphone size={14} className="text-orange-500" />
                                WhatsApp *
                            </label>
                            <input
                                type="tel"
                                value={whatsappPhone}
                                onChange={e => setWhatsappPhone(e.target.value)}
                                placeholder="+34 612 345 678"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                                data-testid="post-whatsapp"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Solo visible para usuarios registrados
                            </p>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                <Tag size={14} className="text-orange-500" />
                                Etiquetas ({tags.length}/{TABLON_MAX_TAGS})
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    placeholder="Añadir etiqueta..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50"
                                    disabled={tags.length >= TABLON_MAX_TAGS}
                                    data-testid="post-tag-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    disabled={tags.length >= TABLON_MAX_TAGS || !tagInput.trim()}
                                    className="w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-30 transition-all"
                                    data-testid="post-tag-add"
                                >
                                    <Plus size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-gray-300 rounded-md text-xs"
                                        >
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-gray-500 hover:text-red-400 transition-colors"
                                            >
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Images */}
                        <div>
                            <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                <Camera size={14} className="text-orange-500" />
                                Fotos ({images.length}/{TABLON_MAX_IMAGES})
                            </label>
                            <div className="flex gap-3 flex-wrap">
                                {images.map((url, idx) => (
                                    <div
                                        key={idx}
                                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10"
                                    >
                                        <img
                                            src={url}
                                            alt={`Foto ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            width={80}
                                            height={80}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={12} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}
                                {images.length < TABLON_MAX_IMAGES && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-orange-500/50 hover:text-orange-400 transition-all"
                                        data-testid="post-upload-btn"
                                    >
                                        {uploading ? (
                                            <div className="w-6 h-6 border-2 border-white/20 border-t-orange-500 rounded-full animate-spin" />
                                        ) : (
                                            <Camera size={24} strokeWidth={1.5} />
                                        )}
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={e => handleImageUpload(e.target.files)}
                                className="hidden"
                                data-testid="post-file-input"
                            />
                        </div>

                        {error && (
                            <div
                                className="flex items-center gap-3 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20"
                                data-testid="post-error"
                            >
                                <AlertCircle size={18} />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={createPost.isPending || editPost.isPending || uploading}
                            className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:brightness-110 disabled:opacity-50 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                            data-testid="post-submit"
                        >
                            {createPost.isPending || editPost.isPending ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Megaphone size={18} strokeWidth={2.5} />
                                    {post ? 'Guardar cambios' : 'Publicar anuncio'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
