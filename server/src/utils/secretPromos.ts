import { supabase } from '../db/supabase.js';

export interface SecretPromoCode {
    code: string;
    discountPercentage: number;
    active: boolean;
    createdAt: string;
}

const DEFAULT_SECRET_PROMOS: SecretPromoCode[] = [
    {
        code: 'WELOVEYOU15',
        discountPercentage: 15,
        active: true,
        createdAt: '2026-11-08T00:00:00.000Z',
    },
];

export async function getSecretPromoCodes(): Promise<SecretPromoCode[]> {
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'secret_promo_codes')
            .maybeSingle();

        if (error || !data || data.value == null) {
            return [...DEFAULT_SECRET_PROMOS];
        }

        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;

        if (!Array.isArray(parsed)) {
            return [...DEFAULT_SECRET_PROMOS];
        }

        return parsed
            .filter(
                (item: any) =>
                    item &&
                    typeof item.code === 'string' &&
                    item.code.trim().length > 0 &&
                    typeof item.discountPercentage === 'number'
            )
            .map((item: any) => ({
                code: item.code.trim().toUpperCase(),
                discountPercentage: Math.min(90, Math.max(1, Number(item.discountPercentage))),
                active: item.active !== false,
                createdAt: item.createdAt || new Date().toISOString(),
            }));
    } catch {
        return [...DEFAULT_SECRET_PROMOS];
    }
}

export async function saveSecretPromoCodes(codes: SecretPromoCode[]): Promise<void> {
    const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'secret_promo_codes', value: JSON.stringify(codes) }, { onConflict: 'key' });

    if (error) {
        throw error;
    }
}

export async function findActiveSecretPromo(code: string): Promise<SecretPromoCode | null> {
    const normalized = String(code || '')
        .trim()
        .toUpperCase();
    if (!normalized) return null;

    const codes = await getSecretPromoCodes();
    const match = codes.find(c => c.code === normalized && c.active);
    return match || null;
}
