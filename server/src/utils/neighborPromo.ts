import { supabase } from '../db/supabase.js';

export const VECINOS_PROMO_CODE = 'VECINOS';
export const VECINOS_DISCOUNT_PERCENTAGE = 5;

// Calle Barrilero, 20, 28007 Madrid
export const RESTAURANT_COORDS = {
    lat: 40.397042,
    lon: -3.672449,
};

// Walking neighborhood radius around Calle Barrilero, 20 (1.5 km)
export const NEIGHBOR_RADIUS_KM = 1.5;

// Fallback postal codes when a saved address has no lat/lon coordinates
const NEIGHBOR_POSTAL_CODES = new Set(['28007']);

export function haversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export interface NeighborEligibilityResult {
    eligible: boolean;
    error?: string;
}

/**
 * Checks whether a registered user qualifies for the VECINOS (-5% pickup) promo:
 * - Must be authenticated
 * - Must choose pickup ('pickup')
 * - Must have at least one saved address near Calle Barrilero, 20 (<= 1.5 km or CP 28007)
 */
export async function validateVecinosPromo(
    userId: string | undefined,
    deliveryType: string | undefined
): Promise<NeighborEligibilityResult> {
    if (!userId) {
        return {
            eligible: false,
            error: 'Inicia sesión o regístrate para usar el código VECINOS',
        };
    }

    if (deliveryType !== 'pickup') {
        return {
            eligible: false,
            error: 'El código VECINOS solo es válido al elegir recogida en local',
        };
    }

    const { data: addresses, error } = await supabase
        .from('user_addresses')
        .select('id, lat, lon, postal_code')
        .eq('user_id', userId);

    if (error) {
        console.error('[PROMO] Error fetching addresses for VECINOS:', error);
        return {
            eligible: false,
            error: 'Error al verificar tu dirección para el código VECINOS',
        };
    }

    const savedAddresses = Array.isArray(addresses) ? addresses : [];
    if (savedAddresses.length === 0) {
        return {
            eligible: false,
            error: 'Añade tu dirección en tu perfil para comprobar que vives cerca de nuestro local y usar el código VECINOS',
        };
    }

    const isNeighbor = savedAddresses.some((addr: any) => {
        const lat = addr.lat !== null && addr.lat !== undefined ? Number(addr.lat) : NaN;
        const lon = addr.lon !== null && addr.lon !== undefined ? Number(addr.lon) : NaN;

        if (Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0)) {
            const distKm = haversineDistanceKm(
                RESTAURANT_COORDS.lat,
                RESTAURANT_COORDS.lon,
                lat,
                lon
            );
            return distKm <= NEIGHBOR_RADIUS_KM;
        }

        const cleanPostal = String(addr.postal_code || '')
            .replace(/\D/g, '')
            .trim();
        return cleanPostal.length === 5 && NEIGHBOR_POSTAL_CODES.has(cleanPostal);
    });

    if (!isNeighbor) {
        return {
            eligible: false,
            error: 'El código VECINOS es exclusivo para vecinos que viven cerca de nuestro local (Calle Barrilero, 20)',
        };
    }

    return { eligible: true };
}
