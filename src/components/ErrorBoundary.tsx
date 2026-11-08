import { Component, ErrorInfo, ReactNode } from 'react';
import { safeReload } from '../utils/reload';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    errorType: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorType: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // If it's a chunk load error, we can handle it specifically
        if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
            return { hasError: true, errorType: 'chunk' };
        }
        return { hasError: true, errorType: 'general' };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Auto-refresh on chunk errors – often fixes issues after a new deployment
        if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
            console.warn('ChunkLoadError detected. Attempting to refresh page via safeReload...');
            const reloaded = safeReload(`ChunkLoadError: ${error.message}`);
            if (!reloaded) {
                // If safeReload decided not to reload (limit reached), we show the error UI
                this.setState({ hasError: true });
            }
        }
    }

    public render() {
        if (this.state.hasError) {
            if (this.state.errorType === 'chunk') {
                return (
                    <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center p-6 text-center">
                        <div>
                            <div className="text-6xl mb-4">🔄</div>
                            <h1 className="text-2xl font-black mb-2">
                                Actualizando la aplicación...
                            </h1>
                            <p className="text-gray-500">
                                Estamos cargando la última versión para ti.
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center p-6 text-center">
                    <div className="max-w-md bg-white p-10 rounded-2xl shadow-2xl border border-gray-100">
                        <div className="text-6xl mb-6">🍣</div>
                        <h1 className="text-3xl font-black mb-4">¡Ups! Algo salió mal</h1>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Parece que hubo un pequeño error al cargar la página. No te preocupes,
                            tus sushis están a salvo.
                        </p>
                        <button
                            onClick={() => (window.location.href = '/')}
                            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
