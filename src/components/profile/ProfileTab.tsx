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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-2 md:px-0">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="text-center sm:text-left">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight m-0">
                        {isEditing ? 'Editar Perfil' : 'Datos Personales'}
                    </h2>
                    <p className="text-gray-500 text-[11px] md:text-xs mt-0.5">
                        Gestiona tu información básica y seguridad
                    </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                    {!isEditing ? (
                        <button
                            onClick={startEditing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-xl font-black text-xs md:text-sm hover:bg-orange-600 transition-all shadow-lg shadow-gray-200 active:scale-95"
                        >
                            <Edit3 size={16} strokeWidth={1.5} /> Editar
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] md:text-sm hover:bg-gray-200 transition-all active:scale-95"
                            >
                                <X size={14} strokeWidth={1.5} /> <span>CANCELAR</span>
                            </button>
                            <button
                                type="submit"
                                form="profile-form"
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 bg-orange-600 text-white rounded-xl font-black text-[10px] md:text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-95"
                            >
                                <Save size={14} strokeWidth={1.5} /> GUARDAR
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Profile Completion Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider m-0">
                            Progreso de tu perfil
                        </h3>
                        <p className="text-[11px] text-gray-500 font-semibold m-0 mt-0.5 uppercase tracking-tight">
                            Completa tu perfil para asegurar tu cuenta y conseguir Maksim Coins
                        </p>
                    </div>
                    <span className="text-xl font-black text-orange-600 leading-none">
                        {completionPct}%
                    </span>
                </div>

                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 mb-4">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_0_8px_rgba(242,101,34,0.3)] transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                    />
                </div>

                {missingFields.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                        {missingFields.map(f => (
                            <div
                                key={f.field}
                                className="flex items-center justify-between bg-orange-50/20 border border-orange-100/30 rounded-xl p-3"
                            >
                                <span className="text-xs font-semibold text-gray-700 leading-snug">
                                    {f.label}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCompleteField(f.field)}
                                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer"
                                >
                                    Completar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Information Grid Wrapped in Form */}
            <form
                id="profile-form"
                onSubmit={saveProfile}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
                        className="group p-3.5 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-orange-100 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 flex flex-col"
                    >
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-hover:text-orange-500 transition-colors">
                            <field.icon size={11} strokeWidth={1.5} />
                            {field.label}
                        </label>

                        {isEditing ? (
                            <div className="flex flex-col gap-1 flex-1">
                                {field.label === 'Teléfono' ? (
                                    <div className="flex items-center bg-white border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-orange-600/20 focus-within:border-orange-600 transition-all shadow-sm overflow-hidden h-[46px]">
                                        <div className="pl-4 pr-2 text-gray-400 font-bold text-sm select-none border-r border-gray-100 h-full flex items-center bg-gray-50">
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
                                            className="w-full bg-transparent border-none px-4 py-3 text-sm font-bold outline-none text-gray-900"
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
                                        className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 outline-none transition-all shadow-sm h-[42px] ${(field as any).disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                        placeholder={`Introduce tu ${field.label.toLowerCase()}`}
                                    />
                                )}
                                {['Nombre Completo', 'Teléfono', 'Fecha de Cumpleaños'].includes(
                                    field.label
                                ) && (
                                    <p className="text-[10px] text-orange-600/70 mt-1 font-bold animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                                        <Shield size={10} className="text-orange-500" />
                                        Solo se puede cambiar una vez cada 30 días.
                                    </p>
                                )}
                                {field.label === 'Correo Electrónico' && (
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium flex items-center gap-1.5 opacity-80">
                                        Para cambiar tu email, contacta con
                                        <a
                                            href="https://wa.me/34631920312?text=Hola,%20me%20gustar%C3%ADa%20solicitar%20un%20cambio%20de%20correo%20electr%C3%B3nico%20para%20mi%20cuenta."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-600 font-black hover:underline flex items-center gap-1"
                                        >
                                            WhatsApp
                                        </a>
                                    </p>
                                )}
                                {field.label.includes('Cumpleaños') &&
                                    !['Nombre Completo', 'Teléfono'].includes(field.label) && (
                                        <p className="text-[10px] text-gray-500 mt-1 font-medium animate-in fade-in slide-in-from-top-1">
                                            🎁 ¡Te enviaremos un regalo especial en tu día!
                                        </p>
                                    )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between min-h-[32px]">
                                <p className="text-sm font-black text-gray-900 m-0">
                                    {field.value}
                                </p>
                                {field.label === 'Correo Electrónico' && (
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div
                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} border-none`}
                                        >
                                            {user.isVerified ? 'Verificado' : 'Sin verificar'}
                                        </div>
                                        <a
                                            href="https://wa.me/34631920312?text=Hola,%20me%20gustar%C3%ADa%20solicitar%20un%20cambio%20de%20correo%20electr%C3%B3nico%20para%20mi%20cuenta."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] text-emerald-600 font-black hover:underline"
                                        >
                                            Solicitar cambio
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </form>

            {/* Avatar Selection (Only when editing) */}
            {isEditing && (
                <div className="px-4 py-8 md:p-10 bg-gray-900 rounded-[40px] text-white overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-10 -ml-32 -mb-32" />

                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-8 flex items-center gap-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full animate-ping" />
                        Avatar & Foto
                    </h3>

                    <div className="flex flex-col items-center justify-center p-8 mb-10 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                        <div className="relative mb-6">
                            <div className="w-32 h-32 md:w-36 md:h-36 rounded-[42px] bg-gray-800 border-4 border-white/20 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-orange-500">
                                {editAvatar && editAvatar.startsWith('http') ? (
                                    <SafeImage
                                        src={editAvatar}
                                        getOptimizedUrl={getSharpAvatar}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                        fallbackContent={
                                            <div className="text-5xl md:text-6xl select-none font-black text-white/90">
                                                {currentInitials}
                                            </div>
                                        }
                                    />
                                ) : (
                                    <div className="text-5xl md:text-6xl select-none font-black text-white/90">
                                        {editAvatar || currentInitials}
                                    </div>
                                )}

                                {isUploading && (
                                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            <label className="absolute -bottom-2 -right-2 w-11 h-11 bg-white text-gray-900 rounded-2xl flex items-center justify-center shadow-xl cursor-pointer hover:bg-orange-600 hover:text-white transition-all transform hover:scale-110 active:scale-90 group/cam">
                                <Camera size={20} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <h4 className="text-sm font-black text-white uppercase tracking-wider m-0">
                                {editAvatar && editAvatar.startsWith('http')
                                    ? 'Tu foto personalizada'
                                    : 'Personaliza tu avatar'}
                            </h4>
                            <div className="flex gap-2">
                                {editAvatar && editAvatar.startsWith('http') && (
                                    <button
                                        onClick={() => setEditAvatar('')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-orange-500/20 text-[10px] font-black uppercase text-white rounded-xl border border-white/10 transition-all"
                                    >
                                        <Trash2 size={12} /> Quitar Foto
                                    </button>
                                )}
                                {!editAvatar.startsWith('http') && editAvatar !== '' && (
                                    <button
                                        onClick={() => setEditAvatar('')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase text-white rounded-xl border border-white/10 transition-all"
                                    >
                                        <RotateCcw size={12} /> Resetear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 relative z-10" id="avatar-grid">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 ml-1">
                                Original
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => setEditAvatar('')}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black transition-all border-2
                                    ${editAvatar === '' ? 'bg-orange-600 border-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                            >
                                {editName.substring(0, 2).toUpperCase() || '??'}
                            </motion.button>
                        </div>

                        {AVATAR_CATEGORIES.map(category => (
                            <div key={category.name}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 ml-1">
                                    {category.name}
                                </p>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {category.icons.map(avatar => (
                                        <motion.button
                                            key={`${category.name}-${avatar}`}
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            whileTap={{ scale: 0.9 }}
                                            type="button"
                                            onClick={() => setEditAvatar(avatar)}
                                            className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-all border-2
                                                ${
                                                    editAvatar === avatar
                                                        ? 'bg-orange-600 border-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110 z-10'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {avatar}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Security Section */}
            <div className="pt-8 border-t border-gray-100">
                {!showChangePassword ? (
                    <div className="bg-amber-50 rounded-[32px] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-amber-100">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <Shield size={24} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight m-0">
                                    Seguridad de la cuenta
                                </h4>
                                <p className="text-xs text-amber-700 mt-0.5 m-0 opacity-80">
                                    Tu contraseña se actualizó hace tiempo
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="w-full sm:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-amber-200"
                        >
                            Cambiar Contraseña
                        </button>
                    </div>
                ) : (
                    <form
                        id="password-form"
                        onSubmit={handleChangePassword}
                        className="bg-gray-50 rounded-[32px] p-8 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-lg font-black text-gray-900 m-0">
                                Cambio de Contraseña
                            </h4>
                            <button
                                onClick={() => setShowChangePassword(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
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
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                                        {f.label}
                                    </label>
                                    <div className="relative">
                                        <input
                                            ref={f.ref}
                                            type={f.show ? 'text' : 'password'}
                                            name={f.name}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-600/20 outline-none transition-all"
                                        />
                                        {f.label !== 'Confirmar Nueva Contraseña' && (
                                            <button
                                                type="button"
                                                onClick={() => f.toggle(!f.show)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {f.show ? (
                                                    <EyeOff size={16} strokeWidth={1.5} />
                                                ) : (
                                                    <Eye size={16} strokeWidth={1.5} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-8">
                            <button
                                type="submit"
                                className="flex-1 sm:flex-none px-8 py-3.5 bg-orange-600 text-white rounded-xl font-black text-xs md:text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 active:scale-95"
                            >
                                ACTUALIZAR
                            </button>
                            <button
                                onClick={() => setShowChangePassword(false)}
                                className="flex-1 sm:flex-none px-8 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black text-xs md:text-sm hover:bg-gray-200 hover:text-gray-900 transition-all active:scale-95"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Danger Zone */}
            <div className="pt-12 border-t border-gray-100">
                <div className="bg-orange-50 rounded-[32px] p-8 border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h4 className="text-lg font-black text-orange-900 m-0 flex items-center gap-2 justify-center md:justify-start">
                            <Trash2 size={20} strokeWidth={1.5} /> ZONA DE PELIGRO
                        </h4>
                        <p className="text-sm text-orange-700 mt-2 m-0 font-medium">
                            Tu cuenta se marcará para eliminación. Tienes 30 días para recuperarla
                            simplemente iniciando sesión.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full md:w-auto px-8 py-3.5 bg-white text-orange-600 border-2 border-orange-200 hover:border-orange-600 hover:bg-orange-600 hover:text-white rounded-xl font-black text-xs md:text-sm transition-all shadow-lg shadow-orange-100 active:scale-95 whitespace-nowrap"
                    >
                        Eliminar mi cuenta
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                        className="relative bg-white rounded-[40px] p-8 md:p-10 max-w-md w-full shadow-2xl overflow-hidden"
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
