const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
};

const srcDir = path.join(process.cwd(), 'src');
const files = walk(srcDir);

const report = [];

files.forEach(f => {
    const content = fs.readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        if (line.includes('.map(')) {
            // Extraer la variable que está antes de .map(
            const match = line.match(/(\w+(?:\?\.\w+)*)\s*\.map\(/);
            if (match) {
                const variable = match[1];
                
                // Buscar inicialización de la variable en el mismo archivo
                let initialized = 'Desconocida / Prop';
                const initMatch = content.match(new RegExp(`const\\s+\\[\\s*${variable}\\s*,\\s*set\\w+\\s*\\]\\s*=\\s*useState\\s*\\(([^)]+)\\)`, 'i'));
                if (initMatch) {
                    initialized = initMatch[1].trim();
                } else if (content.includes(`const\\s*${variable}\\s*=`)) {
                    initialized = 'Variable Local / Query';
                }

                // Verificar protección
                const hasOptionalChaining = line.includes('?.map(');
                const hasArrayCheck = content.includes(`Array.isArray(${variable})`) || line.includes(`Array.isArray(${variable})`);
                const hasFallback = line.includes(`${variable} || []`) || line.includes(`${variable} ?? []`);

                report.push({
                    file: f.replace(process.cwd(), '').replace(/\\/g, '/'),
                    line: idx + 1,
                    variable: variable,
                    initialized: initialized,
                    protected: (hasOptionalChaining || hasArrayCheck || hasFallback) ? 'sí' : 'no'
                });
            }
        }
    });
});

fs.writeFileSync('map_audit.json', JSON.stringify(report, null, 2));
console.log(`Auditoría completada. ${report.length} mapas encontrados.`);
