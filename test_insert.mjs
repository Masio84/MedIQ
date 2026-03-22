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
  const adminId = '1c5e32d0-9c84-4181-8c27-df51957c98a1';
  const assistantId = '76ca6e62-a3f9-4f7e-ba0d-c0220545050b';
  const clinicId = 'b81bcb5a-82a9-4687-9b9b-89f84b85a59d';

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      doctor_id: assistantId, 
      from_user_id: adminId,
      message: 'test admin to assistant',
      clinic_id: clinicId
    }]);

  if (error) {
    console.error("Insert error logic:", error.message);
  } else {
    console.log("Insert SUCCESSFUL!");
  }
}

test();
