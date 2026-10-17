/**
 * Approximate calorie estimation for menu items.
 * Heuristic: base energy density (kcal/100g) by dish type, adjusted by
 * ingredient keywords found in name/description/category, multiplied by
 * the dish weight (explicit, or estimated from pieces / dish type).
 * Values are indicative only.
 */

interface CalorieInput {
    name?: string;
    description?: string;
    category?: string;
    weight?: string | number | null;
    pieces?: number | string | null;
}

export interface CalorieEstimate {
    kcal: number;
    per100g: number;
    grams: number;
    weightEstimated: boolean;
}

// [keywords, kcal/100g, grams per piece, default dish grams]
const DISH_TYPES: Array<[string[], number, number, number]> = [
    [['bebida', 'refresco', 'drink', 'agua', 'zumo', 'coca', 'té ', 'cerveza'], 40, 0, 330],
    [['postre', 'mochi', 'dessert', 'helado', 'tarta', 'cheesecake', 'dulce'], 290, 35, 120],
    [['sopa', 'miso', 'ramen', 'caldo'], 70, 0, 350],
    [['ensalada', 'salad', 'wakame', 'edamame'], 110, 0, 180],
    [['gyoza', 'dumpling', 'empanadilla'], 210, 25, 150],
    [['tempura', 'frito', 'fried', 'crunch', 'panko', 'karaage'], 250, 35, 200],
    [['sashimi', 'tataki', 'carpaccio', 'tartar'], 140, 15, 150],
    [['nigiri', 'gunkan'], 160, 35, 140],
    [['poke', 'bowl', 'donburi', 'chirashi'], 150, 0, 380],
    [['wok', 'yakisoba', 'udon', 'noodle', 'fideo', 'arroz frito', 'yakimeshi'], 165, 0, 350],
    [['set', 'combo', 'menú', 'menu', 'party', 'barco', 'bandeja'], 175, 30, 800],
    [['roll', 'maki', 'uramaki', 'futomaki', 'california', 'philadelphia', 'temaki'], 175, 30, 250],
];

// [keywords, kcal/100g adjustment]
const MODIFIERS: Array<[string[], number]> = [
    [['queso', 'crema', 'philadelphia', 'cheese'], 25],
    [['tempura', 'frit', 'panko', 'crujiente', 'crunch'], 35],
    [['mayo', 'spicy', 'kewpie', 'salsa', 'teriyaki', 'unagi'], 15],
    [['aguacate', 'avocado'], 10],
    [['salmón', 'salmon', 'anguila', 'pez mantequilla', 'butterfish'], 10],
    [['chocolate', 'caramelo', 'nutella'], 40],
    [['pepino', 'vegetal', 'veggie', 'verdura', 'kanikama'], -15],
    [['light', 'zero', 'sin azúcar'], -30],
];

const parseNumber = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const m = String(v)
        .replace(',', '.')
        .match(/\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
};

export function estimateCalories(item: CalorieInput): CalorieEstimate {
    const text =
        ` ${item.category || ''} ${item.name || ''} ${item.description || ''} `.toLowerCase();

    const type =
        DISH_TYPES.find(([kw]) => kw.some(k => text.includes(k))) ||
        ([[], 180, 30, 250] as [string[], number, number, number]);
    const [, basePer100g, gramsPerPiece, defaultGrams] = type;
    let per100g = basePer100g;

    for (const [kw, adj] of MODIFIERS) {
        if (kw.some(k => text.includes(k))) per100g += adj;
    }
    per100g = Math.max(20, per100g);

    // Weight: explicit grams (or ml) → pieces × grams per piece → default
    let grams = parseNumber(item.weight);
    let weightEstimated = false;
    if (grams && /kg/i.test(String(item.weight))) grams *= 1000;
    if (!grams) {
        const pieces = parseNumber(item.pieces);
        grams = pieces && gramsPerPiece ? pieces * gramsPerPiece : defaultGrams;
        weightEstimated = true;
    }

    const kcal = Math.round((grams * per100g) / 100 / 10) * 10;
    return { kcal, per100g: Math.round(per100g), grams: Math.round(grams), weightEstimated };
}
