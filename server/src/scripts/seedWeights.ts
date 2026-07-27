import { supabase } from '../db/supabase.js';

function computeWeight(item: {
    id: number;
    name: string;
    category: string;
    pieces?: number | null;
    weight?: string | null;
}): string {
    if (item.weight && Boolean(String(item.weight).trim())) {
        return String(item.weight).trim();
    }

    const text = `${item.name} ${item.category}`.toLowerCase();
    const cat = item.category.toLowerCase();

    if (cat.includes('rollos-grandes') || cat.includes('rollos-especiales')) {
        return '250';
    }
    if (cat.includes('rollos-fritos') || cat.includes('hot')) {
        return '280';
    }
    if (
        cat.includes('clasicos') ||
        cat.includes('hosomaki') ||
        text.includes('clásico') ||
        text.includes('clasico')
    ) {
        return '140';
    }
    if (cat.includes('nigiri') || text.includes('nigiri')) {
        return item.pieces && item.pieces > 1 ? `${item.pieces * 35}` : '35';
    }
    if (cat.includes('gunkan') || text.includes('gunkan')) {
        return item.pieces && item.pieces > 1 ? `${item.pieces * 40}` : '70';
    }
    if (cat.includes('sashimi')) {
        return '120';
    }
    if (cat.includes('sopas') || text.includes('sopa') || text.includes('tom yum')) {
        return '350';
    }
    if (text.includes('gyoza') || text.includes('gyozas')) {
        return '180';
    }
    if (text.includes('edamame')) {
        return '150';
    }
    if (text.includes('wakame')) {
        return '120';
    }
    if (text.includes('bao')) {
        return '160';
    }
    if (text.includes('mochi')) {
        return '80';
    }
    if (text.includes('cheesecake') || text.includes('tarta')) {
        return '120';
    }
    if (text.includes('tequeños') || text.includes('tequenos')) {
        return '160';
    }
    if (text.includes('finger') || text.includes('mozzarella')) {
        return '150';
    }
    if (text.includes('langostinos fritos')) {
        return '160';
    }
    if (cat.includes('entrantes')) {
        return '180';
    }
    if (cat.includes('combos') || cat.includes('set') || text.includes('xl')) {
        return '650';
    }
    return '';
}

async function run() {
    console.log('Fetching menu items from Supabase...');
    const { data: items, error } = await supabase.from('menu_items').select('*');

    if (error || !items) {
        console.error('Error fetching menu items:', error);
        process.exit(1);
    }

    console.log(`Found ${items.length} menu items. Setting default weights...`);

    let updatedCount = 0;
    for (const item of items) {
        if (item.category === 'bebidas') continue; // Don't set grammage for drinks unless appropriate

        const weightVal = computeWeight(item);
        if (!weightVal) continue;

        console.log(`Item #${item.id} "${item.name}" -> Weight: ${weightVal} g`);

        const { error: updateErr } = await supabase
            .from('menu_items')
            .update({ weight: weightVal })
            .eq('id', item.id);

        if (updateErr) {
            console.error(`Failed to update item #${item.id}:`, updateErr);
        } else {
            updatedCount++;
        }
    }

    console.log(`Successfully updated ${updatedCount} items with weight in grams!`);
    process.exit(0);
}

run();
