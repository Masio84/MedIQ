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
    .from('chat_messages')
    .select('*')
    .limit(1);

  if (error) {
    console.log("Empty or Error fetching messages:", error.message || error);
    // Let's try to query RPC or any list of columns directly
    const { data: cols, error: errCols } = await supabase.rpc('get_columns', { table_name: 'chat_messages' });
    if (errCols) {
        console.log("RPC Error:", errCols.message);
    } else {
        console.log("Columns from RPC:", cols);
    }
  } else {
    console.log("Columns on chat_messages:", data.length > 0 ? Object.keys(data[0]) : "No data to inspect columns");
  }
}

test();
