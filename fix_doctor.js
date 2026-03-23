const fs = require('fs');
const file = 'src/components/dashboards/DoctorDashboard.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Reemplazar mapeo
content = content.replace('{searchResults.map((p) => (', '{Array.isArray(searchResults) && searchResults.map((p) => (');

// 2. Reemplazar setState
content = content.replace('if (data) setSearchResults(data);', 'setSearchResults(Array.isArray(data) ? data : []);');

fs.writeFileSync(file, content);
console.log('Reemplazos completados en DoctorDashboard.tsx');
