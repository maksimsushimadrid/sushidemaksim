import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Shield,
    Users as UsersIcon,
    RefreshCw,
    Crown,
    Calendar,
    CheckCircle,
    AlertCircle,
    Clock,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    Trash2,
    Search,
    X,
    RotateCcw,
    Eye,
} from 'lucide-react';

import { api, ApiError } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { UserAnalyticsTooltip } from './UserAnalyticsTooltip';

interface AdminUsersProps {
    language?: 'ru' | 'es';
}

const USERS_TRANSLATIONS = {
    ru: {
        searchPlaceholder: 'Поиск по ID, имени или email...',
        filters: {
            active: 'Только активные',
            archived: 'Только в архиве',
            all: 'Все',
        },
        refresh: 'Обновить',
        loading: 'Загрузка пользователей...',
        noUsers: 'Пользователи не найдены',
        table: {
            id: 'ID',
            nameEmail: 'Имя / Email',
            birthDate: 'ДР / Вер.',
            orders: 'Заказы',
            spent: 'Потрачено',
            activity: 'Активность',
            regDate: 'Рег.',
            role: 'Роль',
            actions: 'Действия',
        },
        roles: {
            superadmin: 'Владелец',
            admin: 'Админ',
            waiter: 'Официант',
            moderator: 'Модератор',
            user: 'Клиент',
        },
        status: {
            online: 'В сети',
            offline: 'Был(а) в сети',
            never: 'Никогда',
            archived: 'В архиве',
            verified: 'Email подтвержден',
            pending: 'Email ожидает подтверждения',
            verify: 'Подтвердить',
            manualVerify: 'Подтвердить вручную',
            noDate: 'Нет даты',
            birthVerified: 'Подтверждено',
            birthPending: 'Не подтверждено',
        },
        modals: {
            deleteTitle: 'Удалить пользователя НАВСЕГДА?',
            deleteConfirm: 'Вы собираетесь окончательно удалить {name} (ID: #{id}).',
            deleteWarning:
                'Внимание! Это действие необратимо. Будут удалены ВСЕ заказы, адреса и история этого пользователя.',
            changeRoleTitle: 'Сменить роль',
            changeRoleDesc: 'Выберите новую роль для:',
            confirmRole: 'ПОДТВЕРДИТЬ СМЕНУ',
            verifyEmailTitle: 'Подтвердить Email вручную?',
            verifyEmailDesc: 'Вы подтверждаете адрес {email} без отправки письма?',
            cancel: 'ОТМЕНА',
            yesDelete: 'ДА, УДАЛИТЬ СЕЙЧАС',
            confirm: 'ПОДТВЕРДИТЬ',
            restore: 'Восстановить',
        },
        time: {
            today: 'Сегодня',
        },
    },
    es: {
        searchPlaceholder: 'Buscar por ID, nombre o email...',
        filters: {
            active: 'Solo Activos',
            archived: 'Solo Archivados',
            all: 'Todos',
        },
        refresh: 'Actualizar',
        loading: 'Cargando usuarios...',
        noUsers: 'No se encontraron usuarios',
        table: {
            id: 'ID',
            nameEmail: 'Nombre / Email',
            birthDate: 'Cumple / Verif.',
            orders: 'Pedidos',
            spent: 'Gastado',
            activity: 'Actividad',
            regDate: 'Reg.',
            role: 'Rol',
            actions: 'Acciones',
        },
        roles: {
            superadmin: 'Owner',
            admin: 'Admin',
            waiter: 'Camarero',
            moderator: 'Moderador',
            user: 'Cliente',
        },
        status: {
            online: 'En línea',
            offline: 'Visto por última vez',
            never: 'Nunca',
            archived: 'Archivado',
            verified: 'Email verificado',
            pending: 'Email pendiente de verificación',
            verify: 'Verificar',
            manualVerify: 'Verificar email manualmente',
            noDate: 'Sin fecha',
            birthVerified: 'Verificado',
            birthPending: 'Sin Verificar',
        },
        modals: {
            deleteTitle: '¿Eliminar usuario PARA SIEMPRE?',
            deleteConfirm: 'Estás a punto de borrar definitivamente a {name} (ID: #{id}).',
            deleteWarning:
                '¡Atención! Esta acción es irreversible. Se ELIMINARÁN PARA SIEMPRE todos sus pedidos, direcciones, historial y cualquier dato asociado.',
            changeRoleTitle: 'Cambiar Rol',
            changeRoleDesc: 'Selecciona el nuevo rol para:',
            confirmRole: 'CONFIRMAR CAMBIO',
            verifyEmailTitle: '¿Verificar Email Manualmente?',
            verifyEmailDesc: '¿Deseas verificar el email {email} de forma manual?',
            cancel: 'CANCELAR',
            yesDelete: 'SÍ, ELIMINAR AHORA',
            confirm: 'CONFIRMAR',
            restore: 'Restaurar',
        },
        time: {
            today: 'Hoy',
        },
    },
} as const;

// --- UserRow Component ---
const UserRow = memo(
    ({
        user,
        currentUser,
        onToggleRole,
        onDelete,
        onRestore,
        onToggleBirthday,
        onVerifyEmail,
        language,
    }: {
        user: any;
        currentUser: any;
        onToggleRole: (user: any) => void;
        onDelete: (user: any) => void;
        onRestore: (user: any) => void;
        onToggleBirthday: (id: number, verified: boolean) => void;
        onVerifyEmail: (user: any) => void;
        language: 'ru' | 'es';
    }) => {
        const t = USERS_TRANSLATIONS[language];
        const { success } = useToast();
        const dateLocale = language === 'ru' ? 'ru-RU' : 'es-ES';

        const isOnline = user.lastSeenAt
            ? new Date().getTime() - new Date(user.lastSeenAt).getTime() < 5 * 60 * 1000
            : false;

        const lastSeenStr = user.lastSeenAt
            ? (() => {
                  const lastSeenDate = new Date(user.lastSeenAt);
                  const today = new Date();
                  if (lastSeenDate.toLocaleDateString() === today.toLocaleDateString()) {
                      return (
                          t.time.today +
                          ' ' +
                          lastSeenDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                      );
                  }
                  return lastSeenDate.toLocaleDateString(dateLocale, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                  });
              })()
            : t.status.never;

        const regDate = new Date(user.createdAt).toLocaleDateString(dateLocale);
        const birthDate = user.birthDate
            ? new Date(user.birthDate).toLocaleDateString(dateLocale)
            : null;

        const initials =
            user.name
                .split(' ')
                .filter(Boolean)
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '??';

        const [showTooltip, setShowTooltip] = useState(false);
        const triggerRef = useRef<HTMLDivElement>(null);

        return (
            <tr
                className={`hover:bg-gray-50/50 transition-all group ${user.deletedAt ? 'opacity-50 grayscale bg-gray-50/30' : ''}`}
            >
                <td
                    className="px-2 md:px-4 py-2 md:py-2.5 font-black text-gray-300 text-[9px] tabular-nums group-hover:text-gray-400 transition-colors cursor-pointer active:scale-95"
                    title={user.id}
                    onClick={() => {
                        navigator.clipboard.writeText(user.id);
                        success(language === 'ru' ? 'ID скопирован' : 'ID copiado');
                    }}
                >
                    {typeof user.id === 'string' && user.id.includes('-')
                        ? `#${user.id.slice(0, 8)}...`
                        : `#${user.id}`}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-2.5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-110">
                            {user.avatar ? (
                                user.avatar.startsWith('http') ? (
                                    <img
                                        src={`${user.avatar}${user.avatar.includes('?') ? '&' : '?'}t=${Date.now()}`}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                        onError={e => {
                                            (e.currentTarget as HTMLImageElement).style.display =
                                                'none';
                                            e.currentTarget.parentElement!.innerText = initials;
                                        }}
                                    />
                                ) : (
                                    <div className="text-2xl select-none">{user.avatar}</div>
                                )
                            ) : (
                                <div className="text-[10px] font-black text-gray-400 select-none uppercase tracking-tighter">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 w-full min-w-0">
                                <div
                                    ref={triggerRef}
                                    className="relative group/name cursor-help min-w-0 flex-shrink"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                >
                                    <div className="font-black text-gray-900 line-clamp-1 group-hover/name:text-orange-600 transition-colors">
                                        {user.name}
                                    </div>
                                    <UserAnalyticsTooltip
                                        isVisible={showTooltip}
                                        language={language}
                                        triggerRef={triggerRef}
                                        stats={{
                                            orderCount: user.orderCount,
                                            totalSpent: user.totalSpent,
                                            avgCheck: user.avgCheck || 0,
                                            frequency: user.frequency || 'N/A',
                                            favoriteDish: user.favoriteDish || 'N/A',
                                            registrationDate: user.createdAt,
                                        }}
                                    />
                                </div>
                                {user.isVerified ? (
                                    <span
                                        title={t.status.verified}
                                        className="text-green-500 bg-green-50 p-1 rounded-lg border border-green-100 shadow-sm shrink-0"
                                    >
                                        <CheckCircle size={10} strokeWidth={3} />
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span
                                            title={t.status.pending}
                                            className="text-amber-500 bg-amber-50 p-1 rounded-lg border border-amber-100 shadow-sm animate-pulse"
                                        >
                                            <Clock size={10} strokeWidth={3} />
                                        </span>
                                        <button
                                            onClick={() => onVerifyEmail(user)}
                                            className="px-2 py-0.5 bg-blue-600 text-white hover:bg-black rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                            title={t.status.manualVerify}
                                        >
                                            {t.status.verify}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="text-gray-400 text-[10px] font-bold line-clamp-1">
                                {user.email}
                            </div>
                            {user.phone && (
                                <div className="text-gray-400 text-[9px] font-bold mt-0.5 tracking-tight tabular-nums">
                                    {user.phone}
                                </div>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-2 md:px-4 py-2 md:py-2.5 min-w-[120px]">
                    <div className="flex flex-col gap-1.5">
                        {birthDate ? (
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-700 bg-gray-100/50 px-2 py-0.5 rounded-lg w-fit border border-gray-100 whitespace-nowrap">
                                <Calendar size={10} strokeWidth={2} className="text-orange-400" />
                                <span className="tabular-nums">{birthDate}</span>
                            </div>
                        ) : (
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">
                                {t.status.noDate}
                            </span>
                        )}

                        {birthDate && (
                            <button
                                onClick={() => onToggleBirthday(user.id, user.isBirthDateVerified)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-tighter w-fit transition-all border shadow-sm active:scale-95 whitespace-nowrap ${
                                    user.isBirthDateVerified
                                        ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-600 hover:text-white'
                                        : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-600 hover:text-white'
                                }`}
                            >
                                {user.isBirthDateVerified ? (
                                    <>
                                        <CheckCircle size={10} strokeWidth={3} />{' '}
                                        {t.status.birthVerified}
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={10} strokeWidth={3} />{' '}
                                        {t.status.birthPending}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </td>
                <td className="px-2 md:px-4 py-2 md:py-2.5 text-center">
                    <div className="inline-flex items-center justify-center bg-gray-50 text-gray-900 w-8 h-8 rounded-xl font-black text-xs border border-gray-100 shadow-inner tabular-nums">
                        {user.orderCount}
                    </div>
                </td>
                <td className="px-2 md:px-4 py-2 md:py-2.5 text-center">
                    <div className="font-black text-orange-600 text-sm tabular-nums whitespace-nowrap">
                        {Number(user.totalSpent || 0)
                            .toFixed(2)
                            .replace('.', ',')}{' '}
                        €
                    </div>
                </td>

                <td className="px-2 md:px-4 py-2 md:py-2.5">
                    <div className="flex flex-col gap-1">
                        {user.lastSeenAt ? (
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 w-fit">
                                {isOnline ? (
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 border-2 border-white shadow-sm"></span>
                                    </div>
                                ) : (
                                    <div className="h-2 w-2 rounded-full bg-gray-300 border-2 border-white shadow-sm"></div>
                                )}
                                <span className="text-gray-700 font-black text-[10px] tabular-nums tracking-tight">
                                    {lastSeenStr}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-300 bg-gray-50/30 px-3 py-1.5 rounded-xl border border-dashed border-gray-100 w-fit">
                                <Clock size={12} strokeWidth={2} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {t.status.never}
                                </span>
                            </div>
                        )}
                    </div>
                </td>
                <td className="px-2 md:px-4 py-2 md:py-2.5 text-center text-[10px] font-bold text-gray-400 tabular-nums">
                    {regDate}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-2.5 text-center min-w-[110px]">
                    <div className="flex flex-col items-center gap-1">
                        {user.isSuperadmin ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border border-amber-100 shadow-sm whitespace-nowrap">
                                <Crown size={10} strokeWidth={2.5} /> {t.roles.superadmin}
                            </span>
                        ) : user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border border-orange-100/50 shadow-sm whitespace-nowrap">
                                <Shield size={10} strokeWidth={2.5} /> {t.roles.admin}
                            </span>
                        ) : user.role === 'waiter' ? (
                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border border-orange-100/50 shadow-sm whitespace-nowrap">
                                <Clock size={10} strokeWidth={2.5} /> {t.roles.waiter}
                            </span>
                        ) : user.role === 'moderator' ? (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border border-purple-100 shadow-sm whitespace-nowrap">
                                <Eye size={10} strokeWidth={2.5} /> {t.roles.moderator}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border border-gray-200 whitespace-nowrap">
                                <UsersIcon size={10} strokeWidth={2.5} /> {t.roles.user}
                            </span>
                        )}
                        {user.deletedAt && (
                            <span className="inline-flex items-center gap-1 bg-black text-white px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-lg whitespace-nowrap">
                                {t.status.archived}
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-2 md:px-4 py-2 md:py-2.5 text-center sticky right-0 bg-white/95 backdrop-blur-sm shadow-[-10px_0_15px_rgba(0,0,0,0.03)] border-l border-gray-100 group-hover:bg-gray-50/95 transition-colors">
                    {!user.isSuperadmin && (
                        <div className="flex items-center justify-center gap-1.5">
                            {user.deletedAt ? (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => onRestore(user)}
                                        className="p-1.5 px-2.5 flex items-center gap-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border border-green-100 shadow-sm active:scale-95 whitespace-nowrap"
                                        title={t.modals.restore}
                                    >
                                        <RotateCcw size={12} strokeWidth={3} /> {t.modals.restore}
                                    </button>
                                    <button
                                        onClick={() => onDelete(user)}
                                        className="p-1.5 text-orange-600 hover:bg-orange-600 hover:text-white bg-orange-50 rounded-lg border border-orange-100 transition-all shadow-sm active:scale-95 animate-pulse-subtle shrink-0"
                                        title={t.modals.deleteTitle}
                                    >
                                        <Trash2 size={16} strokeWidth={2} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {currentUser?.isSuperadmin && (
                                        <button
                                            onClick={() => onToggleRole(user)}
                                            className="px-3 py-1.5 bg-white text-gray-600 hover:bg-black hover:text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border border-gray-200 shadow-sm active:scale-95 whitespace-nowrap"
                                        >
                                            {t.table.role}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(user)}
                                        className="p-1.5 text-gray-300 hover:text-orange-600 bg-gray-50 hover:bg-white rounded-lg border border-gray-100 transition-all shadow-sm active:scale-95 shrink-0"
                                        title={t.modals.deleteTitle}
                                    >
                                        <Trash2 size={16} strokeWidth={2} />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </td>
            </tr>
        );
    }
);

export default function AdminUsers({ language = 'es' }: AdminUsersProps) {
    const { success } = useToast();
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    const t = USERS_TRANSLATIONS[language];

    // UI state
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'lastSeenAt', order: 'desc' });
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter] = useState('active'); // 'active', 'archived', 'all'

    // Modal state
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [userToChangeRole, setUserToChangeRole] = useState<any>(null);
    const [userToVerify, setUserToVerify] = useState<any>(null);
    const [selectedNewRole, setSelectedNewRole] = useState<
        'user' | 'admin' | 'waiter' | 'moderator'
    >('user');

    const LIMIT = 20;

    // Set initial role when modal opens
    useEffect(() => {
        if (userToChangeRole) {
            setSelectedNewRole(userToChangeRole.role || 'user');
        }
    }, [userToChangeRole]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Users Query
    // Prevent background scrolling when modal is open
    useEffect(() => {
        const hasOpenModal = userToDelete || userToChangeRole || userToVerify;
        if (hasOpenModal) {
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
    }, [userToDelete, userToChangeRole, userToVerify]);

    const {
        data,
        isLoading,
        error: fetchError,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['admin-users', page, sort.field, sort.order, debouncedSearch, filter],
        queryFn: () =>
            api.get(
                `/admin/users?page=${page}&limit=${LIMIT}&sortBy=${sort.field}&order=${sort.order}&search=${debouncedSearch}&filter=${filter}`
            ),
    });

    const users = data?.users || [];
    const pagination = data?.pagination || { page: 1, limit: LIMIT, total: 0, pages: 1 };

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (userId: number) => api.delete(`/admin/users/${userId}`),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            if (data?.message) {
                success(data.message);
            } else {
                success(language === 'ru' ? 'Пользователь удален' : 'Usuario eliminado');
            }
        },
    });

    const roleMutation = useMutation({
        mutationFn: ({ id, role }: { id: number; role: string }) =>
            api.patch(`/admin/users/${id}/role`, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });

    const verifyEmailMutation = useMutation({
        mutationFn: (id: number) =>
            api.patch(`/admin/users/${id}/verify-email`, { isVerified: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });

    const verifyBirthdayMutation = useMutation({
        mutationFn: ({ id, verified }: { id: number; verified: boolean }) =>
            api.patch(`/admin/users/${id}/verify-birthday`, { verified }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });

    const restoreMutation = useMutation({
        mutationFn: (userId: number) => api.patch(`/admin/users/${userId}/restore`),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            if (data?.message) {
                success(data.message);
            } else {
                success(language === 'ru' ? 'Пользователь восстановлен' : 'Usuario restaurado');
            }
        },
    });

    const handleSort = (field: string) => {
        setSort(prev => ({
            field,
            order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
        }));
    };

    const confirmRoleChange = () => {
        if (userToChangeRole) {
            roleMutation.mutate({ id: userToChangeRole.id, role: selectedNewRole });
        }
        setUserToChangeRole(null);
    };

    const confirmVerifyEmail = async () => {
        if (!userToVerify) return;
        verifyEmailMutation.mutate(userToVerify.id);
        setUserToVerify(null);
    };

    const toggleBirthdayVerified = useCallback(
        (userId: number, currentVerified: boolean) => {
            verifyBirthdayMutation.mutate({ id: userId, verified: !currentVerified });
        },
        [verifyBirthdayMutation]
    );

    if (isLoading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <RefreshCw
                    className="animate-spin text-orange-600 mb-6"
                    size={48}
                    strokeWidth={2}
                />
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    {t.loading}
                </p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search Bar */}
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full max-w-md">
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
                        className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-bold focus:bg-white focus:border-orange-400 transition-all placeholder:text-gray-400 shadow-inner"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 border-none bg-transparent cursor-pointer p-1"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                        <select
                            value={filter}
                            onChange={e => {
                                setFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-700 appearance-none cursor-pointer focus:bg-white focus:border-orange-400 transition-all shadow-sm"
                        >
                            <option value="active">{t.filters.active}</option>
                            <option value="archived">{t.filters.archived}</option>
                            <option value="all">{t.filters.all}</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown size={14} strokeWidth={3} />
                        </div>
                    </div>

                    <button
                        onClick={() => refetch()}
                        className="p-2.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-white border border-gray-100 rounded-xl shadow-sm transition-all active:scale-95"
                        title={t.refresh}
                    >
                        <RefreshCw
                            size={20}
                            strokeWidth={2}
                            className={isFetching ? 'animate-spin' : ''}
                        />
                    </button>
                </div>
            </div>

            {fetchError && (
                <div className="bg-orange-50 text-orange-600 p-5 rounded-2xl mb-6 border-2 border-orange-100 flex items-center gap-4 animate-in shake duration-500 shadow-xl shadow-orange-50">
                    <div className="bg-orange-600 p-2 rounded-lg">
                        <AlertCircle className="text-white" size={20} strokeWidth={2} />
                    </div>
                    <p className="font-black uppercase tracking-tight text-sm">
                        {fetchError instanceof ApiError ? fetchError.message : 'Error'}
                    </p>
                </div>
            )}

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-100">
                            <tr>
                                <th
                                    className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 transition"
                                    onClick={() => handleSort('id')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t.table.id}
                                        {sort.field === 'id' ? (
                                            sort.order === 'desc' ? (
                                                <ChevronDown
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            ) : (
                                                <ChevronUp
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            )
                                        ) : (
                                            <ArrowUpDown
                                                size={12}
                                                strokeWidth={2}
                                                className="opacity-30"
                                            />
                                        )}
                                    </div>
                                </th>
                                <th className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {t.table.nameEmail}
                                </th>
                                <th className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {t.table.birthDate}
                                </th>
                                <th
                                    className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-gray-100/50 transition"
                                    onClick={() => handleSort('orderCount')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {t.table.orders}
                                        {sort.field === 'orderCount' ? (
                                            sort.order === 'desc' ? (
                                                <ChevronDown
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            ) : (
                                                <ChevronUp
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            )
                                        ) : (
                                            <ArrowUpDown
                                                size={12}
                                                strokeWidth={2}
                                                className="opacity-30"
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-gray-100/50 transition"
                                    onClick={() => handleSort('totalSpent')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {t.table.spent}
                                        {sort.field === 'totalSpent' ? (
                                            sort.order === 'desc' ? (
                                                <ChevronDown
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            ) : (
                                                <ChevronUp
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            )
                                        ) : (
                                            <ArrowUpDown
                                                size={12}
                                                strokeWidth={2}
                                                className="opacity-30"
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 transition"
                                    onClick={() => handleSort('lastSeenAt')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t.table.activity}
                                        {sort.field === 'lastSeenAt' ? (
                                            sort.order === 'desc' ? (
                                                <ChevronDown
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            ) : (
                                                <ChevronUp
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            )
                                        ) : (
                                            <ArrowUpDown
                                                size={12}
                                                strokeWidth={2}
                                                className="opacity-30"
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 transition"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t.table.regDate}
                                        {sort.field === 'createdAt' ? (
                                            sort.order === 'desc' ? (
                                                <ChevronDown
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            ) : (
                                                <ChevronUp
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            )
                                        ) : (
                                            <ArrowUpDown
                                                size={12}
                                                strokeWidth={2}
                                                className="opacity-30"
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-gray-100/50 transition"
                                    onClick={() => handleSort('role')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {t.table.role}
                                        {sort.field === 'role' ? (
                                            sort.order === 'desc' ? (
                                                <ChevronDown
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            ) : (
                                                <ChevronUp
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-orange-500"
                                                />
                                            )
                                        ) : (
                                            <ArrowUpDown
                                                size={12}
                                                strokeWidth={2}
                                                className="opacity-30"
                                            />
                                        )}
                                    </div>
                                </th>
                                <th className="px-2 md:px-4 py-2.5 md:py-3 text-[9px] font-black uppercase tracking-widest text-center whitespace-nowrap sticky right-0 bg-gray-50/95 backdrop-blur-sm shadow-[-10px_0_15px_rgba(0,0,0,0.03)] border-l border-gray-100 z-10">
                                    {t.table.actions}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {users.map((user: any) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    currentUser={currentUser}
                                    onToggleRole={setUserToChangeRole}
                                    onDelete={setUserToDelete}
                                    onRestore={u => restoreMutation.mutate(u.id)}
                                    onToggleBirthday={toggleBirthdayVerified}
                                    onVerifyEmail={setUserToVerify}
                                    language={language}
                                />
                            ))}
                            {!isLoading && users.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-5 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                                <Search size={32} />
                                            </div>
                                            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">
                                                {t.noUsers}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div className="p-6 border-t border-gray-100 flex justify-center gap-3 bg-gray-50/50">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm transition-all shadow-sm active:scale-90 border ${
                                    pageNum === page
                                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-200 scale-110'
                                        : 'bg-white text-gray-400 border-gray-100 hover:border-orange-400 hover:text-orange-500'
                                }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Permanent Delete Confirmation Modal */}
            {userToDelete &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setUserToDelete(null)}
                        />
                        <div className="relative bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <Trash2 size={40} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight uppercase">
                                    {t.modals.deleteTitle}
                                </h3>
                                <p className="text-[12px] text-gray-400 font-bold mb-8 leading-relaxed uppercase tracking-widest">
                                    {t.modals.deleteConfirm
                                        .replace('{name}', '')
                                        .replace('{id}', '')}
                                    <span className="text-orange-600 font-black block mt-2 text-base">
                                        {userToDelete.name} (ID: #{userToDelete.id})
                                    </span>
                                </p>
                                <div className="p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl mb-10">
                                    <p className="text-orange-700 font-black text-[10px] uppercase tracking-widest leading-relaxed">
                                        {t.modals.deleteWarning}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            deleteMutation.mutate(userToDelete.id);
                                            setUserToDelete(null);
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-orange-100 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {deleteMutation.isPending && (
                                            <RefreshCw size={16} className="animate-spin" />
                                        )}
                                        {t.modals.yesDelete}
                                    </button>
                                    <button
                                        onClick={() => setUserToDelete(null)}
                                        className="w-full py-5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all active:scale-95"
                                    >
                                        {t.modals.cancel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Role Change Confirmation Modal */}
            {userToChangeRole &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] bg-gray-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain py-10 px-4 flex justify-center items-center"
                        onClick={e => {
                            if (e.target === e.currentTarget) setUserToChangeRole(null);
                        }}
                    >
                        <div className="relative bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-amber-100">
                                    <Shield size={40} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight uppercase">
                                    {t.modals.changeRoleTitle}
                                </h3>
                                <p className="text-[11px] text-gray-400 font-bold mb-8 uppercase tracking-widest leading-relaxed">
                                    {t.modals.changeRoleDesc}
                                    <br />
                                    <span className="block mt-2 font-black text-gray-900 text-lg tracking-tight">
                                        {userToChangeRole.name}
                                    </span>
                                </p>

                                <div className="grid grid-cols-1 gap-3 mb-10">
                                    {[
                                        {
                                            id: 'user',
                                            label: t.roles.user,
                                            icon: UsersIcon,
                                            color: 'gray',
                                        },
                                        {
                                            id: 'waiter',
                                            label: t.roles.waiter,
                                            icon: Clock,
                                            color: 'orange',
                                        },
                                        {
                                            id: 'admin',
                                            label: t.roles.admin,
                                            icon: Shield,
                                            color: 'red',
                                        },
                                        {
                                            id: 'moderator',
                                            label: t.roles.moderator,
                                            icon: Eye,
                                            color: 'purple',
                                        },
                                    ].map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => setSelectedNewRole(r.id as any)}
                                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left group/role ${
                                                selectedNewRole === r.id
                                                    ? `bg-${r.color}-50 border-${r.color === 'gray' ? 'gray-400' : r.color + '-500'} text-${r.color === 'gray' ? 'gray-900' : r.color + '-900'} shadow-sm scale-[1.02]`
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                                            }`}
                                        >
                                            <div
                                                className={`p-2 rounded-xl transition-colors ${selectedNewRole === r.id ? `bg-${r.color === 'gray' ? 'gray-200' : r.color + '-100'}` : 'bg-gray-50'}`}
                                            >
                                                <r.icon size={20} strokeWidth={2.5} />
                                            </div>
                                            <span className="font-black text-xs uppercase tracking-widest">
                                                {r.label}
                                            </span>
                                            {selectedNewRole === r.id && (
                                                <div className="ml-auto bg-white rounded-full p-1 shadow-sm border border-current/20">
                                                    <CheckCircle size={16} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={confirmRoleChange}
                                        disabled={roleMutation.isPending}
                                        className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-orange-100 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {roleMutation.isPending && (
                                            <RefreshCw size={16} className="animate-spin" />
                                        )}
                                        {t.modals.confirmRole}
                                    </button>
                                    <button
                                        onClick={() => setUserToChangeRole(null)}
                                        className="w-full py-5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all active:scale-95"
                                    >
                                        {t.modals.cancel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Email Verify Confirmation Modal */}
            {userToVerify &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] bg-gray-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain py-10 px-4 flex justify-center items-center"
                        onClick={e => {
                            if (e.target === e.currentTarget) setUserToVerify(null);
                        }}
                    >
                        <div className="relative bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-100">
                                    <CheckCircle size={40} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight uppercase">
                                    {t.modals.verifyEmailTitle}
                                </h3>
                                <p className="text-[11px] text-gray-400 font-bold mb-10 leading-relaxed uppercase tracking-widest">
                                    {t.modals.verifyEmailDesc.replace('{email}', '')}
                                    <br />
                                    <span className="text-blue-600 font-black block mt-2 text-base italic">
                                        {userToVerify.email}
                                    </span>
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={confirmVerifyEmail}
                                        disabled={verifyEmailMutation.isPending}
                                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {verifyEmailMutation.isPending && (
                                            <RefreshCw size={16} className="animate-spin" />
                                        )}
                                        {t.modals.confirm}
                                    </button>
                                    <button
                                        onClick={() => setUserToVerify(null)}
                                        className="w-full py-5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all active:scale-95"
                                    >
                                        {t.modals.cancel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
