import { api } from '../utils/api';

/**
 * Types of events we track on the site.
 */
export type EventName =
    | 'page_view'
    | 'category_click'
    | 'product_click'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'search'
    | 'promo_apply'
    | 'promo_code_error'
    | 'delivery_zone_error'
    | 'checkout_step_change'
    | 'cart_view'
    | 'checkout_start'
    | 'delivery_info_filled'
    | 'payment_method_selected'
    | 'order_placed'
    | 'error_notice'
    | 'user_idle_start'
    | 'user_idle_end'
    | 'form_focus';

/**
 * Service for tracking user progress and interactions.
 */
class AnalyticsTracker {
    private sessionId: string;
    private sentSteps: Set<string> = new Set();
    private utmSource: string | null = null;

    constructor() {
        // Look for existing session or generate a new one
        let sid =
            sessionStorage.getItem('analytics_session_id') ||
            sessionStorage.getItem('funnel_session_id');
        if (!sid) {
            sid = crypto.randomUUID();
            sessionStorage.setItem('analytics_session_id', sid);
        }
        this.sessionId = sid;

        // Capture UTM parameters if present
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            this.utmSource = params.get('utm_source') || params.get('ref') || null;
            if (this.utmSource) {
                sessionStorage.setItem('analytics_utm_source', this.utmSource);
            } else {
                this.utmSource = sessionStorage.getItem('analytics_utm_source');
            }
        }
    }

    /**
     * Send an event to the backend.
     */
    async track(
        eventName: EventName,
        data: {
            userId?: string | number | null;
            metadata?: Record<string, any>;
        } = {}
    ) {
        // Completely disabled on the frontend to eliminate Vercel Serverless request usage
        // and keep function execution limits safe under the free Hobby tier.
        return;
    }

    /**
     * Legacy support for funnel tracking
     */
    async trackStep(step: any, data: any) {
        return this.track(step as EventName, data);
    }

    /**
     * Resets the session (call after successful order to start fresh)
     */
    resetSession() {
        this.sessionId = crypto.randomUUID();
        sessionStorage.setItem('analytics_session_id', this.sessionId);
        this.sentSteps.clear();
    }
}

export const funnelTracker = new AnalyticsTracker(); // Kept name for compatibility
export const tracker = funnelTracker;
