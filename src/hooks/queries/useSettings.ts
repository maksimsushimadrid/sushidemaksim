import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';

export interface SiteSettings {
    contactPhone: string;
    contactEmail: string;
    contactAddressLine1: string;
    contactAddressLine2: string;
    contactGoogleMapsUrl: string;
    contactSchedule: any[];
    socialLinks: any[];
    estDeliveryTime: string;
    closedMessage: string;
    ratingTheFork: number;
    ratingGoogle: number;
    ratingReviewsCount: number;
    isReservationsTodayClosed: boolean;
}

export function useSettings() {
    return useQuery<SiteSettings>({
        queryKey: ['settings'],
        queryFn: async () => {
            const data = await api.get('/settings');
            return {
                contactPhone: data.contactPhone || '',
                contactEmail: data.contactEmail || '',
                contactAddressLine1: data.contactAddressLine1 || '',
                contactAddressLine2: data.contactAddressLine2 || '',
                contactGoogleMapsUrl: data.contactGoogleMapsUrl || '',
                contactSchedule: Array.isArray(data.contactSchedule) ? data.contactSchedule : [],
                socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
                estDeliveryTime: data.estDeliveryTime || '30-60 min',
                closedMessage:
                    data.closedMessage || 'Lo sentimos, la cocina está cerrada temporalmente.',
                ratingTheFork: data.ratingTheFork || 9.1,
                ratingGoogle: data.ratingGoogle || 4.8,
                ratingReviewsCount: data.ratingReviewsCount || 543,
                isReservationsTodayClosed: data.isReservationsTodayClosed === 'true',
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
