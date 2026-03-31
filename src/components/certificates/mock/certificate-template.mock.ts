import { CertificateTemplate } from '../types/certificate-template.types';

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplate = {
  id: 'default-cert-template',
  doctorId: '',
  name: 'Certificado Médico Estándar',
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
        subtitle: 'Certificado Médico',
        contactInfo: '{{clinic_address}}\nTel: {{clinic_phone}}',
      },
    },
    {
      id: 'block-doctor',
      type: 'doctor',
      enabled: true,
      order: 1,
      style: {},
      contentConfig: {
        alignment: 'right',
        showSpecialty: true,
      },
    },
    {
      id: 'block-patient',
      type: 'patient',
      enabled: true,
      order: 2,
      style: {},
      contentConfig: {
        fields: ['name', 'age', 'gender', 'folio', 'date'],
      },
    },
    {
      id: 'block-body',
      type: 'body',
      enabled: true,
      order: 3,
      style: {},
      contentConfig: {
        prefix: 'A quien corresponda:\nPor medio de la presente, certifico que he examinado a',
        showPurpose: true,
      },
    },
    {
      id: 'block-signature',
      type: 'signature',
      enabled: true,
      order: 4,
      style: {},
      contentConfig: {
        position: 'center',
        showSeal: true,
      },
    },
    {
      id: 'block-footer',
      type: 'footer',
      enabled: true,
      order: 5,
      style: {},
      contentConfig: {
        text: 'Este certificado ha sido emitido digitalmente y es válido para los fines que al interesado convengan.',
      },
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_CERTIFICATE_DATA = {
  folio: 'CERT-2026-001',
  date: new Date().toLocaleDateString('es-MX'),
  purpose: 'Salud General',
  findings: 'Paciente en buen estado de salud general. Signos vitales dentro de parámetros normales. No presenta síntomas de enfermedades infectocontagiosas.',
  conclusion: 'APTO para realizar actividades físicas y deportivas.',
  validDays: 30,
};
