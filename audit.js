const fs = require('fs');
const path = require('path');

const apiDir = path.join(process.cwd(), 'src/app/api');
const endpoints = [];

function parseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            parseDir(full);
        } else if (f === 'route.ts') {
            const content = fs.readFileSync(full, 'utf-8');
            const route = full.replace(apiDir, '').replace('\\route.ts', '').replace('/route.ts', '');
            
            const hasSession = content.includes('auth.getUser(') || content.includes('authorizeUser(') || content.includes('requireSuperAdmin') ? 'sí' : 'no';
            const hasFeature = content.includes('requireFeature(') ? 'sí' : 'no';
            const restrictsClinic = (content.includes('clinic_id') && content.includes('.eq(')) || content.includes('auth.profile?.clinic_id') || content.includes('profile.clinic_id') ? 'sí' : 'no';

            endpoints.push({ route, hasSession, hasFeature, restrictsClinic, full: full.replace(process.cwd(), '') });
        }
    }
}

parseDir(apiDir);

let markdown = '| Ruta | Sesión | RequireFeature | Clinic Filtrado | Alerta |\n|---|---|---|---|---|\n';
for (const e of endpoints) {
    const alert = (e.hasSession === 'no' || e.restrictsClinic === 'no') ? '⚠️' : '-';
    markdown += `| \`${e.route}\` | ${e.hasSession} | ${e.hasFeature} | ${e.restrictsClinic} | ${alert} |\n`;
}

fs.writeFileSync(path.join(process.cwd(), 'audit_report.md'), markdown);
console.log('Reporte audit de seguridad creado');
