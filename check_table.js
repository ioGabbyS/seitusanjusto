
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qoxmjecahsauiccpmksa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking stock_logs table...");
    const { data, error } = await supabase.from('stock_logs').select('*').order('timestamp', { ascending: false }).limit(1);
    if (error) {
        console.error("Error fetching stock_logs:", error);
    } else {
        console.log("Sample row (newest):", data[0]);
        if (data[0]) {
            console.log("Columns found:", Object.keys(data[0]));
        } else {
            console.log("No data found in stock_logs");
        }
    }
}

check();
