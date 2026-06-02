export class ApiError extends Error {
    constructor(
        public message: string,
        public status?: number
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const api = {
    async get(endpoint: string) {
        return fetchApi(endpoint, { method: 'GET' });
    },

    async post(endpoint: string, body?: unknown) {
        return fetchApi(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    async put(endpoint: string, body?: unknown) {
        return fetchApi(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    async patch(endpoint: string, body?: unknown) {
        return fetchApi(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },

    async delete(endpoint: string) {
        return fetchApi(endpoint, { method: 'DELETE' });
    },

    async formData(endpoint: string, formData: FormData) {
        return fetchApi(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // Let the browser set the Content-Type with boundary
            },
        });
    },
};

async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('sushi_token');

    const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers,
            credentials: 'same-origin',
            signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (response.status === 401) {
            // Token expired or invalid — clear session
            localStorage.removeItem('sushi_token');
            localStorage.removeItem('sushi_logged_in');

            // Clear backend cookie
            fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(
                () => {}
            );

            // List of public pages that should NOT redirect on 401
            const publicPages = ['/', '/menu', '/cart', '/promo', '/contacts', '/tablon'];
            const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
            const isPublicPage =
                publicPages.includes(currentPath) ||
                window.location.pathname.startsWith('/tablon/') ||
                window.location.pathname.startsWith('/track/') ||
                window.location.pathname.startsWith('/pay-for-friend/');

            // Don't reload/redirect if the user is trying to login/register
            // OR if they are already on a public page
            if (endpoint !== '/auth/login' && endpoint !== '/auth/register' && !isPublicPage) {
                window.location.href = '/';
            }

            throw new ApiError(data?.error || 'No autorizado', 401);
        }

        if (!response.ok) {
            // Add a small delay on errors to prevent flooding the server/WAF
            if (response.status === 404 || response.status === 403) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            throw new ApiError(
                data?.error || `Error ${response.status}: Ha ocurrido un problema con el servidor.`,
                response.status
            );
        }

        return data;
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new ApiError(
                'La solicitud ha tardado demasiado tiempo. Reintenta de nuevo.',
                408
            );
        }
        // Network errors (server down, no internet, CORS, etc.)
        if (
            error instanceof TypeError &&
            (error.message === 'Failed to fetch' ||
                error.message === 'Load failed' ||
                error.message.includes('NetworkError'))
        ) {
            throw new ApiError(
                'No se pudo conectar con el servidor. Comprueba tu conexión a internet e inténtalo de nuevo.',
                0
            );
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}
