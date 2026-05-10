/** Default Tablón categories — synced with DB seed data */
export const TABLON_DEFAULT_CATEGORIES = [
    { id: 'espero-pedido', name: 'Espero mi pedido', emoji: '⏳' },
    { id: 'eventos', name: 'Eventos', emoji: '🎉' },
    { id: 'negocios', name: 'Negocios', emoji: '💼' },
    { id: 'ideas', name: 'Ideas', emoji: '💡' },
    { id: 'sugerencias', name: 'Sugerencias', emoji: '📝' },
    { id: 'trabajo', name: 'Trabajo', emoji: '👷' },
    { id: 'alquiler', name: 'Alquiler', emoji: '🏠' },
    { id: 'varios', name: 'Varios', emoji: '📦' },
] as const;

/** Maximum photos allowed per post */
export const TABLON_MAX_IMAGES = 9;

/** Maximum tags allowed per post */
export const TABLON_MAX_TAGS = 3;

/** Edit window in milliseconds (20 minutes) */
export const TABLON_EDIT_WINDOW_MS = 20 * 60 * 1000;
