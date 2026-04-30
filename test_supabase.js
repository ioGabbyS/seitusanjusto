
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function test() {
    const url = 'https://qoxmjecahsauiccpmksa.supabase.co/rest/v1/';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';
    try {
        console.log('Fetching Supabase...');
        const res = await fetch(url, {
            headers: { 'apikey': key }
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
