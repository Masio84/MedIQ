import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .rpc('get_policies', { table_name: 'chat_messages' });

  if (error) {
    console.log("RPC Error:", error.message);
    // Alternatively, query pg_policies using an arbitrary select from a meta catalog table or RPC that executes raw SQL if available
    const { data: policies, error: errPg } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'chat_messages');
        
    if (errPg) {
        console.log("pg_policies query empty or error:", errPg.message);
        console.log("Let's try creating a view or something, but instead let's just query the table to see if inserts work.");
    } else {
        console.log("Policies:", policies);
    }
  } else {
    console.log("Policies from RPC:", data);
  }
}

test();
