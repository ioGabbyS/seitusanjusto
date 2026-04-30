
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qoxmjecahsauiccpmksa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    console.log("Attempting test insert into stock_logs...");
    const log = {
        id: "test_" + Date.now(),
        product_name: "TEST PRODUCT",
        category: "TEST",
        quantity: 1,
        reason: "Test insert",
        user_name: "Test User",
        timestamp: new Date().toISOString(),
        previous_stock: 0,
        new_stock: 1,
        bultos: 1,
        units: 0,
        pack_units: 1,
        is_additive: true
    };

    const { data, error } = await supabase.from('stock_logs').insert([log]);
    if (error) {
        console.error("INSERT ERROR:", error);
    } else {
        console.log("INSERT SUCCESS:", data);
    }
}

testInsert();
