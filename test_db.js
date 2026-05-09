const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || 'https://adkdesaeysijbgmiyywj.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2Rlc2FleXNpamJnbWl5eXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjEwOTcsImV4cCI6MjA5MzA5NzA5N30.eVN9Ooae5NFnJ0zs-D0Ln42wFidKQjz-V1Mh93nGRh8';

const supabase = createClient(url, key);

async function test() {
  console.log("Fetching customers from San Justo DB...");
  const { data, error } = await supabase.from('customers').select('*').limit(10);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", data);
  }
}
test();
