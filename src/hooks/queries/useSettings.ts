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
    isStoreClosed: boolean;
    isTodayClosed: boolean;
    isPickupOnly: boolean;
    minOrder: number;
    deliveryFee: number;
    vacationStartDate?: string;
    vacationEndDate?: string;
    customClosures?: any[];
}

export function useSettings() {
    return useQuery<SiteSettings>({
        queryKey: ['settings'],
        queryFn: async () => {
            const data = await api.get('/settings');
            const minOrderVal = data.minOrder ?? data.min_order;
            const deliveryFeeVal = data.deliveryFee ?? data.delivery_fee;
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
                isStoreClosed:
                    data.isStoreClosed === 'true' ||
                    data.isStoreClosed === true ||
                    data.is_store_closed === 'true' ||
                    data.is_store_closed === true,
                isTodayClosed:
                    data.isTodayClosed === 'true' ||
                    data.isTodayClosed === true ||
                    data.is_today_closed === 'true' ||
                    data.is_today_closed === true,
                isPickupOnly:
                    data.isPickupOnly === 'true' ||
                    data.isPickupOnly === true ||
                    data.is_pickup_only === 'true' ||
                    data.is_pickup_only === true,
                minOrder: minOrderVal !== undefined ? Number(minOrderVal) : 15,
                deliveryFee: deliveryFeeVal !== undefined ? Number(deliveryFeeVal) : 3.5,
                vacationStartDate: data.vacationStartDate || '',
                vacationEndDate: data.vacationEndDate || '',
                customClosures: Array.isArray(data.customClosures) ? data.customClosures : [],
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
