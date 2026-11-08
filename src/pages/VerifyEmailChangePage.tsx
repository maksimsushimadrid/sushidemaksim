import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Home, User } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import SEO from '../components/SEO';
import { GenericSkeleton } from '../components/skeletons/GenericSkeleton';

export default function VerifyEmailChangePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const hasVerified = useRef(false);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const { success: showSuccess, error: showError } = useToast();

    useEffect(() => {
        if (!token || hasVerified.current) return;

        const verifyEmailChange = async () => {
            hasVerified.current = true;
            try {
                const response = await api.get(`/auth/verify-email-change/${token}`);
                setStatus('success');
                const msg = response.message || '¡Email actualizado con éxito!';
                setMessage(msg);
                showSuccess(msg);
            } catch (err: any) {
                setStatus('error');
                const msg = err.message || 'El enlace ha expirado o no es válido.';
                setMessage(msg);
                showError(msg);
            }
        };

        verifyEmailChange();
    }, [token, showSuccess, showError]);

    if (status === 'loading') {
        return <GenericSkeleton />;
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <SEO
                title="Verificar nuevo email"
                description="Confirmación de cambio de correo electrónico"
            />

            <div className="max-w-md w-full bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-2xl text-center border border-gray-100 animate-in fade-in zoom-in duration-500">
                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-6 text-green-500 shadow-inner border-2 border-white">
                            <CheckCircle size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                            ¡Email Actualizado!
                        </h1>
                        <p className="text-gray-500 font-medium mb-10 leading-relaxed italic">
                            {message}
                        </p>
                        <div className="grid grid-cols-1 gap-4 w-full">
                            <Link
                                to="/profile"
                                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                            >
                                <User size={18} strokeWidth={1.5} /> Ver mi perfil
                            </Link>
                            <Link
                                to="/"
                                className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Home size={18} strokeWidth={1.5} /> Ir al inicio
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 text-orange-500 shadow-inner border-2 border-white">
                            <XCircle size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                            Error de Verificación
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
