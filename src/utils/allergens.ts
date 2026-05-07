export const ALLERGEN_INFO: Record<
    string,
    { icon: string; bg: string; text: string; border: string }
> = {
    gluten: { icon: '🌾', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    trigo: { icon: '🌾', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    soja: { icon: '🌿', bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
    soy: { icon: '🌿', bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
    pescado: { icon: '🐟', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    fish: { icon: '🐟', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    crustaceos: { icon: '🦐', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    crustáceos: { icon: '🦐', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    marisco: { icon: '🦐', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    huevo: { icon: '🥚', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    leche: { icon: '🥛', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    lactose: { icon: '🥛', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    lacteos: { icon: '🥛', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    lácteos: { icon: '🥛', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    cacahuete: {
        icon: '🥜',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
    },
    nuts: { icon: '🥜', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    mani: { icon: '🥜', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    sesamo: { icon: '🌱', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    sésamo: { icon: '🌱', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    mostaza: {
        icon: '🟡',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-100',
    },
    apio: { icon: '🥬', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    sulfito: {
        icon: '🍷',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-100',
    },
    altramuz: { icon: '🌰', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    moluscos: { icon: '🦑', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' },
};

export const getAllergenInfo = (allergen: string) => {
    const key = allergen.toLowerCase().trim();
    for (const [k, info] of Object.entries(ALLERGEN_INFO)) {
        if (key.includes(k)) return info;
    }
    return { icon: '⚠️\uFE0F', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
};
