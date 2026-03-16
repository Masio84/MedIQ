import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pqpoqyzkhacnmboaixhv.supabase.co',
  'ey...' // using ANON_KEY from output
);

async function test() {
  const { data, error } = await supabase
    .from('billing')
    .select('*, consultations(*, patients(*))') // Fetch everything
    .limit(3);

  console.log(JSON.stringify(data, null, 2));
}

test();
