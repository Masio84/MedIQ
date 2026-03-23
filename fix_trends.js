const fs = require('fs');
const file = 'src/components/dashboards/TrendsPanel.tsx';
let content = fs.readFileSync(file, 'utf-8');

const target = '{doctors.map(d => (';
const replacement = '{Array.isArray(doctors) && doctors.map(d => (';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Reemplazo exitoso en TrendsPanel.tsx');
} else {
    console.log('No se encontro el target');
}
