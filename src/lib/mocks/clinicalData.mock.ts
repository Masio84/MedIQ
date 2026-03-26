import { Patient, Consultation, Prescription, ClinicalHistoryEntry } from '../../types/clinical';

const NOW = new Date().toISOString();
const PAST_DATE_1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

// 1. Mock Paciente
export const mockPatients: Patient[] = [
  {
    id: 'pat_001',
    name: 'Juan',
    lastName: 'Pérez García',
    dateOfBirth: '1985-04-12',
    gender: 'male',
    email: 'juan.perez@example.com',
    phoneNumber: '+52 55 1234 5678',
    bloodType: 'O+',
    allergies: ['Penicilina', 'Polvo'],
    createdAt: '2023-01-15T10:00:00.000Z',
  },
  {
    id: 'pat_002',
    name: 'María',
    lastName: 'López Hernández',
    dateOfBirth: '1992-08-25',
    gender: 'female',
    email: 'maria.lopez@example.com',
    phoneNumber: '+52 55 8765 4321',
    createdAt: '2023-05-20T14:30:00.000Z',
  }
];

// 2. Mock Consultas
export const mockConsultations: Consultation[] = [
  {
    id: 'con_001',
    patientId: 'pat_001',
    diagnosis: 'Infección en vías respiratorias superiores',
    symptoms: ['Fiebre', 'Tos seca', 'Dolor de garganta'],
    treatment: 'Antibiótico y descanso',
    notes: 'El paciente presenta inflamación severa en las amígdalas.',
    createdAt: PAST_DATE_1,
  },
  {
    id: 'con_002',
    patientId: 'pat_001',
    diagnosis: 'Seguimiento de infección',
    symptoms: ['Tos leve'],
    treatment: 'Terminar tratamiento de antibiótico. Jarabe para la tos.',
    notes: 'Mejora notable, sin fiebre desde hace 48 horas.',
    createdAt: NOW,
  }
];

// 3. Mock Recetas
export const mockPrescriptions: Prescription[] = [
  {
    id: 'pre_001',
    folio: 'REC-20231015-0001',
    patientId: 'pat_001',
    consultationId: 'con_001',
    templateSnapshot: { theme: 'modern', showLogo: true },
    contentSnapshot: {
      medications: [
        {
          id: 'med_01',
          name: 'Amoxicilina',
          dosage: '500mg',
          frequency: 'Cada 8 horas',
          duration: '7 días',
          instructions: 'Tomar con alimentos'
        },
        {
          id: 'med_02',
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Cada 8 horas',
          duration: '3 días',
          instructions: 'Solo en caso de dolor o fiebre'
        }
      ],
      recommendations: 'Aumentar consumo de líquidos y reposar.'
    },
    createdAt: PAST_DATE_1,
  }
];

// 4. Mock Historial de Cambios (Validación de edición inmutable)
export const mockClinicalHistory: ClinicalHistoryEntry[] = [
  {
    id: 'his_001',
    consultationId: 'con_001',
    fieldModified: 'notes',
    previousValue: 'El paciente presenta inflamación en las amígdalas.',
    newValue: 'El paciente presenta inflamación severa en las amígdalas.',
    modifiedBy: 'doc_123',
    createdAt: PAST_DATE_1, // Asumimos modificación poco después
  }
];

// Utility function to get hydrated patient (with their data nested, just like a DB joined query)
export const getHydratedPatient = (patientId: string): Patient | null => {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) return null;

  const consultations = mockConsultations.filter(c => c.patientId === patientId).map(c => {
    // Attach prescription and history if exist
    const prescription = mockPrescriptions.find(pr => pr.consultationId === c.id);
    const history = mockClinicalHistory.filter(h => h.consultationId === c.id);
    return { ...c, prescription: prescription || null, history };
  });

  const prescriptions = mockPrescriptions.filter(p => p.patientId === patientId);

  return { ...patient, consultations, prescriptions };
};
