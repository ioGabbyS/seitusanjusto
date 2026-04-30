
import { createClient } from '@supabase/supabase-client-helpers'; // Wait, I should use the proper client
import { supabase } from './src/utils/supabaseClient.js';

async function check() {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}

check();
