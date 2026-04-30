
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Try to find .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMovements() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking movements for ${today}...`);

    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('timestamp', `${today}T00:00:00Z`)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error);
        return;
    }

    console.log(`Found ${data.length} movements:`);
    data.forEach(m => {
        console.log(`- [${m.type}] ${m.description}: $${m.amount} (${m.timestamp}) ID: ${m.id}`);
    });
}

checkMovements();
