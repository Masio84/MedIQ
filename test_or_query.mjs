import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const profileId = '1c5e32d0-9c84-4181-8c27-df51957c98a1'; // Admin
  const selectedUserId = '76ca6e62-a3f9-4f7e-ba0d-c0220545050b'; // Assistant

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(`and(from_user_id.eq.${profileId},doctor_id.eq.${selectedUserId}),and(from_user_id.eq.${selectedUserId},doctor_id.eq.${profileId})`);

  if (error) {
    console.error("OR Query error:", error.message);
  } else {
    console.log("OR Query success! Count:", data.length);
    console.log(data);
  }
}

test();
