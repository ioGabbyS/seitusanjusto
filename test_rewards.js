const { createClient } = require('@supabase/supabase-js');
const url = 'https://adkdesaeysijbgmiyywj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2Rlc2FleXNpamJnbWl5eXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjEwOTcsImV4cCI6MjA5MzA5NzA5N30.eVN9Ooae5NFnJ0zs-D0Ln42wFidKQjz-V1Mh93nGRh8';

const supabase = createClient(url, key);

async function test() {
  console.log("Testing rewards insert...");
  const newReward = {
    id: Date.now().toString(),
    name: 'Test Reward',
    category: 'Puntos',
    point_cost: 10,
    stock: 5,
    image: ''
  };
  
  const { data, error } = await supabase.from('rewards').upsert(newReward).select();
  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success:", data);
  }
}
test();
