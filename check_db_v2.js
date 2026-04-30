
const fs = require('fs');
const url = 'https://qoxmjecahsauiccpmksa.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';

async function check() {
    try {
        const catRes = await fetch(url + 'catalog?select=id,name,category', { headers: { 'apikey': key } });
        const catalog = await catRes.json();

        const iceRes = await fetch(url + 'ice_cream_stock?select=id', { headers: { 'apikey': key } });
        const iceStock = await iceRes.json();

        const output = {
            catalogCount: catalog.length,
            catalogSample: catalog,
            iceStockCount: iceStock.length,
            iceStockSample: iceStock
        };

        fs.writeFileSync('db_report.json', JSON.stringify(output, null, 2));
        console.log('Report written to db_report.json');
    } catch (e) {
        console.error('Error:', e);
    }
}

check();
