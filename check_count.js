
const fs = require('fs');
const url = 'https://qoxmjecahsauiccpmksa.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';

async function check() {
    try {
        const response = await fetch(url + 'catalog?select=count', {
            headers: {
                'apikey': key,
                'Prefer': 'count=exact'
            }
        });
        const count = response.headers.get('content-range');
        fs.writeFileSync('db_count.txt', 'Catalog count range: ' + count);
    } catch (e) {
        fs.writeFileSync('db_count.txt', 'Error: ' + e.message);
    }
}
check();
