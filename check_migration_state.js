import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profs } = await supabase.from('profiles').select('*').eq('role', 'doctor');
  console.log('Doctors profiles:', profs);

  const { data: clinics } = await supabase.from('clinics').select('*');
  console.log('Available Clinics:', clinics);
}

check();
