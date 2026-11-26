import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

interface RealtimeParams {
    userId?: string;
    orderId?: string | number;
    onUpdate?: () => void;
}

/**
 * Hook to listen for order status updates via Supabase Broadcast.
 * Can listen to a specific user's orders or a single specific order.
 */
export function useOrderRealtime({ userId, orderId, onUpdate }: RealtimeParams) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channelName = orderId
            ? `order_tracking:${orderId}`
            : userId
              ? `user_orders:${userId}`
              : null;

        if (!channelName) return;

        const channel = supabase.channel(channelName);

        const handleUpdate = () => {
            if (onUpdate) {
                onUpdate();
            }

            queryClient.invalidateQueries({ queryKey: ['orders'] });
            if (orderId) {
                queryClient.invalidateQueries({ queryKey: ['order', String(orderId)] });
            }
        };

        channel
            .on('broadcast', { event: 'order_status_updated' }, handleUpdate)
            .on('broadcast', { event: 'orderStatus_updated' }, handleUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, orderId, queryClient, onUpdate]);
}
