const fs = require('fs');
const file = 'src/components/dashboards/AssistantDashboard.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Reemplazar mapeos
content = content.replace('{billings.map((b) => {', '{Array.isArray(billings) && billings.map((b) => {');
content = content.replace('{notifications.map((notif, idx) => {', '{Array.isArray(notifications) && notifications.map((notif, idx) => {');
content = content.replace('{doctors.map(d => <option', '{Array.isArray(doctors) && doctors.map(d => <option');

// 2. Reemplazar setState (con o sin validaciones previas si existen)
// Buscaremos formas comunes: setBillings(data), setNotifications(data), setDoctors(data)
content = content.replace(/setBillings\(([^)]+)\)/g, (match, p1) => {
    if (p1.includes('Array.isArray')) return match;
    return `setBillings(Array.isArray(${p1}) ? ${p1} : [])`;
});

content = content.replace(/setNotifications\(([^)]+)\)/g, (match, p1) => {
    if (p1.includes('Array.isArray') || p1.includes('prev =>')) return match; // ignorar actualizaciones funcionales
    return `setNotifications(Array.isArray(${p1}) ? ${p1} : [])`;
});

content = content.replace(/setDoctors\(([^)]+)\)/g, (match, p1) => {
    if (p1.includes('Array.isArray')) return match;
    return `setDoctors(Array.isArray(${p1}) ? ${p1} : [])`;
});

fs.writeFileSync(file, content);
console.log('Reemplazos completados en AssistantDashboard.tsx');
