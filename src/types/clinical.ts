export interface BaseEntity {
  id: string;
  createdAt: string; // ISO DateTime string
  updatedAt?: string;
}

export interface Patient extends BaseEntity {
  name: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phoneNumber?: string;
  bloodType?: string;
  allergies?: string[];
  
  // Relations (optional for hydration)
  consultations?: Consultation[];
  prescriptions?: Prescription[];
}

export interface Consultation extends BaseEntity {
  patientId: string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  notes: string;

  // Relations
  patient?: Patient;
  prescription?: Prescription | null; // 1:1 relation, null if no prescription generated yet
  history?: ClinicalHistoryEntry[];   // 1:N relation for audit trail
}

export interface Prescription extends BaseEntity {
  folio: string; // Unique identifier like REC-YYYYMMDD-XXXX
  patientId: string;
  consultationId: string;
  
  // Stored snapshots so history is immutable regardless of later template changes
  templateSnapshot: Record<string, any>; // Represents the UI configuration/layout chosen
  contentSnapshot: {                     // Represents the clinical data placed in the prescription
    medications: Array<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
    recommendations?: string;
  };

  // Relations
  patient?: Patient;
  consultation?: Consultation;
}

export interface ClinicalHistoryEntry extends BaseEntity {
  consultationId: string;
  fieldModified: keyof Consultation;
  previousValue: any;
  newValue: any;
  modifiedBy?: string; // Optional doctor ID who made the change
}
