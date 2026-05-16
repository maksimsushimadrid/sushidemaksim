import React, { useState, useEffect, memo, useRef } from 'react';
import {
    Mail,
    Lock,
    User,
    Phone,
    Eye,
    EyeOff,
    ArrowLeft,
    KeyRound,
    X,
    CheckCircle2,
    Circle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { motion, AnimatePresence } from 'framer-motion';

// ========== SUB-COMPONENTS (Memoized for performance) ==========

const LoginForm = memo(
    ({
        onLogin,
        onSwitchRegister,
        onSwitchForgot,
        isLoading,
    }: {
        onLogin: (data: { email: string; password: string }) => void;
        onSwitchRegister: () => void;
        onSwitchForgot: () => void;
        isLoading: boolean;
    }) => {
        const [showPassword, setShowPassword] = useState(false);
        const emailRef = useRef<HTMLInputElement>(null);
        const passwordRef = useRef<HTMLInputElement>(null);
        const isSubmitting = useRef(false);

        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            e.stopPropagation();

            // Prevent double submission
            if (isSubmitting.current || isLoading) return;

            // Critical fix for Mobile Safari Autofill:
            // 1. Force values from Safari internal buffer to DOM
            [emailRef, passwordRef].forEach(ref => {
                if (ref.current) {
                    ref.current.focus();
                    // Dispatch events to wake up any listeners (including browser's own)
                    ref.current.dispatchEvent(new Event('input', { bubbles: true }));
                    ref.current.dispatchEvent(new Event('change', { bubbles: true }));
                    ref.current.blur();
                }
            });

            // 2. Use FormData as the ultimate source of truth for WebKit (Safari)
            const formData = new FormData(e.currentTarget);
            const emailVal = ((formData.get('email') as string) || '').trim();
            const passwordVal = (formData.get('password') as string) || '';

            if (!emailVal || !passwordVal) {
                // If we still don't have values, we must inform the user
                // instead of silently failing.
                if (!emailVal) {
                    // Try one last fallback to ref just in case
                    const fallbackEmail = (emailRef.current?.value || '').trim();
                    if (!fallbackEmail) {
                        return; // Let browser validation handle it via 'required'
                    }
                    // If we found it via ref, continue
                } else {
                    return; // Let browser validation handle it
                }
            }

            isSubmitting.current = true;
            onLogin({ email: emailVal, password: passwordVal });

            // Reset submission lock after a delay
            setTimeout(() => {
                isSubmitting.current = false;
            }, 1000);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Email
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                            <Mail size={16} strokeWidth={1.5} />
                        </div>
                        <input
                            ref={emailRef}
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                            placeholder="tu@email.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Contraseña
                        </label>
                        <button
                            type="button"
                            onClick={onSwitchForgot}
                            className="text-[10px] font-bold text-orange-600 hover:text-orange-700 transition"
                            aria-label="Olvidé mi contraseña"
                        >
                            ¿Olvidaste?
                        </button>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                            <Lock size={16} strokeWidth={1.5} />
                        </div>
                        <input
                            ref={passwordRef}
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            autoComplete="current-password"
                            className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                            placeholder="Tu contraseña"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition bg-transparent border-none p-0"
                            aria-label="Mostrar contraseña"
                        >
                            {showPassword ? (
                                <EyeOff size={16} strokeWidth={1.5} />
                            ) : (
                                <Eye size={16} strokeWidth={1.5} />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-2 h-12"
                >
                    {isLoading ? 'Iniciando...' : 'Iniciar sesión'}
                </button>

                <div className="pt-2 text-center">
                    <p className="text-xs font-medium text-gray-500">
                        ¿No tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={onSwitchRegister}
                            data-testid="switch-to-register"
                            className="text-orange-600 font-black hover:underline bg-transparent border-none p-0 cursor-pointer"
                        >
                            Regístrate
                        </button>
                    </p>
                </div>
            </form>
        );
    }
);

const PasswordHint = memo(({ password }: { password: string }) => {
    const checks = [
        { label: '9+ caracteres', met: password.length >= 9 },
        { label: 'Un número', met: /\d/.test(password) },
        { label: 'Un símbolo', met: /[!@#$%^&*(),.?":{}|<>_+-]/.test(password) },
    ];

    if (!password) return null;

    return (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {checks.map((check, i) => (
                <div
                    key={i}
                    className={`flex items-center gap-1.5 text-[9px] font-bold transition-colors ${
                        check.met ? 'text-green-500' : 'text-gray-400'
                    }`}
                >
                    {check.met ? (
                        <CheckCircle2 size={11} className="shrink-0" />
                    ) : (
                        <Circle size={11} className="shrink-0 opacity-40" />
                    )}
                    <span>{check.label}</span>
                </div>
            ))}
        </div>
    );
});
PasswordHint.displayName = 'PasswordHint';

const RegisterForm = memo(
    ({
        onRegister,
        onSwitchLogin,
        isLoading,
    }: {
        onRegister: (data: {
            name: string;
            phone: string;
            email: string;
            password: string;
        }) => void;
        onSwitchLogin: () => void;
        isLoading: boolean;
    }) => {
        const [showPassword, setShowPassword] = useState(false);
        const [password, setPassword] = useState('');

        const nameRef = useRef<HTMLInputElement>(null);
        const phoneRef = useRef<HTMLInputElement>(null);
        const emailRef = useRef<HTMLInputElement>(null);
        const passwordRef = useRef<HTMLInputElement>(null);
        const isSubmitting = useRef(false);

        const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 9);
            e.target.value = val;
        };

        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            e.stopPropagation();

            if (isSubmitting.current || isLoading) return;

            // Safari Sync Hack
            [nameRef, phoneRef, emailRef, passwordRef].forEach(ref => {
                if (ref.current) {
                    ref.current.focus();
                    ref.current.dispatchEvent(new Event('input', { bubbles: true }));
                    ref.current.dispatchEvent(new Event('change', { bubbles: true }));
                    ref.current.blur();
                }
            });

            // Use FormData for reliability on Mobile Safari
            const formData = new FormData(e.currentTarget);
            const nameVal = ((formData.get('name') as string) || '').trim();
            const emailVal = ((formData.get('email') as string) || '').trim();
            const phoneVal = ((formData.get('phone') as string) || '').trim();
            const passwordVal = (formData.get('password') as string) || '';

            if (!emailVal || !passwordVal || !nameVal || !phoneVal) {
                return;
            }

            isSubmitting.current = true;
            onRegister({
                name: nameVal,
                phone: phoneVal,
                email: emailVal,
                password: passwordVal,
            });

            setTimeout(() => {
                isSubmitting.current = false;
            }, 1000);
        };

        return (
            <form onSubmit={handleSubmit} data-testid="register-form" className="space-y-3">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Nombre completo
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                <User size={16} strokeWidth={1.5} />
                            </div>
                            <input
                                ref={nameRef}
                                type="text"
                                name="name"
                                required
                                autoComplete="name"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                                placeholder="Tu nombre completo"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Teléfono
                        </label>
                        <div className="relative group flex items-center bg-gray-50 border-2 border-transparent rounded-2xl focus-within:bg-white focus-within:border-orange-600 transition-all overflow-hidden">
                            <div className="pl-4 pr-1.5 flex items-center text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                                <Phone size={16} strokeWidth={1.5} />
                                <span className="ml-2 font-bold text-gray-900 text-sm mt-[0.5px]">
                                    +34
                                </span>
                            </div>
                            <input
                                ref={phoneRef}
                                type="tel"
                                name="phone"
                                required
                                autoComplete="tel"
                                onChange={handlePhoneChange}
                                className="w-full bg-transparent pl-1 pr-4 py-3 outline-none font-medium text-sm text-gray-900 placeholder:text-gray-400"
                                placeholder="600 000 000"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Email
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                            <Mail size={16} strokeWidth={1.5} />
                        </div>
                        <input
                            ref={emailRef}
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                            placeholder="tu@email.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Contraseña
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                            <Lock size={16} strokeWidth={1.5} />
                        </div>
                        <input
                            ref={passwordRef}
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                            placeholder="Crea una contraseña segura"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition bg-transparent border-none p-0"
                            aria-label="Mostrar contraseña"
                        >
                            {showPassword ? (
                                <EyeOff size={16} strokeWidth={1.5} />
                            ) : (
                                <Eye size={16} strokeWidth={1.5} />
                            )}
                        </button>
                    </div>
                    <PasswordHint password={password} />
                </div>

                <button
                    type="submit"
                    disabled={
                        isLoading ||
                        password.length < 9 ||
                        !/\d/.test(password) ||
                        !/[!@#$%^&*(),.?":{}|<>_+-]/.test(password)
                    }
                    className="w-full py-3.5 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-2 h-12"
                >
                    {isLoading ? 'Creando...' : 'Crear cuenta'}
                </button>

                <div className="pt-2 text-center">
                    <p className="text-xs font-medium text-gray-500">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={onSwitchLogin}
                            className="text-orange-600 font-black hover:underline bg-transparent border-none p-0 cursor-pointer"
                        >
                            Inicia sesión
                        </button>
                    </p>
                </div>
            </form>
        );
    }
);

const ForgotPasswordForm = memo(
    ({
        onForgot,
        onBack,
        isLoading,
    }: {
        onForgot: (email: string) => void;
        onBack: () => void;
        isLoading: boolean;
    }) => {
        const emailRef = useRef<HTMLInputElement>(null);
        const isSubmitting = useRef(false);

        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            e.stopPropagation();

            if (isSubmitting.current || isLoading) return;

            // Safari Sync
            if (emailRef.current) {
                emailRef.current.focus();
                emailRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                emailRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                emailRef.current.blur();
            }

            const formData = new FormData(e.currentTarget);
            const emailVal = ((formData.get('email') as string) || '').trim();

            if (!emailVal) return;

            isSubmitting.current = true;
            onForgot(emailVal);

            setTimeout(() => {
                isSubmitting.current = false;
            }, 1000);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-2">
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        Introduce tu email y te enviaremos las instrucciones.
                    </p>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Email
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                            <Mail size={16} strokeWidth={1.5} />
                        </div>
                        <input
                            ref={emailRef}
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                            placeholder="tu@email.com"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-2 mb-2 h-12"
                >
                    {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full py-3 bg-gray-50 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={16} strokeWidth={1.5} /> Volver
                </button>
            </form>
        );
    }
);

const PinInput = memo(({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
    const inputs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, val: string) => {
        const cleanVal = val.replace(/\D/g, '');
        if (!cleanVal) {
            const newVal = value.split('');
            newVal[index] = '';
            onChange(newVal.join('').slice(0, 6));
            return;
        }

        if (cleanVal.length > 1) {
            const data = cleanVal.slice(0, 6);
            onChange(data);
            const nextIndex = Math.min(data.length, 5);
            inputs.current[nextIndex]?.focus();
            return;
        }

        const newVal = value.split('');
        for (let i = 0; i < 6; i++) {
            if (newVal[i] === undefined) newVal[i] = '';
        }
        newVal[index] = cleanVal;
        const combined = newVal.join('').slice(0, 6);
        onChange(combined);

        if (index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputs.current[index - 1]?.focus();
            const newVal = value.split('');
            newVal[index - 1] = '';
            onChange(newVal.join(''));
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').trim().slice(0, 6).replace(/\D/g, '');
        onChange(data);
        if (data.length > 0) {
            const nextIndex = Math.min(data.length, 5);
            inputs.current[nextIndex]?.focus();
        }
    };

    const handlePasteButtonClick = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const data = text.trim().slice(0, 6).replace(/\D/g, '');
            onChange(data);
            if (data.length > 0) {
                const nextIndex = Math.min(data.length, 5);
                inputs.current[nextIndex]?.focus();
            }
        } catch (err) {
            // Fallback: focus first input if paste fails
            inputs.current[0]?.focus();
        }
    };

    return (
        <div className="space-y-3 mb-2">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Código de recuperación
                </label>
                <button
                    type="button"
                    onClick={handlePasteButtonClick}
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 transition flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
                >
                    <KeyRound size={12} strokeWidth={2} /> Pegar código
                </button>
            </div>
            <div className="flex justify-between gap-1.5" onPaste={handlePaste}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <input
                        key={i}
                        ref={el => (inputs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={value[i] || ''}
                        onChange={e => handleChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className="w-full h-12 text-center text-lg font-black bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-600 outline-none transition-all text-gray-900 shadow-sm"
                        placeholder="•"
                    />
                ))}
            </div>
            <input type="hidden" name="code" value={value} />
        </div>
    );
});
PinInput.displayName = 'PinInput';

const ResetPasswordForm = memo(
    ({
        onReset,
        isLoading,
        token,
        recoveryEmail,
    }: {
        onReset: (data: {
            password: string;
            confirmPassword: string;
            code: string;
            email: string;
        }) => void;
        isLoading: boolean;
        token: string;
        recoveryEmail: string;
    }) => {
        const [showPassword, setShowPassword] = useState(false);
        const [codeValue, setCodeValue] = useState(token || '');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');

        const passwordRef = useRef<HTMLInputElement>(null);
        const confirmPasswordRef = useRef<HTMLInputElement>(null);
        const emailRef = useRef<HTMLInputElement>(null);
        const isSubmitting = useRef(false);

        const isPasswordValid =
            password.length >= 9 &&
            /\d/.test(password) &&
            /[!@#$%^&*(),.?":{}|<>_+-]/.test(password);

        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            e.stopPropagation();

            if (isSubmitting.current || isLoading) return;

            // Safari Sync Hack
            [passwordRef, confirmPasswordRef, emailRef].forEach(ref => {
                if (ref.current) {
                    ref.current.focus();
                    ref.current.dispatchEvent(new Event('input', { bubbles: true }));
                    ref.current.dispatchEvent(new Event('change', { bubbles: true }));
                    ref.current.blur();
                }
            });

            const formData = new FormData(e.currentTarget);
            const passwordVal = (formData.get('password') as string) || '';
            const confirmPasswordVal = (formData.get('confirmPassword') as string) || '';
            const emailVal = ((formData.get('email') as string) || '').trim() || recoveryEmail;
            const codeVal = token || codeValue;

            if (!passwordVal || !confirmPasswordVal || !codeVal || !emailVal) return;

            isSubmitting.current = true;
            onReset({
                password: passwordVal,
                confirmPassword: confirmPasswordVal,
                code: codeVal,
                email: emailVal,
            });

            setTimeout(() => {
                isSubmitting.current = false;
            }, 1000);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-3">
                {!recoveryEmail && !token && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Tu Email
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                <Mail size={16} strokeWidth={1.5} />
                            </div>
                            <input
                                ref={emailRef}
                                type="email"
                                name="email"
                                required
                                autoComplete="email"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                                placeholder="tu@email.com"
                            />
                        </div>
                    </div>
                )}
                {recoveryEmail && (
                    <input type="hidden" ref={emailRef} name="email" value={recoveryEmail} />
                )}

                {token ? (
                    <input type="hidden" name="code" value={token} />
                ) : (
                    <PinInput value={codeValue} onChange={setCodeValue} />
                )}

                <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl mb-1 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                        <Lock size={16} strokeWidth={1.5} />
                    </div>
                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                        Crea una nueva contraseña para proteger tu cuenta.
                    </p>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Nueva Contraseña
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                            <Lock size={16} strokeWidth={1.5} />
                        </div>
                        <input
                            ref={passwordRef}
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                            placeholder="Mínimo 9 caracteres"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition bg-transparent border-none p-0"
                            aria-label="Mostrar contraseña"
                        >
                            {showPassword ? (
                                <EyeOff size={16} strokeWidth={1.5} />
                            ) : (
                                <Eye size={16} strokeWidth={1.5} />
                            )}
                        </button>
                    </div>
                    <PasswordHint password={password} />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Confirmar
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                            <Lock size={16} strokeWidth={1.5} />
                        </div>
                        <input
                            ref={confirmPasswordRef}
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            required
                            onChange={e => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all font-medium text-sm text-gray-900"
                            placeholder="Repite la contraseña"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={
                        isLoading ||
                        (!token && codeValue.length < 6) ||
                        !isPasswordValid ||
                        password !== confirmPassword
                    }
                    className="w-full py-3.5 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-2 h-12"
                >
                    {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
            </form>
        );
    }
);
ResetPasswordForm.displayName = 'ResetPasswordForm';

// ========== MAIN COMPONENT ==========

export default function LoginModal({
    isOpen,
    onClose,
    initialMode = 'login',
}: {
    isOpen: boolean;
    onClose: () => void;
    initialMode?:
        | 'login'
        | 'register'
        | 'forgot'
        | 'verify-sent'
        | 'reset-password'
        | 'register-success';
}) {
    const [mode, setMode] = useState<
        | 'login'
        | 'register'
        | 'forgot'
        | 'verify-sent'
        | 'verify-code'
        | 'reset-password'
        | 'register-success'
        | 'success'
        | 'loading'
    >(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const { login, register, forgotPassword, resetPassword } = useAuth();
    const { success: showSuccess, error: showError } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const handleOpen = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.mode) setMode(customEvent.detail.mode);
            if (customEvent.detail?.token) {
                setMode('reset-password');
                setResetToken(customEvent.detail.token);
            }
        };

        const handleForceOpen = () => {
            setMode('login');
        };

        document.addEventListener('custom:openLogin', handleOpen);
        document.addEventListener('custom:forceOpenLogin', handleForceOpen);
        return () => {
            document.removeEventListener('custom:openLogin', handleOpen);
            document.removeEventListener('custom:forceOpenLogin', handleForceOpen);
        };
    }, []);

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            // paddingRight logic is kept to prevent layout shift from scrollbar
            document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
        } else {
            document.body.style.paddingRight = '';
            setRecoveryEmail('');
        }

        return () => {
            document.body.style.paddingRight = '';
        };
    }, [isOpen, initialMode]);

    const handleLogin = async (data: { email: string; password: string }) => {
        setIsLoading(true);
        try {
            const { email, password } = data;
            const res = await login(email, password);
            if (res.success) {
                onClose();
                showSuccess('¡Bienvenido de nuevo! 🍣');
                navigate('/menu');
            } else {
                showError(res.error || 'Error al iniciar sesión');
            }
        } catch (err: unknown) {
            const error = err as Error;
            showError(error.message || 'Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (data: {
        name: string;
        phone: string;
        email: string;
        password: string;
    }) => {
        setIsLoading(true);

        try {
            const { name, email, password } = data;
            let { phone } = data;

            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length !== 9 || !/^[6789]/.test(cleanPhone)) {
                showError('El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9');
                setIsLoading(false);
                return;
            }

            phone = `+34${cleanPhone}`;

            // If registering from a table, pass the table URL so verification redirects back
            const isTableRoute = window.location.pathname.startsWith('/table');
            const tableRedirect = isTableRoute
                ? `${window.location.pathname}${window.location.search}`
                : undefined;

            const res = await register(name, email, phone, password, tableRedirect);
            if (res.success) {
                setMode('register-success');
                showSuccess('VERIFICA TU EMAIL');
            } else {
                showError(res.error || 'Error al registrarse');
            }
        } catch (err: unknown) {
            const error = err as Error;
            showError(error.message || 'Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgot = async (email: string) => {
        setIsLoading(true);

        try {
            const res = await forgotPassword(email);
            if (res.success) {
                setRecoveryEmail(email);
                setMode('verify-sent');
                showSuccess('Código de recuperación enviado');
            } else {
                showError(res.error || 'Error al procesar la solicitud');
            }
        } catch (err: unknown) {
            const error = err as Error;
            showError(error.message || 'Error al procesar la solicitud');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (data: {
        password: string;
        confirmPassword: string;
        code: string;
        email: string;
    }) => {
        setIsLoading(true);
        const { password, confirmPassword, code, email } = data;

        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }

        try {
            const res = await resetPassword(email, code, password);
            if (res.success) {
                setMode('login');
                showSuccess('Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
                setRecoveryEmail('');
            } else {
                showError(res.error || 'Error al actualizar la contraseña');
            }
        } catch (err: unknown) {
            const error = err as Error;
            showError(error.message || 'Error al actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 isolate">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm cursor-pointer"
                        onClick={() => !isLoading && onClose()}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                        }}
                        className="relative max-w-sm w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[92vh]"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all z-20 border-none cursor-pointer"
                        >
                            <X size={18} strokeWidth={1.5} />
                        </button>

                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <div className="text-center mb-4 pt-1">
                                <img
                                    src="/logo.svg"
                                    alt="Sushi de Maksim"
                                    className="h-9 w-auto object-contain brightness-0 mx-auto mb-3"
                                />
                                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                                    {mode === 'login' && '¡Hola de nuevo!'}
                                    {mode === 'register' && 'Crea tu cuenta'}
                                    {mode === 'forgot' && 'Recuperar acceso'}
                                    {mode === 'verify-sent' && 'Verifica tu email'}
                                    {mode === 'reset-password' && 'Nueva contraseña'}
                                    {mode === 'register-success' && 'VERIFICA TU EMAIL'}
                                </h2>
                                <p className="text-[13px] text-gray-400 font-medium mt-1 leading-tight">
                                    {mode === 'login' && 'Entra y disfruta del mejor sushi.'}
                                    {mode === 'register' && 'Únete a la familia Maksim.'}
                                    {mode === 'forgot' && 'Te ayudamos a volver.'}
                                    {mode === 'verify-sent' && 'Hemos enviado un código.'}
                                    {mode === 'reset-password' && 'Casi has terminado.'}
                                    {mode === 'register-success' && '¡Ya casi está listo!'}
                                </p>
                            </div>

                            {mode === 'login' && (
                                <LoginForm
                                    onLogin={handleLogin}
                                    onSwitchRegister={() => setMode('register')}
                                    onSwitchForgot={() => setMode('forgot')}
                                    isLoading={isLoading}
                                />
                            )}

                            {mode === 'register' && (
                                <RegisterForm
                                    onRegister={handleRegister}
                                    onSwitchLogin={() => setMode('login')}
                                    isLoading={isLoading}
                                />
                            )}

                            {mode === 'forgot' && (
                                <ForgotPasswordForm
                                    onForgot={handleForgot}
                                    onBack={() => setMode('login')}
                                    isLoading={isLoading}
                                />
                            )}

                            {mode === 'register-success' && (
                                <div className="text-center space-y-6">
                                    <div className="bg-orange-50 text-orange-700 p-6 rounded-3xl border border-orange-100 font-medium text-sm leading-relaxed">
                                        <p>
                                            Para completar el registro y recibir tu código de
                                            descuento del 10%, debes activar tu cuenta haciendo clic
                                            en el enlace que te hemos enviado por email.
                                        </p>
                                        <p className="mt-3 text-xs opacity-75 italic">
                                            (No olvides revisar la carpeta de SPAM 📥)
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => {
                                                onClose();
                                                navigate('/menu');
                                            }}
                                            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={18} strokeWidth={2.5} /> ENTENDIDO
                                        </button>
                                        <button
                                            onClick={() => setMode('login')}
                                            className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors text-[10px] uppercase tracking-widest"
                                        >
                                            Ir al login
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mode === 'verify-sent' && (
                                <div className="text-center space-y-6">
                                    <div className="bg-green-50 text-green-700 p-6 rounded-3xl border border-green-100 font-medium text-sm leading-relaxed">
                                        <p>
                                            Te hemos enviado un código de 6 dígitos. Por favor,
                                            revísalo en tu correo e introdúcelo para restablecer tu
                                            contraseña.
                                        </p>
                                        <p className="mt-2 text-xs opacity-75 italic">
                                            (No olvides revisar la carpeta de SPAM)
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => setMode('reset-password')}
                                            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                                        >
                                            <KeyRound size={18} strokeWidth={1.5} /> Introducir el
                                            código
                                        </button>
                                        <button
                                            onClick={() => {
                                                onClose();
                                                navigate('/menu');
                                            }}
                                            className="w-full py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-black text-sm hover:border-orange-600 hover:text-orange-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            Explorar Menú
                                        </button>
                                        <button
                                            onClick={() => setMode('login')}
                                            className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors text-[10px] uppercase tracking-widest"
                                        >
                                            Volver al login
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mode === 'reset-password' && (
                                <div>
                                    <ResetPasswordForm
                                        onReset={handleReset}
                                        isLoading={isLoading}
                                        token={resetToken}
                                        recoveryEmail={recoveryEmail}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
