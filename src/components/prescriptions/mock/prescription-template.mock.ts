import { PrescriptionTemplate } from '../types/prescription-template.types';

export const DEFAULT_TEMPLATE: PrescriptionTemplate = {
  id: 'default-template',
  doctorId: '',
  name: 'Plantilla Estándar',
  page: {
    size: 'LETTER',
    margins: {
      top: 15,
      right: 15,
      bottom: 15,
      left: 15,
    },
    orientation: 'PORTRAIT',
  },
  styles: {
    fontFamily: 'Arial',
    fontSize: 12,
    lineHeight: 1.5,
    primaryColor: '#1A4A8A',
    secondaryColor: '#64748B',
    textColor: '#1E293B',
  },
  branding: {
    logo: null,
    signature: null,
    seal: null,
  },
  blocks: [
    {
      id: 'block-header',
      type: 'header',
      enabled: true,
      order: 0,
      style: {},
      contentConfig: {
        title: '{{clinic_name}}',
        subtitle: '{{doctor_name}} - {{doctor_specialty}}',
        contactInfo: 'Cédula: {{doctor_cedula}}\n{{clinic_address}}\nTel: {{clinic_phone}}',
      },
    },
    {
      id: 'block-patient',
      type: 'patient',
      enabled: true,
      order: 1,
      style: {},
      contentConfig: {
        fields: ['name', 'age', 'gender', 'date', 'folio'],
      },
    },
    {
      id: 'block-diagnosis',
      type: 'diagnosis',
      enabled: true,
      order: 2,
      style: {},
      contentConfig: {
        showCIE10: true,
      },
    },
    {
      id: 'block-treatment',
      type: 'treatment',
      enabled: true,
      order: 3,
      style: {},
      contentConfig: {
        columns: ['medication', 'dose', 'frequency', 'duration'],
      },
    },
    {
      id: 'block-notes',
      type: 'notes',
      enabled: true,
      order: 4,
      style: {},
      contentConfig: {
        placeholder: 'Indicaciones adicionales...',
      },
    },
    {
      id: 'block-signature',
      type: 'signature',
      enabled: true,
      order: 5,
      style: {},
      contentConfig: {
        position: 'center',
      },
    },
    {
      id: 'block-footer',
      type: 'footer',
      enabled: true,
      order: 6,
      style: {},
      contentConfig: {
        text: 'Esta receta no es válida sin la firma y sello del médico.',
      },
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_PATIENT_DATA = {
  name: 'Juan Pérez García',
  age: 35,
  gender: 'Masculino',
  dob: '1989-05-15',
  curp: 'PEGJ890515HMZRRN01',
  phone: '5566778899',
  email: null, // Simulated missing email for UX test
};

export const MOCK_PRESCRIPTION_DATA = {
  folio: 'REC-2026-001',
  date: new Date().toLocaleDateString('es-MX'),
  diagnosis: 'Faringoamigdalitis aguda (J03.9)',
  treatment: [
    { medication: 'Amoxicilina 500mg', dose: '1 tableta', frequency: 'Cada 8 horas', duration: '7 días' },
    { medication: 'Paracetamol 500mg', dose: '1 tableta', frequency: 'Cada 6 horas en caso de dolor o fiebre', duration: '3 días' },
  ],
  notes: 'Abundantes líquidos. Evitar cambios bruscos de temperatura.',
};
