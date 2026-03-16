const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pqpoqyzkhacnmboaixhv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcG9xeXpraGFjbm1ib2FpeGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU5NjI2OCwiZXhwIjoyMDg5MTcyMjY4fQ.KhP63EYNRzKh1gheqBJLDIVCSAK8oECdWByNWx5MNag'
);

async function test() {
  const { data, error } = await supabase
    .from('billing')
    .select('id, normal_fee, discount, extra_charge, created_at, paid, patient_id, patients(name, id), consultations(id, notes, doctor_id)')
    .limit(1);

  if (error) console.error('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

test();
