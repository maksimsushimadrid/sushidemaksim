import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Home, LogIn } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import SEO from '../components/SEO';
import { GenericSkeleton } from '../components/skeletons/GenericSkeleton';

export default function VerifyPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const redirectTo = searchParams.get('redirectTo');

    const hasVerified = useRef(false);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const { success: showSuccess, error: showError } = useToast();

    useEffect(() => {
        if (!token || hasVerified.current) return;

        const verifyToken = async () => {
            hasVerified.current = true;
            try {
                const response = await api.get(`/auth/verify/${token}`);
                setStatus('success');
                const msg = response.message || '¡Cuenta activada con éxito!';
                setMessage(msg);
                showSuccess(msg);

                // Handle automatic login if token is provided
                if (response.token) {
                    localStorage.setItem('sushi_token', response.token);
                    // Dispatch event for components that listen for auth changes
                    window.dispatchEvent(new CustomEvent('auth:login_success'));
                }

                // Automatic redirect if redirectTo is present
                if (redirectTo) {
                    setTimeout(() => {
                        navigate(redirectTo);
                    }, 1500); // Slightly faster redirect
                }
            } catch (err: any) {
                setStatus('error');
                const msg = err.message || 'El enlace ha expirado o no es válido.';
                setMessage(msg);
                showError(msg);
            }
        };

        verifyToken();
    }, [token, showSuccess, showError, navigate, redirectTo]);

    if (status === 'loading') {
        return <GenericSkeleton />;
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <SEO
                title="Activar cuenta"
                description="Activación de cuenta de usuario"
                robots="noindex, nofollow"
            />

            <div className="max-w-md w-full bg-white rounded-[32px] p-8 md:p-12 shadow-2xl text-center border border-gray-100 animate-in fade-in zoom-in duration-500">
                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-6 text-green-500 shadow-inner border-2 border-white">
                            <CheckCircle size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                            ¡Cuenta Activada!
                        </h1>
                        <p className="text-gray-500 font-medium mb-4 leading-relaxed italic">
                            {message}
                        </p>
                        {redirectTo ? (
                            <div className="w-full space-y-6">
                                <div className="flex justify-center">
                                    <div className="relative w-12 h-12">
                                        <div className="absolute inset-0 border-4 border-orange-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
                                    </div>
                                </div>
                                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                                    <p className="text-orange-900 font-bold text-sm">
                                        ¡Todo listo! Te estamos llevando de vuelta a tu pedido...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 w-full">
                                <button
                                    onClick={() => {
                                        navigate('/menu');
                                        setTimeout(() => {
                                            document.dispatchEvent(
                                                new CustomEvent('custom:openLogin')
                                            );
                                        }, 100);
                                    }}
                                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                                >
                                    <LogIn size={18} strokeWidth={1.5} /> Iniciar sesión y Pedir
                                </button>
                                <Link
                                    to="/menu"
                                    className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Home size={18} strokeWidth={1.5} /> Nuestra Carta
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 text-orange-500 shadow-inner border-2 border-white">
                            <XCircle size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                            Error de Activación
                        </h1>
                        <p className="text-orange-600 font-medium mb-10 leading-relaxed">
                            {message}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-2"
                        >
                            <Home size={18} strokeWidth={1.5} /> Volver al Inicio
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
