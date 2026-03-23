const fs = require('fs');
const path = require('path');

const files = [
  'consultations/delete/route.ts',
  'patients/create/route.ts',
  'patients/update/route.ts',
  'patients/delete/route.ts',
  'patients/search/route.ts',
  'appointments/cancel/route.ts',
  'appointments/update/route.ts',
  'appointments/unblock-slot/route.ts',
  'appointments/waiting-list/route.ts'
];

const apiDir = path.join(process.cwd(), 'src/app/api');

files.forEach(f => {
  const full = path.join(apiDir, f);
  if (!fs.existsSync(full)) {
    console.log(`Fichero no existe: ${f}`);
    return;
  }
  let content = fs.readFileSync(full, 'utf-8');

  // 1. Reemplazar imports
  content = content.replace("import { supabaseAdmin } from '@/lib/supabaseAdmin';", "import { createClient } from '@/lib/supabase/server';");

  // 2. Inyectar createClient
  if (content.includes('const { user, profile } = auth') && !content.includes('const supabase = await createClient();')) {
      content = content.replace('const { user, profile } = auth as any;', 'const { user, profile } = auth as any;\n    const supabase = await createClient();');
  } else if (content.includes('const { user } = auth') && !content.includes('const supabase = await createClient();')) {
      content = content.replace('const { user } = auth as any;', 'const { user } = auth as any;\n    const supabase = await createClient();');
  } else if (!content.includes('const supabase = await createClient();') && content.includes("if ('error' in auth)")) {
      const mark = content.indexOf("if ('error' in auth)");
      const closeBracket = content.indexOf('}', mark);
      if (closeBracket !== -1) {
          content = content.slice(0, closeBracket + 1) + '\n\n  const { user, profile } = auth as any;\n  const supabase = await createClient();' + content.slice(closeBracket + 1);
      }
  }

  // 3. Reemplazar supabaseAdmin por supabase
  content = content.replace(/supabaseAdmin/g, 'supabase');

  // 4. Forzar clinic_id en insert
  if (content.includes('.insert([')) {
      content = content.replace(/.insert\(\[\s*\{/g, `.insert([{\n        clinic_id: profile.clinic_id,`);
  }

  // 5. Agregar .eq('clinic_id', profile.clinic_id) para select, update, delete
  // Solo aplicamos si no hay ya un filtro clinic_id
  if (content.includes(".from('") && !content.includes(".eq('clinic_id'")) {
      const rx = /\.from\('(\w+)'\)/g;
      content = content.replace(rx, (match, table) => {
          if (['consultations', 'patients', 'billing', 'appointments', 'blocked_slots'].includes(table)) {
              return `.from('${table}').eq('clinic_id', profile.clinic_id)`;
          }
          return match;
      });
  }

  fs.writeFileSync(full, content);
  console.log(`Procesado: ${f}`);
});
