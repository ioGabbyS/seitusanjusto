
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qoxmjecahsauiccpmksa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking purchases table...");
    const { data, error } = await supabase.from('purchases').select('*').limit(1);
    if (error) {
        console.error("Error fetching purchases:", error);
    } else {
        console.log("Purchases table exists. Sample:", data[0]);
    }
}

check();
