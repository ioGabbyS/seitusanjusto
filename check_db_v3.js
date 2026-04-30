
const https = require('https');
const fs = require('fs');

const options = {
    hostname: 'qoxmjecahsauiccpmksa.supabase.co',
    port: 443,
    path: '/rest/v1/catalog?select=id&limit=1',
    method: 'GET',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (d) => { data += d; });
    res.on('end', () => {
        fs.writeFileSync('db_res.txt', data);
    });
});

req.on('error', (e) => {
    fs.writeFileSync('db_res.txt', 'Error: ' + e.message);
});
req.end();
