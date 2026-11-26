import { useToast } from '../../context/ToastContext';

export const GoogleAuthButton = ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess,
    isLoading = false,
}: {
    onSuccess: (params: { access_token: string }) => void;
    isLoading?: boolean;
}) => {
    const { error: showError } = useToast();

    const triggerRedirect = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (clientId && clientId !== 'dummy-client-id') {
            const redirectUri = window.location.origin;
            const scope = 'openid email profile';
            const state = btoa(JSON.stringify({ returnTo: window.location.pathname }));
            const googleAuthUrl =
                `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${clientId}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=token` +
                `&scope=${encodeURIComponent(scope)}` +
                `&state=${encodeURIComponent(state)}` +
                `&prompt=select_account`;
            window.location.href = googleAuthUrl;
        } else {
            showError('Error al abrir la ventana de Google.');
        }
    };

    const handleLoginClick = () => {
        triggerRedirect();
    };

    return (
        <button
            type="button"
            onClick={handleLoginClick}
            disabled={isLoading}
            data-testid="google-login-button"
            className="w-full h-12 flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 font-bold text-xs hover:border-gray-200 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.27l3.66-2.84z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
            )}
            {isLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>
    );
};
GoogleAuthButton.displayName = 'GoogleAuthButton';
