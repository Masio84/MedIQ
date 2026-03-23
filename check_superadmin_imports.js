const fs = require('fs');
const path = require('path');

const files = [
  'src/app/superadmin/page.tsx',
  'src/lib/permissions.ts',
  'src/components/superadmin/SuperAdminDashboard.tsx',
  'src/components/superadmin/ClinicsTable.tsx',
  'src/components/superadmin/GlobalMetrics.tsx',
  'src/components/superadmin/CreateClinicModal.tsx'
];

files.forEach(f => {
    try {
        const content = fs.readFileSync(f, 'utf-8');
        const imports = content.match(/import\s+[\s\S]*?\s+from\s+['"].*?['"]/g) || [];
        console.log(`--- IMPORTS EN ${f} ---`);
        imports.forEach(i => console.log(i));
        console.log('\n');
    } catch (e) {
        console.error(`Error procesando ${f}:`, e.message);
    }
});
