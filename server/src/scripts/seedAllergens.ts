import { supabase } from '../db/supabase.js';

function computeAllergens(item: {
    name: string;
    description?: string;
    category: string;
}): string[] {
    const text = `${item.name} ${item.description || ''}`.toLowerCase();
    const cat = item.category.toLowerCase();
    const allergens = new Set<string>();

    // Pescado
    if (
        text.includes('salmón') ||
        text.includes('salmon') ||
        text.includes('atún') ||
        text.includes('atun') ||
        text.includes('anguila') ||
        text.includes('pez mantequilla') ||
        text.includes('pez volador') ||
        text.includes('pescado') ||
        text.includes('bonito') ||
        text.includes('katsuobushi') ||
        text.includes('tobiko') ||
        text.includes('masago') ||
        text.includes('caviar')
    ) {
        allergens.add('fish');
    }

    // Crustáceos
    if (
        text.includes('gamba') ||
        text.includes('langostino') ||
        text.includes('cangrejo') ||
        text.includes('surimi') ||
        /\bebi\b/.test(text) ||
        text.includes('crustaceo') ||
        text.includes('marisco')
    ) {
        allergens.add('crustaceos');
    }

    // Moluscos
    if (
        text.includes('pulpo') ||
        text.includes('calamar') ||
        text.includes('vieira') ||
        /\btako\b/.test(text) ||
        text.includes('ostra')
    ) {
        allergens.add('moluscos');
    }

    // Soja (salsas, edamame, miso, tofu y salsa de soja de acompañamiento para sushi)
    if (
        text.includes('soja') ||
        text.includes('edamame') ||
        text.includes('miso') ||
        text.includes('tofu') ||
        text.includes('teriyaki') ||
        text.includes('ponzu') ||
        cat.includes('rollo') ||
        cat.includes('nigiri') ||
        cat.includes('gunkan') ||
        cat.includes('sashimi') ||
        cat.includes('poke') ||
        cat.includes('combo')
    ) {
        allergens.add('soy');
    }

    // Gluten (tempura, rebozado, pan panko, fideos ramen, gyoza, bao, fritos, cerveza)
    if (
        text.includes('tempura') ||
        text.includes('panko') ||
        text.includes('pan rallado') ||
        text.includes('frito') ||
        text.includes('gyoza') ||
        text.includes('bao') ||
        text.includes('ramen') ||
        text.includes('fideos') ||
        text.includes('dorayaki') ||
        text.includes('tarta') ||
        text.includes('cheesecake') ||
        text.includes('cerveza') ||
        text.includes('teriyaki') ||
        cat.includes('rollos-fritos')
    ) {
        allergens.add('gluten');
    }

    // Lácteos / Lactosa
    if (
        text.includes('queso') ||
        text.includes('philadelphia') ||
        text.includes('cream') ||
        text.includes('nata') ||
        text.includes('leche') ||
        text.includes('cheesecake') ||
        text.includes('mochi') ||
        text.includes('helado')
    ) {
        allergens.add('lactose');
    }

    // Huevo
    if (
        text.includes('mayonesa') ||
        text.includes('mayo') ||
        text.includes('picante') ||
        text.includes('spicy') ||
        text.includes('tamago') ||
        text.includes('tortilla') ||
        text.includes('huevo') ||
        text.includes('tempura') ||
        text.includes('panko')
    ) {
        allergens.add('huevo');
    }

    // Sésamo
    if (
        text.includes('sésamo') ||
        text.includes('sesamo') ||
        text.includes('wakame') ||
        text.includes('uramaki') ||
        cat.includes('rollo') ||
        cat.includes('combo')
    ) {
        allergens.add('sesamo');
    }

    // Frutos de cáscara / Cacahuetes
    if (
        text.includes('nueces') ||
        text.includes('almendra') ||
        text.includes('cacahuete') ||
        text.includes('frutos secos') ||
        text.includes('nutella')
    ) {
        allergens.add('nuts');
    }

    // Mostaza
    if (text.includes('mostaza') || text.includes('wasabi')) {
        allergens.add('mostaza');
    }

    // Sulfitos
    if (
        text.includes('vino') ||
        text.includes('mirin') ||
        text.includes('cava') ||
        text.includes('tinto')
    ) {
        allergens.add('sulfito');
    }

    return Array.from(allergens);
}

async function run() {
    console.log('Fetching menu items from Supabase...');
    const { data: items, error } = await supabase.from('menu_items').select('*');

    if (error || !items) {
        console.error('Error fetching menu items:', error);
        process.exit(1);
    }

    console.log(`Found ${items.length} menu items. Updating allergens...`);

    let updatedCount = 0;
    for (const item of items) {
        const computed = computeAllergens(item);
        console.log(`Item #${item.id} "${item.name}" -> Allergens: [${computed.join(', ')}]`);

        const { error: updateErr } = await supabase
            .from('menu_items')
            .update({ allergens: computed })
            .eq('id', item.id);

        if (updateErr) {
            console.error(`Failed to update item #${item.id}:`, updateErr);
        } else {
            updatedCount++;
        }
    }

    console.log(
        `Successfully updated ${updatedCount}/${items.length} items with computed allergens!`
    );
    process.exit(0);
}

run();
