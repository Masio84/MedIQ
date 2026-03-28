const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  content.split('\n').forEach(line => {
    if (line.includes('=')) {
      const index = line.indexOf('=');
      const key = line.substring(0, index).trim();
      const value = line.substring(index + 1).trim().replace(/^"|"$/g, '');
      process.env[key] = value;
    }
  });
}

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabase.from('profiles').select('*').limit(1);
  console.log(Object.keys(data?.[0] || {}));
}

run();
