
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qoxmjecahsauiccpmksa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTkwMDQzNiwiZXhwIjoyMDg1NDc2NDM2fQ.mBUAkrNAeOX3dV-7frOryN7EZI7GjM0wygsvNwXUofw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCatalog() {
    const { data: catalog, error } = await supabase.from('catalog').select('*');
    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("--- CATALOG INSPECTION ---");
    const pals = catalog.filter(p => p.name.includes("AMERICANA"));
    pals.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.name} | Barcode: ${p.barcode} | Cat: ${p.category} | Stock: ${p.quantity}`);
    });
}

inspectCatalog();
