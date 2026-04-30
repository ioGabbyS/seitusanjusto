
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qoxmjecahsauiccpmksa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFull() {
    console.log("Attempting test insert WITH all columns...");
    const log = {
        id: "test_full_" + Date.now(),
        product_name: "TEST FULL PRODUCT",
        product_id: "test_id_123",
        category: "TEST CATEGORY",
        quantity: 5,
        reason: "Verifying schema update",
        user_name: "Verification Script",
        timestamp: new Date().toISOString(),
        previous_stock: 10,
        new_stock: 15,
        bultos: 0,
        units: 5,
        pack_units: 1,
        is_additive: true
    };

    const { data, error } = await supabase.from('stock_logs').insert([log]);
    if (error) {
        console.error("INSERT ERROR (Still failing?):", error);
    } else {
        console.log("INSERT SUCCESS! The database now accepts all columns.");
    }
}

testFull();
