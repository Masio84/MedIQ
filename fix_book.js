const fs = require('fs');
const file = 'src/app/book/[slug]/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Reemplazar mapeo
content = content.replace('availableSlots.map(slot => (', 'Array.isArray(availableSlots) && availableSlots.map(slot => (');

// 2. Reemplazar setState
content = content.replace('setAvailableSlots(data.data);', 'setAvailableSlots(Array.isArray(data.data) ? data.data : []);');

fs.writeFileSync(file, content);
console.log('Reemplazos completados en BookPage');
