const fs = require('fs');

const files = [
  {
    path: 'src/app/dashboard/agenda/page.tsx',
    replacements: [
      ['{waitingList.map(item => (', '{Array.isArray(waitingList) && waitingList.map(item => (']
    ]
  },
  {
    path: 'src/components/BillingPanel.tsx',
    replacements: [
      ['{patients.map(p => <option', '{Array.isArray(patients) && patients.map(p => <option']
    ]
  },
  {
    path: 'src/components/ConsultationForm.tsx',
    replacements: [
      ['{patients.map((p) => (', '{Array.isArray(patients) && patients.map((p) => ('],
      ['{symptomsList.map(s => (', '{Array.isArray(symptomsList) && symptomsList.map(s => ('],
      ['{aiSuggestions.symptoms.map(s => (', '{Array.isArray(aiSuggestions.symptoms) && aiSuggestions.symptoms.map(s => (']
    ]
  },
  {
    path: 'src/components/dashboards/AdminDashboard.tsx',
    replacements: [
      ['{profiles.map(', '{Array.isArray(profiles) && profiles.map(']
    ]
  },
  {
    path: 'src/components/PatientList.tsx',
    replacements: [
      ['{patients.map(', '{Array.isArray(patients) && patients.map(']
    ]
  },
  {
    path: 'src/components/UserManagement.tsx',
    replacements: [
      ['{profiles.map(', '{Array.isArray(profiles) && profiles.map(']
    ]
  }
];

files.forEach(f => {
    try {
        let content = fs.readFileSync(f.path, 'utf-8');
        let modified = false;
        f.replacements.forEach(([target, replacement]) => {
            if (content.includes(target)) {
                content = content.replace(target, replacement);
                modified = true;
            } else {
                console.log(`No se encontro string exacto en ${f.path} para: ${target}`);
            }
        });
        if (modified) {
            fs.writeFileSync(f.path, content);
            console.log(`Actualizado: ${f.path}`);
        }
    } catch (e) {
        console.error(`Error procesando ${f.path}:`, e.message);
    }
});
