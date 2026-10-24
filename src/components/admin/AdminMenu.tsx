import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    RefreshCw,
    Upload,
    Image as ImageIcon,
    SlidersHorizontal,
    ArrowUp,
    ArrowDown,
    CheckCircle2,
} from 'lucide-react';
import { api, ApiError } from '../../utils/api';
import { getAllergenInfo } from '../../utils/allergens';
import {
    AVAILABLE_CATEGORY_ICONS,
    resolveCategories,
    type MenuCategory,
} from '../../constants/menu';
import { useSettings } from '../../hooks/queries/useSettings';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    weight?: string | number;
    pieces?: number;
    spicy?: boolean;
    vegetarian?: boolean;
    isPromo?: boolean;
    isPopular?: boolean;
    isChefChoice?: boolean;
    isNew?: boolean;
    allergens?: string[];
    costPrice?: number;
}

interface AdminMenuProps {
    language?: 'ru' | 'es';
}

const MENU_TRANSLATIONS = {
    ru: {
        searchPlaceholder: 'Поиск по названию или категории...',
        refresh: 'Обновить',
        newDish: 'Новое блюдо',
        loadingMenu: 'Загрузка меню...',
        table: {
            image: 'Фото',
            name: 'Название',
            category: 'Категория',
            price: 'Цена',
            costPrice: 'Себест.',
            tags: 'Метки',
            actions: 'Действия',
        },
        noDishes: 'Блюда не найдены.',
        modal: {
            edit: 'Редактировать блюдо',
            add: 'Добавить блюдо',
            name: 'Название *',
            category: 'Категория *',
            price: 'Цена (€) *',
            costPrice: 'Себестоимость (€) *',
            pieces: 'Кусочков (опц.)',
            weight: 'Вес в граммах (опц.)',
            weightPlaceholder: 'Например: 240',
            description: 'Описание *',
            imageLabel: 'Изображение блюда',
            uploading: 'Загрузка...',
            uploadBtn: 'Загрузить с устройства',
            urlPlaceholder: 'Или используйте ссылку (https://...)',
            allergens: 'Аллергены',
            cancel: 'Отмена',
            save: 'Сохранить изменения',
            create: 'Создать блюдо',
        },
        categoriesBtn: 'Категории',
        categoryModal: {
            title: 'Управление категориями',
            desc: 'Настройте порядок отображения категорий в меню (десктоп и мобильный) и добавляйте новые.',
            orderTitle: 'Порядок категорий на сайте',
            moveUp: 'Вверх',
            moveDown: 'Вниз',
            addTitle: 'Добавить новую категорию',
            nameLabel: 'Название категории (на испанском)',
            namePlaceholder: 'Например: Poke Bowls, Sashimi, Wok',
            idLabel: 'Идентификатор (slug)',
            idPlaceholder: 'poke-bowls, sashimi',
            iconLabel: 'Иконка',
            descLabel: 'Описание (опционально)',
            descPlaceholder: 'Краткое описание категории...',
            addBtn: 'Добавить в список',
            resetBtn: 'Сбросить порядок по умолчанию',
            saveBtn: 'Сохранить категории',
            savingBtn: 'Сохранение...',
            deleteConfirm: 'Удалить категорию "{name}"?',
            successMsg: 'Порядок категорий успешно сохранен!',
            fillRequired: 'Пожалуйста, укажите название и идентификатор категории.',
            customBadge: 'Новая',
            close: 'Закрыть',
        },
        categories: {
            entrantes: 'Закуски',
            'rollos-grandes': 'Большие роллы',
            'rollos-clasicos': 'Классические роллы',
            'rollos-fritos': 'Жареные роллы',
            sopas: 'Супы',
            menus: 'Сеты / Меню',
            postre: 'Десерты',
            bebidas: 'Напитки',
            extras: 'Добавки',
        },
        tags: {
            spicy: 'Острое',
            vegetarian: 'Вегетарианское',
            isPromo: 'Акция',
            isPopular: 'Топ',
            isChefChoice: 'Шеф',
            isNew: 'Новинка',
            allergens: 'Аллерг.',
        },
        delete: {
            title: 'Удалить это блюдо?',
            confirm: 'Вы собираетесь удалить "{name}". Это действие нельзя отменить.',
            yes: 'ДА, УДАЛИТЬ СЕЙЧАС',
            no: 'ОТМЕНА',
        },
        errorSaving: 'Ошибка при сохранении',
        errorDeleting: 'Ошибка при удалении',
        errors: {
            largeImage: 'Изображение слишком большое (макс. 4.5MB).',
            network: 'Ошибка сети: не удалось подключиться к серверу.',
            price: 'Ошибка обработки цены',
        },
    },
    es: {
        searchPlaceholder: 'Buscar por nombre o categoría...',
        refresh: 'Actualizar',
        newDish: 'Nuevo Plato',
        categoriesBtn: 'Categorías',
        categoryModal: {
            title: 'Gestión de Categorías',
            desc: 'Configura el orden de las categorías en el menú (móvil y escritorio) y añade nuevas.',
            orderTitle: 'Orden actual de categorías en la web',
            moveUp: 'Subir',
            moveDown: 'Bajar',
            addTitle: 'Añadir nueva categoría',
            nameLabel: 'Nombre de la categoría',
            namePlaceholder: 'Ej. Poke Bowls, Sashimi, Wok',
            idLabel: 'Identificador (slug)',
            idPlaceholder: 'poke-bowls, sashimi',
            iconLabel: 'Icono',
            descLabel: 'Descripción (opcional)',
            descPlaceholder: 'Breve descripción de la categoría...',
            addBtn: 'Añadir a la lista',
            resetBtn: 'Restablecer por defecto',
            saveBtn: 'Guardar categorías',
            savingBtn: 'Guardando...',
            deleteConfirm: '¿Eliminar categoría "{name}"?',
            successMsg: '¡Categorías guardadas correctamente!',
            fillRequired: 'Por favor, introduce el nombre y el identificador.',
            customBadge: 'Personalizada',
            close: 'Cerrar',
        },
        loadingMenu: 'Cargando menú...',
        table: {
            image: 'Imagen',
            name: 'Nombre',
            category: 'Categoría',
            price: 'Precio',
            costPrice: 'Coste',
            tags: 'Etiquetas',
            actions: 'Acciones',
        },
        noDishes: 'No se encontraron platos.',
        modal: {
            edit: 'Editar Plato',
            add: 'Añadir Plato',
            name: 'Nombre *',
            category: 'Categoría *',
            price: 'Precio (€) *',
            costPrice: 'Coste Ingredientes (€) *',
            pieces: 'Piezas (opcional)',
            weight: 'Peso en gramos (opcional)',
            weightPlaceholder: 'Ej. 240',
            description: 'Descripción *',
            imageLabel: 'Imagen del Plato',
            uploading: 'Subiendo...',
            uploadBtn: 'Subir desde dispositivo',
            urlPlaceholder: 'https://...',
            allergens: 'Alérgenos',
            cancel: 'Cancelar',
            save: 'Guardar Cambios',
            create: 'Crear Plato',
        },
        categories: {
            entrantes: 'Entrantes',
            'rollos-grandes': 'Rollos Grandes',
            'rollos-clasicos': 'Rollos Clásicos',
            'rollos-fritos': 'Rollos Fritos',
            sopas: 'Sopas',
            menus: 'Menús',
            postre: 'Postre',
            bebidas: 'Bebidas',
            extras: 'Extras',
        },
        tags: {
            spicy: 'Picante',
            vegetarian: 'Veggie',
            isPromo: 'Promo',
            isPopular: 'Top',
            isChefChoice: 'Chef',
            isNew: 'Nuevo',
            allergens: 'Alérg.',
        },
        delete: {
            title: '¿Eliminar este plato?',
            confirm: 'Estás a punto de borrar "{name}". Esta acción no se puede deshacer.',
            yes: 'SÍ, ELIMINAR AHORA',
            no: 'CANCELAR',
        },
        errorSaving: 'Error al guardar',
        errorDeleting: 'Error al eliminar',
        errors: {
            largeImage: 'La imagen sigue siendo demasiado grande (máx. 4.5MB).',
            network: 'Error de red: No se pudo conectar al servidor.',
            price: 'Error al procesar el precio',
        },
    },
} as const;

export default function AdminMenu({ language = 'es' }: AdminMenuProps) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    const t = MENU_TRANSLATIONS[language];

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    // Category management state
    const { data: siteSettings } = useSettings();
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryList, setCategoryList] = useState<MenuCategory[]>(() => resolveCategories());
    const [catSuccessToast, setCatSuccessToast] = useState(false);
    const [newCat, setNewCat] = useState({
        name: '',
        id: '',
        iconName: 'Utensils',
        description: '',
    });

    // Sync remote categories from siteSettings when loaded
    useEffect(() => {
        if (siteSettings?.menuCategories && Array.isArray(siteSettings.menuCategories)) {
            setCategoryList(resolveCategories(siteSettings.menuCategories));
        } else {
            setCategoryList(resolveCategories());
        }
    }, [siteSettings?.menuCategories]);

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        setCategoryList(prev => {
            const next = [...prev];
            const temp = next[index - 1];
            next[index - 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    const handleMoveDown = (index: number) => {
        if (index >= categoryList.length - 1) return;
        setCategoryList(prev => {
            const next = [...prev];
            const temp = next[index + 1];
            next[index + 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCat.name.trim() || !newCat.id.trim()) {
            alert(t.categoryModal.fillRequired);
            return;
        }
        const cleanId = newCat.id
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        if (categoryList.some(c => c.id === cleanId)) {
            alert(
                language === 'ru'
                    ? 'Категория с таким ID уже существует.'
                    : 'Ya existe una categoría con este identificador.'
            );
            return;
        }

        const selectedIconInfo = AVAILABLE_CATEGORY_ICONS.find(i => i.id === newCat.iconName);

        const createdCategory: MenuCategory = {
            id: cleanId,
            name: newCat.name.trim(),
            description: newCat.description.trim(),
            icon: selectedIconInfo?.icon || AVAILABLE_CATEGORY_ICONS[0].icon,
            iconName: newCat.iconName,
            emoji: selectedIconInfo?.emoji || '🍽️',
            isCustom: true,
        };

        setCategoryList(prev => [...prev, createdCategory]);
        setNewCat({ name: '', id: '', iconName: 'Utensils', description: '' });
    };

    const handleDeleteCategory = (cat: MenuCategory) => {
        if (window.confirm(t.categoryModal.deleteConfirm.replace('{name}', cat.name))) {
            setCategoryList(prev => prev.filter(c => c.id !== cat.id));
        }
    };

    const handleResetCategories = () => {
        setCategoryList(resolveCategories());
    };

    const saveCategoriesMutation = useMutation({
        mutationFn: (categoriesToSave: MenuCategory[]) => {
            const payload = categoriesToSave.map(c => ({
                id: c.id,
                name: c.name,
                iconName: c.iconName || 'Utensils',
                emoji: c.emoji || '🍽️',
                description: c.description || '',
                isCustom: !!c.isCustom,
            }));
            return api.put('/admin/settings', { menu_categories: payload });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            setCatSuccessToast(true);
            setTimeout(() => setCatSuccessToast(false), 3000);
        },
        onError: () => {
            alert(t.errorSaving);
        },
    });

    // Form state
    const [formData, setFormData] = useState<Partial<MenuItem>>({});
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formError, setFormError] = useState('');
    const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isModalOpen || itemToDelete || isCategoryModalOpen) {
            document.body.style.overflow = 'hidden';
            (window as any).lenis?.stop();
        } else {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        }
        return () => {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        };
    }, [isModalOpen, itemToDelete, isCategoryModalOpen]);

    // Menu Query
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['admin-menu'],
        queryFn: () => api.get('/admin/menu'),
    });

    const items: MenuItem[] = useMemo(() => data?.items || [], [data]);

    const filteredItems = useMemo(() => {
        return items.filter(
            item =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.category.toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/menu/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-menu'] });
            setItemToDelete(null);
        },
        onError: (err: any) => {
            alert(err instanceof ApiError ? err.message : t.errorDeleting);
        },
    });

    const upsertMutation = useMutation({
        mutationFn: (payload: any) => {
            if (editingItem) {
                return api.put(`/admin/menu/${editingItem.id}`, payload);
            }
            return api.post('/admin/menu', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-menu'] });
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            setFormError(err instanceof ApiError ? err.message : t.errorSaving);
        },
    });

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            price: 0,
            image: '',
            category: 'entrantes',
            pieces: 0,
            weight: '',
            spicy: false,
            vegetarian: false,
            isPromo: false,
            isPopular: false,
            isChefChoice: false,
            isNew: false,
            allergens: [],
            costPrice: 0,
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({ ...item });
        setFormError('');
        setIsModalOpen(true);
    };

    const compressImage = (file: File): Promise<Blob | File> => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    const MAX_SIZE = 1000;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        blob => {
                            if (blob && blob.size < file.size) {
                                resolve(blob);
                            } else {
                                resolve(file);
                            }
                        },
                        'image/webp',
                        0.8
                    );
                };
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        setFormError('');

        try {
            if (file.type.startsWith('image/')) {
                const compressed = await compressImage(file);
                file = new File([compressed], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
                    type: 'image/webp',
                });
            }

            if (file.size > 4 * 1024 * 1024) {
                throw new Error(t.errors.largeImage);
            }

            const formDataUpload = new FormData();
            formDataUpload.append('image', file);

            const token = localStorage.getItem('sushi_token');
            const res = await fetch('/api/admin/menu/upload-image', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataUpload,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({
                    error: `Error (${res.status})`,
                    details: 'Server error',
                }));
                const errorMessage = errorData.details
                    ? `${errorData.error}: ${errorData.details}`
                    : errorData.error;
                throw new Error(errorMessage || `Error ${res.status}`);
            }

            const data = await res.json();
            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (err: any) {
            console.error('Upload fail:', err);
            setFormError(err.message === 'Failed to fetch' ? t.errors.network : err.message);
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        try {
            const priceStr = String(formData.price || '0');
            const parsedPrice = priceStr.includes(',')
                ? Number(priceStr.replace(',', '.'))
                : Number(priceStr);

            const payload = {
                ...formData,
                price: parsedPrice,
                pieces: formData.pieces ? Number(formData.pieces) : undefined,
            };

            upsertMutation.mutate(payload);
        } catch (err) {
            setFormError(t.errors.price);
        }
    };

    return (
        <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Top Controls */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-96">
                        <Search
                            size={18}
                            strokeWidth={2}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 focus:outline-none transition-all placeholder:text-gray-400"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors p-1"
                            >
                                <X size={16} strokeWidth={2} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => refetch()}
                            className="p-3 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-white border border-gray-100 rounded-xl transition-all shadow-sm active:scale-95"
                            title={t.refresh}
                        >
                            <RefreshCw
                                size={20}
                                strokeWidth={2}
                                className={isFetching ? 'animate-spin' : ''}
                            />
                        </button>
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex-1 sm:flex-none uppercase tracking-widest bg-gray-900 text-white px-5 py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-md active:scale-95"
                        >
                            <SlidersHorizontal size={15} strokeWidth={2.5} /> {t.categoriesBtn}
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex-1 sm:flex-none uppercase tracking-widest bg-orange-600 text-white px-6 py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-orange-100 active:scale-95"
                        >
                            <Plus size={16} strokeWidth={3} /> {t.newDish}
                        </button>
                    </div>
                </div>

                {/* Loading state */}
                {isLoading && items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <RefreshCw
                            className="animate-spin text-orange-600 mb-6"
                            size={48}
                            strokeWidth={2}
                        />
                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
                            {t.loadingMenu}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-100">
                                    <tr>
                                        <th className="px-3.5 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-widest">
                                            {t.table.image}
                                        </th>
                                        <th className="px-3.5 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-widest">
                                            {t.table.name}
                                        </th>
                                        <th className="px-3.5 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-widest">
                                            {t.table.category}
                                        </th>
                                        <th className="px-3.5 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-widest text-right">
                                            {t.table.price}
                                        </th>
                                        <th className="px-3.5 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-widest text-right">
                                            {t.table.costPrice}
                                        </th>
                                        <th className="px-3.5 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-widest text-center">
                                            {t.table.tags}
                                        </th>
                                        <th className="px-3.5 md:px-8 py-3 md:py-5 text-[10px] font-black uppercase tracking-widest text-right">
                                            {t.table.actions}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredItems.map(item => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="px-3.5 md:px-8 py-2 md:py-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm group-hover:scale-110 transition-transform">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                            onError={e =>
                                                                (e.currentTarget.style.display =
                                                                    'none')
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-xl">🍣</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3.5 md:px-8 py-2 md:py-4">
                                                <p className="font-black text-gray-900 text-base tracking-tight leading-tight">
                                                    {item.name}
                                                </p>
                                                {(item.pieces || item.weight) && (
                                                    <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                                                        {item.pieces ? `${item.pieces} uds` : ''}
                                                        {item.pieces && item.weight ? ' • ' : ''}
                                                        {item.weight
                                                            ? `${String(item.weight).toLowerCase().includes('g') ? item.weight : `${item.weight} g`}`
                                                            : ''}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3.5 md:px-8 py-2 md:py-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 whitespace-nowrap">
                                                    {(t.categories as any)[item.category] ||
                                                        item.category.replace('-', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-3.5 md:px-8 py-2 md:py-4 text-right">
                                                <p className="font-black text-orange-600 text-lg tabular-nums whitespace-nowrap">
                                                    {Number(item.price)
                                                        .toFixed(2)
                                                        .replace('.', ',')}{' '}
                                                    €
                                                </p>
                                            </td>
                                            <td className="px-3.5 md:px-8 py-2 md:py-4 text-right">
                                                <p className="font-bold text-gray-400 text-sm tabular-nums whitespace-nowrap">
                                                    {Number(item.costPrice || 0)
                                                        .toFixed(2)
                                                        .replace('.', ',')}{' '}
                                                    €
                                                </p>
                                            </td>
                                            <td className="px-3.5 md:px-8 py-2 md:py-4">
                                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                    {item.spicy && (
                                                        <span
                                                            className="flex items-center justify-center w-7 h-7 bg-red-50 text-[14px] rounded-lg border border-red-100 shadow-sm"
                                                            title={t.tags.spicy}
                                                        >
                                                            🌶️
                                                        </span>
                                                    )}
                                                    {item.vegetarian && (
                                                        <span
                                                            className="flex items-center justify-center w-7 h-7 bg-green-50 text-[14px] rounded-lg border border-green-100 shadow-sm"
                                                            title={t.tags.vegetarian}
                                                        >
                                                            🥬
                                                        </span>
                                                    )}
                                                    {item.isPopular && (
                                                        <span
                                                            className="flex items-center justify-center px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[9px] font-black rounded-md shadow-sm uppercase tracking-wider"
                                                            title={t.tags.isPopular}
                                                        >
                                                            TOP
                                                        </span>
                                                    )}
                                                    {item.isChefChoice && (
                                                        <span
                                                            className="flex items-center justify-center w-7 h-7 bg-purple-50 text-[14px] rounded-lg border border-purple-100 shadow-sm"
                                                            title={t.tags.isChefChoice}
                                                        >
                                                            👨‍🍳
                                                        </span>
                                                    )}
                                                    {item.isNew && (
                                                        <span
                                                            className="flex items-center justify-center px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-md shadow-sm uppercase tracking-wider"
                                                            title={t.tags.isNew}
                                                        >
                                                            NEW
                                                        </span>
                                                    )}
                                                    {item.allergens &&
                                                        item.allergens.length > 0 &&
                                                        item.allergens.map(allergen => {
                                                            const info = getAllergenInfo(allergen);
                                                            return (
                                                                <span
                                                                    key={allergen}
                                                                    className={`flex items-center justify-center w-7 h-7 ${info.bg} text-[14px] rounded-lg border ${info.border} shadow-sm`}
                                                                    title={allergen}
                                                                >
                                                                    {info.icon}
                                                                </span>
                                                            );
                                                        })}
                                                </div>
                                            </td>
                                            <td className="px-3.5 md:px-8 py-2 md:py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-white rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                                                        title={t.modal.edit}
                                                    >
                                                        <Edit2 size={18} strokeWidth={2} />
                                                    </button>
                                                    <button
                                                        onClick={() => setItemToDelete(item)}
                                                        className="p-3 text-gray-400 hover:text-orange-600 bg-gray-50 hover:bg-white rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                                                        title={t.table.actions}
                                                    >
                                                        <Trash2 size={18} strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredItems.length === 0 && (
                            <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Search size={32} />
                                </div>
                                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">
                                    {t.noDishes}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Modal CRUD */}
            {isModalOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-modal bg-gray-900/60 backdrop-blur-md overflow-y-auto overscroll-contain py-4 md:py-20 px-0 sm:px-4 flex justify-center items-start sm:items-center"
                        onClick={e => {
                            if (e.target === e.currentTarget) setIsModalOpen(false);
                        }}
                    >
                        <div className="bg-white sm:rounded-[40px] shadow-2xl w-full max-w-2xl relative animate-in zoom-in-95 duration-500 border border-white flex flex-col min-h-screen sm:min-h-0 max-h-[90vh] overflow-hidden">
                            <div className="flex-shrink-0 p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-white/95 backdrop-blur-xl z-20">
                                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">
                                    {editingItem ? t.modal.edit : t.modal.add}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 transition-all active:scale-90"
                                >
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                                <form id="menu-form" onSubmit={handleSave} className="space-y-6">
                                    {formError && (
                                        <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-orange-100 flex items-center gap-3 animate-in shake">
                                            <X
                                                size={16}
                                                strokeWidth={3}
                                                className="bg-orange-600 text-white rounded-full p-0.5"
                                            />
                                            {formError}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="item-name"
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                                            >
                                                {t.modal.name}
                                            </label>
                                            <input
                                                id="item-name"
                                                required
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-400 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="item-category"
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                                            >
                                                {t.modal.category}
                                            </label>
                                            <select
                                                id="item-category"
                                                required
                                                value={formData.category || ''}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        category: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-400 transition-all appearance-none"
                                            >
                                                {categoryList.map(cat => {
                                                    const localizedName = (t.categories as any)[
                                                        cat.id
                                                    ];
                                                    const displayLabel =
                                                        localizedName && localizedName !== cat.name
                                                            ? `${cat.name} (${localizedName})`
                                                            : cat.name;
                                                    return (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.emoji ? `${cat.emoji} ` : ''}
                                                            {displayLabel}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="item-price"
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                                            >
                                                {t.modal.price}
                                            </label>
                                            <input
                                                id="item-price"
                                                required
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.price || 0}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        price: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-400 transition-all tabular-nums"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {t.modal.costPrice}
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.costPrice || 0}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        costPrice: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-emerald-400 transition-all tabular-nums"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {t.modal.pieces}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.pieces || ''}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        pieces: e.target.value as any,
                                                    })
                                                }
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-400 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {t.modal.weight}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={t.modal.weightPlaceholder}
                                                value={formData.weight || ''}
                                                onChange={e =>
                                                    setFormData({
                                                        ...formData,
                                                        weight: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-400 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="item-description"
                                            className="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                                        >
                                            {t.modal.description}
                                        </label>
                                        <textarea
                                            id="item-description"
                                            required
                                            rows={3}
                                            value={formData.description || ''}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-400 transition-all resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {t.modal.imageLabel}
                                        </label>

                                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                                            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                                {formData.image ? (
                                                    <div className="relative group w-32 h-32 rounded-2xl overflow-hidden border border-gray-200 bg-white flex-shrink-0 shadow-sm">
                                                        <img
                                                            src={formData.image}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setFormData({
                                                                    ...formData,
                                                                    image: '',
                                                                })
                                                            }
                                                            className="absolute inset-0 bg-orange-600/90 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                                                        >
                                                            <Trash2 size={24} strokeWidth={2.5} />
                                                            <span className="text-[10px] font-black mt-1 uppercase tracking-widest">
                                                                Eliminar
                                                            </span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center flex-shrink-0 text-gray-300 shadow-sm">
                                                        <ImageIcon size={32} strokeWidth={1} />
                                                        <span className="text-[9px] font-black mt-2 uppercase tracking-widest">
                                                            No Imagen
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex-1 w-full space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            disabled={uploadingImage}
                                                            onClick={() =>
                                                                fileInputRef.current?.click()
                                                            }
                                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-black hover:text-white text-gray-900 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                        >
                                                            {uploadingImage ? (
                                                                <RefreshCw
                                                                    size={16}
                                                                    strokeWidth={3}
                                                                    className="animate-spin"
                                                                />
                                                            ) : (
                                                                <Upload size={16} strokeWidth={3} />
                                                            )}
                                                            {uploadingImage
                                                                ? t.modal.uploading
                                                                : t.modal.uploadBtn}
                                                        </button>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            onChange={handleImageUpload}
                                                            className="hidden"
                                                            accept="image/*"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                                                            <ImageIcon size={14} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={formData.image || ''}
                                                            onChange={e =>
                                                                setFormData({
                                                                    ...formData,
                                                                    image: e.target.value,
                                                                })
                                                            }
                                                            placeholder={t.modal.urlPlaceholder}
                                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold focus:border-orange-400 transition-all placeholder:text-gray-300 shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-gray-400 border-l-4 border-amber-100 pl-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                Propiedades
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {[
                                                'spicy',
                                                'vegetarian',
                                                'isPromo',
                                                'isPopular',
                                                'isChefChoice',
                                                'isNew',
                                            ].map(field => (
                                                <label
                                                    key={field}
                                                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                                                        (formData as any)[field]
                                                            ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm scale-[1.02]'
                                                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={!!(formData as any)[field]}
                                                        onChange={e =>
                                                            setFormData({
                                                                ...formData,
                                                                [field]: e.target.checked,
                                                            })
                                                        }
                                                        className="hidden"
                                                    />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {(t.tags as any)[field] ||
                                                            field
                                                                .replace('is_', '')
                                                                .replace('_', ' ')}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-gray-400 border-l-4 border-blue-100 pl-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {t.modal.allergens}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {[
                                                'gluten',
                                                'fish',
                                                'crustaceos',
                                                'soy',
                                                'lactose',
                                                'huevo',
                                                'nuts',
                                                'sesamo',
                                                'mostaza',
                                                'moluscos',
                                            ].map(allergen => {
                                                const info = getAllergenInfo(allergen);
                                                const isSelected =
                                                    formData.allergens?.includes(allergen);
                                                return (
                                                    <label
                                                        key={allergen}
                                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                                                            isSelected
                                                                ? `${info.bg} ${info.border} ${info.text} font-black shadow-sm scale-[1.02]`
                                                                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={!!isSelected}
                                                            onChange={e => {
                                                                const current =
                                                                    formData.allergens || [];
                                                                const updated = e.target.checked
                                                                    ? [...current, allergen]
                                                                    : current.filter(
                                                                          a => a !== allergen
                                                                      );
                                                                setFormData({
                                                                    ...formData,
                                                                    allergens: updated,
                                                                });
                                                            }}
                                                            className="hidden"
                                                        />
                                                        <span className="text-base font-normal">
                                                            {info.icon}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            {allergen}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 rounded-b-[32px] z-10 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-2xl transition-all"
                                >
                                    {t.modal.cancel}
                                </button>
                                <button
                                    type="submit"
                                    form="menu-form"
                                    disabled={upsertMutation.isPending}
                                    className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] bg-orange-600 text-white hover:bg-black rounded-2xl transition-all shadow-xl shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {upsertMutation.isPending && (
                                        <RefreshCw size={16} className="animate-spin" />
                                    )}
                                    {editingItem ? t.modal.save : t.modal.create}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Delete Confirmation Modal */}
            {itemToDelete &&
                createPortal(
                    <div
                        className="fixed inset-0 z-popover bg-gray-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain py-10 px-4 flex justify-center items-center"
                        onClick={e => {
                            if (e.target === e.currentTarget) setItemToDelete(null);
                        }}
                    >
                        <div className="relative bg-white rounded-[32px] p-10 max-sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-orange-100">
                                    <Trash2 size={36} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight uppercase">
                                    {t.delete.title}
                                </h3>
                                <p className="text-xs text-gray-400 font-bold mb-10 leading-relaxed uppercase tracking-widest">
                                    {t.delete.confirm.replace('{name}', '')}
                                    <br />
                                    <span className="text-orange-600 font-black">
                                        "{itemToDelete.name}"
                                    </span>
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => deleteMutation.mutate(itemToDelete.id)}
                                        disabled={deleteMutation.isPending}
                                        className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-orange-100 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {deleteMutation.isPending ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : null}
                                        {t.delete.yes}
                                    </button>
                                    <button
                                        onClick={() => setItemToDelete(null)}
                                        className="w-full py-5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all active:scale-95"
                                    >
                                        {t.delete.no}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Category Management Modal */}
            {isCategoryModalOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-popover bg-gray-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain py-6 sm:py-10 px-3 sm:px-4 flex justify-center items-center"
                        onClick={e => {
                            if (e.target === e.currentTarget) setIsCategoryModalOpen(false);
                        }}
                    >
                        <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <SlidersHorizontal size={18} className="text-orange-600" />
                                        <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                                            {t.categoryModal.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {t.categoryModal.desc}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 no-scrollbar">
                                {/* Success toast inside modal */}
                                {catSuccessToast && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in">
                                        <CheckCircle2
                                            size={20}
                                            className="text-emerald-600 shrink-0"
                                        />
                                        <span>{t.categoryModal.successMsg}</span>
                                    </div>
                                )}

                                {/* Categories List */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                                            {t.categoryModal.orderTitle} ({categoryList.length})
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={handleResetCategories}
                                            className="text-[10px] sm:text-[11px] font-black text-gray-400 hover:text-orange-600 uppercase tracking-wider transition-colors"
                                        >
                                            {t.categoryModal.resetBtn}
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {categoryList.map((cat, idx) => {
                                            const IconComp = cat.icon;
                                            return (
                                                <div
                                                    key={cat.id}
                                                    className="flex items-center justify-between p-3 sm:p-3.5 bg-gray-50 border border-gray-100 rounded-2xl hover:border-gray-200 transition-all gap-2 sm:gap-3"
                                                >
                                                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-gray-200 text-gray-400 text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-base sm:text-lg shrink-0 text-orange-600">
                                                            {IconComp ? (
                                                                <IconComp size={18} />
                                                            ) : (
                                                                cat.emoji || '🍽️'
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs sm:text-sm font-black text-gray-900 truncate">
                                                                    {cat.name}
                                                                </span>
                                                                {cat.isCustom && (
                                                                    <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-orange-100 text-orange-700 uppercase tracking-wider shrink-0">
                                                                        {
                                                                            t.categoryModal
                                                                                .customBadge
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono">
                                                                id: {cat.id}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            disabled={idx === 0}
                                                            onClick={() => handleMoveUp(idx)}
                                                            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                                                            title={t.categoryModal.moveUp}
                                                        >
                                                            <ArrowUp size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                idx === categoryList.length - 1
                                                            }
                                                            onClick={() => handleMoveDown(idx)}
                                                            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                                                            title={t.categoryModal.moveDown}
                                                        >
                                                            <ArrowDown size={15} />
                                                        </button>
                                                        {cat.isCustom && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteCategory(cat)
                                                                }
                                                                className="p-1.5 sm:p-2 text-red-500 hover:text-red-700 bg-white border border-red-100 hover:bg-red-50 rounded-xl transition-all active:scale-95 ml-0.5 sm:ml-1"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Add New Category Form */}
                                <form
                                    onSubmit={handleAddCategory}
                                    className="p-4 sm:p-5 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3.5"
                                >
                                    <h4 className="text-xs font-black text-orange-900 uppercase tracking-widest flex items-center gap-2">
                                        <Plus size={15} className="text-orange-600" />
                                        {t.categoryModal.addTitle}
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                {t.categoryModal.nameLabel} *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder={t.categoryModal.namePlaceholder}
                                                value={newCat.name}
                                                onChange={e => {
                                                    const nameVal = e.target.value;
                                                    setNewCat(prev => ({
                                                        ...prev,
                                                        name: nameVal,
                                                        id: prev.id
                                                            ? prev.id
                                                            : nameVal
                                                                  .toLowerCase()
                                                                  .trim()
                                                                  .replace(/\s+/g, '-')
                                                                  .replace(/[^a-z0-9-]/g, ''),
                                                    }));
                                                }}
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-orange-500 focus:outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                {t.categoryModal.idLabel} *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder={t.categoryModal.idPlaceholder}
                                                value={newCat.id}
                                                onChange={e =>
                                                    setNewCat(prev => ({
                                                        ...prev,
                                                        id: e.target.value
                                                            .toLowerCase()
                                                            .replace(/\s+/g, '-')
                                                            .replace(/[^a-z0-9-]/g, ''),
                                                    }))
                                                }
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold font-mono focus:border-orange-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                {t.categoryModal.iconLabel}
                                            </label>
                                            <select
                                                value={newCat.iconName}
                                                onChange={e =>
                                                    setNewCat(prev => ({
                                                        ...prev,
                                                        iconName: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-orange-500 focus:outline-none"
                                            >
                                                {AVAILABLE_CATEGORY_ICONS.map(i => (
                                                    <option key={i.id} value={i.id}>
                                                        {i.emoji} {i.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                {t.categoryModal.descLabel}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={t.categoryModal.descPlaceholder}
                                                value={newCat.description}
                                                onChange={e =>
                                                    setNewCat(prev => ({
                                                        ...prev,
                                                        description: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-orange-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-colors active:scale-95 shadow-sm"
                                    >
                                        + {t.categoryModal.addBtn}
                                    </button>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-xl transition-all active:scale-95"
                                >
                                    {t.categoryModal.close}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => saveCategoriesMutation.mutate(categoryList)}
                                    disabled={saveCategoriesMutation.isPending}
                                    className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-orange-600 hover:bg-black rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saveCategoriesMutation.isPending && (
                                        <RefreshCw size={14} className="animate-spin" />
                                    )}
                                    {saveCategoriesMutation.isPending
                                        ? t.categoryModal.savingBtn
                                        : t.categoryModal.saveBtn}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
