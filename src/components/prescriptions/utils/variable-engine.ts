/**
 * List of available variables for prescription templates
 */
export const PRESCRIPTION_VARIABLES = {
  clinic: [
    { key: '{{clinic_name}}', label: 'Nombre de la Clínica', value: 'Clínica Santa Elena' },
    { key: '{{clinic_phone}}', label: 'Teléfono', value: '+52 555 123 4567' },
    { key: '{{clinic_address}}', label: 'Dirección', value: 'Av. Reforma 123, Ciudad de México' },
    { key: '{{clinic_logo}}', label: 'URL del Logo', value: 'https://placehold.co/200x200?text=LOGO' },
  ],
  doctor: [
    { key: '{{doctor_name}}', label: 'Nombre del Doctor', value: 'Dr. Alejandro Martínez' },
    { key: '{{doctor_specialty}}', label: 'Especialidad', value: 'Medicina General' },
    { key: '{{doctor_cedula}}', label: 'Cédula Profesional', value: '9876543210' },
    { key: '{{doctor_email}}', label: 'Correo Electrónico', value: 'alejandro.martinez@mymediq.app' },
  ],
  patient: [
    { key: '{{patient_name}}', label: 'Nombre del Paciente', value: 'Juan Pérez García' },
    { key: '{{patient_age}}', label: 'Edad', value: '45' },
    { key: '{{patient_gender}}', label: 'Género', value: 'Masculino' },
    { key: '{{patient_id}}', label: 'ID / Folio Paciente', value: 'PT-9021' },
  ],
  prescription: [
    { key: '{{date}}', label: 'Fecha Actual', value: new Date().toLocaleDateString() },
    { key: '{{folio}}', label: 'Folio Receta', value: 'REC-2024-001' },
  ],
};

/**
 * Replaces placeholders in a string with values from a data object
 */
export function replaceVariables(text: string, data: Record<string, string>): string {
  if (!text) return '';
  return text.replace(/\{\{([^{}]+)\}\}/g, (match, innerKey) => {
    const cleanKey = innerKey.trim().toLowerCase();
    const upperKey = innerKey.trim().toUpperCase();
    
    // Check exact match e.g. '{{CLINIC_NAME}}'
    if (data[match] !== undefined) return data[match];
    
    // Check lowercase with brackets e.g. '{{clinic_name}}'
    if (data[`{{${cleanKey}}}`] !== undefined) return data[`{{${cleanKey}}}`];
    
    // Check without brackets uppercase/lowercase e.g. 'CLINIC_NAME' or 'clinic_name'
    if (data[upperKey] !== undefined) return data[upperKey];
    if (data[cleanKey] !== undefined) return data[cleanKey];

    return match;
  });
}

/**
 * Flattens the nested variables into a single Record for the engine
 */
export function getVariableDataMap(): Record<string, string> {
  const map: Record<string, string> = {};
  Object.values(PRESCRIPTION_VARIABLES).flat().forEach(v => {
    map[v.key] = v.value;
  });
  return map;
}
