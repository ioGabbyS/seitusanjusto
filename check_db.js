
const url = 'https://qoxmjecahsauiccpmksa.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';

async function check() {
    try {
        const catRes = await fetch(url + 'catalog?select=*&limit=5', { headers: { 'apikey': key } });
        const catalog = await catRes.json();
        console.log('Catalog count (sample):', catalog.length);
        console.log('Catalog items:', JSON.stringify(catalog, null, 2));

        const iceRes = await fetch(url + 'ice_cream_stock?select=*&limit=5', { headers: { 'apikey': key } });
        const iceStock = await iceRes.json();
        console.log('Ice Cream Stock count (sample):', iceStock.length);
        console.log('Ice Cream items:', JSON.stringify(iceStock, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

check();
