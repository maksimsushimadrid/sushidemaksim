import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

const USER_QUERY_KEY = ['user'];

/**
 * Hook to handle:
 * 1. Magic login tokens from welcome emails (magicToken query param)
 * 2. Google OAuth redirect callback (access_token in URL hash fragment)
 *
 * Both flows auto-log the user in and clean up the URL.
 */
export function useMagicLogin(): void {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const processed = useRef(false);

    // Handle magic token from welcome email
    useEffect(() => {
        const magicToken = searchParams.get('magicToken');
        const promoCode = searchParams.get('promoCode');

        if (!magicToken || processed.current) return;
        processed.current = true;

        // 1. Store the JWT token (auto-login)
        localStorage.setItem('sushi_token', magicToken);

        // 2. Store promo code for auto-apply in CartPage
        if (promoCode) {
            localStorage.setItem('sushi_pending_promo', promoCode);
        }

        // 3. Refresh user query to pick up the new token
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });

        // 4. Clean URL params without page reload
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('magicToken');
        newParams.delete('promoCode');
        setSearchParams(newParams, { replace: true });
    }, [searchParams, setSearchParams, queryClient]);

    // Handle Google OAuth redirect callback (access_token in URL hash)
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || processed.current) return;

        // Parse hash fragment: #access_token=xxx&token_type=Bearer&...
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (!accessToken) return;
        processed.current = true;

        // Clean the hash immediately to prevent re-processing
        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        // Call backend to authenticate with Google access_token
        (async () => {
            try {
                const data = await api.post('/auth/google', { access_token: accessToken });
                localStorage.setItem('sushi_token', data.token);
                await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
                await queryClient.refetchQueries({ queryKey: USER_QUERY_KEY });
            } catch (err) {
                console.error('Google redirect auth failed:', err);
            }
        })();
    }, [queryClient]);
}
