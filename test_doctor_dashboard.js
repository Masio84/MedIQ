import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role key to bypass RLS to check data existence

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // 1. Check patients count
  const { data: patients, error: pError } = await supabase.from('patients').select('id, name, clinic_id');
  console.log('Total Patients bypassing RLS:', patients?.length || 0, pError || '');

  if (patients?.length > 0) {
     console.log('Sample Patient:', patients[0]);
  }

  // 2. Test the ilike with .or syntax
  const { data: testOr, error: orError } = await supabase
    .from('patients')
    .select('id, name')
    .or(`name.ilike.%cuellar%`);
    
  console.log('Test with .or():', testOr?.length || 0, orError || '');

  // 3. Test with .ilike()
  const { data: testILike, error: iError } = await supabase
    .from('patients')
    .select('id, name')
    .ilike('name', '%cuellar%');
    
  console.log('Test with .ilike():', testILike?.length || 0, iError || '');
}

test();
