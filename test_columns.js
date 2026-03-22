import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching schema:", error);
  } else {
    console.log("Columns on chat_messages:", data.length > 0 ? Object.keys(data[0]) : "No data to inspect columns");
  }
}

test();
