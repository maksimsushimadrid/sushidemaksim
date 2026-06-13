import { supabase } from '../db/supabase.js';

async function main() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, abandoned_cart_reminder_sent_at, unconfirmed_reminder_sent_at')
        .limit(1);

    if (error) {
        console.error('Error querying columns:', error);
    } else {
        console.log('Columns exist! Data:', data);
    }
}

main();
