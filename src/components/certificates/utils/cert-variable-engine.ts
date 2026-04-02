// Simulated Variable Engine for Certificates

export const getCertificateVariableDataMap = (mockData?: any) => {
  const patient = mockData?.patient || {
    name: 'Nombre del Paciente',
    age: 'XX',
    gender: 'Sexo',
    folio: 'F-0000',
    date: new Date().toLocaleDateString('es-MX'),
  };

  const doctor = mockData?.doctor || {
    name: 'Dr. Nombre del Médico',
    specialty: 'Especialidad',
    cedula: '12345678',
    specialtyCedula: '87654321',
  };

  const clinic = mockData?.clinic || {
    name: 'Nombre Clínica/Hospital',
    address: 'Dirección completa, Ciudad, Estado, CP',
    phone: 'Tel: (000) 000-0000',
  };

  return {
    // Clinic Variables
    '{{clinic_name}}': clinic.name,
    '{{clinic_address}}': clinic.address,
    '{{clinic_phone}}': clinic.phone,

    // Doctor Variables
    '{{doctor_name}}': doctor.name,
    '{{doctor_specialty}}': doctor.specialty,
    '{{doctor_cedula}}': doctor.cedula,
    '{{doctor_cedula_esc}}': doctor.specialtyCedula,

    // Patient Variables
    '{{patient_name}}': patient.name,
    '{{patient_age}}': patient.age,
    '{{patient_gender}}': patient.gender,
    '{{patient_folio}}': patient.folio,
    '{{patient_date}}': patient.date,
  };
};

export const replaceCertificateVariables = (text: string, mockData?: any): string => {
  if (!text) return '';
  const dataMap = getCertificateVariableDataMap(mockData);
  let result = text;
  
  Object.entries(dataMap).forEach(([key, value]) => {
    // Escapar caracteres especiales para el RegExp
    const cleanKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Crear RegExp que soporte:
    // 1. Mayúsculas/minúsculas (flag 'i')
    // 2. Con o sin llaves externas (opcional)
    // 3. Globalmente (flag 'g')
    const pattern = new RegExp(cleanKey, 'gi');
    
    result = result.replace(pattern, value?.toString() || '');
  });
  
  return result;
};
