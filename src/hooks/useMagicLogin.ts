import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const USER_QUERY_KEY = ['user'];

/**
 * Hook to handle magic login tokens from welcome emails.
 * Reads `magicToken` and `promoCode` from URL search params,
 * auto-logs the user in and stores the promo code for later use in CartPage.
 */
export function useMagicLogin(): void {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const processed = useRef(false);

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
}
