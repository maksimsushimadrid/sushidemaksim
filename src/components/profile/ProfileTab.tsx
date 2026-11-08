import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Edit3,
    Save,
    X,
    Phone,
    Mail,
    Shield,
    Eye,
    EyeOff,
    Calendar,
    Trash2,
    Camera,
    RotateCcw,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { User as UserType } from '../../types';
import { getSharpAvatar } from '../../utils/avatar';
import { USER_QUERY_KEY } from '../../hooks/queries/useUser';
import SafeImage from '../common/SafeImage';

interface Props {
    user: UserType;
    updateProfile: (
        data: Partial<Pick<UserType, 'name' | 'email' | 'phone' | 'avatar' | 'birthDate'>>
    ) => Promise<void>;
}

const AVATAR_CATEGORIES = [
    {
        name: 'Sushi & Food',
        icons: ['🍣', '🍱', '🍙', '🍥', '🍜', '🥟', '🍤', '🥢', '🍵', '🍶', '🍢', '🍡'],
    },
    {
        name: 'Personajes',
        icons: ['🥷', '🧑‍🍳', '🦹', '🦸', '🧙', '🧛', '👹', '👺', '👻', '👾', '🤖', '👽', '💀', '🤡'],
    },
    {
        name: 'Animales Cool',
        icons: ['🐼', '🦊', '🐱', '🐶', '🐉', '🦖', '🦄', '🦁', '🐯', '🐻', '🐒', '🦉', '🦋', '🐟'],
    },
    {
        name: 'Estilo & Japan',
        icons: [
            '🏮',
            '⛩️',
            '🏯',
            '🗻',
            '🚀',
            '💎',
            '🔥',
            '⚡',
            '🌈',
            '👑',
            '🕶️',
            '🎸',
            '🎮',
            '🛹',
            '🧘',
        ],
    },
];

export default function ProfileTab({ user, updateProfile }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [editBirthDate, setEditBirthDate] = useState('');

    // Change password state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showCurrPwd, setShowCurrPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form Refs for reliable Safari capture
    const nameRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const birthDateRef = useRef<HTMLInputElement>(null);
    const currentPasswordRef = useRef<HTMLInputElement>(null);
    const newPasswordRef = useRef<HTMLInputElement>(null);
    const confirmNewPasswordRef = useRef<HTMLInputElement>(null);
    const isSubmitting = useRef(false);
    const queryClient = useQueryClient();
    const { deleteAccount } = useAuth();
    const { success, error } = useToast();

    const completionPct = useMemo(() => {
        let pct = 0;
        if (user.email) pct += 20;
        if (
            user.name &&
            user.name.trim() !== '' &&
            !user.name.toLowerCase().includes('invitado') &&
            !user.name.toLowerCase().includes('guest')
        )
            pct += 25;
        if (user.phone && user.phone.trim() !== '') pct += 25;
        if (user.birthDate && user.birthDate.trim() !== '') pct += 15;
        if (user.avatar && user.avatar.trim() !== '') pct += 15;
        return pct;
    }, [user]);

    const missingFields = useMemo(() => {
        const missing = [];
        if (
            !user.name ||
            user.name.trim() === '' ||
            user.name.toLowerCase().includes('invitado') ||
            user.name.toLowerCase().includes('guest')
        ) {
            missing.push({ field: 'name', label: 'Añade tu nombre completo (+25%)' });
        }
        if (!user.phone || user.phone.trim() === '') {
            missing.push({ field: 'phone', label: 'Añade tu número de teléfono (+25%)' });
        }
        if (!user.birthDate || user.birthDate.trim() === '') {
            missing.push({
                field: 'birthDate',
                label: 'Añade tu cumpleaños (+15%) para recibir un regalo especial',
            });
        }
        if (!user.avatar || user.avatar.trim() === '') {
            missing.push({ field: 'avatar', label: 'Elige un avatar o sube una foto (+15%)' });
        }
        return missing;
    }, [user]);

    const handleCompleteField = (field: string) => {
        if (!isEditing) {
            startEditing();
        }
        setTimeout(() => {
            if (field === 'name') {
                nameRef.current?.focus();
                nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (field === 'phone') {
                phoneRef.current?.focus();
                phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (field === 'birthDate') {
                birthDateRef.current?.focus();
                birthDateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (field === 'avatar') {
                const element = document.getElementById('avatar-grid');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 100);
    };

    // Calculate initials based on current editing state or original user data
    const currentInitials =
        (isEditing ? editName || '?' : user.name || '?')
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??';

    const startEditing = () => {
        setEditName(user.name);
        setEditPhone(user.phone);
        setEditEmail(user.email);
        setEditAvatar(user.avatar || '');

        if (user.birthDate) {
            const dateStr = user.birthDate.split('T')[0];
            setEditBirthDate(dateStr);
        } else {
            setEditBirthDate('');
        }
        setIsEditing(true);
    };

    const saveProfile = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isSubmitting.current) return;

        // Safari Sync Hack
        [nameRef, phoneRef, birthDateRef].forEach(ref => {
            if (ref.current) {
                ref.current.focus();
                ref.current.blur();
            }
        });

        const nameVal = (nameRef.current?.value || '').trim();
        const phoneVal = (phoneRef.current?.value || '').trim();
        const birthDateVal = birthDateRef.current?.value || '';

        const dataToSave: Partial<
            Pick<UserType, 'name' | 'email' | 'phone' | 'avatar' | 'birthDate'>
        > = {
            avatar: editAvatar,
            name: nameVal || user.name,
            birthDate: birthDateVal,
        };

        if (phoneVal) {
            const cleanPhone = phoneVal.replace(/\D/g, '').slice(0, 9);
            dataToSave.phone = cleanPhone ? `+34${cleanPhone}` : '';
        } else {
            dataToSave.phone = '';
        }

        if (dataToSave.birthDate) {
            const birthYear = new Date(dataToSave.birthDate).getFullYear();
            if (birthYear < 1945) {
                error('El año de nacimiento no puede ser inferior a 1945');
                return;
            }
            if (new Date(dataToSave.birthDate) > new Date()) {
                error('La fecha de nacimiento no puede ser en el futuro');
                return;
            }
        }

        try {
            isSubmitting.current = true;
            const res = (await updateProfile(dataToSave)) as any;
            setIsEditing(false);
            success(res?.message || '¡Perfil actualizado con éxito! 🍣');
        } catch (err: any) {
            error(err.message || 'Error al actualizar el perfil');
        } finally {
            isSubmitting.current = false;
        }
    };

    const handleChangePassword = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isSubmitting.current) return;

        // Safari Sync Hack
        [currentPasswordRef, newPasswordRef, confirmNewPasswordRef].forEach(ref => {
            if (ref.current) {
                ref.current.focus();
                ref.current.blur();
            }
        });

        const currentPwdVal = currentPasswordRef.current?.value || '';
        const newPwdVal = newPasswordRef.current?.value || '';
        const confirmPwdVal = confirmNewPasswordRef.current?.value || '';

        if (!currentPwdVal || !newPwdVal || !confirmPwdVal) {
            error('Por favor, rellena todos los campos de contraseña');
            return;
        }

        if (newPwdVal.length < 6) {
            error('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (newPwdVal !== confirmPwdVal) {
            error('Las contraseñas no coinciden');
            return;
        }

        try {
            isSubmitting.current = true;
            const { api } = await import('../../utils/api');
            await api.put('/user/change-password', {
                currentPassword: currentPwdVal,
                newPassword: newPwdVal,
            });
            success('¡Contraseña actualizada correctamente! 🔐');
            setShowChangePassword(false);
        } catch (err: any) {
            error(err.message || 'Error al cambiar la contraseña');
        } finally {
            isSubmitting.current = false;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (file.size > 5 * 1024 * 1024) {
            error('La imagen no debe superar los 5MB');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            error('Formato no permitido. Usa JPG, PNG o WebP');
            return;
        }

        try {
            setIsUploading(true);
            const { api } = await import('../../utils/api');
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await api.formData('/user/upload-avatar', formData);
            if (!res.url) throw new Error('No se recibió la URL de la imagen');

            // Force query refresh immediately to sync global state
            await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
            setEditAvatar(res.url);
            success('¡Foto de perfil subida con éxito! 📸');
        } catch (err: any) {
            error(err.message || 'Error al subir la imagen');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Actions */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight m-0">
                        {isEditing ? 'Editar Perfil' : 'Datos Personales'}
                    </h2>
                    <p className="text-gray-400 text-[11px] md:text-xs m-0 mt-0.5 font-medium">
                        Gestiona tu información básica y seguridad
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {!isEditing ? (
                        <button
                            onClick={startEditing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl font-extrabold text-xs hover:bg-orange-600 transition-all active:scale-95 cursor-pointer border-none"
                        >
                            <Edit3 size={14} strokeWidth={2} /> Editar
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-600 rounded-xl font-extrabold text-xs hover:bg-gray-200 transition-all active:scale-95 cursor-pointer border-none"
                            >
                                <X size={14} strokeWidth={2} /> <span>Cancelar</span>
                            </button>
                            <button
                                type="submit"
                                form="profile-form"
                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl font-extrabold text-xs hover:bg-orange-700 transition-all active:scale-95 cursor-pointer border-none"
                            >
                                <Save size={14} strokeWidth={2} /> Guardar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Profile Completion Section - Flat (No Nested Box) */}
            {completionPct < 100 && (
                <div className="pb-5 border-b border-gray-100">
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider m-0">
                                Progreso de tu perfil
                            </h3>
                            <p className="text-[11px] text-gray-400 font-medium m-0">
                                Completa tu perfil para asegurar tu cuenta y recibir regalos
                            </p>
                        </div>
                        <span className="text-sm font-black text-orange-600 leading-none">
                            {completionPct}%
                        </span>
                    </div>

                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-orange-500 transition-all duration-500"
                            style={{ width: `${completionPct}%` }}
                        />
                    </div>

                    {missingFields.length > 0 && (
                        <div className="divide-y divide-gray-100 mt-3">
                            {missingFields.map(f => (
                                <div
                                    key={f.field}
                                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                                >
                                    <span className="text-xs font-medium text-gray-600 leading-snug">
                                        {f.label}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCompleteField(f.field)}
                                        className="text-xs font-extrabold text-orange-600 hover:text-orange-700 bg-transparent border-none p-0 cursor-pointer shrink-0"
                                    >
                                        Completar →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Information Grid Wrapped in Form - Flat */}
            <form
                id="profile-form"
                onSubmit={saveProfile}
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5"
            >
                {[
                    {
                        label: 'Nombre Completo',
                        value: user.name,
                        editedValue: editName,
                        setter: setEditName,
                        icon: User,
                        type: 'text',
                    },
                    {
                        label: 'Correo Electrónico',
                        value: user.email,
                        editedValue: editEmail,
                        setter: setEditEmail,
                        icon: Mail,
                        type: 'email',
                        disabled: true,
                    },
                    {
                        label: 'Teléfono',
                        value: user.phone || 'No añadido',
                        editedValue: editPhone,
                        setter: setEditPhone,
                        icon: Phone,
                        type: 'tel',
                    },
                    {
                        label: 'Fecha de Cumpleaños',
                        value: user.birthDate
                            ? (() => {
                                  const [y, m, d] = user.birthDate.split('T')[0].split('-');
                                  return `${d}.${m}.${y}`;
                              })()
                            : 'No añadida',
                        editedValue: editBirthDate,
                        setter: setEditBirthDate,
                        icon: Calendar,
                        type: 'date',
                        min: '1945-01-01',
                        max: new Date().toISOString().split('T')[0],
                    },
                ].map(field => (
                    <div
                        key={field.label}
                        className="pb-3.5 border-b border-gray-100 flex flex-col justify-between"
                    >
                        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                            <field.icon size={12} strokeWidth={2} className="text-orange-500" />
                            {field.label}
                        </label>

                        {isEditing ? (
                            <div className="flex flex-col gap-1">
                                {field.label === 'Teléfono' ? (
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-orange-500 transition-all overflow-hidden h-[42px]">
                                        <div className="pl-3.5 pr-2 text-gray-400 font-bold text-sm select-none border-r border-gray-200 h-full flex items-center">
                                            +34
                                        </div>
                                        <input
                                            ref={phoneRef}
                                            type="tel"
                                            name="phone"
                                            defaultValue={field.editedValue.replace(/^\+34/, '')}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const val = e.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 9);
                                                field.setter(val ? `+34${val}` : '');
                                            }}
                                            className="w-full bg-transparent border-none px-3 py-2 text-sm font-bold outline-none text-gray-900"
                                            placeholder="600 000 000"
                                            maxLength={9}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        ref={
                                            field.label === 'Nombre Completo'
                                                ? nameRef
                                                : field.label === 'Fecha de Cumpleaños'
                                                  ? birthDateRef
                                                  : undefined
                                        }
                                        type={field.type}
                                        name={
                                            field.label === 'Nombre Completo'
                                                ? 'name'
                                                : field.label === 'Correo Electrónico'
                                                  ? 'email'
                                                  : 'birthDate'
                                        }
                                        defaultValue={field.editedValue}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            field.setter(e.target.value)
                                        }
                                        disabled={(field as any).disabled}
                                        min={(field as any).min}
                                        max={(field as any).max}
                                        className={`w-full bg-gray-50 focus:bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-bold focus:border-orange-500 outline-none transition-all h-[42px] ${(field as any).disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder={`Introduce tu ${field.label.toLowerCase()}`}
                                    />
                                )}
                                {['Nombre Completo', 'Teléfono', 'Fecha de Cumpleaños'].includes(
                                    field.label
                                ) && (
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium m-0 flex items-center gap-1">
                                        <Shield size={10} className="text-orange-500" />
                                        Solo se puede cambiar una vez cada 30 días.
                                    </p>
                                )}
                                {field.label === 'Correo Electrónico' && (
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium m-0 flex items-center gap-1">
                                        Para cambiar tu email, contacta por{' '}
                                        <a
                                            href="https://wa.me/34631920312?text=Hola,%20me%20gustar%C3%ADa%20solicitar%20un%20cambio%20de%20correo%20electr%C3%B3nico%20para%20mi%20cuenta."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-600 font-bold hover:underline"
                                        >
                                            WhatsApp
                                        </a>
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-2 min-h-[28px]">
                                <p className="text-sm font-bold text-gray-900 m-0 truncate">
                                    {field.value}
                                </p>
                                {field.label === 'Correo Electrónico' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span
                                            className={`text-[10px] font-extrabold uppercase ${user.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}
                                        >
                                            {user.isVerified ? '✓ Verificado' : 'Sin verificar'}
                                        </span>
                                        <span className="text-gray-200">•</span>
                                        <a
                                            href="https://wa.me/34631920312?text=Hola,%20me%20gustar%C3%ADa%20solicitar%20un%20cambio%20de%20correo%20electr%C3%B3nico%20para%20mi%20cuenta."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-gray-400 hover:text-emerald-600 font-bold hover:underline"
                                        >
                                            Cambiar
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </form>

            {/* Avatar Selection (Only when editing) - Flat Section */}
            {isEditing && (
                <div className="pt-2 border-b border-gray-100 pb-6" id="avatar-grid">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                    {editAvatar && editAvatar.startsWith('http') ? (
                                        <SafeImage
                                            src={editAvatar}
                                            getOptimizedUrl={getSharpAvatar}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            fallbackContent={
                                                <div className="text-2xl select-none font-black text-gray-700">
                                                    {currentInitials}
                                                </div>
                                            }
                                        />
                                    ) : (
                                        <div className="text-2xl select-none font-black text-gray-700">
                                            {editAvatar || currentInitials}
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 m-0">
                                    Avatar y foto de perfil
                                </h3>
                                <p className="text-[11px] text-gray-400 font-medium m-0 mt-0.5">
                                    Sube tu propia foto o elige un icono de la colección
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                                <Camera size={14} />
                                <span>Subir foto</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                            {editAvatar !== '' && (
                                <button
                                    type="button"
                                    onClick={() => setEditAvatar('')}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 rounded-xl border-none cursor-pointer transition-colors"
                                >
                                    <RotateCcw size={13} />
                                    <span>Original ({currentInitials})</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {AVATAR_CATEGORIES.map(category => (
                            <div key={category.name}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 m-0">
                                    {category.name}
                                </p>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {category.icons.map(avatar => (
                                        <button
                                            key={`${category.name}-${avatar}`}
                                            type="button"
                                            onClick={() => setEditAvatar(avatar)}
                                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-lg sm:text-xl flex items-center justify-center transition-all cursor-pointer border ${
                                                editAvatar === avatar
                                                    ? 'bg-orange-50 border-orange-500 scale-105'
                                                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                                            }`}
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Security Section - Flat Row */}
            <div className="pt-1 border-b border-gray-100 pb-5">
                {!showChangePassword ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Shield size={18} strokeWidth={2} className="text-amber-500 shrink-0" />
                            <div>
                                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 m-0">
                                    Seguridad de la cuenta
                                </h4>
                                <p className="text-[11px] text-gray-400 m-0">
                                    Actualiza tu contraseña periódicamente para mantener tu cuenta
                                    segura
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="self-start sm:self-auto text-xs font-extrabold text-orange-600 hover:text-orange-700 bg-transparent border-none p-0 cursor-pointer shrink-0"
                        >
                            Cambiar contraseña →
                        </button>
                    </div>
                ) : (
                    <form id="password-form" onSubmit={handleChangePassword} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-gray-900 m-0">
                                Cambio de Contraseña
                            </h4>
                            <button
                                type="button"
                                onClick={() => setShowChangePassword(false)}
                                className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1"
                            >
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    label: 'Contraseña Actual',
                                    ref: currentPasswordRef,
                                    name: 'currentPassword',
                                    show: showCurrPwd,
                                    toggle: setShowCurrPwd,
                                },
                                {
                                    label: 'Nueva Contraseña',
                                    ref: newPasswordRef,
                                    name: 'newPassword',
                                    show: showNewPwd,
                                    toggle: setShowNewPwd,
                                },
                                {
                                    label: 'Confirmar Nueva Contraseña',
                                    ref: confirmNewPasswordRef,
                                    name: 'confirmNewPassword',
                                    show: showNewPwd,
                                    toggle: () => {},
                                },
                            ].map(f => (
                                <div key={f.label}>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                                        {f.label}
                                    </label>
                                    <div className="relative">
                                        <input
                                            ref={f.ref}
                                            type={f.show ? 'text' : 'password'}
                                            name={f.name}
                                            className="w-full bg-gray-50 focus:bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold focus:border-orange-500 outline-none transition-all"
                                        />
                                        {f.label !== 'Confirmar Nueva Contraseña' && (
                                            <button
                                                type="button"
                                                onClick={() => f.toggle(!f.show)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                                            >
                                                {f.show ? (
                                                    <EyeOff size={15} strokeWidth={1.8} />
                                                ) : (
                                                    <Eye size={15} strokeWidth={1.8} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="submit"
                                className="px-5 py-2 bg-orange-600 text-white rounded-xl font-extrabold text-xs hover:bg-orange-700 transition-all active:scale-95 cursor-pointer border-none"
                            >
                                Actualizar contraseña
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowChangePassword(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-extrabold text-xs hover:bg-gray-200 transition-all active:scale-95 cursor-pointer border-none"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Danger Zone - Flat Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                    <Trash2 size={18} strokeWidth={2} className="text-red-500 shrink-0" />
                    <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 m-0">
                            Eliminar cuenta
                        </h4>
                        <p className="text-[11px] text-gray-400 m-0">
                            Se marcará para eliminación con 30 días para recuperarla iniciando
                            sesión
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="self-start sm:self-auto text-xs font-extrabold text-red-600 hover:text-red-700 bg-transparent border-none p-0 cursor-pointer shrink-0"
                >
                    Eliminar mi cuenta →
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-popover flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteConfirm(false)}
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-white rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-orange-600" />
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">
                                ¿Estás seguro?
                            </h3>
                            <p className="text-gray-500 font-medium mb-8">
                                Tu cuenta no se borrará hoy. Tendrás{' '}
                                <span className="text-orange-600 font-black">30 días</span> para
                                reactivarla. Si no lo haces, tus datos se perderán para siempre.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={async () => {
                                        try {
                                            await deleteAccount();
                                        } catch {
                                            error('Error al procesar la solicitud');
                                        }
                                    }}
                                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 active:scale-95"
                                >
                                    SÍ, ELIMINAR CUENTA
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
