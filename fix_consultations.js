const fs = require('fs');
const file = 'src/app/dashboard/consultations/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Reemplazar mapeo
content = content.replace('{history.map((c) => (', '{Array.isArray(history) && history.map((c) => (');

// 2. Reemplazar setState
content = content.replace('if (data) setHistory(data);', 'setHistory(Array.isArray(data) ? data : []);');

fs.writeFileSync(file, content);
console.log('Reemplazos completados en ConsultationsPage');
